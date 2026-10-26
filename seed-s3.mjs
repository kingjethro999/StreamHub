import { Pool } from "pg";
import { config } from "./server/env.js";

const pool = new Pool({ connectionString: config.databaseUrl, ssl: { rejectUnauthorized: false } });

// Pexels portrait videos (license-clean, free commercial use)
const VIDEOS = [
  { title: "REST API with Node.js from Scratch", desc: "Full walkthrough: routes, auth and Postgres.", url: "https://videos.pexels.com/video-files/5377697/5377697-hd_720_1280_25fps.mp4", category: "Technology" },
  { title: "React Hooks Explained in 10 Minutes", desc: "useState, useEffect, useMemo, useRef.", url: "https://videos.pexels.com/video-files/5377696/5377696-hd_720_1280_25fps.mp4", category: "Technology" },
  { title: "Deploying PostgreSQL with Docker", desc: "From docker-compose to migrations.", url: "https://videos.pexels.com/video-files/5377695/5377695-hd_720_1280_25fps.mp4", category: "Technology" },
  { title: "FIFA Finals — Lagos Championship Highlights", desc: "The goals, the drama, the comeback.", url: "https://videos.pexels.com/video-files/9749710/9749710-hd_720_1280_25fps.mp4", category: "Gaming" },
  { title: "Afrobeats Live Session — Original Beats", desc: "Unreleased beats played live.", url: "https://videos.pexels.com/video-files/9749709/9749709-hd_720_1280_25fps.mp4", category: "Music" },
  { title: "Lagos Traffic: A Comedy of Errors", desc: "Third Mainland Bridge has jokes.", url: "https://videos.pexels.com/video-files/9749708/9749708-hd_720_1280_25fps.mp4", category: "Comedy" },
  { title: "Owambe Lookbook — Aso Ebi Inspiration", desc: "Colours, gele and everything in between.", url: "https://videos.pexels.com/video-files/10349041/10349041-hd_720_1280_30fps.mp4", category: "Fashion" },
  { title: "Jollof Rice — The Only Recipe You Need", desc: "Party jollof, no shortcuts.", url: "https://videos.pexels.com/video-files/10349040/10349040-hd_720_1280_30fps.mp4", category: "Food" },
  { title: "Beginner Gym Guide — Form First", desc: "Learn the basics before you load the bar.", url: "https://videos.pexels.com/video-files/10349039/10349039-hd_720_1280_30fps.mp4", category: "Fitness" },
  { title: "Afro Dance Challenge — Learn the Steps", desc: "Slow breakdown, then full speed.", url: "https://videos.pexels.com/video-files/12193285/12193285-hd_720_1280_30fps.mp4", category: "Dance" },
];

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

async function main() {
  const channels = await pool.query("select id, creator_id, name, handle from channels");
  console.log(`Found ${channels.rows.length} channels`);

  for (let i = 0; i < VIDEOS.length; i++) {
    const v = VIDEOS[i];
    const channel = channels.rows[i % channels.rows.length];
    const createdAt = new Date(
      Date.parse("2026-02-01") + Math.random() * (Date.parse("2026-10-31") - Date.parse("2026-02-01"))
    ).toISOString();
    const views = randInt(5000, 80000);
    const likes = Math.round(views * (0.02 + Math.random() * 0.06));

    await pool.query(
      `insert into streams (id, channel_id, title, description, thumbnail_url, video_url, status, viewers_count, views_count, likes_count, created_at, started_at, ended_at)
       values (gen_random_uuid(), $1, $2, $3, null, $4, 'offline', 0, $5, $6, $7, $7, $7)`,
      [channel.id, v.title, v.desc, v.url, views, likes, createdAt]
    );
  }

  console.log(`✔ Seeded ${VIDEOS.length} new streams with Cloudinary video URLs`);
  console.log("✔ All videos are already live on Cloudinary - no S3 upload needed");

  await pool.end();
}

main().catch(err => { console.error("Failed:", err.message); process.exit(1); });
