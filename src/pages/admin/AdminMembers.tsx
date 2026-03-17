import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search } from "lucide-react";

interface Member {
  id: string;
  family_id: string;
  member_name: string;
  status: string;
  created_at: string;
  families?: { card_number: string; family_head_name: string };
}

interface Family {
  id: string;
  card_number: string;
  family_head_name: string;
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [memberName, setMemberName] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const [membersRes, familiesRes] = await Promise.all([
      supabase.from("members").select("*, families(card_number, family_head_name)").order("created_at", { ascending: false }),
      supabase.from("families").select("id, card_number, family_head_name").order("card_number"),
    ]);
    setMembers((membersRes.data as Member[]) || []);
    setFamilies(familiesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!memberName.trim() || !selectedFamily) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("members").insert({
      family_id: selectedFamily,
      member_name: memberName.trim(),
      status: "active",
    });
    if (error) {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
    } else {
      // Update family total_members count
      const { data: count } = await supabase.from("members").select("id", { count: "exact" }).eq("family_id", selectedFamily);
      if (count) {
        await supabase.from("families").update({ total_members: count.length }).eq("id", selectedFamily);
      }
      toast({ title: "Member added" });
      setMemberName("");
      setSelectedFamily("");
      setDialogOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Members</h2>
          <p className="text-muted-foreground text-sm">View and manage all family members.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} /> Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Family</Label>
                <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                  <SelectTrigger><SelectValue placeholder="Select family" /></SelectTrigger>
                  <SelectContent>
                    {families.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.card_number} — {f.family_head_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Member Name</Label>
                <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Enter member name" />
              </div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full">
                {submitting ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search size={16} className="text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No members found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Card No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.member_name}</TableCell>
                  <TableCell>{m.families?.family_head_name || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{m.families?.card_number || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "active" ? "default" : "secondary"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id, m.family_id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
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
