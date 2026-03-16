import { Users, DollarSign, BarChart3, ClipboardList } from "lucide-react";

const stats = [
  { label: "Total Families", value: "12", icon: Users, change: "+2 this month" },
  { label: "Total Contributions", value: "$12,450.00", icon: DollarSign, change: "+$2,180" },
  { label: "Active Members", value: "48", icon: BarChart3, change: "3 pending" },
  { label: "Pending Requests", value: "5", icon: ClipboardList, change: "Action needed" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of family contributions and activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 border border-border rounded-xl bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary">
                <stat.icon size={18} className="text-primary" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-xl bg-card p-6">
        <h3 className="text-base font-semibold mb-2">Recent Activity</h3>
        <p className="text-muted-foreground text-sm">No recent activity to display.</p>
      </div>
    </div>
  );
}
