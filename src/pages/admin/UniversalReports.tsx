import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Loader2, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { toast } from "sonner";
import { ReportTable } from "@/components/admin/reports/ReportTable";
import { generateUniversalPDF } from "@/components/admin/reports/generateUniversalPDF";
import type { BookingCategory, UniversalOrder, EntityOption } from "@/components/admin/reports/types";

const CATEGORIES: { key: BookingCategory; label: string }[] = [
  { key: "lab", label: "Lab Orders" },
  { key: "doctor", label: "Doctor Appointments" },
  { key: "nurse", label: "Nurse Bookings" },
  { key: "pharmacy", label: "Pharmacy Orders" },
];

const UniversalReports = () => {
  const [orders, setOrders] = useState<UniversalOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<BookingCategory[]>(["lab"]);
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return format(d, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Determine entity filter label
  const entityLabel = useMemo(() => {
    if (selectedCategories.length !== 1) return "Entity";
    const map: Record<BookingCategory, string> = { lab: "Lab", doctor: "Doctor", nurse: "Nurse", pharmacy: "Pharmacy" };
    return map[selectedCategories[0]];
  }, [selectedCategories]);

  // Fetch entity options based on selected categories
  useEffect(() => {
    const fetchEntities = async () => {
      const opts: EntityOption[] = [];
      if (selectedCategories.includes("lab")) {
        const { data } = await supabase.from("labs").select("id, name").order("name");
        data?.forEach(l => opts.push({ id: l.id, name: l.name, type: "lab" }));
      }
      if (selectedCategories.includes("doctor")) {
        const { data } = await supabase.from("doctors").select("id, full_name").eq("status", "approved").order("full_name");
        data?.forEach(d => opts.push({ id: d.id, name: d.full_name, type: "doctor" }));
      }
      if (selectedCategories.includes("nurse")) {
        const { data } = await supabase.from("nurses").select("id, full_name").eq("status", "approved").order("full_name");
        data?.forEach(n => opts.push({ id: n.id, name: n.full_name, type: "nurse" }));
      }
      if (selectedCategories.includes("pharmacy")) {
        const { data } = await supabase.from("medical_stores").select("id, name").eq("status", "approved").order("name");
        data?.forEach(p => opts.push({ id: p.id, name: p.name, type: "pharmacy" }));
      }
      setEntityOptions(opts);
      setSelectedEntity("all");
    };
    fetchEntities();
  }, [selectedCategories]);

  const toggleCategory = (cat: BookingCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== cat);
      }
      return [...prev, cat];
    });
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const results: UniversalOrder[] = [];
      const dateStart = `${startDate}T00:00:00`;
      const dateEnd = `${endDate}T23:59:59`;

      // Lab orders
      if (selectedCategories.includes("lab")) {
        let q = supabase.from("orders")
          .select("id, unique_id, user_id, lab_id, tests, original_total, discounted_total, discount_percentage, is_availed, availed_at, created_at, status")
          .gte("created_at", dateStart).lte("created_at", dateEnd)
          .order("created_at", { ascending: false });
        if (selectedEntity !== "all" && entityOptions.find(e => e.id === selectedEntity)?.type === "lab") {
          q = q.eq("lab_id", selectedEntity);
        }
        const { data } = await q;
        if (data) {
          const labIds = [...new Set(data.map(o => o.lab_id).filter(Boolean))];
          const { data: labsData } = await supabase.from("labs").select("id, name").in("id", labIds.length ? labIds : ["_"]);
          const labMap: Record<string, string> = {};
          labsData?.forEach(l => labMap[l.id] = l.name);

          const userIds = [...new Set(data.map(o => o.user_id))];
          const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds.length ? userIds : ["_"]);
          const profileMap: Record<string, string> = {};
          profiles?.forEach(p => profileMap[p.user_id] = p.full_name || "Unknown");

          data.forEach(o => {
            const tests = Array.isArray(o.tests) ? o.tests : [];
            const itemParts: string[] = [];
            tests.forEach((t: any) => {
              if (t.type === "package" && Array.isArray(t.tests_included)) {
                // Clean package name (remove emoji prefix)
                const pkgName = (t.test_name || t.name || "Package").replace(/📦\s*/g, "").trim();
                const includedTests = t.tests_included.map((inc: any) => inc.name || "Test").join(", ");
                itemParts.push(`[${pkgName}]: ${includedTests}`);
              } else {
                itemParts.push(t.test_name || t.name || "Unknown");
              }
            });
            const items = itemParts.join(", ");
            results.push({
              id: o.id, category: "lab",
              entityName: o.lab_id ? labMap[o.lab_id] || "Unknown Lab" : "N/A",
              patientName: profileMap[o.user_id] || "Unknown",
              bookingDate: o.created_at,
              availDate: o.availed_at,
              isAvailed: o.is_availed,
              items,
              originalTotal: Number(o.original_total || 0),
              discountedTotal: Number(o.discounted_total || 0),
              status: o.status || "pending",
            });
          });
        }
      }

      // Doctor appointments
      if (selectedCategories.includes("doctor")) {
        let q = supabase.from("appointments")
          .select("id, unique_id, patient_id, doctor_id, appointment_date, appointment_time, consultation_type, fee, status, created_at, completed_at, location_name")
          .gte("created_at", dateStart).lte("created_at", dateEnd)
          .order("created_at", { ascending: false });
        if (selectedEntity !== "all" && entityOptions.find(e => e.id === selectedEntity)?.type === "doctor") {
          q = q.eq("doctor_id", selectedEntity);
        }
        const { data } = await q;
        if (data) {
          const doctorIds = [...new Set(data.map(a => a.doctor_id))];
          const { data: docs } = await supabase.from("doctors").select("id, full_name").in("id", doctorIds.length ? doctorIds : ["_"]);
          const docMap: Record<string, string> = {};
          docs?.forEach(d => docMap[d.id] = d.full_name);

          const patientIds = [...new Set(data.map(a => a.patient_id))];
          const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", patientIds.length ? patientIds : ["_"]);
          const profileMap: Record<string, string> = {};
          profiles?.forEach(p => profileMap[p.user_id] = p.full_name || "Unknown");

          data.forEach(a => {
            results.push({
              id: a.id, category: "doctor",
              entityName: docMap[a.doctor_id] || "Unknown Doctor",
              patientName: profileMap[a.patient_id] || "Unknown",
              bookingDate: a.created_at,
              availDate: a.completed_at,
              isAvailed: a.status === "completed",
              items: `${a.consultation_type} - ${a.appointment_date} ${a.appointment_time}${a.location_name ? ` (${a.location_name})` : ""}`,
              originalTotal: Number(a.fee || 0),
              discountedTotal: Number(a.fee || 0),
              status: a.status || "pending",
            });
          });
        }
      }

      // Nurse bookings
      if (selectedCategories.includes("nurse")) {
        let q = supabase.from("nurse_bookings")
          .select("id, unique_id, nurse_id, patient_id, patient_name, service_needed, preferred_date, preferred_time, status, created_at, completed_at")
          .gte("created_at", dateStart).lte("created_at", dateEnd)
          .order("created_at", { ascending: false });
        if (selectedEntity !== "all" && entityOptions.find(e => e.id === selectedEntity)?.type === "nurse") {
          q = q.eq("nurse_id", selectedEntity);
        }
        const { data } = await q;
        if (data) {
          const nurseIds = [...new Set(data.map(n => n.nurse_id))];
          const { data: nurses } = await supabase.from("nurses").select("id, full_name, per_visit_fee").in("id", nurseIds.length ? nurseIds : ["_"]);
          const nurseMap: Record<string, { name: string; fee: number }> = {};
          nurses?.forEach(n => nurseMap[n.id] = { name: n.full_name, fee: n.per_visit_fee || 0 });

          data.forEach(b => {
            const nurse = nurseMap[b.nurse_id] || { name: "Unknown Nurse", fee: 0 };
            results.push({
              id: b.id, category: "nurse",
              entityName: nurse.name,
              patientName: b.patient_name || "Unknown",
              bookingDate: b.created_at,
              availDate: b.completed_at,
              isAvailed: b.status === "completed",
              items: `${b.service_needed || "General"} - ${b.preferred_date} ${b.preferred_time || ""}`,
              originalTotal: nurse.fee,
              discountedTotal: nurse.fee,
              status: b.status || "pending",
            });
          });
        }
      }

      // Pharmacy orders
      if (selectedCategories.includes("pharmacy")) {
        let q = supabase.from("medicine_orders")
          .select("id, unique_id, user_id, store_id, medicines, estimated_price, final_price, status, created_at, pharmacy_confirmed_at")
          .gte("created_at", dateStart).lte("created_at", dateEnd)
          .order("created_at", { ascending: false });
        if (selectedEntity !== "all" && entityOptions.find(e => e.id === selectedEntity)?.type === "pharmacy") {
          q = q.eq("store_id", selectedEntity);
        }
        const { data } = await q;
        if (data) {
          const storeIds = [...new Set(data.map(o => o.store_id).filter(Boolean))];
          const { data: stores } = await supabase.from("medical_stores").select("id, name").in("id", storeIds.length ? storeIds : ["_"]);
          const storeMap: Record<string, string> = {};
          stores?.forEach(s => storeMap[s.id] = s.name);

          const userIds = [...new Set(data.map(o => o.user_id))];
          const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds.length ? userIds : ["_"]);
          const profileMap: Record<string, string> = {};
          profiles?.forEach(p => profileMap[p.user_id] = p.full_name || "Unknown");

          data.forEach(o => {
            const meds = Array.isArray(o.medicines) ? o.medicines : [];
            const items = meds.map((m: any) => m.name || "Medicine").join(", ");
            results.push({
              id: o.id, category: "pharmacy",
              entityName: o.store_id ? storeMap[o.store_id] || "Unknown Store" : "N/A",
              patientName: profileMap[o.user_id] || "Unknown",
              bookingDate: o.created_at,
              availDate: o.pharmacy_confirmed_at,
              isAvailed: o.status === "delivered" || o.status === "completed",
              items: items || "Prescription Order",
              originalTotal: Number(o.estimated_price || o.final_price || 0),
              discountedTotal: Number(o.final_price || o.estimated_price || 0),
              status: o.status || "pending",
            });
          });
        }
      }

      setOrders(results);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate, selectedCategories, selectedEntity]);

  // Group orders by category
  const grouped = useMemo(() => {
    const map: Record<BookingCategory, UniversalOrder[]> = { lab: [], doctor: [], nurse: [], pharmacy: [] };
    orders.forEach(o => map[o.category].push(o));
    return map;
  }, [orders]);

  // Summary
  const totals = useMemo(() => {
    const totalOriginal = orders.reduce((s, o) => s + o.originalTotal, 0);
    const totalDiscounted = orders.reduce((s, o) => s + o.discountedTotal, 0);
    return { totalOriginal, totalDiscounted, totalSavings: totalOriginal - totalDiscounted };
  }, [orders]);

  const categoryLabels: Record<BookingCategory, string> = { lab: "Lab Orders", doctor: "Doctor Appointments", nurse: "Nurse Bookings", pharmacy: "Pharmacy Orders" };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Universal Reports</h1>
            <p className="text-muted-foreground text-sm">Generate reports across all booking categories</p>
          </div>
          <Button onClick={() => generateUniversalPDF(orders, grouped, selectedCategories, categoryLabels, startDate, endDate, selectedEntity, entityOptions)} disabled={orders.length === 0} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category checkboxes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Booking Categories</label>
              <div className="flex flex-wrap gap-4">
                {CATEGORIES.map(c => (
                  <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={selectedCategories.includes(c.key)} onCheckedChange={() => toggleCategory(c.key)} />
                    <span className="text-sm">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Select {entityLabel}</label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger><SelectValue placeholder={`All ${entityLabel}s`} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {entityOptions.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {selectedCategories.length > 1 && <Badge variant="outline" className="mr-1 text-[10px]">{e.type}</Badge>}
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Original</p>
            <p className="text-2xl font-bold">Rs. {totals.totalOriginal.toLocaleString()}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Discounted</p>
            <p className="text-2xl font-bold text-primary">Rs. {totals.totalDiscounted.toLocaleString()}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Savings</p>
            <p className="text-2xl font-bold text-green-600">Rs. {totals.totalSavings.toLocaleString()}</p>
          </CardContent></Card>
        </div>

        {/* Tables per category */}
        {loading ? (
          <Card><CardContent className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </CardContent></Card>
        ) : orders.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No bookings found</p>
            <p className="text-sm">Try adjusting the date range or filters</p>
          </CardContent></Card>
        ) : (
          selectedCategories.map(cat => {
            const catOrders = grouped[cat];
            if (catOrders.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {categoryLabels[cat]}
                    <Badge variant="secondary">{catOrders.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ReportTable orders={catOrders} category={cat} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
};

export default UniversalReports;
