import Redis from "ioredis";

// Docker mein host 'redis' hona chahiye, local mein '127.0.0.1'
const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  
  // Ye zaroori hai taaki baar-baar connection fail na ho
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

// Connection logs taaki terminal mein pata chale
redis.on("connect", () => {
  console.log(`Redis connected to ${redisHost}:${redisPort}`);
});

redis.on("error", (err) => {
  console.error(" Redis Connection Error:", err.message);
});