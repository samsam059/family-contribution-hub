import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users } from "lucide-react";

interface Family {
  id: string;
  card_number: string;
  family_head_name: string;
  total_members: number;
  photo: string | null;
}

interface Member {
  id: string;
  member_name: string;
  status: string;
}

export default function EntrySearchFamily() {
  const [query, setQuery] = useState("");
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedFamily(null);
    setMembers([]);
    const { data } = await supabase
      .from("families")
      .select("*")
      .or(`card_number.ilike.%${query}%,family_head_name.ilike.%${query}%`);
    setFamilies(data ?? []);
    setLoading(false);
  };

  const selectFamily = async (family: Family) => {
    setSelectedFamily(family);
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("family_id", family.id)
      .eq("status", "active");
    setMembers(data ?? []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Search Family</h2>
        <p className="text-muted-foreground text-sm">Search by card number or family head name.</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Card number or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      {families.length > 0 && !selectedFamily && (
        <div className="grid gap-3">
          {families.map((f) => (
            <Card
              key={f.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => selectFamily(f)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {f.photo && (
                  <img src={f.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{f.family_head_name}</p>
                  <p className="text-sm text-muted-foreground">{f.card_number}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {f.total_members}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedFamily && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {selectedFamily.photo && (
                <img src={selectedFamily.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              {selectedFamily.family_head_name}
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedFamily.card_number})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Total members: {selectedFamily.total_members}</p>
            <div>
              <h4 className="font-medium text-foreground mb-2">Active Members</h4>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active members.</p>
              ) : (
                <ul className="space-y-1">
                  {members.map((m) => (
                    <li key={m.id} className="text-sm text-foreground">{m.member_name}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSelectedFamily(null); setMembers([]); }}>
              Back to results
            </Button>
          </CardContent>
        </Card>
      )}

      {families.length === 0 && query && !loading && (
        <p className="text-sm text-muted-foreground">No families found.</p>
      )}
    </div>
  );
}
