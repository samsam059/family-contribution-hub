import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus } from "lucide-react";

interface Family {
  id: string;
  card_number: string;
  family_head_name: string;
}

export default function EntryMemberRequest() {
  const [cardNumber, setCardNumber] = useState("");
  const [family, setFamily] = useState<Family | null>(null);
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!cardNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("families")
      .select("id, card_number, family_head_name")
      .ilike("card_number", `%${cardNumber.trim()}%`)
      .limit(1)
      .maybeSingle();
    setFamily(data);
    setLoading(false);
  };

  const submitRequest = async () => {
    if (!family || !memberName.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("pending_requests").insert({
      family_id: family.id,
      member_name: memberName.trim(),
      request_type: "add_member",
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted", description: "Admin will review your request." });
      setMemberName("");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Request Add Member</h2>
        <p className="text-muted-foreground text-sm">Enter a card number and member name. The request will be sent to admin for approval.</p>
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
          <CardHeader>
            <CardTitle>{family.family_head_name} <span className="text-sm font-normal text-muted-foreground">({family.card_number})</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Member Name</Label>
              <Input
                placeholder="Enter new member name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            </div>
            <Button onClick={submitRequest} disabled={submitting || !memberName.trim()} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" /> Request Add Member
            </Button>
          </CardContent>
        </Card>
      )}

      {!family && searched && !loading && (
        <p className="text-sm text-muted-foreground">No family found for that card number.</p>
      )}
    </div>
  );
}
