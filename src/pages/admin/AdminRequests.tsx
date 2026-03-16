export default function AdminRequests() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Pending Requests</h2>
        <p className="text-muted-foreground text-sm">Review and approve member requests.</p>
      </div>
      <div className="border border-border rounded-xl bg-card p-6">
        <p className="text-muted-foreground text-sm">No pending requests.</p>
      </div>
    </div>
  );
}
