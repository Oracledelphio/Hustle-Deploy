import { Router } from "express";
import Stripe from "stripe";

const router = Router();
// Stripe throws an error if initialized with an empty string, so fallback to a dummy key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");

router.post("/stripe/create-checkout-session", async (req, res) => {
  try {
    const { tier, price } = req.body;

    if (!tier || !price) {
      res.status(400).json({ error: "Missing tier or price" });
      return;
    }

    // Determine the origin from the request to redirect back correctly
    // In dev, the Vite server usually runs on port 5173 
    // but the Origin header sent by browser should tell us exactly.
    const origin = req.headers.origin || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `HustleSafe ${tier} Policy`,
              description: `Weekly premium for ${tier} parametric coverage`,
            },
            unit_amount: Math.round(price * 100), // Stripe uses cents/paise
          },
          quantity: 1,
        },
      ],
      mode: "payment", // or 'subscription' if we want recurring, but 'payment' is simpler for one-off/mock
      success_url: `${origin}/worker/policy?success=true&tier=${tier}&price=${price}`,
      cancel_url: `${origin}/worker/policy?canceled=true`,
    });

    res.json({ url: session.url });
    return;
  } catch (err: any) {
    req.log.error({ err }, "Stripe checkout session creation failed");
    res.status(500).json({ error: err.message || "Failed to create checkout session" });
    return;
  }
});

import { db, workersTable, policiesTable, walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { creditWallet } from "../lib/wallet.js";

router.post("/stripe/checkout-success", async (req, res) => {
  try {
    const { workerId, tier, amount } = req.body;

    if (!workerId || !tier || !amount) {
      res.status(400).json({ error: "Missing workerId, tier or amount" });
      return;
    }

    // 1. Update worker tier
    await db.update(workersTable).set({ policy_tier: tier.toLowerCase() }).where(eq(workersTable.id, workerId));

    // 2. Update existing active policy or create new
    const tierCaps: Record<string, string> = { basic: "400.00", standard: "800.00", pro: "1500.00" };
    const cap = tierCaps[tier.toLowerCase()] || "800.00";
    await db.update(policiesTable)
      .set({ tier: tier.toLowerCase(), coverage_cap: cap, weekly_premium: amount.toString() })
      .where(eq(policiesTable.worker_id, workerId));

    // 3. Credit wallet directly as requested for Stripe payments
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.worker_id, workerId)).limit(1);
    if (wallet) {
      await creditWallet(wallet.id, workerId, amount.toString(), "stripe_payment", null, `Added funds for ${tier} tier`);
    }

    res.json({ success: true });
    return;
  } catch (err: any) {
    req.log.error({ err }, "Stripe checkout success handler failed");
    res.status(500).json({ error: err.message || "Failed to process checkout success" });
    return;
  }
});

export default router;
