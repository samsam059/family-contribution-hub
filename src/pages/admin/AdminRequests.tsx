import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface PendingRequest {
  id: string;
  family_id: string;
  member_name: string;
  request_type: string;
  status: string;
  created_at: string;
  families?: { card_number: string; family_head_name: string };
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("pending_requests")
      .select("*, families(card_number, family_head_name)")
      .order("created_at", { ascending: false });
    setRequests((data as PendingRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (req: PendingRequest) => {
    // Add member to members table
    const { error: memberError } = await supabase.from("members").insert({
      family_id: req.family_id,
      member_name: req.member_name,
      status: "active",
    });
    if (memberError) {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
      return;
    }

    // Update family total_members
    const { data: count } = await supabase.from("members").select("id", { count: "exact" }).eq("family_id", req.family_id);
    if (count) {
      await supabase.from("families").update({ total_members: count.length }).eq("id", req.family_id);
    }

    // Update request status
    await supabase.from("pending_requests").update({ status: "approved" }).eq("id", req.id);
    toast({ title: "Approved", description: `${req.member_name} has been added to the family` });
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    await supabase.from("pending_requests").update({ status: "rejected" }).eq("id", id);
    toast({ title: "Rejected" });
    fetchRequests();
  };

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Pending Requests</h2>
        <p className="text-muted-foreground text-sm">Review and approve member requests.</p>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No pending requests.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead>Family</TableHead>
                <TableHead>Card No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.member_name}</TableCell>
                  <TableCell>{r.families?.family_head_name || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{r.families?.card_number || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{r.request_type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleApprove(r)}>
                      <CheckCircle size={14} className="text-green-500" /> Approve
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReject(r.id)}>
                      <XCircle size={14} className="text-destructive" /> Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {processed.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">History</h3>
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.member_name}</TableCell>
                    <TableCell>{r.families?.family_head_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
