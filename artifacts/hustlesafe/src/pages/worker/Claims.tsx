import { AppLayout } from "@/components/layout/AppLayout";
import { useListClaims } from "@workspace/api-client-react";
import { useAuth } from "@/store/auth";
import { ClaimBadge } from "@/components/ClaimBadge";
import { format } from "date-fns";
import { FileX, Search } from "lucide-react";

export function WorkerClaims() {
  const { worker } = useAuth();
  const { data: claimsData } = useListClaims({ worker_id: worker?.id });

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Claims History</h1>
            <p className="text-muted-foreground mt-1">Past payouts and processing status.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search claims..."
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {claimsData?.claims?.length ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Claim ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Event Trigger</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {claimsData.claims.map(claim => (
                  <tr key={claim.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      #{claim.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {format(new Date(claim.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {claim.disruption_type?.replace('_', ' ').toUpperCase() || 'GRID ALERT'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {Math.round((claim.hours_affected || 0) * 60)} mins
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      ₹{claim.payout_amount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ClaimBadge status={claim.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-card border border-border rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
              <FileX className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">No Claims Yet</h3>
            <p className="text-muted-foreground max-w-md">
              You haven't been affected by any grid disruptions since your policy started. We're monitoring your zone 24/7.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
