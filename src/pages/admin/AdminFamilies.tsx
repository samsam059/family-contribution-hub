import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Search, ChevronDown, ChevronRight, UserPlus, CalendarIcon } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/TablePagination";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  relation: string;
}

interface Family {
  id: string;
  card_number: string;
  family_head_name: string;
  photo: string | null;
  total_members: number;
  created_at: string;
}

const RELATION_OPTIONS = ["Father", "Mother", "Son", "Daughter", "Grandfather", "Grandmother", "Other"];

export default function AdminFamilies() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Record<string, Member[]>>({});
  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null);
  const { toast } = useToast();

  // Family head fields
  const [headName, setHeadName] = useState("");
  const [headDob, setHeadDob] = useState<Date | undefined>();
  const [headMarital, setHeadMarital] = useState("single");
  const [headMarriageDate, setHeadMarriageDate] = useState<Date | undefined>();
  const [headProfession, setHeadProfession] = useState("");
  const [headBaptized, setHeadBaptized] = useState("no");

  // New member form state
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState<Date | undefined>();
  const [newMarital, setNewMarital] = useState("single");
  const [newMarriageDate, setNewMarriageDate] = useState<Date | undefined>();
  const [newProfession, setNewProfession] = useState("");
  const [newBaptized, setNewBaptized] = useState("no");
  const [newRelation, setNewRelation] = useState("Other");
  const [newCustomRelation, setNewCustomRelation] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const fetchFamilies = async () => {
    const { data } = await supabase.from("families").select("*").order("created_at", { ascending: false });
    setFamilies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFamilies(); }, []);

  const fetchMembers = async (familyId: string) => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: true });
    setFamilyMembers((prev) => ({ ...prev, [familyId]: (data as Member[]) || [] }));
  };

  const toggleExpand = (familyId: string) => {
    if (expandedFamily === familyId) {
      setExpandedFamily(null);
    } else {
      setExpandedFamily(familyId);
      if (!familyMembers[familyId]) fetchMembers(familyId);
    }
  };

  const generateCardNumber = async () => {
    const { data } = await supabase.from("families").select("card_number").order("created_at", { ascending: false }).limit(1);
    if (!data || data.length === 0) return "BE-001";
    const last = data[0].card_number;
    const num = parseInt(last.replace("BE-", "")) + 1;
    return `BE-${String(num).padStart(3, "0")}`;
  };

  const resetHeadForm = () => {
    setHeadName("");
    setHeadDob(undefined);
    setHeadMarital("single");
    setHeadMarriageDate(undefined);
    setHeadProfession("");
    setHeadBaptized("no");
    setPhotoFile(null);
  };

  const handleAddFamily = async () => {
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

      const { data: familyData, error } = await supabase.from("families").insert({
        card_number: cardNumber,
        family_head_name: headName.trim(),
        photo: photoUrl,
        total_members: 1,
      }).select().single();

      if (error) throw error;

      // Add family head as a member
      await supabase.from("members").insert({
        family_id: familyData.id,
        member_name: headName.trim(),
        status: "active",
        relation: "Head",
        dob: headDob ? format(headDob, "yyyy-MM-dd") : null,
        marital_status: headMarital,
        marriage_date: headMarital === "married" && headMarriageDate ? format(headMarriageDate, "yyyy-MM-dd") : null,
        profession: headProfession.trim() || null,
        baptized: headBaptized === "yes",
      });

      toast({ title: "Family added", description: `Card number: ${cardNumber}` });
      resetHeadForm();
      setDialogOpen(false);
      fetchFamilies();
    } catch {
      toast({ title: "Error", description: "Failed to add family", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleDeleteFamily = async (id: string, cardNumber: string) => {
    if (!confirm(`Delete family ${cardNumber}?`)) return;
    await supabase.from("members").delete().eq("family_id", id);
    await supabase.from("subscriptions").delete().eq("family_id", id);
    await supabase.from("pending_requests").delete().eq("family_id", id);
    await supabase.from("families").delete().eq("id", id);
    toast({ title: "Deleted", description: `Family ${cardNumber} removed` });
    setExpandedFamily(null);
    fetchFamilies();
  };

  const resetMemberForm = () => {
    setNewName("");
    setNewDob(undefined);
    setNewMarital("single");
    setNewMarriageDate(undefined);
    setNewProfession("");
    setNewBaptized("no");
    setNewRelation("Other");
    setNewCustomRelation("");
  };

  const handleAddMember = async (familyId: string) => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Member name is required", variant: "destructive" });
      return;
    }
    setAddingMember(true);
    const relation = newRelation === "Other" ? (newCustomRelation.trim() || "Other") : newRelation;
    const { error } = await supabase.from("members").insert({
      family_id: familyId,
      member_name: newName.trim(),
      status: "active",
      relation,
      dob: newDob ? format(newDob, "yyyy-MM-dd") : null,
      marital_status: newMarital,
      marriage_date: newMarital === "married" && newMarriageDate ? format(newMarriageDate, "yyyy-MM-dd") : null,
      profession: newProfession.trim() || null,
      baptized: newBaptized === "yes",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { data: count } = await supabase.from("members").select("id", { count: "exact" }).eq("family_id", familyId);
      if (count) {
        await supabase.from("families").update({ total_members: count.length }).eq("id", familyId);
      }
      toast({ title: "Member added" });
      resetMemberForm();
      setAddMemberOpen(null);
      fetchMembers(familyId);
      fetchFamilies();
    }
    setAddingMember(false);
  };

  const handleDeleteMember = async (memberId: string, familyId: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("members").delete().eq("id", memberId);
    const { data: count } = await supabase.from("members").select("id", { count: "exact" }).eq("family_id", familyId);
    if (count) {
      await supabase.from("families").update({ total_members: count.length }).eq("id", familyId);
    }
    toast({ title: "Member removed" });
    fetchMembers(familyId);
    fetchFamilies();
  };

  const filtered = families.filter(
    (f) =>
      f.card_number.toLowerCase().includes(search.toLowerCase()) ||
      f.family_head_name.toLowerCase().includes(search.toLowerCase())
  );

  const pagination = usePagination(filtered, 10);

  const MemberFormFields = ({ prefix, name, setName, dob, setDob, marital, setMarital, marriageDate, setMarriageDate, profession, setProfession, baptized, setBaptized, relation, setRelation, customRelation, setCustomRelation, showRelation = true }: any) => (
    <div className="space-y-4">
      <div>
        <Label>Name *</Label>
        <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Member name" />
      </div>
      {showRelation && (
        <div>
          <Label>Relation</Label>
          <Select value={relation} onValueChange={setRelation}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RELATION_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {relation === "Other" && (
            <Input className="mt-2" value={customRelation} onChange={(e: any) => setCustomRelation(e.target.value)} placeholder="Type relation..." />
          )}
        </div>
      )}
      <div>
        <Label>Date of Birth</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dob ? format(dob, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dob} onSelect={setDob} initialFocus className="p-3 pointer-events-auto" captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label>Marital Status</Label>
        <Select value={marital} onValueChange={setMarital}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="married">Married</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {marital === "married" && (
        <div>
          <Label>Marriage Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !marriageDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {marriageDate ? format(marriageDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={marriageDate} onSelect={setMarriageDate} initialFocus className="p-3 pointer-events-auto" captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} />
            </PopoverContent>
          </Popover>
        </div>
      )}
      <div>
        <Label>Profession</Label>
        <Input value={profession} onChange={(e: any) => setProfession(e.target.value)} placeholder="e.g. Teacher, Engineer" />
      </div>
      <div>
        <Label>Baptized</Label>
        <Select value={baptized} onValueChange={setBaptized}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Only baptized members are included in subscription (₹10/head)</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Families</h2>
          <p className="text-muted-foreground text-sm">Manage families and their members. Click a row to expand.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetHeadForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus size={16} /> Add Family</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Family</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input disabled placeholder="Auto-generated (e.g. BE-001)" />
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
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 text-foreground">Family Head Details</h4>
                <MemberFormFields
                  name={headName} setName={setHeadName}
                  dob={headDob} setDob={setHeadDob}
                  marital={headMarital} setMarital={setHeadMarital}
                  marriageDate={headMarriageDate} setMarriageDate={setHeadMarriageDate}
                  profession={headProfession} setProfession={setHeadProfession}
                  baptized={headBaptized} setBaptized={setHeadBaptized}
                  showRelation={false}
                />
              </div>
              <Button onClick={handleAddFamily} disabled={submitting} className="w-full">
                {submitting ? "Adding..." : "Add Family"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search size={16} className="text-muted-foreground" />
        <Input placeholder="Search by card number or name..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="max-w-sm" />
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No families found.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Card No.</TableHead>
                  <TableHead>Family Head</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedItems.map((f) => (
                  <>
                    <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(f.id)}>
                      <TableCell>
                        {expandedFamily === f.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </TableCell>
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFamily(f.id, f.card_number)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expandedFamily === f.id && (
                      <TableRow key={`${f.id}-members`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-foreground">Family Members</h4>
                              <Dialog open={addMemberOpen === f.id} onOpenChange={(open) => { setAddMemberOpen(open ? f.id : null); if (!open) resetMemberForm(); }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <UserPlus size={14} className="mr-1" /> Add Member
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                  <DialogHeader><DialogTitle>Add Member to {f.card_number}</DialogTitle></DialogHeader>
                                  <MemberFormFields
                                    name={newName} setName={setNewName}
                                    dob={newDob} setDob={setNewDob}
                                    marital={newMarital} setMarital={setNewMarital}
                                    marriageDate={newMarriageDate} setMarriageDate={setNewMarriageDate}
                                    profession={newProfession} setProfession={setNewProfession}
                                    baptized={newBaptized} setBaptized={setNewBaptized}
                                    relation={newRelation} setRelation={setNewRelation}
                                    customRelation={newCustomRelation} setCustomRelation={setNewCustomRelation}
                                    showRelation={true}
                                  />
                                  <Button onClick={() => handleAddMember(f.id)} disabled={addingMember} className="w-full">
                                    {addingMember ? "Adding..." : "Add Member"}
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {!familyMembers[f.id] ? (
                              <p className="text-sm text-muted-foreground">Loading members...</p>
                            ) : familyMembers[f.id].length === 0 ? (
                              <p className="text-sm text-muted-foreground">No members added yet. Click "Add Member" to start.</p>
                            ) : (
                              <div className="border border-border rounded-lg overflow-hidden bg-card">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Relation</TableHead>
                                      <TableHead>DOB</TableHead>
                                      <TableHead>Marital Status</TableHead>
                                      <TableHead>Profession</TableHead>
                                      <TableHead>Baptized</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {familyMembers[f.id].map((m) => (
                                      <TableRow key={m.id}>
                                        <TableCell className="font-medium">{m.member_name}</TableCell>
                                        <TableCell className="text-sm capitalize">{m.relation}</TableCell>
                                        <TableCell className="text-sm">{m.dob ? new Date(m.dob).toLocaleDateString() : "—"}</TableCell>
                                        <TableCell className="text-sm capitalize">
                                          {m.marital_status}
                                          {m.marital_status === "married" && m.marriage_date && (
                                            <span className="text-muted-foreground ml-1">({new Date(m.marriage_date).toLocaleDateString()})</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm">{m.profession || "—"}</TableCell>
                                        <TableCell>
                                          <Badge variant={m.baptized ? "default" : "secondary"}>
                                            {m.baptized ? "Yes" : "No"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMember(m.id, f.id)}>
                                            <Trash2 size={14} className="text-destructive" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}

                            {familyMembers[f.id] && familyMembers[f.id].length > 0 && (
                              <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                                <span>Total: {familyMembers[f.id].length}</span>
                                <span>Baptized: {familyMembers[f.id].filter((m) => m.baptized).length}</span>
                                <span>Monthly Subscription: ₹{familyMembers[f.id].filter((m) => m.baptized).length * 10}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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
