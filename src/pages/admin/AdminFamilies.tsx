export default function AdminFamilies() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Families</h2>
        <p className="text-muted-foreground text-sm">Manage registered families and their details.</p>
      </div>
      <div className="border border-border rounded-xl bg-card p-6">
        <p className="text-muted-foreground text-sm">No families registered yet.</p>
      </div>
    </div>
  );
}
