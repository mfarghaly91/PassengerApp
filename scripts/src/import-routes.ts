import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATASET_PATH = resolve(
  __dirname,
  "../../attached_assets/Pasted--id-a04e5298-a5ef-4006-b5bf-35755730c511-name-Ain-Shams_1778849930643.txt"
);

interface RawStop {
  lat: number;
  lng: number;
  name: string;
  stop_order: number;
}

interface RawRoute {
  id: string;
  name: string;
  estimated_duration_mins: number;
  route_stops: RawStop[];
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function parseFromTo(routeName: string): { from: string; to: string } {
  const arrow = routeName.match(/^(.+?)\s*→\s*(.+?)(?:\s*#\d+)?$/);
  if (arrow) return { from: arrow[1].trim(), to: arrow[2].trim() };
  const parts = routeName.split(/[-–—]/);
  if (parts.length >= 2) return { from: parts[0].trim(), to: parts[parts.length - 1].trim() };
  return { from: routeName, to: routeName };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("=== ShuttleOps Route Import ===\n");

  const raw = readFileSync(DATASET_PATH, "utf8");
  let dataset: RawRoute[];
  try {
    dataset = JSON.parse(raw);
  } catch {
    console.error("Failed to parse dataset JSON.");
    await pool.end();
    process.exit(1);
  }

  console.log(`Loaded ${dataset.length} raw routes from dataset.\n`);

  let imported = 0;
  let skipped = 0;
  let stationCount = 0;
  const warnings: string[] = [];

  for (const rawRoute of dataset) {
    const routeName = normalizeName(rawRoute.name);

    if (!routeName) {
      warnings.push(`Unnamed route skipped`);
      skipped++;
      continue;
    }

    const duration = rawRoute.estimated_duration_mins;
    if (!duration || duration <= 0 || !isFinite(duration)) {
      warnings.push(`"${routeName}": invalid duration ${duration}`);
      skipped++;
      continue;
    }

    // Duplicate check
    const dup = await pool.query(
      `SELECT id FROM routes WHERE name = $1 LIMIT 1`,
      [routeName]
    );
    if (dup.rows.length > 0) {
      console.log(`  [SKIP] "${routeName}" (id: ${dup.rows[0].id})`);
      skipped++;
      continue;
    }

    // Validate and sort stops
    const validStops = (rawRoute.route_stops ?? [])
      .filter((s) => {
        if (!s.name?.trim()) return false;
        if (!isValidCoord(s.lat, s.lng)) {
          warnings.push(`Drop stop "${s.name}" in "${routeName}": bad coords (${s.lat}, ${s.lng})`);
          return false;
        }
        return true;
      })
      .sort((a, b) => a.stop_order - b.stop_order);

    if (validStops.length < 2) {
      warnings.push(`"${routeName}": only ${validStops.length} valid stop(s) — skipped`);
      skipped++;
      continue;
    }

    const { from, to } = parseFromTo(routeName);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const routeRes = await client.query(
        `INSERT INTO routes (name, from_location, to_location, estimated_duration, base_price, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         RETURNING id`,
        [routeName, from, to, duration, "0.00"]
      );
      const routeId = routeRes.rows[0].id;

      for (const s of validStops) {
        await client.query(
          `INSERT INTO stations (route_id, name, latitude, longitude, "order", created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [routeId, normalizeName(s.name), s.lat, s.lng, s.stop_order]
        );
      }

      await client.query("COMMIT");
      console.log(`  [OK]   "${routeName}" (id: ${routeId}) — ${validStops.length} stops`);
      imported++;
      stationCount += validStops.length;
    } catch (err: any) {
      await client.query("ROLLBACK");
      warnings.push(`Failed to import "${routeName}": ${err.message}`);
      skipped++;
    } finally {
      client.release();
    }
  }

  await pool.end();

  console.log("\n=== Import Complete ===");
  console.log(`Routes imported : ${imported}`);
  console.log(`Routes skipped  : ${skipped}`);
  console.log(`Stops imported  : ${stationCount}`);

  if (warnings.length > 0) {
    console.log("\n=== Warnings ===");
    warnings.forEach((w) => console.log(" •", w));
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
