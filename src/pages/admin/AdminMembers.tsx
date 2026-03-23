import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/TablePagination";

interface Member {
  id: string;
  family_id: string;
  member_name: string;
  status: string;
  dob: string | null;
  marital_status: string;
  marriage_date: string | null;
  profession: string | null;
  baptized: boolean;
  created_at: string;
  families?: { card_number: string; family_head_name: string };
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase
      .from("members")
      .select("*, families(card_number, family_head_name)")
      .order("created_at", { ascending: false });
    setMembers((data as Member[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string, familyId: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("members").delete().eq("id", id);
    const { data: count } = await supabase.from("members").select("id", { count: "exact" }).eq("family_id", familyId);
    if (count) {
      await supabase.from("families").update({ total_members: count.length }).eq("id", familyId);
    }
    toast({ title: "Member removed" });
    fetchData();
  };

  const filtered = members.filter(
    (m) =>
      m.member_name.toLowerCase().includes(search.toLowerCase()) ||
      m.families?.card_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.families?.family_head_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pagination = usePagination(filtered, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Members</h2>
        <p className="text-muted-foreground text-sm">View all family members. Add members from the Families page.</p>
      </div>

      <div className="flex items-center gap-2">
        <Search size={16} className="text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="max-w-sm" />
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No members found.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Card No.</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Marital</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Baptized</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedItems.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.member_name}</TableCell>
                    <TableCell>{m.families?.family_head_name || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{m.families?.card_number || "—"}</TableCell>
                    <TableCell className="text-sm">{m.dob ? new Date(m.dob).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{m.marital_status}</TableCell>
                    <TableCell className="text-sm">{m.profession || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.baptized ? "default" : "secondary"}>
                        {m.baptized ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "active" ? "default" : "secondary"}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id, m.family_id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination {...pagination} />
          </>
        )}
      </div>
    </div>
  );
}
