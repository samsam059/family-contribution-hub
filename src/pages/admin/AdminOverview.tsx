import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, BarChart3, ClipboardList } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalFamilies: number;
  totalCollections: number;
  activeMembers: number;
  pendingRequests: number;
}

interface MonthlyData {
  month: string;
  paid: number;
  unpaid: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const barChartConfig: ChartConfig = {
  paid: { label: "Collected", color: "hsl(var(--primary))" },
  unpaid: { label: "Unpaid", color: "hsl(var(--destructive))" },
};

const pieChartConfig: ChartConfig = {
  active: { label: "Active", color: "hsl(var(--primary))" },
  inactive: { label: "Inactive", color: "hsl(var(--muted-foreground))" },
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalFamilies: 0,
    totalCollections: 0,
    activeMembers: 0,
    pendingRequests: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [memberBreakdown, setMemberBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const currentYear = new Date().getFullYear();

      const [families, members, payments, requests, allSubs, inactiveMembers] = await Promise.all([
        supabase.from("families").select("id", { count: "exact", head: true }),
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("amount").eq("paid_status", "paid"),
        supabase.from("pending_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subscriptions").select("month, amount, paid_status").eq("year", currentYear),
        supabase.from("members").select("id", { count: "exact", head: true }).neq("status", "active"),
      ]);

      const totalCollections = payments.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

      setStats({
        totalFamilies: families.count ?? 0,
        totalCollections,
        activeMembers: members.count ?? 0,
        pendingRequests: requests.count ?? 0,
      });

      // Monthly chart data
      const monthly: MonthlyData[] = MONTHS.map((m, i) => {
        const monthSubs = allSubs.data?.filter((s) => s.month === i + 1) ?? [];
        return {
          month: m,
          paid: monthSubs.filter((s) => s.paid_status === "paid").reduce((a, s) => a + Number(s.amount), 0),
          unpaid: monthSubs.filter((s) => s.paid_status === "unpaid").reduce((a, s) => a + Number(s.amount), 0),
        };
      });
      setMonthlyData(monthly);

      setMemberBreakdown([
        { name: "Active", value: members.count ?? 0 },
        { name: "Inactive", value: inactiveMembers.count ?? 0 },
      ]);
    };
    fetchAll();
  }, []);

  const cards = [
    { label: "Total Families", value: stats.totalFamilies.toString(), icon: Users },
    { label: "Total Collections", value: `$${stats.totalCollections.toFixed(2)}`, icon: DollarSign },
    { label: "Active Members", value: stats.activeMembers.toString(), icon: BarChart3 },
    { label: "Pending Requests", value: stats.pendingRequests.toString(), icon: ClipboardList },
  ];

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))"];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Collections Bar Chart */}
        <div className="lg:col-span-2 border border-border rounded-xl bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4 text-foreground">Monthly Collections</h3>
          <ChartContainer config={barChartConfig} className="h-[280px] w-full">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unpaid" fill="var(--color-unpaid)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Member Status Pie Chart */}
        <div className="border border-border rounded-xl bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4 text-foreground">Member Status</h3>
          <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={memberBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                strokeWidth={2}
              >
                {memberBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-2">
            {memberBreakdown.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
