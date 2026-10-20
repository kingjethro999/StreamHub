-- StreamHub database schema (plain PostgreSQL)
--
-- Ported from scripts/001_schema.sql + scripts/003_likes.sql.
-- Supabase-specific pieces removed: `auth.users` foreign keys and every
-- row-level-security policy. Ownership checks now happen in the API layer.

create extension if not exists pgcrypto;

-- 1. Accounts --------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- 2. Public profile, 1:1 with users ---------------------------------------
create table if not exists profiles (
  id              uuid primary key references users(id) on delete cascade,
  username        text unique not null,
  display_name    text not null,
  bio             text,
  avatar_url      text,
  is_creator      boolean default false,
  followers_count integer default 0,
  created_at      timestamptz default now()
);

-- 3. Channels / creators ---------------------------------------------------
create table if not exists channels (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references users(id) on delete cascade,
  name            text not null,
  description     text,
  category        text,
  avatar_url      text,
  banner_url      text,
  handle          text unique,
  links           jsonb default '[]'::jsonb,
  contact_email   text,
  followers_count integer default 0,
  created_at      timestamptz default now(),
  constraint channels_creator_unique unique (creator_id)
);

-- 4. Streams ---------------------------------------------------------------
create table if not exists streams (
  id             uuid primary key default gen_random_uuid(),
  channel_id     uuid not null references channels(id) on delete cascade,
  title          text not null,
  description    text,
  thumbnail_url  text,
  video_url      text,
  status         text default 'offline',
  viewers_count  integer default 0,
  views_count    integer default 0,
  likes_count    integer default 0,
  created_at     timestamptz default now(),
  started_at     timestamptz,
  ended_at       timestamptz
);

-- 5. Follows ---------------------------------------------------------------
create table if not exists follows (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null references users(id) on delete cascade,
  channel_id  uuid not null references channels(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (follower_id, channel_id)
);

-- 6. Comments --------------------------------------------------------------
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  stream_id  uuid not null references streams(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  parent_id  uuid references comments(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- Backfill parent_id column on existing databases
alter table if exists comments
  add column if not exists parent_id uuid references comments(id) on delete cascade;

-- 6b. Notifications ----------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  actor_id   uuid references users(id) on delete set null,
  type       text not null,              -- 'follow', 'like', 'comment', 'live', 'mention'
  stream_id  uuid references streams(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_read on public.notifications (user_id, read, created_at desc);
create index if not exists idx_notifications_actor on public.notifications (actor_id);

-- 7. Reposts ---------------------------------------------------------------
create table if not exists reposts (
  id         uuid primary key default gen_random_uuid(),
  stream_id  uuid not null references streams(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  caption    text,
  created_at timestamptz default now()
);

-- 8. Likes -----------------------------------------------------------------
create table if not exists likes (
  id         uuid primary key default gen_random_uuid(),
  stream_id  uuid not null references streams(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (stream_id, user_id)
);

-- 9. Denormalised counters -------------------------------------------------
create or replace function public.handle_like()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.streams
       set likes_count = coalesce(likes_count, 0) + 1
     where id = NEW.stream_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.streams
       set likes_count = greatest(coalesce(likes_count, 0) - 1, 0)
     where id = OLD.stream_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists increment_likes_count on public.likes;
create trigger increment_likes_count
  after insert or delete on public.likes
  for each row execute function public.handle_like();

-- 10. Indexes --------------------------------------------------------------
create index if not exists idx_streams_channel_id   on public.streams (channel_id);
create index if not exists idx_streams_status       on public.streams (status, created_at desc);
create index if not exists idx_streams_title        on public.streams (title);
create index if not exists idx_follows_channel_id   on public.follows (channel_id);
create index if not exists idx_follows_follower     on public.follows (follower_id);
create index if not exists idx_comments_stream_id   on public.comments (stream_id);
create index if not exists idx_comments_parent_id   on public.comments (parent_id);
create index if not exists idx_likes_stream_user    on public.likes (stream_id, user_id);
