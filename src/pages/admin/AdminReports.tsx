export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Reports</h2>
        <p className="text-muted-foreground text-sm">View contribution reports and analytics.</p>
      </div>
      <div className="border border-border rounded-xl bg-card p-6">
        <p className="text-muted-foreground text-sm">No reports available.</p>
      </div>
    </div>
  );
}
