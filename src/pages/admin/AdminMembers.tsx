export default function AdminMembers() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Members</h2>
        <p className="text-muted-foreground text-sm">View and manage all family members.</p>
      </div>
      <div className="border border-border rounded-xl bg-card p-6">
        <p className="text-muted-foreground text-sm">No members found.</p>
      </div>
    </div>
  );
}
