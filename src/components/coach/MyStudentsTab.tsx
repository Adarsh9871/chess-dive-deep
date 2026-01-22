import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap } from "lucide-react";

interface Student {
  student_id: string;
  student_name?: string;
  status: string;
  created_at: string;
}

const MyStudentsTab = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from("coach_student_assignments")
      .select("*")
      .eq("coach_id", user.id)
      .eq("status", "active");

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    if (assignments && profiles) {
      const enriched = assignments.map(a => ({
        ...a,
        student_name: profiles.find(p => p.user_id === a.student_id)?.display_name || 'Unknown Student',
      }));
      setStudents(enriched);
    }

    setLoading(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          My Students
        </CardTitle>
        <CardDescription>
          Students assigned to you for 1-on-1 coaching
        </CardDescription>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <div
                key={s.student_id}
                className="p-4 rounded-lg border bg-background hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{s.student_name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {s.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No students assigned yet</p>
            <p className="text-sm">Admin will assign students to you</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyStudentsTab;
