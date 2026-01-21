import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react";

interface SlotRequest {
  id: string;
  student_id: string;
  coach_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  student_name?: string;
  coach_name?: string;
}

const SlotRequestsTab = () => {
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: requestsData } = await supabase
      .from("slot_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    if (requestsData && profiles) {
      const enriched = requestsData.map(r => ({
        ...r,
        student_name: profiles.find(p => p.user_id === r.student_id)?.display_name || 'Unknown',
        coach_name: profiles.find(p => p.user_id === r.coach_id)?.display_name || 'Unknown',
      }));
      setRequests(enriched);
    }

    setLoading(false);
  };

  const processRequest = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    const request = requests.find(r => r.id === id);

    // Update request status
    const { error } = await supabase
      .from("slot_requests")
      .update({ 
        status,
        admin_notes: adminNotes[id] || null 
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to process request");
      setProcessingId(null);
      return;
    }

    // If approved, create the class
    if (status === 'approved' && request) {
      const { error: classError } = await supabase
        .from("classes")
        .insert({
          coach_id: request.coach_id,
          student_id: request.student_id,
          scheduled_date: request.requested_date,
          scheduled_time: request.requested_time,
          status: 'scheduled',
          notes: request.notes,
        });

      if (classError) {
        console.error("Error creating class:", classError);
      }
    }

    // Send notification
    try {
      if (request) {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: request.student_id,
            type: status === 'approved' ? 'slot_approved' : 'slot_rejected',
            title: status === 'approved' ? 'Session Request Approved!' : 'Session Request Declined',
            message: status === 'approved' 
              ? `Your session request for ${format(new Date(request.requested_date), "MMMM d")} at ${request.requested_time} has been approved. Check your calendar!`
              : `Your session request for ${format(new Date(request.requested_date), "MMMM d")} at ${request.requested_time} was declined. ${adminNotes[id] || ''}`,
            relatedId: id
          }
        });
      }
    } catch (e) {
      console.log("Notification send failed:", e);
    }

    toast.success(status === 'approved' ? "Request approved and class scheduled!" : "Request rejected");
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
            Review and approve student session requests
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
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {format(new Date(r.requested_date), "EEEE, MMMM d, yyyy")} at {r.requested_time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Student:</strong> {r.student_name} → <strong>Coach:</strong> {r.coach_name}
                      </p>
                      {r.notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Note:</strong> {r.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Requested {format(new Date(r.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={adminNotes[r.id] || ''}
                        onChange={(e) => setAdminNotes({...adminNotes, [r.id]: e.target.value})}
                        className="min-w-[200px]"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => processRequest(r.id, 'approved')}
                          disabled={processingId === r.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => processRequest(r.id, 'rejected')}
                          disabled={processingId === r.id}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
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
                    <p className="text-sm">
                      {r.student_name} → {r.coach_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.requested_date), "MMM d")} at {r.requested_time}
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
