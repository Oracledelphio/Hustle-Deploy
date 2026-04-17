import fs from "fs";
import pg from "pg";

// Instruct the Node process to temporarily accept the self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const localEnvFile = fs.readFileSync(".env", "utf-8");
let activeDatabaseUrl = "";

for (const lineEntry of localEnvFile.split("\n")) {
  if (lineEntry.startsWith("DATABASE_URL=")) {
    activeDatabaseUrl = lineEntry.split("=").slice(1).join("=").trim().replace(/['"]/g, "");
  }
}

const { Pool } = pg;
const cleanupPool = new Pool({
  connectionString: activeDatabaseUrl,
  max: 1
});

async function runCleanupOperation() {
  const activeClient = await cleanupPool.connect();
  try {
    await activeClient.query("BEGIN");
    console.log("Initiating database correction...");

    await activeClient.query(`
        UPDATE zones
        SET gds_score = 0, status = 'normal'
        WHERE id = 'koramangala'
    `);

    await activeClient.query("COMMIT");
    console.log("Correction applied successfully. The map should now reflect normal status.");
  } catch (executionError) {
    await activeClient.query("ROLLBACK");
    console.error("Cleanup failed during execution:", executionError);
  } finally {
    activeClient.release();
    process.exit(0);
  }
}

runCleanupOperation();