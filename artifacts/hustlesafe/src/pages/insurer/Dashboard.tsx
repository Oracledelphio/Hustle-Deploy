import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListZones,
  useTriggerDisruption,
  useResolveDisruption,
  useListClaims,
} from "@workspace/api-client-react";
import { ZoneCard } from "@/components/ZoneCard";
import { ClaimBadge } from "@/components/ClaimBadge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Activity, Zap, Ban, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { calculateDailyRisk, generateHourlyRiskVariance } from "@/lib/riskSimulation";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Deterministic Weekly Total Volume ──────────────────────────────────────────
function getWeeklyTotalPremiumVolume() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil(days / 7);

  // Fluctuates platform-wide total based on the same week cycle
  const baseTotal = 810000;
  const variance = (currentWeek % 8) * 15400; // Adds between ₹0 and ₹1,07,800 depending on the week

  return baseTotal + variance;
}

function normalizeZoneStatus(status: string | undefined, gdsScore: number | undefined): "active" | "warning" | "disrupted" {
  const s = (status || "").toLowerCase();
  if (s === "disrupted" || s === "shutdown") return "disrupted";
  if (s === "warning" || s === "high" || s === "elevated") return "warning";
  if ((gdsScore ?? 0) >= 80) return "disrupted";
  if ((gdsScore ?? 0) >= 60) return "warning";
  return "active";
}

export function InsurerDashboard() {
  const queryClient = useQueryClient();
  const { data: zonesData } = useListZones({ query: { refetchInterval: 3000 } as any });
  const { data: claimsData } = useListClaims({ limit: 8 }, { query: { refetchInterval: 3000 } as any });

  const triggerMutation = useTriggerDisruption();
  const resolveMutation = useResolveDisruption();

  const [selectedZone, setSelectedZone] = useState("");
  const [eventType, setEventType] = useState<any>("heavy_rain");
  const [gdsTarget, setGdsTarget] = useState(82);
  const [duration, setDuration] = useState(45);
  const [activeTimers, setActiveTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const [aiHourlyData, setAiHourlyData] = useState<any[]>([]);
  const [dailyPeaks, setDailyPeaks] = useState<Record<string, { score: number, time: string }>>({});
  const [platformAnalytics, setPlatformAnalytics] = useState<any>(null);

  const [liveZones, setLiveZones] = useState<any[]>([]);
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);

  // Define hardcoded fallback data for the API
  const FALLBACK_ANALYTICS = {
    total_workers: 2847,
    total_paid_out: 470000, // ₹4.7L
    loss_ratio: 62.0,
    zones_in_disruption: 0
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const [analyticsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/overview`, { signal: controller.signal }).catch(() => null)
        ]);

        clearTimeout(timeoutId);

        // API Check: Analytics Overview
        if (analyticsRes && analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setPlatformAnalytics(analyticsData);
          console.log("✅ [Insurer Dashboard] Analytics API connected successfully.");
        } else {
          console.warn("⚠️ [Insurer Dashboard] Analytics API offline. Using hardcoded FALLBACK_ANALYTICS.");
          setPlatformAnalytics(FALLBACK_ANALYTICS);
        }

        const todayStr = "2026-04-16"; // Locked to demo data window

        let localHourlyModel: any[] = Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00` }));
        const localPeaks: Record<string, { score: number, time: string }> = {};

        const mappedZones = ["koramangala", "indiranagar", "whitefield", "electronic_city", "hsr_layout", "btm_layout", "marathahalli", "jayanagar"];
        mappedZones.forEach(z => {
          const dailyAvg = calculateDailyRisk(z, todayStr);
          const hourlyArray = generateHourlyRiskVariance(dailyAvg);

          let peakScore = 0;
          let peakTime = "00:00";

          hourlyArray.forEach((hScore, hr) => {
            localHourlyModel[hr][z] = hScore;
            if (hScore > peakScore) {
              peakScore = hScore;
              peakTime = localHourlyModel[hr].time;
            }
          });
          localPeaks[z] = { score: peakScore, time: peakTime };
        });

        setAiHourlyData(localHourlyModel);
        setDailyPeaks(localPeaks);

      } catch (error) {
        console.error("❌ [Insurer Dashboard] Critical network error. APIs unreachable.", error);
        setPlatformAnalytics(FALLBACK_ANALYTICS);
      }
    };
    fetchDashboardData();
    return () => Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    const currentHour = simulatedHour !== null ? simulatedHour : new Date().getHours();
    let hourlyDataToProcess = aiHourlyData.length > 0 ? aiHourlyData : [];
    let currentHourData = hourlyDataToProcess[currentHour] || {};

    const zonesToMap = (zonesData?.zones && zonesData.zones.length > 0)
      ? zonesData.zones
      : [
        { id: "1", name: "Koramangala", status: "active", gds_score: 32 },
        { id: "2", name: "Indiranagar", status: "active", gds_score: 28 },
        { id: "3", name: "Whitefield", status: "active", gds_score: 20 },
        { id: "4", name: "Electronic City", status: "active", gds_score: 15 },
        { id: "5", name: "HSR Layout", status: "active", gds_score: 25 },
        { id: "6", name: "BTM Layout", status: "active", gds_score: 30 },
        { id: "7", name: "Marathahalli", status: "active", gds_score: 22 },
        { id: "8", name: "Jayanagar", status: "active", gds_score: 18 },
      ];

    const updatedZones = zonesToMap.map((zone: any) => {
      const safeKey = zone.name.toLowerCase().replace(" ", "_");
      // Use the AI's prediction for this exact hour
      const aiScore = currentHourData[safeKey] || 0;

      // Use whichever is higher: real backend score (disruption) or AI prediction
      const finalScore = Math.max(Number(zone.gds_score), aiScore);

      // AUTONOMOUS TRIGGER LOGIC
      let computedStatus = zone.status;

      // If there is NO manual timer running, let the highest score dictate the status
      if (!activeTimers[zone.id]) {
        computedStatus = normalizeZoneStatus(zone.status, finalScore);
      }
      return {
        ...zone,
        gds_score: finalScore,
        status: computedStatus,
      };
    });

    setLiveZones(updatedZones);
  }, [zonesData, aiHourlyData, simulatedHour, activeTimers]);


  const handleTrigger = async () => {
    if (!selectedZone) { toast.error("Select a zone first"); return; }
    try {
      await triggerMutation.mutateAsync({ data: { zone_id: selectedZone, event_type: eventType, gds_target: gdsTarget, duration_minutes: duration } });
      if (timersRef.current[selectedZone]) clearTimeout(timersRef.current[selectedZone]);
      const timer = setTimeout(async () => {
        try {
          await resolveMutation.mutateAsync({ zoneId: selectedZone });
          toast.success("Disruption Auto-Resolved", { description: `Zone ${selectedZone} returned to normal.` });
          queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
          setActiveTimers((prev) => { const newT = { ...prev }; delete newT[selectedZone]; return newT; });
          delete timersRef.current[selectedZone];
        } catch (e) { console.error("Failed to auto-resolve disruption:", e); }
      }, duration * 60 * 1000);
      timersRef.current[selectedZone] = timer;
      setActiveTimers((prev) => ({ ...prev, [selectedZone]: timer }));
      toast.success("Disruption Triggered", { description: `Zone signals updated. Auto-resolve in ${duration} minutes.` });
      queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
    } catch (e) { toast.error("Failed to trigger disruption"); }
  };

  const handleEndAll = async () => {
    const activeZones = liveZones.filter((z) => z.status === 'disrupted') || [];
    Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    timersRef.current = {};
    setActiveTimers({});
    for (const zone of activeZones) await resolveMutation.mutateAsync({ zoneId: zone.id });
    toast.success("All events resolved", { description: "Zones returned to normal state." });
    queryClient.invalidateQueries({ queryKey: ["/api/zones"] });
  };

  const formatLakhs = (val: number) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val?.toLocaleString() || 0}`;

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Command Center</h1>
            <p className="text-muted-foreground mt-1 text-sm">System-wide monitoring and manual overrides.</p>
          </div>
          <Button variant="destructive" className="rounded-xl font-bold" onClick={handleEndAll} disabled={resolveMutation.isPending}>
            <Ban className="w-4 h-4 mr-2" /> END ALL EVENTS
          </Button>
        </div>

        {/* DYNAMIC KPI GRID */}
        <div className="grid grid-cols-5 gap-3">
          {(() => {
            const data = platformAnalytics || FALLBACK_ANALYTICS;
            const dynamicKpiCards = [
              // Replaced with our deterministic weekly volume!
              { label: "Est. Premium", value: formatLakhs(getWeeklyTotalPremiumVolume()), sub: "Monthly Vol" },
              { label: "Active Workers", value: data.total_workers?.toLocaleString() || "0", sub: "Platform" },
              { label: "Zones Live", value: `${liveZones.length} / 8`, sub: "Monitored" },
              { label: "Active Disruptions", value: liveZones.filter((z) => z.status === 'disrupted').length.toString(), sub: "Zones" },
              { label: "Loss Ratio", value: `${data.loss_ratio || 0}%`, sub: "Target 60%" },
            ];

            return dynamicKpiCards.map((kpi, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 truncate">{kpi.label}</div>
                <div className="text-xl font-display font-bold text-foreground mb-0.5">{kpi.value}</div>
                <div className="text-[9px] font-bold text-primary uppercase truncate">{kpi.sub}</div>
              </div>
            ));
          })()}
        </div>

        <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Today's AI Risk Peaks
            </h2>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">24H LSTM Forecast</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {zonesData?.zones?.sort((a: any, b: any) => b.gds_score - a.gds_score).map((zone: any) => {
              const safeKey = zone.name.toLowerCase().replace(" ", "_");
              const peakData = dailyPeaks[safeKey] || { score: zone.gds_score, time: "Now" };
              const isHighRisk = peakData.score >= 60;

              return (
                <div key={zone.id} className="min-w-[150px] flex-shrink-0 flex flex-col p-3 rounded-xl bg-muted/30 border border-border transition-colors hover:bg-muted/50">
                  <div className="text-xs font-bold text-muted-foreground mb-2 truncate">
                    {zone.name.replace("_", " ").toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">Today's Peak</span>
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-display font-bold px-2 py-0.5 rounded-md ${peakData.score >= 80 ? 'bg-destructive/10 text-destructive' :
                        peakData.score >= 60 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}>
                        GDS {peakData.score}
                      </span>
                      {isHighRisk && (
                        <span className="text-[10px] font-bold flex items-center gap-1 text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3" /> {peakData.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Live Zone Grid
              </h2>

              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Clock:</span>
                <select
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                  value={simulatedHour === null ? "real" : simulatedHour}
                  onChange={(e) => setSimulatedHour(e.target.value === "real" ? null : parseInt(e.target.value))}
                >
                  <option value="real">Live Time</option>
                  <option value="12">12:00 PM (Calm)</option>
                  <option value="14">2:00 PM (Rising Risk)</option>
                  <option value="16">4:00 PM (Storm Hits)</option>
                  <option value="18">6:00 PM (Recovery)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {liveZones.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} selected={selectedZone === zone.id} hasTimer={!!activeTimers[zone.id]} onClick={() => setSelectedZone(zone.id)} />
              ))}
            </div>

            <div className="bg-card rounded-3xl border border-border p-5 shadow-sm">
              <h2 className="text-lg font-display font-bold mb-3">Live Claims Feed</h2>
              <div className="space-y-2">
                {claimsData?.claims?.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors">
                    <div>
                      <div className="font-bold text-sm">{claim.worker_name || "Worker"}</div>
                      <div className="text-xs text-muted-foreground">{claim.zone_name?.replace("_", " ").toUpperCase() || "ZONE"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">₹{claim.payout_amount}</div>
                      <ClaimBadge status={claim.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-foreground text-background rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
              <h2 className="text-lg font-display font-bold mb-5 flex items-center gap-2 relative z-10">
                <Zap className="w-4 h-4 text-primary" /> Disruption Simulator
              </h2>
              <div className="space-y-5 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5 block">Target Zone</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm outline-none" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                    <option value="" className="bg-foreground text-white">Select a zone...</option>
                    {zonesData?.zones?.map((z) => (<option key={z.id} value={z.id} className="bg-foreground text-white">{z.name.replace("_", " ").toUpperCase()}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2 block">Event Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["heavy_rain", "flood", "curfew", "platform_outage"].map((type) => (
                      <button key={type} onClick={() => setEventType(type)} className={`py-1.5 px-2 text-[10px] font-bold rounded-md border transition-all ${eventType === type ? "bg-primary border-primary text-white" : "border-white/20 text-white/60 hover:bg-white/5"}`}>{type.replace("_", " ").toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">GDS Target</label>
                    <span className="font-display font-bold text-lg">{gdsTarget}</span>
                  </div>
                  <Slider value={[gdsTarget]} onValueChange={(v) => setGdsTarget(v[0])} max={100} step={1} className="py-1" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Duration (Mins)</label>
                    <span className="font-bold text-sm">{duration}m</span>
                  </div>
                  <Slider value={[duration]} onValueChange={(v) => setDuration(v[0])} max={120} min={15} step={5} className="py-1" />
                </div>
                <Button onClick={handleTrigger} disabled={triggerMutation.isPending} className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-lg mt-2">
                  {triggerMutation.isPending ? "Triggering..." : "TRIGGER"}
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Reserve Health</h3>
              <div className="mb-1.5 flex justify-between items-end">
                <span className="text-xl font-display font-bold">₹8.4L</span>
                <span className="text-xs font-medium text-muted-foreground">Target: ₹12L</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 w-[70%]"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}