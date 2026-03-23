import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, DollarSign } from "lucide-react";

interface Family {
  id: string;
  card_number: string;
  family_head_name: string;
  total_members: number;
}

interface Subscription {
  id: string;
  month: number;
  year: number;
  amount: number;
  paid_status: string;
  paid_date: string | null;
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EntryPayments() {
  const [cardNumber, setCardNumber] = useState("");
  const [family, setFamily] = useState<Family | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const unpaidSubs = subscriptions.filter((s) => s.paid_status === "unpaid");
  const totalPending = unpaidSubs.reduce((sum, s) => sum + Number(s.amount), 0);

  const handleSearch = async () => {
    if (!cardNumber.trim()) return;
    setLoading(true);
    setSearched(true);

    const raw = cardNumber.trim();
    const normalized = raw.replace(/[-\s]/g, "").toUpperCase();

    const { data } = await supabase
      .from("families")
      .select("*")
      .or(`card_number.ilike.%${raw}%,card_number.ilike.%${normalized}%,family_head_name.ilike.%${raw}%`)
      .limit(1)
      .maybeSingle();
    setFamily(data);
    if (data) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("family_id", data.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      setSubscriptions(subs ?? []);
    } else {
      setSubscriptions([]);
    }
    setLoading(false);
  };

  const markPaid = async (sub: Subscription) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ paid_status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", sub.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Marked as paid" });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, paid_status: "paid", paid_date: new Date().toISOString().split("T")[0] } : s))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Payment Entry</h2>
        <p className="text-muted-foreground text-sm">Search by card number or name, view pending amount, and mark payments.</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Card Number (e.g. BE-001)"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-xs"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      {family && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{family.family_head_name} <span className="text-sm font-normal text-muted-foreground">({family.card_number})</span></span>
              {unpaidSubs.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Pending: ₹{totalPending.toFixed(2)} ({unpaidSubs.length} months)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriptions found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{MONTH_NAMES[sub.month]} {sub.year}</TableCell>
                      <TableCell>₹{Number(sub.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={sub.paid_status === "paid" ? "default" : "destructive"}>
                          {sub.paid_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.paid_status === "unpaid" && (
                          <Button size="sm" onClick={() => markPaid(sub)}>Mark Paid</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!family && searched && !loading && (
        <p className="text-sm text-muted-foreground">No family found for that card number.</p>
      )}
    </div>
  );
}
