import bcrypt from "bcryptjs"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { getPool, closePool } from "../db.js"
import "../env.js"

/**
 * Seeds the local database with real Nigerian creator accounts, their channels
 * and a backdated catalogue of short videos.
 *
 * Stream media (video + thumbnail URLs) comes from `media.generated.json`, which
 * is produced by the upload pipeline. Creator avatars come from
 * `avatars.generated.json`. Both are committed so the seed is reproducible.
 *
 * Every account uses the password `streamhub123` (documented in README.md).
 * The script is destructive-but-idempotent: it removes previous demo accounts
 * (anything on the `@streamhub.dev` domain) and rebuilds them, so re-running it
 * always yields the same catalogue.
 */

const DEMO_PASSWORD = "streamhub123"
const here = dirname(fileURLToPath(import.meta.url))

function loadJson(name, fallback) {
  const file = join(here, name)
  if (!existsSync(file)) return fallback
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch (err) {
    console.warn(`⚠ Could not parse ${name}: ${err.message}`)
    return fallback
  }
}

const MEDIA = loadJson("media.generated.json", {})
const AVATARS = loadJson("avatars.generated.json", {})

/** Deterministic, valid-shaped UUID. */
const uid = (prefix, n) => `${prefix}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`

const USER_PREFIX = "a0000000"
const CHANNEL_PREFIX = "b0000000"
const VIEWER_PREFIX = "c0000000"
const STREAM_PREFIX = "d0000000"
const COMMENT_PREFIX = "e0000000"
const LIKE_PREFIX = "f0000000"
const FOLLOW_PREFIX = "1a000000"

const CREATORS = [
  {
    username: "victor",
    name: "Victor",
    category: "Technology",
    followers: 48200,
    joined: "2025-11-12T09:15:00Z",
    bio: "Full-stack developer. I build web apps and explain the how and the why.",
  },
  {
    username: "emmanuel",
    name: "Emmanuel",
    category: "Gaming",
    followers: 92400,
    joined: "2025-10-28T14:02:00Z",
    bio: "Console and PC. Ranked grinds, setup tours and tournament recaps.",
  },
  {
    username: "king",
    name: "King",
    category: "Music",
    followers: 138500,
    joined: "2025-09-30T18:44:00Z",
    bio: "Producer and artist. Afrobeats, live sessions and beat-making.",
  },
  {
    username: "tochukwu",
    name: "Tochukwu",
    category: "Comedy",
    followers: 76500,
    joined: "2025-12-02T11:20:00Z",
    bio: "Lagos comedy. Skits about traffic, family and everyday chaos.",
  },
  {
    username: "gtech",
    name: "Gtech",
    category: "Technology",
    followers: 62400,
    joined: "2025-11-05T08:30:00Z",
    bio: "Gadget reviews, unboxings and honest budget-tech advice.",
  },
  {
    username: "amara",
    name: "Amara",
    category: "Fashion",
    followers: 88700,
    joined: "2025-10-14T16:10:00Z",
    bio: "Fashion and style. Owambe looks, thrift flips and Lagos street style.",
  },
  {
    username: "chidi",
    name: "Chidi",
    category: "Entertainment",
    followers: 41300,
    joined: "2026-01-09T12:00:00Z",
    bio: "Filmmaker. Behind the scenes, lighting and directing short films.",
  },
  {
    username: "blessing",
    name: "Blessing",
    category: "Food",
    followers: 102900,
    joined: "2025-09-18T10:05:00Z",
    bio: "Nigerian kitchen. Quick recipes, suya and proper comfort food.",
  },
  {
    username: "tunde",
    name: "Tunde",
    category: "Sports",
    followers: 57800,
    joined: "2025-12-19T19:30:00Z",
    bio: "Football highlights and street-ball skills from Naija.",
  },
  {
    username: "ngozi",
    name: "Ngozi",
    category: "Fitness",
    followers: 34600,
    joined: "2026-01-22T07:45:00Z",
    bio: "Gym basics done right. Form first, ego later.",
  },
  {
    username: "ada",
    name: "Ada",
    category: "Dance",
    followers: 71100,
    joined: "2025-11-27T15:25:00Z",
    bio: "Afro dance challenges, step-by-step tutorials and choreography.",
  },
  {
    username: "ifeanyi",
    name: "Ifeanyi",
    category: "Travel",
    followers: 29800,
    joined: "2026-02-01T09:00:00Z",
    bio: "Nigeria from above and beyond. Nature, cities and the open road.",
  },
]

const COMMUNITY = [
  { username: "adaeze", name: "Adaeze" },
  { username: "obinna", name: "Obinna" },
  { username: "folake", name: "Folake" },
  { username: "kelechi", name: "Kelechi" },
  { username: "chiamaka", name: "Chiamaka" },
  { username: "segun", name: "Segun" },
  { username: "yemi", name: "Yemi" },
  { username: "halima", name: "Halima" },
  { username: "damilola", name: "Damilola" },
  { username: "uche", name: "Uche" },
  { username: "bisi", name: "Bisi" },
  { username: "nneka", name: "Nneka" },
]

const COMMENT_POOL = [
  "This is 🔥🔥",
  "Who else is watching in 2026?",
  "The quality though 👏",
  "First! 😅",
  "Naija to the world 🌍",
  "Please do a part 2",
  "This deserves way more views",
  "Saved. Thank you!",
  "How long did this take you?",
  "I actually learned something new today",
  "This beat is too hard 🔥",
  "The jollof looks perfect 😋",
  "Chai! The vibes on this one",
  "God when? 😂",
  "Underrated creator fr",
  "Consistency is key. Respect.",
  "Abeg drop the recipe 🙏",
  "The transitions are so clean",
  "My guy you too much 👊",
  "Watching from Abuja 🇳🇬",
  "Streaming quality is top tier",
  "Bro really delivered on this one",
  "This made my whole day 😂",
  "Keep it up, we're watching",
  "Adding this to my playlist 🎧",
  "Explain the part at 0:30 again?",
]

/** Small deterministic PRNG so repeated seeds produce the same catalogue. */
function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260208)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const intBetween = (min, max) => Math.floor(rand() * (max - min + 1)) + min

async function seed() {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query("begin")

    // 1. Remove any previous demo accounts. Everything seeded here lives on the
    //    @streamhub.dev domain; FK cascades take the channels, streams, comments,
    //    likes and follows with them.
    const removed = await client.query("delete from users where email like '%@streamhub.dev'")
    if (removed.rowCount) console.log(`↺ Removed ${removed.rowCount} previous demo accounts`)

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    // 2. Creators + profiles + channels
    const creatorMeta = new Map()

    for (const [index, creator] of CREATORS.entries()) {
      const id = uid(USER_PREFIX, index + 1)
      const channelId = uid(CHANNEL_PREFIX, index + 1)
      const email = `${creator.username}@streamhub.dev`
      const avatarUrl = AVATARS[creator.username] || null
      const handle = `@${creator.username}`

      await client.query(
        `insert into users (id, email, password_hash, created_at)
         values ($1, $2, $3, $4)
         on conflict (id) do nothing`,
        [id, email, passwordHash, creator.joined],
      )

      await client.query(
        `insert into profiles (id, username, display_name, bio, avatar_url, is_creator, followers_count, created_at)
         values ($1, $2, $3, $4, $5, true, $6, $7)
         on conflict (id) do nothing`,
        [id, creator.username, creator.name, creator.bio, avatarUrl, creator.followers, creator.joined],
      )

      await client.query(
        `insert into channels (id, creator_id, name, description, category, avatar_url, banner_url, handle, links, contact_email, followers_count, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
         on conflict (id) do nothing`,
        [
          channelId,
          id,
          creator.name,
          creator.bio,
          creator.category,
          avatarUrl,
          null,
          handle,
          JSON.stringify([{ label: "Follow on StreamHub", url: `/channel/${channelId}` }]),
          email,
          creator.followers,
          creator.joined,
        ],
      )

      creatorMeta.set(creator.username, { ...creator, id, channelId, email })
    }

    // 3. Community accounts (viewers who like, comment and follow)
    const viewerIds = []
    for (const [index, person] of COMMUNITY.entries()) {
      const id = uid(VIEWER_PREFIX, index + 1)
      const email = `${person.username}@streamhub.dev`
      const joined = `2026-0${intBetween(1, 2)}-${String(intBetween(10, 27)).padStart(2, "0")}T12:00:00Z`

      await client.query(
        `insert into users (id, email, password_hash, created_at) values ($1, $2, $3, $4)
         on conflict (id) do nothing`,
        [id, email, passwordHash, joined],
      )
      await client.query(
        `insert into profiles (id, username, display_name, bio, avatar_url, is_creator, followers_count, created_at)
         values ($1, $2, $3, $4, null, false, $5, $6)
         on conflict (id) do nothing`,
        [id, person.username, person.name, null, intBetween(0, 400), joined],
      )
      viewerIds.push(id)
    }

    // 4. Streams — driven entirely by the uploaded media catalogue
    const streamEntries = Object.entries(MEDIA).sort((a, b) =>
      String(a[1].createdAt).localeCompare(String(b[1].createdAt)),
    )

    const insertedStreams = []

    for (const [index, [, item]] of streamEntries.entries()) {
      const creator = creatorMeta.get(item.handle)
      if (!creator) {
        console.warn(`⚠ Skipping media with unknown creator: ${item.handle} (${item.title})`)
        continue
      }

      const id = uid(STREAM_PREFIX, index + 1)
      const createdAt = item.createdAt
      const durationMs = Math.round((Number(item.duration) || 0) * 1000)
      const endedAt = new Date(new Date(createdAt).getTime() + durationMs).toISOString()
      const views = Number(item.views) || intBetween(1500, 60000)

      await client.query(
        `insert into streams
           (id, channel_id, title, description, thumbnail_url, video_url, status,
            viewers_count, views_count, likes_count, created_at, started_at, ended_at)
         values ($1, $2, $3, $4, $5, $6, 'offline', 0, $7, 0, $8, $8, $9)
         on conflict (id) do nothing`,
        [id, creator.channelId, item.title, item.description ?? null, item.thumbUrl ?? null, item.videoUrl ?? null, views, createdAt, endedAt],
      )

      insertedStreams.push({ id, createdAt, views, creator })
    }

    // 5. Follows — every viewer follows a random subset of creators
    let followCount = 0
    for (const viewerId of viewerIds) {
      for (const creator of creatorMeta.values()) {
        if (rand() > 0.45) continue
        const createdAt = new Date(Date.now() - intBetween(3, 210) * 86400000).toISOString()
        await client.query(
          `insert into follows (id, follower_id, channel_id, created_at)
           values ($1, $2, $3, $4)
           on conflict (follower_id, channel_id) do nothing`,
          [uid(FOLLOW_PREFIX, ++followCount), viewerId, creator.channelId, createdAt],
        )
      }
    }

    // 6. Likes — a random subset of the community on each short
    let likeCount = 0
    for (const stream of insertedStreams) {
      for (const viewerId of viewerIds) {
        if (rand() > 0.5) continue
        await client.query(
          `insert into likes (id, stream_id, user_id, created_at)
           values ($1, $2, $3, $4)
           on conflict (stream_id, user_id) do nothing`,
          [
            uid(LIKE_PREFIX, ++likeCount),
            stream.id,
            viewerId,
            new Date(new Date(stream.createdAt).getTime() + intBetween(1, 72) * 3600000).toISOString(),
          ],
        )
      }
    }

    // 7. Comments — backdated between the post and now
    let commentCount = 0
    for (const stream of insertedStreams) {
      const posted = new Date(stream.createdAt).getTime()
      const span = Math.max(3600000, Date.now() - posted - 86400000)
      const n = intBetween(2, 5)

      for (let i = 0; i < n; i++) {
        const user = pick(viewerIds)
        const createdAt = new Date(posted + Math.floor(rand() * span)).toISOString()
        await client.query(
          `insert into comments (id, stream_id, user_id, content, created_at)
           values ($1, $2, $3, $4, $5)
           on conflict (id) do nothing`,
          [uid(COMMENT_PREFIX, ++commentCount), stream.id, user, pick(COMMENT_POOL), createdAt],
        )
      }
    }

    // 8. Inflate the public counters so the catalogue looks lived-in. Real like
    //    rows above are what the UI uses for "have I liked this"; the counts are
    //    display totals and stay in sync via the likes trigger from here on.
    for (const stream of insertedStreams) {
      const liked = Math.round(stream.views * (0.035 + rand() * 0.055))
      await client.query(`update streams set likes_count = $1 where id = $2`, [liked, stream.id])
    }

    await client.query("commit")

    const { rows } = await client.query(
      `select
         (select count(*)::int from users)    as users,
         (select count(*)::int from channels) as channels,
         (select count(*)::int from streams)  as streams,
         (select count(*)::int from comments) as comments,
         (select count(*)::int from likes)    as likes`,
    )
    const stats = rows[0]

    console.log(`✔ Seed complete`)
    console.log(`  ${CREATORS.length} creators · ${COMMUNITY.length} community accounts`)
    console.log(`  ${stats.channels} channels · ${stats.streams} streams · ${stats.comments} comments · ${stats.likes} likes`)
    console.log(`  Catalogues spanning ${streamEntries[0]?.[1]?.createdAt?.slice(0, 10)} → ${streamEntries.at(-1)?.[1]?.createdAt?.slice(0, 10)}`)
    console.log(`  Sign in with any of these (password: ${DEMO_PASSWORD}):`)
    console.log(`    Creator:  ${CREATORS[0].username}@streamhub.dev`)
    console.log(`    Viewer:   ${COMMUNITY[0].username}@streamhub.dev`)
  } catch (err) {
    await client.query("rollback").catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

seed()
  .catch((err) => {
    console.error("✖ Seed failed:", err.message)
    if (err.code === "ECONNREFUSED") {
      console.error("  Is PostgreSQL running? Start it with:  pnpm db:up")
    } else if (err.code === "42P01") {
      console.error("  Tables are missing. Run first:  pnpm db:migrate")
    }
    process.exitCode = 1
  })
  .finally(closePool)
