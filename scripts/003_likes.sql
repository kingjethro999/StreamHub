-- 003_likes.sql

-- 1. Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 2. Add likes_count column to streams table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'streams' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE public.streams ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Create function to increment/decrement likes_count on stream
CREATE OR REPLACE FUNCTION public.handle_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.streams
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = NEW.stream_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.streams
        SET likes_count = COALESCE(likes_count, 0) - 1
        WHERE id = OLD.stream_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for likes_count
DROP TRIGGER IF EXISTS increment_likes_count ON public.likes;
CREATE TRIGGER increment_likes_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_like();
