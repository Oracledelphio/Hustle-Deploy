import { Router } from "express";
import { db, premiumHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/premium/history/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;

    // Fetch the worker's premium history, most recent first
    const history = await db.select().from(premiumHistoryTable)
      .where(eq(premiumHistoryTable.worker_id, workerId))
      .orderBy(desc(premiumHistoryTable.week_start));

    if (history.length === 0) {
      return res.status(404).json({ error: "No premium calculated for this worker yet. Wait for the Sunday Celery task." });
    }

    const latestPremium = history[0];

    return res.json({
      history,
      current_premium: latestPremium.premium_amount,
      zone_adjustment: latestPremium.zone_risk_adjustment,
      worker_adjustment: latestPremium.worker_risk_adjustment,
      explanation: latestPremium.explanation,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get premium history");
    return res.status(500).json({ error: "Failed to get premium history" });
  }
});

export default router;