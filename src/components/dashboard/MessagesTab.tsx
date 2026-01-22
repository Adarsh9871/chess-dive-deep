import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Mail, Send, Bell, Check, MailOpen } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  is_announcement: boolean;
  is_read: boolean;
  created_at: string;
}

const MessagesTab = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`recipient_id.eq.${user.id},is_announcement.eq.true`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
    );
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Message List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Inbox
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedMessage?.id === m.id ? "bg-muted" : ""
                } ${!m.is_read ? "bg-primary/5" : ""}`}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.is_read) markAsRead(m.id);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      !m.is_read ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${!m.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {m.subject}
                      </p>
                      {m.is_announcement && (
                        <Bell className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(m.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MailOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Detail */}
      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          {selectedMessage ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{selectedMessage.subject}</h3>
                    {selectedMessage.is_announcement && (
                      <Badge variant="default">Announcement</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {selectedMessage.is_read && (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="w-3 h-3" />
                    Read
                  </Badge>
                )}
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Mail className="w-16 h-16 mb-4 opacity-30" />
              <p>Select a message to read</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagesTab;
