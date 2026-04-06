import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Users, CalendarClock, DollarSign, CheckCircle, ShieldCheck } from "lucide-react";

interface FamilyResult {
  id: string;
  card_number: string;
  family_head_name: string;
  total_members: number;
  photo: string | null;
  pendingMonths: number;
  pendingAmount: number;
  baptizedCount: number;
}

interface UnpaidSub {
  id: string;
  month: number;
  year: number;
  amount: number;
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EntrySearchFamily() {
  const [cardNumber, setCardNumber] = useState("");
  const [family, setFamily] = useState<FamilyResult | null>(null);
  const [unpaidSubs, setUnpaidSubs] = useState<UnpaidSub[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();
  const { userId } = useAuth();

  const handleSearch = async () => {
    if (!cardNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowEntry(false);
    setVerified(false);

    const raw = cardNumber.trim();
    const normalized = raw.replace(/[-\s]/g, "").toUpperCase();

    const { data } = await supabase
      .from("families")
      .select("*")
      .or(`card_number.ilike.%${raw}%,card_number.ilike.%${normalized}%,family_head_name.ilike.%${raw}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      const { data: members } = await supabase
        .from("members")
        .select("baptized")
        .eq("family_id", data.id);

      const baptizedCount = members?.filter((m: any) => m.baptized).length ?? 0;

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, month, year, amount")
        .eq("family_id", data.id)
        .eq("paid_status", "unpaid")
        .order("year", { ascending: true })
        .order("month", { ascending: true });

      const pendingMonths = subs?.length ?? 0;
      const pendingAmount = subs?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0;

      setFamily({ ...data, pendingMonths, pendingAmount, baptizedCount });
      setUnpaidSubs(subs ?? []);
    } else {
      setFamily(null);
      setUnpaidSubs([]);
    }
    setLoading(false);
  };

  const handleVerifyAndPay = async () => {
    if (!family || unpaidSubs.length === 0) return;
    setVerifying(true);

    for (const sub of unpaidSubs) {
      await supabase
        .from("subscriptions")
        .update({
          paid_status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
          entry_user_id: userId,
        })
        .eq("id", sub.id);
    }

    toast({ title: "Payment verified", description: `₹${family.pendingAmount.toFixed(2)} marked as paid. Entry by user ${userId?.slice(0, 8)}...` });
    setVerified(true);
    setVerifying(false);
    // Refresh
    setFamily((prev) => prev ? { ...prev, pendingMonths: 0, pendingAmount: 0 } : null);
    setUnpaidSubs([]);
    setShowEntry(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Search Family</h2>
        <p className="text-muted-foreground text-sm">Search by card number (e.g. BE-001, be001, 001) or family head name.</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Card number or name (e.g. BE-001, 001, John)"
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
        <Card className="max-w-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              {family.photo ? (
                <img src={family.photo} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-primary/30" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-foreground">{family.family_head_name}</p>
                <p className="text-sm text-muted-foreground">{family.card_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{family.total_members}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-accent" />
                <p className="text-lg font-bold text-foreground">{family.baptizedCount}</p>
                <p className="text-xs text-muted-foreground">Valid Subscribers</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <CalendarClock className="h-4 w-4 mx-auto mb-1 text-accent" />
                <p className="text-lg font-bold text-foreground">{family.pendingMonths}</p>
                <p className="text-xs text-muted-foreground">Pending Months</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <DollarSign className="h-4 w-4 mx-auto mb-1 text-destructive" />
                <p className="text-lg font-bold text-foreground">₹{family.pendingAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">Subscription: ₹10/month per baptized member (from Apr 2026)</p>

            {/* Entry Button */}
            {family.pendingMonths > 0 && !showEntry && !verified && (
              <Button className="w-full" onClick={() => setShowEntry(true)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Payment Entry
              </Button>
            )}

            {verified && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-medium">Payment verified & recorded</span>
              </div>
            )}

            {/* Verify Section */}
            {showEntry && !verified && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                <h4 className="text-sm font-semibold text-foreground">Verify Payment</h4>
                <div className="space-y-1 text-sm">
                  {unpaidSubs.map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span>{MONTH_NAMES[s.month]} {s.year}</span>
                      <span>₹{Number(s.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t border-border pt-2 mt-2">
                    <span>Total</span>
                    <span>₹{family.pendingAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Entry by: <Badge variant="outline" className="text-xs">{userId?.slice(0, 8)}...</Badge>
                </div>
                <Button className="w-full" onClick={handleVerifyAndPay} disabled={verifying}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {verifying ? "Processing..." : "Verify & Mark Paid"}
                </Button>
              </div>
            )}

            {family.pendingMonths === 0 && !verified && (
              <Badge variant="default" className="w-full justify-center py-2 text-sm">
                <CheckCircle className="mr-2 h-4 w-4" /> All Paid ✓
              </Badge>
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
