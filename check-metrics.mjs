import { config } from "./server/env.js";
const res = await fetch(`${config.s3Endpoint}`, { method: "GET" });
console.log("S3 reachable:", res.status);
