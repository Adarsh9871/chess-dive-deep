import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react";

interface SlotRequest {
  id: string;
  student_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  student_name?: string;
}

const CoachSlotRequestsTab = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    const { data: requestsData } = await supabase
      .from("slot_requests")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    if (requestsData && profiles) {
      const enriched = requestsData.map(r => ({
        ...r,
        student_name: profiles.find(p => p.user_id === r.student_id)?.display_name || 'Unknown',
      }));
      setRequests(enriched);
    }

    setLoading(false);
  };

  const processRequest = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    const request = requests.find(r => r.id === id);

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
      await supabase.from("classes").insert({
        coach_id: user?.id,
        student_id: request.student_id,
        scheduled_date: request.requested_date,
        scheduled_time: request.requested_time,
        status: 'scheduled',
        notes: request.notes,
      });
    }

    // Send notification
    try {
      if (request) {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: request.student_id,
            type: status === 'approved' ? 'slot_approved' : 'slot_rejected',
            title: status === 'approved' ? 'Session Approved!' : 'Session Request Declined',
            message: status === 'approved' 
              ? `Your session for ${format(new Date(request.requested_date), "MMMM d")} at ${request.requested_time} has been confirmed!`
              : `Your session request was declined. ${adminNotes[id] || ''}`,
            relatedId: id
          }
        });
      }
    } catch (e) {
      console.log("Notification send failed:", e);
    }

    toast.success(status === 'approved' ? "Session approved!" : "Request declined");
    setProcessingId(null);
    fetchRequests();
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

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
          <Clock className="w-5 h-5" />
          Session Requests
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingRequests.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Approve or decline student session requests
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
                        {format(new Date(r.requested_date), "EEEE, MMMM d")} at {r.requested_time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Student: {r.student_name}
                    </p>
                    {r.notes && (
                      <p className="text-sm text-muted-foreground">Note: {r.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Notes (optional)"
                      value={adminNotes[r.id] || ''}
                      onChange={(e) => setAdminNotes({...adminNotes, [r.id]: e.target.value})}
                      className="min-w-[180px]"
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
                        Decline
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoachSlotRequestsTab;
