import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Check } from "lucide-react";

interface Subscription {
  id: string;
  family_id: string;
  month: number;
  year: number;
  amount: number;
  paid_status: string;
  paid_date: string | null;
  families?: { card_number: string; family_head_name: string; total_members: number };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHLY_AMOUNT = 100; // per member per month

export default function AdminPayments() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, families(card_number, family_head_name, total_members)")
      .eq("year", selectedYear)
      .order("month", { ascending: false });
    setSubscriptions((data as Subscription[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubscriptions(); }, [selectedYear]);

  const markAsPaid = async (id: string) => {
    await supabase.from("subscriptions").update({
      paid_status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    toast({ title: "Marked as paid" });
    fetchSubscriptions();
  };

  const generateMonthlySubscriptions = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const { data: families } = await supabase.from("families").select("id, total_members");
    if (!families) return;

    for (const family of families) {
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("family_id", family.id)
        .eq("month", currentMonth)
        .eq("year", selectedYear)
        .maybeSingle();

      if (!existing) {
        await supabase.from("subscriptions").insert({
          family_id: family.id,
          month: currentMonth,
          year: selectedYear,
          amount: family.total_members * MONTHLY_AMOUNT,
          paid_status: "unpaid",
        });
      }
    }
    toast({ title: "Subscriptions generated for current month" });
    fetchSubscriptions();
  };

  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      s.families?.card_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.families?.family_head_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.paid_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCollection = filtered.filter((s) => s.paid_status === "paid").reduce((acc, s) => acc + Number(s.amount), 0);
  const unpaidTotal = filtered.filter((s) => s.paid_status === "unpaid").reduce((acc, s) => acc + Number(s.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Payments</h2>
          <p className="text-muted-foreground text-sm">Track subscription payments and dues.</p>
        </div>
        <Button onClick={generateMonthlySubscriptions}>Generate Current Month</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">${totalCollection.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Unpaid</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums text-destructive">${unpaidTotal.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-border rounded-xl bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Rate: ${MONTHLY_AMOUNT}/member/month</p>
          <p className="text-2xl font-semibold mt-1 tabular-nums">{filtered.length} records</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <Input placeholder="Search by card no. or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No payment records found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card No.</TableHead>
                <TableHead>Family Head</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.families?.card_number}</TableCell>
                  <TableCell>{s.families?.family_head_name}</TableCell>
                  <TableCell>{MONTHS[s.month - 1]} {s.year}</TableCell>
                  <TableCell>{s.families?.total_members}</TableCell>
                  <TableCell className="tabular-nums">${Number(s.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={s.paid_status === "paid" ? "default" : "destructive"}>
                      {s.paid_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.paid_date || "—"}</TableCell>
                  <TableCell className="text-right">
                    {s.paid_status === "unpaid" && (
                      <Button variant="ghost" size="sm" onClick={() => markAsPaid(s.id)}>
                        <Check size={14} /> Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
