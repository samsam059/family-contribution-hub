import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, BarChart3, ClipboardList } from "lucide-react";

interface Stats {
  totalFamilies: number;
  totalCollections: number;
  activeMembers: number;
  pendingRequests: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalFamilies: 0,
    totalCollections: 0,
    activeMembers: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [families, members, payments, requests] = await Promise.all([
        supabase.from("families").select("id", { count: "exact", head: true }),
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("amount").eq("paid_status", "paid"),
        supabase.from("pending_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const totalCollections = payments.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

      setStats({
        totalFamilies: families.count ?? 0,
        totalCollections,
        activeMembers: members.count ?? 0,
        pendingRequests: requests.count ?? 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Families", value: stats.totalFamilies.toString(), icon: Users },
    { label: "Total Collections", value: `$${stats.totalCollections.toFixed(2)}`, icon: DollarSign },
    { label: "Active Members", value: stats.activeMembers.toString(), icon: BarChart3 },
    { label: "Pending Requests", value: stats.pendingRequests.toString(), icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of family contributions and activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-5 border border-border rounded-xl bg-card shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent">
                <card.icon size={18} className="text-accent-foreground" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-2 text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity to display.</p>
      </div>
    </div>
  );
}
