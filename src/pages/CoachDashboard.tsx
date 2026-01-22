import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { Card, CardContent } from "@/components/ui/card";
=======
>>>>>>> target/main
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  RefreshCw,
  LogOut,
  Shield,
  Clock,
  GraduationCap,
  ClipboardList,
<<<<<<< HEAD
  Users,
  Video,
=======
>>>>>>> target/main
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CalendarTab from "@/components/dashboard/CalendarTab";
import MessagesTab from "@/components/dashboard/MessagesTab";
import MakeupClassTab from "@/components/dashboard/MakeupClassTab";
<<<<<<< HEAD
import CoachAvailabilityCalendar from "@/components/coach/CoachAvailabilityCalendar";
import MyStudentsTab from "@/components/coach/MyStudentsTab";
import CoachSlotRequestsTab from "@/components/coach/CoachSlotRequestsTab";
import OneOnOneSessionsTab from "@/components/coach/OneOnOneSessionsTab";
=======
import CoachAvailabilityTab from "@/components/coach/CoachAvailabilityTab";
import MyStudentsTab from "@/components/coach/MyStudentsTab";
import CoachSlotRequestsTab from "@/components/coach/CoachSlotRequestsTab";
>>>>>>> target/main

const CoachDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
<<<<<<< HEAD
  const [roleChecked, setRoleChecked] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [todayClasses, setTodayClasses] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
=======
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
>>>>>>> target/main

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    checkRoles();
    fetchUnreadCount();
    fetchPendingRequests();
<<<<<<< HEAD
    fetchStats();
=======
>>>>>>> target/main
  }, [user, navigate]);

  const checkRoles = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

<<<<<<< HEAD
    const hasAdmin = roles?.some(r => r.role === 'admin') || false;
    const hasCoach = roles?.some(r => r.role === 'coach') || false;
    
    setIsAdmin(hasAdmin);
    setIsCoach(hasCoach);
    setRoleChecked(true);

    // Redirect students to student dashboard
    if (!hasAdmin && !hasCoach) {
      navigate("/student-dashboard");
=======
    if (roles) {
      setIsAdmin(roles.some(r => r.role === 'admin'));
      setIsCoach(roles.some(r => r.role === 'coach'));
>>>>>>> target/main
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .or(`recipient_id.eq.${user.id},is_announcement.eq.true`)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    const { count } = await supabase
      .from("slot_requests")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .eq("status", "pending");

    setPendingRequests(count || 0);
  };

<<<<<<< HEAD
  const fetchStats = async () => {
    if (!user) return;

    // Today's classes
    const today = new Date().toISOString().split("T")[0];
    const { count: classCount } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .eq("scheduled_date", today)
      .eq("status", "scheduled");

    setTodayClasses(classCount || 0);

    // Student count
    const { count: students } = await supabase
      .from("coach_student_assignments")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .eq("status", "active");

    setStudentCount(students || 0);

    // Upcoming sessions
    const { count: sessions } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .gte("scheduled_date", today)
      .in("status", ["scheduled", "makeup"]);

    setUpcomingSessions(sessions || 0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
=======
  if (!user) return null;
>>>>>>> target/main

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="bg-background border-b pt-20">
<<<<<<< HEAD
        <div className="container px-4 mx-auto py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Coach Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.email?.split("@")[0]} 👋
=======
        <div className="container px-4 mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.email?.split("@")[0]}
>>>>>>> target/main
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
<<<<<<< HEAD
            <Button variant="destructive" size="sm" onClick={handleSignOut}>
=======
            <Button variant="destructive" size="sm" onClick={signOut}>
>>>>>>> target/main
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Quick Stats */}
      <div className="container px-4 mx-auto py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayClasses}</p>
                <p className="text-xs text-muted-foreground">Today's Classes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{studentCount}</p>
                <p className="text-xs text-muted-foreground">Active Students</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Video className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingSessions}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread Messages</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="bg-background border h-auto p-1 flex flex-wrap gap-1">
            <TabsTrigger value="sessions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Video className="w-4 h-4" />
              1-on-1 Sessions
              {upcomingSessions > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {upcomingSessions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              My Students
            </TabsTrigger>
=======
      <main className="container px-4 mx-auto py-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="bg-background border h-auto p-1 flex flex-wrap gap-1">
>>>>>>> target/main
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
<<<<<<< HEAD
            <TabsTrigger value="availability" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 relative">
              <ClipboardList className="w-4 h-4" />
              Requests
              {pendingRequests > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
=======
            
            {isCoach && (
              <>
                <TabsTrigger value="availability" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Availability
                </TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  My Students
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 relative">
                  <ClipboardList className="w-4 h-4" />
                  Requests
                  {pendingRequests > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}

>>>>>>> target/main
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 relative">
              <MessageSquare className="w-4 h-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="makeup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Makeup Class
            </TabsTrigger>
          </TabsList>

<<<<<<< HEAD
          <TabsContent value="sessions">
            <OneOnOneSessionsTab />
          </TabsContent>

          <TabsContent value="students">
            <MyStudentsTab />
          </TabsContent>

=======
>>>>>>> target/main
          <TabsContent value="calendar">
            <CalendarTab />
          </TabsContent>

<<<<<<< HEAD
          <TabsContent value="availability">
            <CoachAvailabilityCalendar />
          </TabsContent>

          <TabsContent value="requests">
            <CoachSlotRequestsTab />
          </TabsContent>
=======
          {isCoach && (
            <>
              <TabsContent value="availability">
                <CoachAvailabilityTab />
              </TabsContent>
              <TabsContent value="students">
                <MyStudentsTab />
              </TabsContent>
              <TabsContent value="requests">
                <CoachSlotRequestsTab />
              </TabsContent>
            </>
          )}
>>>>>>> target/main

          <TabsContent value="messages">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="makeup">
            <MakeupClassTab />
          </TabsContent>
        </Tabs>
<<<<<<< HEAD
      </div>
=======
      </main>
>>>>>>> target/main

      <Footer />
    </div>
  );
};

export default CoachDashboard;
