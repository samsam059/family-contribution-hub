import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, Users, CalendarClock, DollarSign } from "lucide-react";

interface FamilyResult {
  id: string;
  card_number: string;
  family_head_name: string;
  total_members: number;
  photo: string | null;
  pendingMonths: number;
  pendingAmount: number;
}

export default function EntrySearchFamily() {
  const [cardNumber, setCardNumber] = useState("");
  const [family, setFamily] = useState<FamilyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!cardNumber.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from("families")
      .select("*")
      .ilike("card_number", `%${cardNumber.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("amount")
        .eq("family_id", data.id)
        .eq("paid_status", "unpaid");

      const pendingMonths = subs?.length ?? 0;
      const pendingAmount = subs?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0;

      setFamily({ ...data, pendingMonths, pendingAmount });
    } else {
      setFamily(null);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Search Family</h2>
        <p className="text-muted-foreground text-sm">Enter a card number (e.g. BE-001) to view family details.</p>
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
        <Card className="max-w-md">
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

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{family.total_members}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <CalendarClock className="h-4 w-4 mx-auto mb-1 text-accent" />
                <p className="text-lg font-bold text-foreground">{family.pendingMonths}</p>
                <p className="text-xs text-muted-foreground">Pending Months</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <DollarSign className="h-4 w-4 mx-auto mb-1 text-destructive" />
                <p className="text-lg font-bold text-foreground">${family.pendingAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!family && searched && !loading && (
        <p className="text-sm text-muted-foreground">No family found for that card number.</p>
      )}
    </div>
  );
}
