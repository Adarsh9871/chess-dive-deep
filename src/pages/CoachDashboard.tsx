import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CalendarTab from "@/components/dashboard/CalendarTab";
import MessagesTab from "@/components/dashboard/MessagesTab";
import MakeupClassTab from "@/components/dashboard/MakeupClassTab";
import CoachAvailabilityTab from "@/components/coach/CoachAvailabilityTab";
import MyStudentsTab from "@/components/coach/MyStudentsTab";
import CoachSlotRequestsTab from "@/components/coach/CoachSlotRequestsTab";
import StudentSlotBookingTab from "@/components/dashboard/StudentSlotBookingTab";

const CoachDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    // Wait until auth finishes hydrating the session on refresh.
    if (loading) return;

    if (!user) {
      navigate("/");
      return;
    }

    checkRoles();
    fetchUnreadCount();
    fetchPendingRequests();
  }, [user, loading, navigate]);

  const checkRoles = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles) {
      setIsAdmin(roles.some(r => r.role === 'admin'));
      setIsCoach(roles.some(r => r.role === 'coach'));
      setIsStudent(roles.some(r => r.role === 'student') || roles.length === 0);
    } else {
      // Default to student if no roles
      setIsStudent(true);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="bg-background border-b pt-20">
        <div className="container px-4 mx-auto py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.email?.split("@")[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Button>
              </Link>
            )}
            <Button variant="destructive" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="container px-4 mx-auto py-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="bg-background border h-auto p-1 flex flex-wrap gap-1">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            
            {/* Student booking tab */}
            {(isStudent || (!isCoach && !isAdmin)) && (
              <TabsTrigger value="booking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Book Session</span>
              </TabsTrigger>
            )}
            
            {isCoach && (
              <>
                <TabsTrigger value="availability" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Availability</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">My Students</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 relative">
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">Requests</span>
                  {pendingRequests > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}

            <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 relative">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="makeup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Makeup</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarTab />
          </TabsContent>

          {(isStudent || (!isCoach && !isAdmin)) && (
            <TabsContent value="booking">
              <StudentSlotBookingTab />
            </TabsContent>
          )}

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

          <TabsContent value="messages">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="makeup">
            <MakeupClassTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default CoachDashboard;
