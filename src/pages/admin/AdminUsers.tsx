export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Users</h2>
        <p className="text-muted-foreground text-sm">Manage system users and their roles.</p>
      </div>
      <div className="border border-border rounded-xl bg-card p-6">
        <p className="text-muted-foreground text-sm">No users configured.</p>
      </div>
    </div>
  );
}
