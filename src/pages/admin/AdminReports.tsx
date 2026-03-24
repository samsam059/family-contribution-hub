import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  totalCollections: number;
  paidFamilies: number;
  unpaidFamilies: number;
  membersCount: number;
  records: { card_number: string; family_head_name: string; amount: number; paid_status: string; month: number; year: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminReports() {
  const [period, setPeriod] = useState("monthly");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReport = async () => {
    setLoading(true);
    const now = new Date();
    let query = supabase.from("subscriptions").select("*, families(card_number, family_head_name)");

    if (period === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", weekAgo);
    } else if (period === "monthly") {
      query = query.eq("month", now.getMonth() + 1).eq("year", now.getFullYear());
    } else {
      query = query.eq("year", now.getFullYear());
    }

    const { data } = await query;
    const records = (data || []) as any[];

    const { count: membersCount } = await supabase.from("members").select("id", { count: "exact", head: true });

    const paidIds = new Set(records.filter((r) => r.paid_status === "paid").map((r) => r.family_id));
    const unpaidIds = new Set(records.filter((r) => r.paid_status === "unpaid").map((r) => r.family_id));

    setReport({
      totalCollections: records.filter((r) => r.paid_status === "paid").reduce((a, r) => a + Number(r.amount), 0),
      paidFamilies: paidIds.size,
      unpaidFamilies: unpaidIds.size,
      membersCount: membersCount || 0,
      records: records.map((r) => ({
        card_number: r.families?.card_number || "",
        family_head_name: r.families?.family_head_name || "",
        amount: Number(r.amount),
        paid_status: r.paid_status,
        month: r.month,
        year: r.year,
      })),
    });
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [period]);

  const exportCSV = () => {
    if (!report) return;
    const header = "Card Number,Family Head,Month,Year,Amount,Status\n";
    const rows = report.records.map((r) => `${r.card_number},${r.family_head_name},${MONTHS[r.month - 1]},${r.year},${r.amount},${r.paid_status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${period.charAt(0).toUpperCase() + period.slice(1)} Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total Collections: Rs.${report.totalCollections.toLocaleString()}`, 14, 30);
    doc.text(`Paid Families: ${report.paidFamilies} | Unpaid Families: ${report.unpaidFamilies} | Members: ${report.membersCount}`, 14, 36);

    autoTable(doc, {
      startY: 44,
      head: [["Card No.", "Family Head", "Month", "Amount", "Status"]],
      body: report.records.map((r) => [r.card_number, r.family_head_name, `${MONTHS[r.month - 1]} ${r.year}`, `Rs.${r.amount}`, r.paid_status]),
    });

    doc.save(`report_${period}.pdf`);
    toast({ title: "PDF exported" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Reports</h2>
          <p className="text-muted-foreground text-sm">View contribution reports and analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading report...</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-xl bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Collections</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">${report.totalCollections.toLocaleString()}</p>
            </div>
            <div className="p-4 border border-border rounded-xl bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Paid Families</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{report.paidFamilies}</p>
            </div>
            <div className="p-4 border border-border rounded-xl bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Unpaid Families</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums text-destructive">{report.unpaidFamilies}</p>
            </div>
            <div className="p-4 border border-border rounded-xl bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-semibold mt-1 tabular-nums">{report.membersCount}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}><Download size={14} /> Export CSV</Button>
            <Button variant="outline" onClick={exportPDF}><FileText size={14} /> Export PDF</Button>
          </div>

          <div className="border border-border rounded-xl bg-card p-6">
            <p className="text-sm text-muted-foreground">{report.records.length} records in this {period} report.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
