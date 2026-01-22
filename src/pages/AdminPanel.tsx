import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield,
  Users,
  Calendar,
  MessageSquare,
  Send,
  Search,
  Trash2,
  Bell,
  Link2,
  Clock,
  RefreshCw,
  Gamepad2,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import CoachAssignmentTab from "@/components/admin/CoachAssignmentTab";
import SlotRequestsTab from "@/components/admin/SlotRequestsTab";
import MakeupRequestsAdminTab from "@/components/admin/MakeupRequestsAdminTab";
import ScheduledGamesAdminTab from "@/components/admin/ScheduledGamesAdminTab";
import SettingsTab from "@/components/admin/SettingsTab";

type UserRole = "admin" | "coach" | "student";

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
}

interface ClassData {
  id: string;
  coach_id: string;
  student_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  coach_name?: string;
  student_name?: string;
}

interface MessageData {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  is_announcement: boolean;
  is_read: boolean;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingCounts, setPendingCounts] = useState({ slots: 0, makeup: 0, games: 0 });
  
  // Announcement form
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !data) {
        toast.error("Access denied. Admin only.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      fetchData();
      fetchPendingCounts();
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchPendingCounts = async () => {
    const [slotsRes, makeupRes, gamesRes] = await Promise.all([
      supabase.from("slot_requests").select("*", { count: 'exact', head: true }).eq("status", "pending"),
      supabase.from("makeup_requests").select("*", { count: 'exact', head: true }).eq("status", "pending"),
      supabase.from("scheduled_games").select("*", { count: 'exact', head: true }).eq("status", "scheduled"),
    ]);

    setPendingCounts({
      slots: slotsRes.count || 0,
      makeup: makeupRes.count || 0,
      games: gamesRes.count || 0,
    });
  };

  const fetchData = async () => {
    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, created_at");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (profiles) {
      const usersWithRoles: UserWithRole[] = profiles.map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.user_id);
        return {
          id: p.user_id,
          email: p.display_name || "Unknown",
          display_name: p.display_name,
          role: (userRole?.role as UserRole) || "student",
          created_at: p.created_at,
        };
      });
      setUsers(usersWithRoles);

      // Fetch classes with names
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .order("scheduled_date", { ascending: false })
        .limit(50);

      if (classesData) {
        const enrichedClasses = classesData.map(c => ({
          ...c,
          coach_name: profiles.find(p => p.user_id === c.coach_id)?.display_name || 'Unknown',
          student_name: profiles.find(p => p.user_id === c.student_id)?.display_name || 'Unknown',
        }));
        setClasses(enrichedClasses);
      }
    }

    // Fetch messages
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (messagesData) {
      setMessages(messagesData);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: newRole,
    });

    if (error) {
      toast.error("Failed to update role");
      return;
    }

    toast.success("Role updated successfully");
    fetchData();
  };

  const deleteClass = async (classId: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", classId);

    if (error) {
      toast.error("Failed to delete class");
      return;
    }

    toast.success("Class deleted");
    fetchData();
  };

  const sendAnnouncement = async () => {
    if (!announcementSubject.trim() || !announcementContent.trim()) {
      toast.error("Please fill in subject and content");
      return;
    }

    setSendingAnnouncement(true);

    const { error } = await supabase.from("messages").insert({
      sender_id: user?.id,
      subject: announcementSubject,
      content: announcementContent,
      is_announcement: true,
    });

    if (error) {
      toast.error("Failed to send announcement");
      setSendingAnnouncement(false);
      return;
    }

    // Send email notifications to all users
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, email_notifications")
      .eq("email_notifications", true);

    if (allProfiles) {
      for (const profile of allProfiles.slice(0, 50)) { // Limit to 50 to prevent timeout
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              userId: profile.user_id,
              type: 'announcement',
              title: announcementSubject,
              message: announcementContent,
            }
          });
        } catch (e) {
          console.log("Failed to send notification:", e);
        }
      }
    }

    setSendingAnnouncement(false);
    toast.success("Announcement sent to all users!");
    setAnnouncementSubject("");
    setAnnouncementContent("");
    fetchData();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container px-4 mx-auto py-24">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Full control over users, classes, and assignments</p>
          </div>
        </div>

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="bg-background border h-auto flex-wrap p-1">
            <TabsTrigger value="games" className="gap-2 relative">
              <Gamepad2 className="w-4 h-4" />
              Scheduled Games
              {pendingCounts.games > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCounts.games}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Link2 className="w-4 h-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="slots" className="gap-2 relative">
              <Clock className="w-4 h-4" />
              Slot Requests
              {pendingCounts.slots > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCounts.slots}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="makeup" className="gap-2 relative">
              <RefreshCw className="w-4 h-4" />
              Makeup Requests
              {pendingCounts.makeup > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCounts.makeup}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <Calendar className="w-4 h-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="announce" className="gap-2">
              <Bell className="w-4 h-4" />
              Announce
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Scheduled Games Tab - NEW */}
          <TabsContent value="games">
            <ScheduledGamesAdminTab />
          </TabsContent>

          {/* Coach-Student Assignments Tab */}
          <TabsContent value="assignments">
            <CoachAssignmentTab />
          </TabsContent>

          {/* Slot Requests Tab */}
          <TabsContent value="slots">
            <SlotRequestsTab />
          </TabsContent>

          {/* Makeup Requests Tab */}
          <TabsContent value="makeup">
            <MakeupRequestsAdminTab />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user roles and permissions</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{u.display_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.role === "admin"
                                ? "destructive"
                                : u.role === "coach"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(val) => updateUserRole(u.id, val as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="coach">Coach</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle>All Scheduled Classes</CardTitle>
                <CardDescription>View and manage all classes in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{format(new Date(c.scheduled_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{c.scheduled_time}</TableCell>
                        <TableCell>{c.coach_name}</TableCell>
                        <TableCell>{c.student_name || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === "completed"
                                ? "default"
                                : c.status === "canceled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteClass(c.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {classes.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No classes found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>All Messages</CardTitle>
                <CardDescription>View system messages and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 rounded-lg border ${
                        m.is_announcement ? "bg-primary/5 border-primary/20" : "bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{m.subject}</p>
                            {m.is_announcement && (
                              <Badge variant="default" className="text-xs">
                                Announcement
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{m.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(m.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">No messages yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announce">
            <Card>
              <CardHeader>
                <CardTitle>Send Announcement</CardTitle>
                <CardDescription>Broadcast a message to all users (with email notification)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Announcement subject..."
                    value={announcementSubject}
                    onChange={(e) => setAnnouncementSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Write your announcement..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  onClick={sendAnnouncement}
                  disabled={sendingAnnouncement}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingAnnouncement ? "Sending..." : "Send Announcement (with Email)"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;
