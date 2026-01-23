import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Maximize2, Minimize2, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface VideoCallRoomProps {
  roomName: string;
  userName: string;
  onEnd: () => void;
  isCoach?: boolean;
}

const VideoCallRoom = ({ roomName, userName, onEnd, isCoach = false }: VideoCallRoomProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  // Create Jitsi meet URL (free, no API key required)
  const jitsiDomain = "meet.jit.si";
  const jitsiUrl = `https://${jitsiDomain}/${roomName}#userInfo.displayName="${encodeURIComponent(userName)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=${isMuted}&config.startWithVideoMuted=${isVideoOff}`;

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setIsConnected(true);
      toast.success("Connected to video call!");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleEndCall = useCallback(() => {
    setIsConnected(false);
    toast.info("Call ended");
    onEnd();
  }, [onEnd]);

  const toggleFullscreen = () => {
    const container = document.getElementById("video-container");
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      id="video-container"
      className={`relative bg-gray-900 rounded-2xl overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "aspect-video"
      }`}
    >
      {/* Jitsi iframe */}
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full h-full border-0"
        title="Video Call"
      />

      {/* Overlay controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="bg-secondary/80">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
              {isConnected ? "Connected" : "Connecting..."}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white">
              <Users className="w-3 h-3 mr-1" />
              {participantCount}
            </Badge>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-full ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white"} hover:bg-white/20`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`rounded-full ${isVideoOff ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white"} hover:bg-white/20`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={handleEndCall}
              className="rounded-full bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Coach badge */}
      {isCoach && (
        <Badge className="absolute top-4 left-4 bg-primary/80">
          Coach Mode
        </Badge>
      )}
    </motion.div>
  );
};

interface VideoCallButtonProps {
  classId?: string;
  coachId: string;
  studentId: string;
  coachName: string;
  studentName: string;
  isCoach: boolean;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export const VideoCallButton = ({
  classId,
  coachId,
  studentId,
  coachName,
  studentName,
  isCoach,
  onCallStart,
  onCallEnd,
}: VideoCallButtonProps) => {
  const [isInCall, setIsInCall] = useState(false);
  const [roomName, setRoomName] = useState("");

  const startCall = useCallback(() => {
    // Generate unique room name
    const room = `chess-class-${classId || Date.now()}-${coachId.slice(0, 8)}`;
    setRoomName(room);
    setIsInCall(true);
    onCallStart?.();
    toast.success("Starting video call...");
  }, [classId, coachId, onCallStart]);

  const endCall = useCallback(() => {
    setIsInCall(false);
    setRoomName("");
    onCallEnd?.();
  }, [onCallEnd]);

  if (isInCall) {
    return (
      <div className="space-y-4">
        <VideoCallRoom
          roomName={roomName}
          userName={isCoach ? coachName : studentName}
          onEnd={endCall}
          isCoach={isCoach}
        />
        <p className="text-sm text-muted-foreground text-center">
          Share this link with {isCoach ? "your student" : "your coach"}: 
          <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">
            https://meet.jit.si/{roomName}
          </code>
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={startCall}
      className="gap-2 bg-gradient-to-r from-secondary to-emerald-500 hover:from-secondary/90 hover:to-emerald-500/90"
    >
      <Video className="w-4 h-4" />
      Start Video Call
    </Button>
  );
};

interface VideoSessionCardProps {
  session: {
    id: string;
    class_id?: string;
    coach_id: string;
    student_id: string;
    room_name: string;
    status: string;
    created_at: string;
  };
  coachName: string;
  studentName: string;
  isCoach: boolean;
  onJoin: () => void;
}

export const VideoSessionCard = ({
  session,
  coachName,
  studentName,
  isCoach,
  onJoin,
}: VideoSessionCardProps) => {
  const isActive = session.status === "active";

  return (
    <Card className={`border-2 ${isActive ? "border-secondary" : "border-border"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Video className="w-4 h-4 text-secondary" />
            Video Session
          </span>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : session.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">With:</span>
            <span className="font-medium">{isCoach ? studentName : coachName}</span>
          </div>
          
          {isActive && (
            <Button onClick={onJoin} className="w-full gap-2">
              <Phone className="w-4 h-4" />
              Join Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCallRoom;
