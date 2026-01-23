import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Calendar, User, Mail, Phone, Loader2, UserCheck } from "lucide-react";

interface SlotRequest {
  id: string;
  student_id: string;
  coach_id: string | null;
  requested_date: string;
  requested_time: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  coach_name?: string;
}

interface CoachProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

const SlotRequestsTab = () => {
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  
  // Approval dialog state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SlotRequest | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");

  useEffect(() => {
    fetchRequests();
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    // Get all coach user IDs
    const { data: coachRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");

    if (coachRoles && coachRoles.length > 0) {
      const coachIds = coachRoles.map(r => r.user_id);
      
      const { data: coachProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", coachIds);

      if (coachProfiles) {
        setCoaches(coachProfiles);
      }
    }
  };

  const fetchRequests = async () => {
    const { data: requestsData } = await supabase
      .from("slot_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, phone");

    if (requestsData && profiles) {
      const enriched = requestsData.map(r => {
        const studentProfile = profiles.find(p => p.user_id === r.student_id);
        const coachProfile = profiles.find(p => p.user_id === r.coach_id);
        return {
          ...r,
          student_name: studentProfile?.display_name || 'Unknown',
          student_email: studentProfile?.email || null,
          student_phone: studentProfile?.phone || null,
          coach_name: coachProfile?.display_name || (r.coach_id ? 'Unknown' : 'Not Assigned'),
        };
      });
      setRequests(enriched);
    }

    setLoading(false);
  };

  const openApprovalDialog = (request: SlotRequest) => {
    setSelectedRequest(request);
    setSelectedCoachId(request.coach_id || "");
    setShowApprovalDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;
    
    if (!selectedCoachId) {
      toast.error("Please select a coach to assign");
      return;
    }

    setProcessingId(selectedRequest.id);

    // Update request with coach and status
    const { error } = await supabase
      .from("slot_requests")
      .update({ 
        status: 'approved',
        coach_id: selectedCoachId,
        admin_notes: adminNotes[selectedRequest.id] || null 
      })
      .eq("id", selectedRequest.id);

    if (error) {
      toast.error("Failed to approve request");
      setProcessingId(null);
      return;
    }

    // Create the class
    const { error: classError } = await supabase
      .from("classes")
      .insert({
        coach_id: selectedCoachId,
        student_id: selectedRequest.student_id,
        scheduled_date: selectedRequest.requested_date,
        scheduled_time: selectedRequest.requested_time,
        status: 'scheduled',
        notes: selectedRequest.notes,
      });

    if (classError) {
      console.error("Error creating class:", classError);
    }

    // Create coach-student assignment if not exists
    const { data: existingAssignment } = await supabase
      .from("coach_student_assignments")
      .select("id")
      .eq("coach_id", selectedCoachId)
      .eq("student_id", selectedRequest.student_id)
      .maybeSingle();

    if (!existingAssignment) {
      await supabase.from("coach_student_assignments").insert({
        coach_id: selectedCoachId,
        student_id: selectedRequest.student_id,
        assigned_by: (await supabase.auth.getUser()).data.user?.id || selectedCoachId,
        status: 'active',
      });
    }

    // Send notifications
    try {
      const coachName = coaches.find(c => c.user_id === selectedCoachId)?.display_name || 'your coach';
      
      // Notify student
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: selectedRequest.student_id,
          type: 'slot_approved',
          title: 'Session Request Approved!',
          message: `Your session on ${format(new Date(selectedRequest.requested_date), "MMMM d")} at ${selectedRequest.requested_time} is confirmed with ${coachName}!`,
          relatedId: selectedRequest.id
        }
      });

      // Notify coach
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: selectedCoachId,
          type: 'new_session',
          title: 'New Session Assigned',
          message: `You have a new session with ${selectedRequest.student_name} on ${format(new Date(selectedRequest.requested_date), "MMMM d")} at ${selectedRequest.requested_time}`,
          relatedId: selectedRequest.id
        }
      });
    } catch (e) {
      console.log("Notification send failed:", e);
    }

    toast.success("Request approved and coach assigned!");
    setProcessingId(null);
    setShowApprovalDialog(false);
    setSelectedRequest(null);
    setSelectedCoachId("");
    fetchRequests();
  };

  const rejectRequest = async (id: string) => {
    setProcessingId(id);
    const request = requests.find(r => r.id === id);

    const { error } = await supabase
      .from("slot_requests")
      .update({ 
        status: 'rejected',
        admin_notes: adminNotes[id] || null 
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to reject request");
      setProcessingId(null);
      return;
    }

    // Send notification
    try {
      if (request) {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: request.student_id,
            type: 'slot_rejected',
            title: 'Session Request Declined',
            message: `Your session request for ${format(new Date(request.requested_date), "MMMM d")} at ${request.requested_time} was declined. ${adminNotes[id] || ''}`,
            relatedId: id
          }
        });
      }
    } catch (e) {
      console.log("Notification send failed:", e);
    }

    toast.success("Request rejected");
    setProcessingId(null);
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Coach Assignment Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Approve & Assign Coach
            </DialogTitle>
            <DialogDescription>
              Select a coach to assign to this session
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 pt-2">
              {/* Student Details Card */}
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Student Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedRequest.student_name}</p>
                  {selectedRequest.student_email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {selectedRequest.student_email}
                    </p>
                  )}
                  {selectedRequest.student_phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {selectedRequest.student_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Session Details */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Session Details
                </h4>
                <p className="text-sm">
                  <strong>Date:</strong> {format(new Date(selectedRequest.requested_date), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm">
                  <strong>Time:</strong> {selectedRequest.requested_time}
                </p>
                {selectedRequest.notes && (
                  <p className="text-sm">
                    <strong>Notes:</strong> {selectedRequest.notes}
                  </p>
                )}
              </div>

              {/* Coach Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Coach *</label>
                <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a coach to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.user_id} value={coach.user_id}>
                        {coach.display_name || coach.email || 'Coach'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {coaches.length === 0 && (
                  <p className="text-xs text-destructive">No coaches available. Please create a coach first.</p>
                )}
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes for this assignment..."
                  value={adminNotes[selectedRequest.id] || ''}
                  onChange={(e) => setAdminNotes({...adminNotes, [selectedRequest.id]: e.target.value})}
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmApproval}
                  disabled={processingId === selectedRequest.id || !selectedCoachId}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processingId === selectedRequest.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Assign
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Slot Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review student requests and assign coaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-lg border bg-background"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Session & Student Info */}
                    <div className="space-y-3 flex-1">
                      {/* Date/Time */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-semibold">
                          {format(new Date(r.requested_date), "EEEE, MMMM d, yyyy")} at {r.requested_time}
                        </span>
                      </div>
                      
                      {/* Student Details */}
                      <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          {r.student_name}
                        </p>
                        {r.student_email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {r.student_email}
                          </p>
                        )}
                        {r.student_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {r.student_phone}
                          </p>
                        )}
                      </div>

                      {/* Coach Assignment Status */}
                      <p className="text-sm">
                        <strong>Coach:</strong>{" "}
                        {r.coach_id ? (
                          <span className="text-green-600">{r.coach_name}</span>
                        ) : (
                          <span className="text-amber-600">Not assigned yet</span>
                        )}
                      </p>

                      {r.notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Student Note:</strong> {r.notes}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Requested {format(new Date(r.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <Button
                        size="sm"
                        onClick={() => openApprovalDialog(r)}
                        disabled={processingId === r.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve & Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectRequest(r.id)}
                        disabled={processingId === r.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending requests</p>
              <p className="text-sm">All caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Processed Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {processedRequests.length > 0 ? (
            <div className="space-y-3">
              {processedRequests.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {r.student_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.requested_date), "MMM d")} at {r.requested_time} • Coach: {r.coach_name}
                    </p>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No processed requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlotRequestsTab;
