import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ModeratorLayout from "@/components/moderator/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  UserRound,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

const ModeratorDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    approvedPrescriptions: 0,
    rejectedPrescriptions: 0,
    pendingDoctorAppointments: 0,
    confirmedDoctorAppointments: 0,
    pendingNurseBookings: 0,
    confirmedNurseBookings: 0,
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentNurseBookings, setRecentNurseBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch prescription stats
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select("id, status, created_at");

      const pendingPrescriptions = prescriptions?.filter(p => p.status === "pending_review").length || 0;
      const approvedPrescriptions = prescriptions?.filter(p => p.status === "approved").length || 0;
      const rejectedPrescriptions = prescriptions?.filter(p => p.status === "rejected").length || 0;

      // Fetch doctor appointment stats
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, status, created_at");

      const pendingDoctorAppointments = appointments?.filter(a => a.status === "pending").length || 0;
      const confirmedDoctorAppointments = appointments?.filter(a => a.status === "confirmed").length || 0;

      // Fetch nurse booking stats
      const { data: nurseBookings } = await supabase
        .from("nurse_bookings")
        .select("id, status, created_at");

      const pendingNurseBookings = nurseBookings?.filter(b => b.status === "pending").length || 0;
      const confirmedNurseBookings = nurseBookings?.filter(b => b.status === "confirmed").length || 0;

      setStats({
        pendingPrescriptions,
        approvedPrescriptions,
        rejectedPrescriptions,
        pendingDoctorAppointments,
        confirmedDoctorAppointments,
        pendingNurseBookings,
        confirmedNurseBookings,
      });

      // Fetch recent prescriptions
      const { data: recentPres } = await supabase
        .from("prescriptions")
        .select("id, status, created_at, unique_id")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentPrescriptions(recentPres || []);

      // Fetch recent appointments
      const { data: recentAppts } = await supabase
        .from("appointments")
        .select(`
          id, status, appointment_date, appointment_time, created_at,
          doctors:doctor_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentAppointments(recentAppts || []);

      // Fetch recent nurse bookings
      const { data: recentNurse } = await supabase
        .from("nurse_bookings")
        .select(`
          id, status, preferred_date, preferred_time, patient_name, created_at,
          nurses:nurse_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentNurseBookings(recentNurse || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-500/10 text-yellow-600", label: "Pending" },
      approved: { color: "bg-green-500/10 text-green-600", label: "Approved" },
      rejected: { color: "bg-red-500/10 text-red-600", label: "Rejected" },
      confirmed: { color: "bg-blue-500/10 text-blue-600", label: "Confirmed" },
      completed: { color: "bg-green-500/10 text-green-600", label: "Completed" },
      cancelled: { color: "bg-red-500/10 text-red-600", label: "Cancelled" },
    };
    return (
      <Badge className={config[status]?.color || "bg-gray-500/10 text-gray-600"}>
        {config[status]?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <ModeratorLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ModeratorLayout>
    );
  }

  return (
    <ModeratorLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Moderator Dashboard</h1>
          <p className="text-muted-foreground">Overview of pending tasks and recent activity</p>
        </div>

        {/* Urgent Tasks */}
        {(stats.pendingPrescriptions > 0 || stats.pendingDoctorAppointments > 0 || stats.pendingNurseBookings > 0) && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                Pending Actions Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {stats.pendingPrescriptions > 0 && (
                  <Link to="/moderator/prescriptions">
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="w-4 h-4" />
                      {stats.pendingPrescriptions} Prescriptions
                    </Button>
                  </Link>
                )}
                {stats.pendingDoctorAppointments > 0 && (
                  <Link to="/moderator/doctor-appointments">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      {stats.pendingDoctorAppointments} Doctor Appointments
                    </Button>
                  </Link>
                )}
                {stats.pendingNurseBookings > 0 && (
                  <Link to="/moderator/nurse-bookings">
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserRound className="w-4 h-4" />
                      {stats.pendingNurseBookings} Nurse Bookings
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPrescriptions}</p>
                  <p className="text-xs text-muted-foreground">Pending Rx</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approvedPrescriptions}</p>
                  <p className="text-xs text-muted-foreground">Approved Rx</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingDoctorAppointments}</p>
                  <p className="text-xs text-muted-foreground">Pending Appts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingNurseBookings}</p>
                  <p className="text-xs text-muted-foreground">Pending Nurse</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Prescriptions */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recent Prescriptions
                </CardTitle>
                <Link to="/moderator/prescriptions">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPrescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No prescriptions yet</p>
              ) : (
                recentPrescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">#{rx.unique_id?.slice(0, 8) || rx.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(rx.created_at), "dd MMM, hh:mm a")}
                      </p>
                    </div>
                    {getStatusBadge(rx.status)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Doctor Appointments */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Recent Appointments
                </CardTitle>
                <Link to="/moderator/doctor-appointments">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No appointments yet</p>
              ) : (
                recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{apt.doctors?.full_name || "Doctor"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.appointment_date), "dd MMM")} at {apt.appointment_time}
                      </p>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Nurse Bookings */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserRound className="w-4 h-4" />
                  Recent Nurse Bookings
                </CardTitle>
                <Link to="/moderator/nurse-bookings">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentNurseBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet</p>
              ) : (
                recentNurseBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{booking.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.preferred_date), "dd MMM")} - {booking.nurses?.full_name}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModeratorLayout>
  );
};

export default ModeratorDashboard;
