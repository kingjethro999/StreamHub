-- 001_schema.sql

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  is_creator boolean default false,
  followers_count integer default 0,
  created_at timestamp default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- 2. Create channels/creators table
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text, -- made optional if not always provided
  avatar_url text,
  banner_url text,
  handle text unique,
  links jsonb default '[]'::jsonb,
  contact_email text,
  followers_count integer default 0,
  created_at timestamp default now()
);

alter table public.channels enable row level security;

create policy "channels_select_public" on public.channels for select using (true);
create policy "channels_insert_own" on public.channels for insert with check (auth.uid() = creator_id);
create policy "channels_update_own" on public.channels for update using (auth.uid() = creator_id);

-- 3. Create streams table
create table if not exists public.streams (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  video_url text,
  status text default 'offline',
  viewers_count integer default 0,
  created_at timestamp default now(),
  started_at timestamp,
  ended_at timestamp
);

alter table public.streams enable row level security;

create policy "streams_select_public" on public.streams for select using (true);
create policy "streams_insert_own_channel" on public.streams for insert with check (
    exists (
      select 1 from public.channels 
      where id = channel_id and creator_id = auth.uid()
    )
);

-- 4. Create follows table
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  created_at timestamp default now(),
  unique(follower_id, channel_id)
);

alter table public.follows enable row level security;

create policy "follows_select_own" on public.follows for select using (auth.uid() = follower_id or true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

-- 5. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 6. Create Reposts Table
CREATE TABLE IF NOT EXISTS public.reposts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reposts are viewable by everyone" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users can create their own reposts" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reposts" ON public.reposts FOR DELETE USING (auth.uid() = user_id);
