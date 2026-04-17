import { db, zonesTable, workersTable, claimsTable, policiesTable, fraudAuditLogTable } from "@workspace/db";
import * as fs from "fs";
import * as path from "path";

async function exportSnapshot() {
  console.log("📸 Exporting Database Snapshot for Demo Fallback...");
  try {
    const zones = await db.select().from(zonesTable);
    const workers = await db.select().from(workersTable);
    const claims = await db.select().from(claimsTable);
    const policies = await db.select().from(policiesTable);
    const auditLogs = await db.select().from(fraudAuditLogTable);

    const snapshot = {
      timestamp: new Date().toISOString(),
      data: {
        zones,
        workers: workers.slice(0, 50), // Limit size for frontend demo wrapper
        claims: claims.slice(0, 100),
        policies: policies.slice(0, 100),
        auditLogs: auditLogs.slice(0, 100)
      }
    };

    const targetDir = path.resolve(import.meta.dirname, "../../../hustlesafe/public/snapshots");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const outputPath = path.join(targetDir, "demo-snapshot.json");
    fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));

    console.log(`✅ Snapshot saved to ${outputPath}`);
  } catch (err) {
    console.error("❌ Failed to export snapshot:", err);
  }
}

exportSnapshot();
