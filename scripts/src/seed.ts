import { db, zonesTable, workersTable, policiesTable, claimsTable, premiumHistoryTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const zones = [
  { id: "koramangala", name: "Koramangala", city: "Bangalore", lat: "12.9352", lng: "77.6245", active_workers: 142 },
  { id: "indiranagar", name: "Indiranagar", city: "Bangalore", lat: "12.9784", lng: "77.6408", active_workers: 89 },
  { id: "whitefield", name: "Whitefield", city: "Bangalore", lat: "12.9698", lng: "77.7499", active_workers: 76 },
  { id: "electronic_city", name: "Electronic City", city: "Bangalore", lat: "12.8399", lng: "77.6770", active_workers: 95 },
  { id: "hsr_layout", name: "HSR Layout", city: "Bangalore", lat: "12.9116", lng: "77.6741", active_workers: 64 },
  { id: "btm_layout", name: "BTM Layout", city: "Bangalore", lat: "12.9166", lng: "77.6101", active_workers: 58 },
  { id: "marathahalli", name: "Marathahalli", city: "Bangalore", lat: "12.9591", lng: "77.6971", active_workers: 71 },
  { id: "jayanagar", name: "Jayanagar", city: "Bangalore", lat: "12.9252", lng: "77.5938", active_workers: 52 },
];

const TIER_CONFIG = {
  basic: { weekly_premium: "15.00", coverage_cap: "600.00" },
  standard: { weekly_premium: "25.00", coverage_cap: "1200.00" },
  pro: { weekly_premium: "40.00", coverage_cap: "1750.00" },
};

const workerNames = [
  "Ravi Kumar", "Priya Sharma", "Amit Singh", "Sunita Devi", "Rahul Nair",
  "Deepa Menon", "Vijay Reddy", "Kavitha Rao", "Suresh Patel", "Anitha Krishnan",
  "Mohammed Irfan", "Lakshmi Iyer", "Ganesh Kumar", "Pooja Verma", "Arjun Mehta",
  "Sathya Narayanan", "Rekha Bhat", "Dinesh Gupta", "Meena Pillai", "Ramesh Hegde",
  "Aisha Begum", "Ranjit Singh", "Usha Kumari", "Pradeep Shetty", "Bhavana Nair",
  "Kiran Bose", "Shilpa Joshi", "Naveen Kumar", "Geeta Sharma", "Vinod Pillai",
  "Padma Subramaniam", "Ajay Malhotra", "Shanthi Rajan", "Nikhil Desai", "Radha Nambiar",
  "Sunil Yadav", "Kamala Devi", "Ashok Tiwari", "Nirmala Shetty", "Prakash Gowda",
  "Vasantha Kumar", "Indira Nair", "Manoj Sharma", "Sudha Krishnamurthy", "Balaji Rao",
  "Nalini Devi", "Rajesh Kulkarni", "Chithra Pillai", "Sanjay Dubey", "Lalitha Reddy",
];

const platforms = ["zomato", "swiggy", "both"] as const;
const tiers = ["basic", "standard", "pro"] as const;
const eventTypes = ["heavy_rain", "flood", "platform_outage", "strike", "curfew", "aqi_hazard"] as const;
const claimStatuses = ["auto_approved", "soft_hold", "insurer_review", "paid", "auto_rejected"] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTier(): "basic" | "standard" | "pro" {
  const r = Math.random();
  if (r < 0.30) return "basic";
  if (r < 0.80) return "standard";
  return "pro";
}

async function seed() {
  console.log("🌱 Starting seed...");

  // Seed zones
  console.log("📍 Seeding zones...");
  for (const zone of zones) {
    await db.insert(zonesTable).values({
      ...zone,
      gds_score: 15 + Math.floor(Math.random() * 15),
      status: "normal",
      rainfall_mm: (1 + Math.random() * 5).toFixed(2),
      traffic_score: (2 + Math.random() * 3).toFixed(1),
      aqi: 50 + Math.floor(Math.random() * 60),
      demand_drop_pct: Math.floor(Math.random() * 10),
      govt_alert: false,
    }).onConflictDoNothing();
  }

  // Seed workers
  console.log("👷 Seeding workers...");
  const createdWorkers: Array<{ id: string; zone_id: string; policy_tier: string }> = [];

  // Distribution: 20 in koramangala, 8 in indiranagar, rest spread
  const workerZones = [
    ...Array(20).fill("koramangala"),
    ...Array(8).fill("indiranagar"),
    ...Array(5).fill("whitefield"),
    ...Array(5).fill("electronic_city"),
    ...Array(4).fill("hsr_layout"),
    ...Array(4).fill("btm_layout"),
    ...Array(2).fill("marathahalli"),
    ...Array(2).fill("jayanagar"),
  ];

  // Add the demo worker first
  try {
    const demoTier = "standard";
    const [demoWorker] = await db.insert(workersTable).values({
      name: "Ravi Kumar",
      phone: "+91 9876543210",
      email: "ravi@example.com",
      platform: "zomato",
      zone_id: "koramangala",
      upi_id: "ravi@upi",
      policy_tier: demoTier,
      platform_rating: "4.8",
      is_active: true,
      fraud_score: "0.05",
      account_age_days: 285,
    }).onConflictDoNothing().returning();

    if (demoWorker) {
      createdWorkers.push({ id: demoWorker.id, zone_id: demoWorker.zone_id, policy_tier: demoWorker.policy_tier });

      await db.insert(policiesTable).values({
        worker_id: demoWorker.id,
        tier: demoTier,
        zone_id: "koramangala",
        weekly_premium: TIER_CONFIG[demoTier].weekly_premium,
        coverage_cap: TIER_CONFIG[demoTier].coverage_cap,
        status: "active",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }
  } catch (e) {
    console.log("Demo worker already exists, skipping...");
  }

  for (let i = 1; i < 50; i++) {
    const name = workerNames[i] || `Worker ${i}`;
    const phone = `+91 ${Math.floor(8000000000 + Math.random() * 1999999999)}`;
    const zone_id = workerZones[i] || randomFrom(zones).id;
    const tier = randomTier();
    const platform = randomFrom(platforms);

    try {
      const [worker] = await db.insert(workersTable).values({
        name,
        phone,
        platform,
        zone_id,
        policy_tier: tier,
        platform_rating: (3.8 + Math.random() * 1.2).toFixed(1),
        is_active: true,
        fraud_score: (0.03 + Math.random() * 0.15).toFixed(2),
        account_age_days: Math.floor(30 + Math.random() * 500),
        upi_id: `${name.split(" ")[0].toLowerCase()}${Math.floor(Math.random() * 9999)}@upi`,
      }).onConflictDoNothing().returning();

      if (worker) {
        createdWorkers.push({ id: worker.id, zone_id: worker.zone_id, policy_tier: worker.policy_tier });

        // Create policy
        await db.insert(policiesTable).values({
          worker_id: worker.id,
          tier,
          zone_id,
          weekly_premium: TIER_CONFIG[tier].weekly_premium,
          coverage_cap: TIER_CONFIG[tier].coverage_cap,
          status: "active",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }
    } catch {
      // Skip duplicates
    }
  }

  console.log(`✅ Created ${createdWorkers.length} workers`);

  // Seed historical claims (3 months, 60 records)
  console.log("📋 Seeding historical claims...");
  const allPolicies = await db.select().from(policiesTable);
  const policyMap = new Map(allPolicies.map(p => [p.worker_id, p]));

  for (let i = 0; i < 60; i++) {
    const worker = randomFrom(createdWorkers);
    const policy = policyMap.get(worker.id);
    if (!policy) continue;

    const daysAgo = Math.floor(Math.random() * 90);
    const claimDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const hoursAffected = (0.5 + Math.random() * 4).toFixed(2);
    const coverageCap = parseFloat(policy.coverage_cap);
    const payout = Math.min(parseFloat(hoursAffected) * 90, coverageCap);
    const fraudScore = (0.03 + Math.random() * 0.15).toFixed(2);
    const statusRoll = Math.random();
    let status: string;
    if (statusRoll < 0.55) status = "paid";
    else if (statusRoll < 0.70) status = "auto_approved";
    else if (statusRoll < 0.80) status = "soft_hold";
    else if (statusRoll < 0.90) status = "insurer_review";
    else status = "auto_rejected";

    await db.insert(claimsTable).values({
      worker_id: worker.id,
      policy_id: policy.id,
      zone_id: worker.zone_id,
      disruption_type: randomFrom(eventTypes),
      disruption_start: claimDate,
      hours_affected: hoursAffected,
      hourly_rate: "90.00",
      payout_amount: payout.toFixed(2),
      fraud_score: fraudScore,
      status,
      fraud_signals: {
        "GPS Location Match": { contribution: 0.12, pass: true, flag: false },
        "Weather Correlation": { contribution: 0.08, pass: true, flag: false },
        "Peer Activity Check": { contribution: 0.05, pass: true, flag: false },
        "Claim Frequency": { contribution: 0.03, pass: true, flag: false },
      },
      paid_at: status === "paid" ? new Date(claimDate.getTime() + 3 * 60 * 1000) : null,
    });
  }

  // Seed premium history
  console.log("💳 Seeding premium history...");
  for (const worker of createdWorkers.slice(0, 10)) {
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - w * 7);
      const basePremium = TIER_CONFIG[worker.policy_tier as keyof typeof TIER_CONFIG]?.weekly_premium || "25.00";
      const zoneAdj = (0.5 + Math.random() * 2).toFixed(2);
      const workerAdj = (0.1 + Math.random() * 0.8).toFixed(2);
      const total = (parseFloat(basePremium) + parseFloat(zoneAdj) + parseFloat(workerAdj)).toFixed(2);

      await db.insert(premiumHistoryTable).values({
        worker_id: worker.id,
        week_start: weekStart.toISOString().split("T")[0],
        premium_amount: total,
        zone_risk_adjustment: zoneAdj,
        worker_risk_adjustment: workerAdj,
        explanation: "Weekly premium based on zone risk index and worker profile",
      });
    }
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch(e => {
  console.error("Seed failed:", e);
  process.exit(1);
});
