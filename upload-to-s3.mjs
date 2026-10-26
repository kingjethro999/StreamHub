import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./server/env.js";

const s3 = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: {
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
  },
  forcePathStyle: true,
});

const S3_BUCKET = config.s3Bucket;

// Download a file from URL and return buffer
async function downloadFile(url) {
  const resp = await fetch(url);
  return Buffer.from(await resp.arrayBuffer());
}

// Pexels portrait videos (license-clean, free commercial use)
const VIDEOS = [
  { title: "REST API with Node.js from Scratch", desc: "Full walkthrough: routes, auth and Postgres. Source in the description.", url: "https://videos.pexels.com/video-files/5377697/5377697-hd_720_1280_25fps.mp4", category: "Technology" },
  { title: "React Hooks Explained in 10 Minutes", desc: "useState, useEffect, useMemo, useRef — the ones you actually use.", url: "https://videos.pexels.com/video-files/5377696/5377696-hd_720_1280_25fps.mp4", category: "Technology" },
  { title: "Deploying PostgreSQL with Docker", desc: "From docker-compose to migrations, the way I do it on every project.", url: "https://videos.pexels.com/video-files/5377695/5377695-hd_720_1280_25fps.mp4", category: "Technology" },
  { title: "FIFA Finals — Lagos Championship Highlights", desc: "The goals, the drama, the comeback.", url: "https://videos.pexels.com/video-files/9749710/9749710-hd_720_1280_25fps.mp4", category: "Gaming" },
  { title: "Afrobeats Live Session — Original Beats", desc: "Unreleased beats played live.", url: "https://videos.pexels.com/video-files/9749709/9749709-hd_720_1280_25fps.mp4", category: "Music" },
  { title: "Lagos Traffic: A Comedy of Errors", desc: "Third Mainland Bridge has jokes.", url: "https://videos.pexels.com/video-files/9749708/9749708-hd_720_1280_25fps.mp4", category: "Comedy" },
  { title: "Owambe Lookbook — Aso Ebi Inspiration", desc: "Colours, gele and everything in between.", url: "https://videos.pexels.com/video-files/10349041/10349041-hd_720_1280_30fps.mp4", category: "Fashion" },
  { title: "Jollof Rice — The Only Recipe You Need", desc: "Party jollof, no shortcuts.", url: "https://videos.pexels.com/video-files/10349040/10349040-hd_720_1280_30fps.mp4", category: "Food" },
  { title: "Beginner Gym Guide — Form First", desc: "Learn the basics before you load the bar.", url: "https://videos.pexels.com/video-files/10349039/10349039-hd_720_1280_30fps.mp4", category: "Fitness" },
  { title: "Afro Dance Challenge — Learn the Steps", desc: "Slow breakdown, then full speed.", url: "https://videos.pexels.com/video-files/12193285/12193285-hd_720_1280_30fps.mp4", category: "Dance" },
];

async function main() {
  // Get all channels
  const { Pool } = await import("pg");
  const pgPool = new Pool({ connectionString: config.databaseUrl, ssl: { rejectUnauthorized: false } });
  
  const channels = await pgPool.query("select id, creator_id, name, handle from channels");
  console.log(`Found ${channels.rows.length} channels`);
  
  const streams = [];
  for (let i = 0; i < VIDEOS.length; i++) {
    const v = VIDEOS[i];
    const channel = channels.rows[i % channels.rows.length];
    
    // Download video
    console.log(`Downloading: ${v.title}`);
    const buffer = await downloadFile(v.url);
    
    // Upload to S3
    const key = `streams/${Date.now()}-${i}.mp4`;
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "video/mp4",
    }));
    
    const videoUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    console.log(`Uploaded to S3: ${videoUrl}`);
    
    streams.push({ ...v, videoUrl, channelId: channel.id });
  }
  
  // Insert streams into database
  for (const s of streams) {
    await pgPool.query(
      `insert into streams (id, channel_id, title, description, video_url, status, viewers_count, views_count, likes_count, created_at, started_at, ended_at)
       values (gen_random_uuid(), $1, $2, $3, null, $4, 'offline', 0, $5, $6, $7, $7, $7)`,
      [s.channelId, s.title, s.desc, s.videoUrl, randInt(5000, 80000), Math.round(randInt(5000, 80000) * (0.02 + Math.random() * 0.06)), new Date(Date.parse("2026-02-01") + Math.random() * (Date.parse("2026-10-31") - Date.parse("2026-02-01"))).toISOString()]
    );
  }
  
  console.log(`\n✔ Uploaded ${VIDEOS.length} videos to S3 bucket '${S3_BUCKET}'`);
  console.log("✔ Seeded all streams to database");
  
  await pgPool.end();
}

function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

main().catch(err => { console.error("Failed:", err.message); process.exit(1); });
