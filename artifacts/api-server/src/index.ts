import http from "http";
import app from "./app";
import { initSocket } from "./socket";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function verifyDatabaseConnection(retries = 5, delayMs = 2000): Promise<void> {
  const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const provider = connectionString.includes("neon.tech") ? "Neon PostgreSQL" : "PostgreSQL";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      logger.info({ provider }, "Database connection verified");
      return;
    } catch (err) {
      if (attempt === retries) {
        logger.error({ err, attempts: retries }, "Database connection failed after all retries");
        process.exit(1);
      }
      logger.warn({ err, attempt, retries, nextRetryMs: delayMs }, "Database connection attempt failed, retrying...");
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function main() {
  await verifyDatabaseConnection();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, () => {
    logger.info({ port }, "Server listening");
  });

  httpServer.on("error", (err) => {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  });
}

main();
