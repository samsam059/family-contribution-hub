import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Search } from "lucide-react";

interface Family {
  id: string;
  card_number: string;
  family_head_name: string;
  photo: string | null;
  total_members: number;
  created_at: string;
}

export default function AdminFamilies() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [headName, setHeadName] = useState("");
  const [totalMembers, setTotalMembers] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchFamilies = async () => {
    const { data } = await supabase.from("families").select("*").order("created_at", { ascending: false });
    setFamilies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFamilies(); }, []);

  const generateCardNumber = async () => {
    const { data } = await supabase.from("families").select("card_number").order("created_at", { ascending: false }).limit(1);
    if (!data || data.length === 0) return "BE-001";
    const last = data[0].card_number;
    const num = parseInt(last.replace("BE-", "")) + 1;
    return `BE-${String(num).padStart(3, "0")}`;
  };

  const handleAdd = async () => {
    if (!headName.trim()) {
      toast({ title: "Error", description: "Family head name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const cardNumber = await generateCardNumber();
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${cardNumber}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(path, photoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("families").insert({
        card_number: cardNumber,
        family_head_name: headName.trim(),
        photo: photoUrl,
        total_members: totalMembers,
      });

      if (error) throw error;
      toast({ title: "Family added", description: `Card number: ${cardNumber}` });
      setHeadName("");
      setTotalMembers(1);
      setPhotoFile(null);
      setDialogOpen(false);
      fetchFamilies();
    } catch {
      toast({ title: "Error", description: "Failed to add family", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, cardNumber: string) => {
    if (!confirm(`Delete family ${cardNumber}?`)) return;
    await supabase.from("members").delete().eq("family_id", id);
    await supabase.from("subscriptions").delete().eq("family_id", id);
    await supabase.from("pending_requests").delete().eq("family_id", id);
    await supabase.from("families").delete().eq("id", id);
    toast({ title: "Deleted", description: `Family ${cardNumber} removed` });
    fetchFamilies();
  };

  const filtered = families.filter(
    (f) =>
      f.card_number.toLowerCase().includes(search.toLowerCase()) ||
      f.family_head_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Families</h2>
          <p className="text-muted-foreground text-sm">Manage registered families and their details.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} /> Add Family</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Family</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input disabled placeholder="Auto-generated (e.g. BE-001)" />
              </div>
              <div>
                <Label>Family Head Name</Label>
                <Input value={headName} onChange={(e) => setHeadName(e.target.value)} placeholder="Enter name" />
              </div>
              <div>
                <Label>Number of Members</Label>
                <Input type="number" min={1} value={totalMembers} onChange={(e) => setTotalMembers(Number(e.target.value))} />
              </div>
              <div>
                <Label>Upload Photo</Label>
                <div className="flex items-center gap-2 mt-1">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-secondary transition-colors">
                    <Upload size={14} />
                    {photoFile ? photoFile.name : "Choose file"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full">
                {submitting ? "Adding..." : "Add Family"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search size={16} className="text-muted-foreground" />
        <Input placeholder="Search by card number or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No families found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Card No.</TableHead>
                <TableHead>Family Head</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    {f.photo ? (
                      <img src={f.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{f.card_number}</TableCell>
                  <TableCell>{f.family_head_name}</TableCell>
                  <TableCell>{f.total_members}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id, f.card_number)}>
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
