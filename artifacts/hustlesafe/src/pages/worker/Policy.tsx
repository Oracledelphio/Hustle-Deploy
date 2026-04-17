import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";

export function WorkerPolicy() {
  const { worker } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      const tier = params.get("tier");
      const amount = params.get("price"); // We need to pass price in URL
      
      if (worker?.id && tier && amount) {
        setIsUpdating(true);
        fetch("/api/stripe/checkout-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerId: worker.id, tier, amount: parseFloat(amount) }),
        })
        .then(res => {
          if (!res.ok) throw new Error("Failed to process payment");
          toast.success(`Successfully upgraded to ${tier} tier and wallet credited!`);
        })
        .catch(err => toast.error(err.message))
        .finally(() => {
          setIsUpdating(false);
          window.history.replaceState({}, document.title, window.location.pathname);
          // Reload to reflect new tier via useAuth
          window.location.reload();
        });
      } else {
        toast.success(`Successfully upgraded to ${tier} tier!`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (params.get("canceled")) {
      toast.error("Checkout was canceled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [worker]);

  const handleUpgradeProcess = async (tierName: string, price: number) => {
    setIsUpdating(true);
    try {
      // Using absolute URL to point to backend server since frontend is on 5173
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: tierName, price }),
      });

      if (!response.ok) {
        let errorData = "Checkout session creation failed";
        try {
          const resJson = await response.json();
          if (resJson.error) errorData = resJson.error;
        } catch (_) {}
        throw new Error(errorData);
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url; // Redirect to Stripe Checkout
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate checkout");
      setIsUpdating(false); // Only set to false on error, if success we are redirecting away
    }
  };
  
  const tiers = [
    { name: "Basic", price: 15, cap: 400 },
    { name: "Standard", price: 25, cap: 800 },
    { name: "Pro", price: 40, cap: 1500 },
  ];

  const activeTierName = worker?.policy_tier || "basic";
  const currentTierData = tiers.find(t => t.name.toLowerCase() === activeTierName.toLowerCase()) || tiers[0];

  return (
    <AppLayout>
      <div className="space-y-8 pb-12 max-w-5xl">
        <div>
          <h1 className="text-3xl font-display font-bold">My Policy</h1>
          <p className="text-muted-foreground mt-1">Manage your parametric coverage details.</p>
        </div>

        <div className="bg-foreground text-background rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-black/10">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              Active Coverage
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Current Tier</div>
                <div className="text-4xl font-display font-bold">{currentTierData.name}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Weekly Premium</div>
                <div className="text-4xl font-display font-bold text-primary-foreground">₹{currentTierData.price}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Daily Cap</div>
                <div className="text-4xl font-display font-bold">₹{currentTierData.cap}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold mb-6">Upgrade Coverage</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map(tier => {
              const isActive = worker?.policy_tier === tier.name.toLowerCase();
              return (
                <div key={tier.name} className={`bg-card rounded-3xl p-6 border transition-all ${isActive ? 'border-primary ring-1 ring-primary shadow-lg' : 'border-border shadow-sm'}`}>
                  {isActive && (
                    <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full inline-block mb-4">
                      Current Plan
                    </div>
                  )}
                  <h3 className="text-2xl font-display font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold">₹{tier.price}</span>
                    <span className="text-muted-foreground font-medium">/ week</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <span>Up to <strong>₹{tier.cap}</strong> daily coverage</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <span>Weather & Grid events covered</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <span>Instant UPI payouts</span>
                    </li>
                  </ul>
                  
                  <Button 
                    variant={isActive ? "outline" : "default"} 
                    className="w-full rounded-xl" 
                    disabled={isActive || isUpdating}
                    onClick={() => handleUpgradeProcess(tier.name, tier.price)}
                  >
                    {isActive ? "Currently Active" : isUpdating ? "Upgrading..." : `Upgrade to ${tier.name}`}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
