export default function AdminPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Payments</h2>
        <p className="text-muted-foreground text-sm">Track subscription payments and dues.</p>
      </div>
      <div className="border border-border rounded-xl bg-card p-6">
        <p className="text-muted-foreground text-sm">No payment records found.</p>
      </div>
    </div>
  );
}
