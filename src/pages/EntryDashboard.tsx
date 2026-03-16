import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PenLine, LogOut, Plus } from "lucide-react";

export default function EntryDashboard() {
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
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Entry Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-10 space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Quick Actions</h2>
          <p className="text-muted-foreground">Record contributions and manage member data.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button className="group p-8 border border-border rounded-2xl bg-card text-left hover:border-primary/20 transition-colors">
            <div className="p-3 rounded-lg bg-muted w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus size={24} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">New Contribution</h3>
            <p className="text-sm text-muted-foreground">Record a new daily contribution for a member.</p>
          </button>

          <button className="group p-8 border border-border rounded-2xl bg-card text-left hover:border-primary/20 transition-colors">
            <div className="p-3 rounded-lg bg-muted w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <PenLine size={24} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Update Member</h3>
            <p className="text-sm text-muted-foreground">Edit member profiles and information.</p>
          </button>
        </div>

        <div className="border border-border rounded-2xl bg-card p-8">
          <h3 className="text-lg font-semibold text-foreground mb-2">Today's Entries</h3>
          <p className="text-muted-foreground text-sm">No entries recorded today. Start by adding a new contribution.</p>
        </div>
      </main>
    </div>
  );
}
