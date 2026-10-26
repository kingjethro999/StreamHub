/**
 * server/db/seed-extra.mjs
 *
 * Seeds ADDITIONAL users, channels, and streams into StreamHub.
 *
 * This script is ADDITIVE: it only inserts new rows and never deletes
 * existing ones. Run it whenever you want to bulk-add more creator
 * accounts and short videos.
 *
 * Every account uses the password `streamhub123`.
 *
 * Stream videos use Pexels portrait clips (license-clean, free commercial
 * use) as Cloudinary URLs, plus a few S3-compatible (Neon) URLs for
 * operator-seeded content.
 *
 * All dates are backdated between Feb 2026 and Oct 2026.
 *
 * Usage:
 *   DATABASE_URL=... DATABASE_SSL=true node server/db/seed-extra.mjs
 */

import bcrypt from "bcryptjs"
import { Pool } from "pg"
import { config } from "../env.js"

const DEMO_PASSWORD = "streamhub123"

const uid = (prefix, n) => `${prefix}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`

const NEW_USER_PREFIX = "90000000"
const NEW_CHANNEL_PREFIX = "80000000"
const NEW_STREAM_PREFIX = "70000000"

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
})

const NEW_CREATORS = [
  { username: "adebayo", name: "Adebayo", category: "Technology", followers: 54300, joined: "2026-02-10T09:00:00Z", bio: "Software engineer from Lagos. I build web apps and teach coding." },
  { username: "folake", name: "Folake", category: "Fashion", followers: 71200, joined: "2026-02-14T14:30:00Z", bio: "Fashion stylist. Owambe looks, thrift flips, and everyday style." },
  { username: "james", name: "James", category: "Gaming", followers: 38900, joined: "2026-02-18T11:00:00Z", bio: "Console gamer. FIFA, shooters, and ranked climbs from Manchester." },
  { username: "chioma", name: "Chioma", category: "Music", followers: 62800, joined: "2026-02-22T16:45:00Z", bio: "Singer and songwriter. Afrobeats, R&B, and original music." },
  { username: "sarah", name: "Sarah", category: "Comedy", followers: 45600, joined: "2026-03-01T10:15:00Z", bio: "Comedian. Skits about everyday life and Nigerian parents." },
  { username: "ibrahim", name: "Ibrahim", category: "Food", followers: 89100, joined: "2026-03-08T19:20:00Z", bio: "Home cook. Nigerian recipes, jollof, suya, and comfort food." },
  { username: "emily", name: "Emily", category: "Fitness", followers: 53200, joined: "2026-03-15T08:00:00Z", bio: "Fitness coach. Home workouts, gym guides, and wellness tips." },
  { username: "obinna", name: "Obinna", category: "Sports", followers: 67400, joined: "2026-03-22T13:10:00Z", bio: "Football fan. Match highlights, skills, and Naija derby coverage." },
  { username: "nneka", name: "Nneka", category: "Entertainment", followers: 34500, joined: "2026-03-29T11:55:00Z", bio: "Filmmaker. Behind the scenes, short films, and directing tips." },
  { username: "david", name: "David", category: "Technology", followers: 29800, joined: "2026-04-05T14:20:00Z", bio: "DevOps engineer. Docker, Postgres, and cloud infrastructure." },
]

const COMMENT_POOL = [
  "This is 🔥🔥", "Who else is watching in 2026?", "The quality though 👏",
  "First! 😅", "Naija to the world 🌍", "Please do a part 2",
  "This deserves way more views", "Saved. Thank you!", "How long did this take you?",
  "I actually learned something new today", "This beat is too hard 🔥",
  "The jollof looks perfect 😋", "Chai! The vibes on this one", "God when? 😂",
  "Underrated creator fr", "Consistency is key. Respect.", "Abeg drop the recipe 🙏",
  "The transitions are so clean", "My guy you too much 👊", "Watching from Abuja 🇳🇬",
  "Streaming quality is top tier", "Bro really delivered on this one",
  "This made my whole day 😂", "Keep it up, we're watching", "Adding this to my playlist 🎧",
]

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

const PEXELS_VIDEOS = [
  "https://videos.pexels.com/video-files/5377697/5377697-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/5377696/5377696-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/5377695/5377695-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/5377694/5377694-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/5377693/5377693-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/9749710/9749710-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/9749709/9749709-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/9749708/9749708-hd_720_1280_25fps.mp4",
  "https://videos.pexels.com/video-files/10349041/10349041-hd_720_1280_30fps.mp4",
  "https://videos.pexels.com/video-files/10349040/10349040-hd_720_1280_30fps.mp4",
  "https://videos.pexels.com/video-files/10349039/10349039-hd_720_1280_30fps.mp4",
  "https://videos.pexels.com/video-files/10349038/10349038-hd_720_1280_30fps.mp4",
  "https://videos.pexels.com/video-files/12193285/12193285-hd_720_1280_30fps.mp4",
  "https://videos.pexels.com/video-files/12193284/12193284-hd_720_1280_30fps.mp4",
  "https://videos.pexels.com/video-files/12193283/12193283-hd_720_1280_30fps.mp4",
]

const S3_ENDPOINT = config.s3Endpoint
const S3_BUCKET = config.s3Bucket

async function seed() {
  const client = await pool.connect()
  try {
    await client.query("begin")

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    // 1. Insert new creators + profiles + channels
    const creatorChannels = []
    for (const [index, creator] of NEW_CREATORS.entries()) {
      const id = uid(NEW_USER_PREFIX, index + 1)
      const channelId = uid(NEW_CHANNEL_PREFIX, index + 1)
      const email = `${creator.username}@streamhub.dev`

      // Insert user (skip if email already exists)
      const userResult = await client.query(
        `insert into users (id, email, password_hash, created_at)
         values ($1, $2, $3, $4)
         on conflict (email) do nothing returning id`,
        [id, email, passwordHash, creator.joined],
      )
      let userId = userResult.rows[0]?.id
      if (!userId) {
        // Email already exists — fetch the existing user's id
        const existing = await client.query(
          `select id from users where email = $1`,
          [email],
        )
        userId = existing.rows[0]?.id
        if (!userId) throw new Error(`Could not find or create user for email ${email}`)
      }

      // Insert profile
      await client.query(
        `insert into profiles (id, username, display_name, bio, avatar_url, is_creator, followers_count, created_at)
         values ($1, $2, $3, $4, null, true, $5, $6)
         on conflict (username) do nothing`,
        [userId, creator.username, creator.name, creator.bio, creator.followers, creator.joined],
      )

      // Insert channel
      await client.query(
        `insert into channels (id, creator_id, name, description, category, avatar_url, banner_url, handle, links, contact_email, followers_count, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
         on conflict (id) do nothing`,
        [
          channelId, userId, creator.name, creator.bio, creator.category, null, null,
          `@${creator.username}`, JSON.stringify([{ label: "Follow on StreamHub", url: `/channel/${channelId}` }]),
          email, creator.followers, creator.joined,
        ],
      )

      creatorChannels.push({ id: channelId, creatorId: userId, ...creator })
    }
    console.log(`✔ Inserted ${creatorChannels.length} new creators`)

    // 2. Insert streams — 2 per creator
    let streamIndex = 0
    for (const ch of creatorChannels) {
      for (let s = 0; s < 2; s++) {
        const streamId = uid(NEW_STREAM_PREFIX, streamIndex + 1)
        const videoUrl = PEXELS_VIDEOS[streamIndex % PEXELS_VIDEOS.length]
        const createdAt = new Date(
          Date.parse("2026-02-01") + Math.random() * (Date.parse("2026-10-31") - Date.parse("2026-02-01"))
        ).toISOString()
        const views = randInt(5000, 80000)
        const likes = Math.round(views * (0.02 + Math.random() * 0.06))

        await client.query(
          `insert into streams (id, channel_id, title, description, thumbnail_url, video_url, status, viewers_count, views_count, likes_count, created_at, started_at, ended_at)
           values ($1, $2, $3, $4, $5, $6, 'offline', 0, $7, $8, $9, $9, $9)
           on conflict (id) do nothing`,
          [
            streamId, ch.id,
            `${ch.name}'s Short ${s + 1}`,
            `A short video from ${ch.name}. ${ch.bio}`,
            null,
            videoUrl,
            views, likes, createdAt,
          ],
        )
        streamIndex++
      }
    }

    // Extra streams from existing creators using S3 URLs
    const extraStreams = [
      { handle: "@victor", title: "Victor's S3 Upload — Debugging Node.js", desc: "Uploaded via S3-compatible storage (Neon)." },
      { handle: "@emmanuel", title: "Emmanuel's S3 Upload — FIFA Highlights", desc: "Uploaded via S3-compatible storage (Neon)." },
      { handle: "@king", title: "King's S3 Upload — Afrobeats Session", desc: "Uploaded via S3-compatible storage (Neon)." },
      { handle: "@tochukwu", title: "Tochukwu's S3 Upload — Lagos Comedy", desc: "Uploaded via S3-compatible storage (Neon)." },
      { handle: "@gtech", title: "Gtech's S3 Upload — Budget Phone Review", desc: "Uploaded via S3-compatible storage (Neon)." },
    ]

    for (const es of extraStreams) {
      const channel = await client.query(
        `select id from channels where handle = $1`,
        [es.handle],
      )
      if (channel.rows.length === 0) continue

      const streamId = uid(NEW_STREAM_PREFIX, streamIndex + 1)
      const key = `streams/operator/${Date.now()}-${es.title.toLowerCase().replace(/\s+/g, "_")}.mp4`
      const createdAt = new Date(
        Date.parse("2026-04-01") + Math.random() * (Date.parse("2026-10-31") - Date.parse("2026-04-01"))
      ).toISOString()
      const views = randInt(3000, 50000)
      const likes = Math.round(views * (0.03 + Math.random() * 0.05))

      await client.query(
        `insert into streams (id, channel_id, title, description, thumbnail_url, video_url, status, viewers_count, views_count, likes_count, created_at, started_at, ended_at)
         values ($1, $2, $3, $4, $5, $6, 'offline', 0, $7, $8, $9, $9, $9)
         on conflict (id) do nothing`,
        [
          streamId, channel.rows[0].id,
          es.title, es.desc, null,
          `${S3_ENDPOINT}/${S3_BUCKET}/${key}`,
          views, likes, createdAt,
        ],
      )
      streamIndex++
    }

    console.log(`✔ Inserted ${streamIndex} new streams`)

    // 3. Add follows and likes from new users to new streams
    const allStreams = await client.query("select id, channel_id from streams where id::text like '7000000%'")
    const allUsers = await client.query("select id from users where id::text like '9000000%'")

    let followCount = 0
    for (const s of allStreams.rows) {
      for (const u of allUsers.rows) {
        if (Math.random() > 0.6) continue
        await client.query(
          `insert into follows (follower_id, channel_id, created_at)
           values ($1, $2, now() - (random() * interval '60 days'))
           on conflict (follower_id, channel_id) do nothing`,
          [u.id, s.channel_id],
        )
        followCount++
      }
    }
    console.log(`✔ Created ~${followCount} new follows`)

    let likeCount = 0
    for (const s of allStreams.rows) {
      for (const u of allUsers.rows) {
        if (Math.random() > 0.5) continue
        await client.query(
          `insert into likes (stream_id, user_id, created_at)
           values ($1, $2, now() - (random() * interval '60 days'))
           on conflict (stream_id, user_id) do nothing`,
          [s.id, u.id],
        )
        likeCount++
      }
    }
    console.log(`✔ Created ~${likeCount} new likes`)

    let commentCount = 0
    for (const s of allStreams.rows) {
      const nComments = randInt(1, 4)
      for (let c = 0; c < nComments; c++) {
        const u = allUsers.rows[Math.floor(Math.random() * allUsers.rows.length)]
        await client.query(
          `insert into comments (stream_id, user_id, content, created_at)
           values ($1, $2, $3, now() - (random() * interval '60 days'))`,
          [s.id, u.id, rand(COMMENT_POOL)],
        )
        commentCount++
      }
    }
    console.log(`✔ Created ~${commentCount} new comments`)

    await client.query("commit")

    // 4. Report stats
    const stats = await client.query(`
      select
        (select count(*) from users where id::text like '9000000%') as new_users,
        (select count(*) from channels where id::text like '8000000%') as new_channels,
        (select count(*) from streams where id::text like '7000000%') as new_streams,
        (select count(*) from users) as total_users,
        (select count(*) from streams) as total_streams,
        (select count(*) from likes where stream_id::text like '7000000%') as new_likes
    `)
    const s2 = stats.rows[0]
    console.log("\n=== EXTRA SEED COMPLETE ===")
    console.log(`New users: ${s2.new_users}, New channels: ${s2.new_channels}, New streams: ${s2.new_streams}`)
    console.log(`New likes: ${s2.new_likes}, New comments: ${commentCount}`)
    console.log(`Total users: ${s2.total_users}, Total streams: ${s2.total_streams}`)
    console.log("\nAll accounts password: streamhub123")
    console.log("Example new user:", NEW_CREATORS[0].username + "@streamhub.dev")
  } catch (err) {
    await client.query("rollback").catch(() => {})
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error("✖ Seed failed:", err.message)
  process.exitCode = 1
})
