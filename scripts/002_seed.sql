-- Seed Nigerian creators and content
insert into public.channels (creator_id, name, description, category, avatar_url, followers_count) 
values 
  ('00000000-0000-0000-0000-000000000001', 'TechNaija', 'Nigerian tech tutorials and coding', 'Technology', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop', 15200),
  ('00000000-0000-0000-0000-000000000002', 'Lagos Gaming', 'Nigerian gaming streams and tournaments', 'Gaming', 'https://images.unsplash.com/photo-1538481143235-c4c91616a176?w=200&h=200&fit=crop', 28500),
  ('00000000-0000-0000-0000-000000000003', 'Naija Music Live', 'Live music performances and beats', 'Music', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop', 42100),
  ('00000000-0000-0000-0000-000000000004', 'Comedy Central NG', 'Nigerian comedy shows and sketches', 'Comedy', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop', 35800),
  ('00000000-0000-0000-0000-000000000005', 'Nollywood Talks', 'Behind the scenes in Nigerian film industry', 'Entertainment', 'https://images.unsplash.com/photo-1485579149c0-123123dee563?w=200&h=200&fit=crop', 52300);

-- Seed some streams
insert into public.streams (channel_id, title, description, thumbnail_url, status, viewers_count, started_at) 
values 
  ('00000000-0000-0000-0000-000000000001', 'Building a Full Stack App - Web Dev Tutorial', 'Learn how to build modern web applications with Next.js and Supabase', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop', 'live', 15200, now()),
  ('00000000-0000-0000-0000-000000000002', 'Esports Tournament Finals - Nigerian Teams', 'Watch top Nigerian esports teams compete for the championship', 'https://images.unsplash.com/photo-1538481143235-c4c91616a176?w=400&h=225&fit=crop', 'live', 28500, now()),
  ('00000000-0000-0000-0000-000000000003', 'Afrobeats Sessions Live', 'Original music performances and beat production', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=225&fit=crop', 'offline', 0, null),
  ('00000000-0000-0000-0000-000000000004', 'Laugh Out Loud - Stand Up Comedy', 'Live comedy show featuring top Nigerian comedians', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop', 'live', 35800, now()),
  ('00000000-0000-0000-0000-000000000005', 'Nollywood Behind the Scenes', 'Exclusive coverage of movie productions and interviews', 'https://images.unsplash.com/photo-1485579149c0-123123dee563?w=400&h=225&fit=crop', 'offline', 0, null);
