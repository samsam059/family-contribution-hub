import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, BarChart3, LogOut } from "lucide-react";

const stats = [
  { label: "Total Members", value: "24", icon: Users },
  { label: "Total Contributions", value: "$12,450.00", icon: DollarSign },
  { label: "This Month", value: "$2,180.00", icon: BarChart3 },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-10 space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Overview</h2>
          <p className="text-muted-foreground">Manage members, view reports, and configure contributions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6 border border-border rounded-2xl bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-muted">
                  <stat.icon size={20} className="text-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="border border-border rounded-2xl bg-card p-8">
          <h3 className="text-lg font-semibold text-foreground mb-2">Recent Activity</h3>
          <p className="text-muted-foreground text-sm">No recent activity to display. Start adding members and contributions.</p>
        </div>
      </main>
    </div>
  );
}
