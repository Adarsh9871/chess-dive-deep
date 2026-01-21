import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserPlus, Users, Trash2, Link2 } from "lucide-react";

interface Assignment {
  id: string;
  coach_id: string;
  student_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  coach_name?: string;
  student_name?: string;
}

interface UserInfo {
  user_id: string;
  display_name: string | null;
  role?: string;
}

const CoachAssignmentTab = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [coaches, setCoaches] = useState<UserInfo[]>([]);
  const [students, setStudents] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [selectedCoach, setSelectedCoach] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    // Fetch all roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (profiles && roles) {
      const profilesWithRoles = profiles.map(p => ({
        ...p,
        role: roles.find(r => r.user_id === p.user_id)?.role || 'student'
      }));

      setCoaches(profilesWithRoles.filter(p => p.role === 'coach'));
      setStudents(profilesWithRoles.filter(p => p.role === 'student'));
    }

    // Fetch assignments
    const { data: assignmentsData } = await supabase
      .from("coach_student_assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (assignmentsData && profiles) {
      const enrichedAssignments = assignmentsData.map(a => ({
        ...a,
        coach_name: profiles.find(p => p.user_id === a.coach_id)?.display_name || 'Unknown Coach',
        student_name: profiles.find(p => p.user_id === a.student_id)?.display_name || 'Unknown Student',
      }));
      setAssignments(enrichedAssignments);
    }

    setLoading(false);
  };

  const createAssignment = async () => {
    if (!selectedCoach || !selectedStudent) {
      toast.error("Please select both coach and student");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("coach_student_assignments").insert({
      coach_id: selectedCoach,
      student_id: selectedStudent,
      assigned_by: user?.id,
      notes: notes || null,
    });

    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        toast.error("This coach-student pair already exists");
      } else {
        toast.error("Failed to create assignment");
      }
      return;
    }

    toast.success("Coach assigned to student successfully!");
    setShowDialog(false);
    setSelectedCoach("");
    setSelectedStudent("");
    setNotes("");
    fetchData();

    // Send notification to student
    try {
      const coachName = coaches.find(c => c.user_id === selectedCoach)?.display_name || 'your coach';
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: selectedStudent,
          type: 'class_scheduled',
          title: 'Coach Assigned',
          message: `You have been assigned to ${coachName} for 1-on-1 chess lessons. Check your dashboard to view available slots and book sessions.`,
        }
      });
    } catch (e) {
      console.log("Notification send failed:", e);
    }
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase
      .from("coach_student_assignments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove assignment");
      return;
    }

    toast.success("Assignment removed");
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("coach_student_assignments")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Status updated");
    fetchData();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Coach-Student Assignments
              </CardTitle>
              <CardDescription>
                Assign coaches to students for 1-on-1 teaching sessions
              </CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  New Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Coach to Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Coach</label>
                    <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a coach" />
                      </SelectTrigger>
                      <SelectContent>
                        {coaches.map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            {c.display_name || c.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {coaches.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No coaches available. Assign coach role to users first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Student</label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.user_id} value={s.user_id}>
                            {s.display_name || s.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                    <Textarea
                      placeholder="Add any notes about this assignment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button onClick={createAssignment} disabled={saving} className="w-full">
                    {saving ? "Assigning..." : "Create Assignment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {a.coach_name}
                      </div>
                    </TableCell>
                    <TableCell>{a.student_name}</TableCell>
                    <TableCell>
                      <Select
                        value={a.status}
                        onValueChange={(val) => updateStatus(a.id, val)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(a.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                      {a.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAssignment(a.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No assignments yet</p>
              <p className="text-sm">Click "New Assignment" to pair coaches with students</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coaches.length}</p>
                <p className="text-sm text-muted-foreground">Active Coaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => a.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachAssignmentTab;
