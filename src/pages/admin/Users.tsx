import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Users, Loader2, Shield, User } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role")
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      setProfiles(profilesResult.data || []);

      const rolesMap: Record<string, string> = {};
      (rolesResult.data || []).forEach((role: UserRole) => {
        rolesMap[role.user_id] = role.role;
      });
      setUserRoles(rolesMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId);

    try {
      // Check if role exists
      const existingRole = userRoles[userId];
      
      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as any });

        if (error) throw error;
      }

      toast.success("User role updated");
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const userRole = userRoles[profile.user_id] || "patient";
    const matchesRole = roleFilter === "all" || userRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and roles
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => {
                      const role = userRoles[profile.user_id] || "patient";
                      return (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {role === "admin" ? (
                                  <Shield className="w-5 h-5 text-primary" />
                                ) : (
                                  <User className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {profile.full_name || "Unnamed User"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {profile.user_id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{profile.phone || "—"}</TableCell>
                          <TableCell>{profile.city || "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={role}
                              onValueChange={(value) => handleRoleChange(profile.user_id, value)}
                              disabled={isUpdating === profile.user_id}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="patient">Patient</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), "dd MMM yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
