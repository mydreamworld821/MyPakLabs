import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  TestTube,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Activity
} from "lucide-react";

interface DashboardStats {
  totalLabs: number;
  totalTests: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  pendingPrescriptions: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLabs: 0,
    totalTests: 0,
    totalOrders: 0,
    totalUsers: 0,
    pendingOrders: 0,
    pendingPrescriptions: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: labsCount },
        { count: testsCount },
        { count: ordersCount },
        { count: usersCount },
        { count: pendingOrdersCount },
        { count: pendingPrescriptionsCount },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from("labs").select("*", { count: "exact", head: true }),
        supabase.from("tests").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
        supabase.from("orders").select("discounted_total").eq("status", "completed")
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.discounted_total) || 0), 0) || 0;

      setStats({
        totalLabs: labsCount || 0,
        totalTests: testsCount || 0,
        totalOrders: ordersCount || 0,
        totalUsers: usersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        pendingPrescriptions: pendingPrescriptionsCount || 0,
        totalRevenue
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Labs",
      value: stats.totalLabs,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Tests",
      value: stats.totalTests,
      icon: TestTube,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Activity,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Pending Prescriptions",
      value: stats.pendingPrescriptions,
      icon: FileText,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Total Revenue",
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Growth",
      value: "+12%",
      icon: TrendingUp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {isLoading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                View and manage recent orders from the Orders section.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Use the sidebar to navigate between different sections:
              </p>
              <ul className="text-sm space-y-1 mt-2">
                <li>• <strong>Labs:</strong> Add/edit diagnostic laboratories</li>
                <li>• <strong>Tests:</strong> Manage test catalog and pricing</li>
                <li>• <strong>Orders:</strong> Track and update order statuses</li>
                <li>• <strong>Prescriptions:</strong> Review uploaded prescriptions</li>
                <li>• <strong>Users:</strong> Manage user accounts and roles</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
