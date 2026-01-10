import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, X, Loader2, User, Star, Search } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  specialization_id: string | null;
}

interface HospitalDoctor {
  id: string;
  doctor_id: string;
  is_primary: boolean;
  department: string | null;
  schedule: string | null;
  doctors: Doctor;
}

interface HospitalDoctorManagerProps {
  hospitalId: string;
  hospitalName: string;
  departments: string[];
}

const HospitalDoctorManager = ({ hospitalId, hospitalName, departments }: HospitalDoctorManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hospitalDoctors, setHospitalDoctors] = useState<HospitalDoctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New doctor form
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [schedule, setSchedule] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHospitalDoctors();
      fetchAllDoctors();
    }
  }, [isOpen, hospitalId]);

  const fetchHospitalDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hospital_doctors")
        .select(`
          id,
          doctor_id,
          is_primary,
          department,
          schedule,
          doctors (
            id,
            full_name,
            photo_url,
            qualification,
            specialization_id
          )
        `)
        .eq("hospital_id", hospitalId);

      if (error) throw error;
      setHospitalDoctors((data as any) || []);
    } catch (error) {
      console.error("Error fetching hospital doctors:", error);
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, full_name, photo_url, qualification, specialization_id")
        .eq("status", "approved")
        .order("full_name");

      if (error) throw error;
      setAllDoctors(data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleAddDoctor = async () => {
    if (!selectedDoctorId) {
      toast.error("Please select a doctor");
      return;
    }

    // Check if already assigned
    if (hospitalDoctors.some(hd => hd.doctor_id === selectedDoctorId)) {
      toast.error("This doctor is already assigned to this hospital");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("hospital_doctors")
        .insert({
          hospital_id: hospitalId,
          doctor_id: selectedDoctorId,
          department: selectedDepartment || null,
          schedule: schedule || null,
          is_primary: isPrimary
        });

      if (error) throw error;
      
      toast.success("Doctor assigned successfully");
      fetchHospitalDoctors();
      resetForm();
    } catch (error: any) {
      console.error("Error adding doctor:", error);
      toast.error(error.message || "Failed to assign doctor");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDoctor = async (id: string) => {
    if (!confirm("Remove this doctor from the hospital?")) return;

    try {
      const { error } = await supabase
        .from("hospital_doctors")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Doctor removed from hospital");
      fetchHospitalDoctors();
    } catch (error) {
      console.error("Error removing doctor:", error);
      toast.error("Failed to remove doctor");
    }
  };

  const togglePrimary = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("hospital_doctors")
        .update({ is_primary: !currentValue })
        .eq("id", id);

      if (error) throw error;
      fetchHospitalDoctors();
    } catch (error) {
      console.error("Error updating primary status:", error);
    }
  };

  const resetForm = () => {
    setSelectedDoctorId("");
    setSelectedDepartment("");
    setSchedule("");
    setIsPrimary(false);
  };

  // Filter available doctors (not already assigned)
  const availableDoctors = allDoctors.filter(
    d => !hospitalDoctors.some(hd => hd.doctor_id === d.id)
  );

  const filteredAvailableDoctors = availableDoctors.filter(
    d => d.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-1" />
          Manage Doctors
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Doctors - {hospitalName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Doctor Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h3 className="font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Assign New Doctor
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Search & Select Doctor</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAvailableDoctors.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No available doctors found
                      </div>
                    ) : (
                      filteredAvailableDoctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex items-center gap-2">
                            <span>{doctor.full_name}</span>
                            {doctor.qualification && (
                              <span className="text-xs text-muted-foreground">
                                ({doctor.qualification})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Input
                    placeholder="e.g., Mon-Fri 9AM-5PM"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                  <Label>Primary Hospital</Label>
                </div>
                <Button onClick={handleAddDoctor} disabled={saving || !selectedDoctorId}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Assign Doctor
                </Button>
              </div>
            </div>
          </div>

          {/* Current Doctors List */}
          <div className="space-y-3">
            <h3 className="font-medium">
              Assigned Doctors ({hospitalDoctors.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : hospitalDoctors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No doctors assigned to this hospital yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {hospitalDoctors.map((hd) => (
                  <div
                    key={hd.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {hd.doctors?.photo_url ? (
                          <img
                            src={hd.doctors.photo_url}
                            alt={hd.doctors.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{hd.doctors?.full_name}</p>
                          {hd.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {hd.department && <span>{hd.department}</span>}
                          {hd.schedule && <span>• {hd.schedule}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrimary(hd.id, hd.is_primary)}
                      >
                        {hd.is_primary ? "Unset Primary" : "Set Primary"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveDoctor(hd.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HospitalDoctorManager;
