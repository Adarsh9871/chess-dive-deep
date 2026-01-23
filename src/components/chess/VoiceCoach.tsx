import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Mic, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface VoiceCoachProps {
  message: string;
  isPlayerTurn: boolean;
  autoSpeak?: boolean;
}

const coachEmojis = ["🧙‍♂️", "👨‍🏫", "🦉", "🤖", "🎓"];
const encouragements = [
  "You've got this!",
  "Great thinking!",
  "Take your time!",
  "Chess champions think ahead!",
  "Excellent focus!",
];

const VoiceCoach = ({ message, isPlayerTurn, autoSpeak = false }: VoiceCoachProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [coachEmoji] = useState(() => coachEmojis[Math.floor(Math.random() * coachEmojis.length)]);
  const [lastMessage, setLastMessage] = useState("");
  const { speak, stop, isSpeaking, isLoading } = useTextToSpeech();

  // Speak message when it changes
  useEffect(() => {
    if (isEnabled && message && message !== lastMessage && isPlayerTurn) {
      setLastMessage(message);
      speak(message);
    }
  }, [message, isEnabled, lastMessage, isPlayerTurn, speak]);

  // Auto-enable if requested
  useEffect(() => {
    if (autoSpeak && !isEnabled) {
      setIsEnabled(true);
    }
  }, [autoSpeak, isEnabled]);

  const toggleVoice = useCallback(() => {
    if (isEnabled) {
      stop();
    }
    setIsEnabled(!isEnabled);
  }, [isEnabled, stop]);

  const speakNow = useCallback(() => {
    if (message) {
      speak(message);
    }
  }, [message, speak]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="flex items-center gap-2">
        {/* Voice toggle button */}
        <Button
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          onClick={toggleVoice}
          className={`relative overflow-hidden ${
            isEnabled 
              ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0" 
              : ""
          }`}
        >
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.div
                key="speaking"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Mic className="w-4 h-4" />
                </motion.div>
                <span className="text-xs">Speaking...</span>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span className="text-xs">Loading...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                {isEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span className="text-xs hidden sm:inline">
                  {isEnabled ? "Voice On" : "Voice Off"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Animated rings when speaking */}
          {isSpeaking && (
            <>
              <motion.div
                className="absolute inset-0 rounded-md border-2 border-white/30"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-md border-2 border-white/20"
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
            </>
          )}
        </Button>

        {/* Speak button (manual trigger) */}
        {isEnabled && message && !isSpeaking && !isLoading && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={speakNow}
              className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">Repeat</span>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Coach bubble (shows when speaking) */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-full left-0 mt-2 z-50"
          >
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl px-4 py-3 shadow-xl max-w-[250px]">
              <div className="flex items-start gap-2">
                <span className="text-2xl">{coachEmoji}</span>
                <div>
                  <p className="text-xs font-medium opacity-80">Coach says:</p>
                  <p className="text-sm font-semibold line-clamp-3">{message}</p>
                </div>
              </div>
              {/* Speech bubble triangle */}
              <div className="absolute -top-2 left-4 w-4 h-4 bg-violet-500 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceCoach;
