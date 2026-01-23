import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Chess, Square, PieceSymbol, Color } from "chess.js";
import { ArrowLeft, Calendar, Play as PlayIcon, Clock, LogIn, X, Loader2, Sparkles, Trophy, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChessBoard from "@/components/chess/ChessBoard";
import PremiumBotSelector, { premiumBots } from "@/components/chess/PremiumBotSelector";
import { BotDifficulty } from "@/components/chess/PremiumBotCard";
import PremiumGameInfo from "@/components/chess/PremiumGameInfo";
import QuickActions from "@/components/chess/QuickActions";
import GameStatusBanner from "@/components/chess/GameStatusBanner";
import VoiceCoach from "@/components/chess/VoiceCoach";
import ChessGuide from "@/components/chess/ChessGuide";
import LiveGuide from "@/components/chess/LiveGuide";
import ScheduledGamesPanel from "@/components/chess/ScheduledGamesPanel";
import AuthModal from "@/components/auth/AuthModal";
import { useChessBotWorker } from "@/hooks/useChessBotWorker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isBefore, startOfToday } from "date-fns";
import { usePlayerStore } from "@/stores/playerStore";

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

const Play = () => {
  const { user, loading: authLoading } = useAuth();
  const { autoSuggestions, toggleAutoSuggestions } = usePlayerStore();
  const botWorker = useChessBotWorker();
  const botRequestTokenRef = useRef(0);

  const [gamePhase, setGamePhase] = useState<"select" | "schedule" | "playing">("select");
  const [game, setGame] = useState(() => new Chess());
  const [playerColor, setPlayerColor] = useState<Color>("w");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[]; black: string[] }>({
    white: [],
    black: [],
  });
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightedSquares, setHighlightedSquares] = useState<{ from: Square; to: Square } | null>(null);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [voiceMessage, setVoiceMessage] = useState("");
  
  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sound player
  const playSound = useCallback((type: "move" | "capture" | "check" | "gameEnd") => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const frequencies = { move: 440, capture: 330, check: 550, gameEnd: 660 };
      
      oscillator.frequency.value = frequencies[type];
      oscillator.type = type === "capture" ? "square" : "sine";
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Thinking timer
  const startThinkingTimer = useCallback(() => {
    setThinkingTime(0);
    thinkingTimerRef.current = setInterval(() => {
      setThinkingTime((prev) => prev + 100);
    }, 100);
  }, []);

  const stopThinkingTimer = useCallback(() => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    if (thinkingWatchdogRef.current) {
      clearTimeout(thinkingWatchdogRef.current);
      thinkingWatchdogRef.current = null;
    }
    setThinkingTime(0);
  }, []);

  // Cancel bot move
  const cancelBotMove = useCallback(() => {
    botRequestTokenRef.current++;
    botWorker.cancelAll();
    stopThinkingTimer();
    
    const moves = game.moves({ verbose: true });
    if (moves.length > 0 && game.turn() !== playerColor) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const newGame = new Chess(game.fen());
      const move = newGame.move(randomMove);
      
      if (move) {
        if (move.captured) {
          setCapturedPieces((prev) => ({
            ...prev,
            [move.color === "w" ? "black" : "white"]: [
              ...prev[move.color === "w" ? "black" : "white"],
              move.captured!,
            ],
          }));
        }
        playSound(move.captured ? "capture" : "move");
        setGame(newGame);
        setLastMove({ from: move.from, to: move.to });
        setMoveHistory((prev) => [...prev, move.san]);
        setGameHistory((prev) => [...prev, game.fen()]);
        toast.info("Bot made a quick move!");
      }
    }
    setIsThinking(false);
  }, [game, playerColor, playSound, botWorker, stopThinkingTimer]);

  // Bot move
  const makeBotMove = useCallback(() => {
    if (!botDifficulty || game.isGameOver() || game.turn() === playerColor) return;

    setIsThinking(true);
    startThinkingTimer();

    const token = ++botRequestTokenRef.current;
    const fen = game.fen();

    thinkingWatchdogRef.current = setTimeout(() => {
      if (token !== botRequestTokenRef.current) return;
      cancelBotMove();
    }, 1200);

    setTimeout(() => {
      botWorker
        .requestMove(fen, botDifficulty)
        .then((botMove) => {
          if (token !== botRequestTokenRef.current) return;
          if (!botMove) return;

          const newGame = new Chess(fen);
          const move = newGame.move({
            from: botMove.from as Square,
            to: botMove.to as Square,
            promotion: (botMove.promotion as PieceSymbol) || undefined,
          });

          if (!move) return;

          const soundType = move.captured ? "capture" : "move";

          setCapturedPieces((prev) => {
            if (!move.captured) return prev;
            return {
              ...prev,
              [move.color === "w" ? "black" : "white"]: [
                ...prev[move.color === "w" ? "black" : "white"],
                move.captured!,
              ],
            };
          });

          playSound(soundType);

          if (newGame.inCheck()) {
            setTimeout(() => playSound("check"), 50);
            const checkMessages = [
              "Oh no! Your King is in check! Quick, find a safe spot!",
              "Watch out! The King needs to move to safety!",
              "Check! Time to protect your King, you can do it!"
            ];
            setVoiceMessage(checkMessages[Math.floor(Math.random() * checkMessages.length)]);
          }

          setGame(newGame);
          setLastMove({ from: move.from, to: move.to });
          setMoveHistory((prev) => [...prev, move.san]);

          if (newGame.isGameOver()) {
            playSound("gameEnd");
            const winner = newGame.turn() === playerColor ? "Bot" : "You";
            const message = newGame.isCheckmate()
              ? winner === "You"
                ? "Wow! Amazing job! You are a chess champion!"
                : "Great game! Every chess master learns from mistakes. Try again!"
              : "It's a draw! That means you played really well!";
            toast[winner === "You" ? "success" : "info"](message);
            setVoiceMessage(message);
          } else {
            const turnMessages = [
              "Your turn now! Look at the green arrows for help!",
              "Great! Now it's your move. What do you see?",
              "Alright! Think carefully and make your best move!",
              "Your turn! Remember, take your time and have fun!"
            ];
            setVoiceMessage(turnMessages[Math.floor(Math.random() * turnMessages.length)]);
          }
        })
        .catch((error) => {
          if (token !== botRequestTokenRef.current) return;
          console.error("Bot move error:", error);
        })
        .finally(() => {
          if (token !== botRequestTokenRef.current) return;
          setIsThinking(false);
          stopThinkingTimer();
        });
    }, 50);
  }, [game, botDifficulty, playerColor, playSound, botWorker, startThinkingTimer, stopThinkingTimer, cancelBotMove]);

  // Trigger bot move
  useEffect(() => {
    if (gamePhase !== "playing" || game.isGameOver()) return;
    if (game.turn() === playerColor) return;
    if (isThinking) return;
    
    const timeoutId = requestAnimationFrame(() => {
      setTimeout(makeBotMove, 100);
    });
    return () => cancelAnimationFrame(timeoutId);
  }, [game.fen(), gamePhase, playerColor, makeBotMove, isThinking]);

  // Player move
  const handlePlayerMove = useCallback((from: Square, to: Square, promotion?: PieceSymbol): boolean => {
    if (isThinking || game.turn() !== playerColor) return false;

    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({ from, to, promotion: promotion || "q" });

      if (move) {
        if (move.captured) {
          setCapturedPieces((prev) => ({
            ...prev,
            [move.color === "w" ? "black" : "white"]: [
              ...prev[move.color === "w" ? "black" : "white"],
              move.captured!,
            ],
          }));
          playSound("capture");
          const captureMessages = [
            `Awesome capture! You got their ${move.captured === 'q' ? 'Queen' : move.captured === 'r' ? 'Rook' : move.captured === 'b' ? 'Bishop' : move.captured === 'n' ? 'Knight' : 'Pawn'}!`,
            `Great job! That ${move.captured === 'q' ? 'Queen' : move.captured === 'r' ? 'Rook' : move.captured === 'b' ? 'Bishop' : move.captured === 'n' ? 'Knight' : 'Pawn'} is yours now!`,
            `Boom! Nice capture! You're playing like a pro!`
          ];
          setVoiceMessage(captureMessages[Math.floor(Math.random() * captureMessages.length)]);
        } else {
          playSound("move");
        }

        if (newGame.inCheck()) {
          playSound("check");
          const checkMessages = [
            "Check! You're attacking the King! Great move!",
            "Whoa! Check! The King is in trouble!",
            "Amazing! That's check! You're doing great!"
          ];
          setVoiceMessage(checkMessages[Math.floor(Math.random() * checkMessages.length)]);
        }

        setGameHistory((prev) => [...prev, game.fen()]);
        setGame(newGame);
        setLastMove({ from, to });
        setMoveHistory((prev) => [...prev, move.san]);
        setHighlightedSquares(null);

        if (newGame.isGameOver()) {
          playSound("gameEnd");
          const message = newGame.isCheckmate() 
            ? "Checkmate! You are amazing! You won the game!" 
            : "It's a draw! Great defensive play!";
          toast[newGame.isCheckmate() ? "success" : "info"](message);
          setVoiceMessage(message);
        }

        return true;
      }
    } catch (e) {
      // Invalid move
    }
    return false;
  }, [isThinking, game, playerColor, playSound]);

  // Go to schedule screen
  const goToSchedule = () => {
    if (!botDifficulty) {
      toast.error("Please select a bot to play against!");
      return;
    }
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setGamePhase("schedule");
  };

  // Start game immediately
  const startGameNow = useCallback(() => {
    const bot = premiumBots.find((b) => b.id === botDifficulty);
    setGamePhase("playing");
    const startMessages = [
      `Let's play chess with ${bot?.name}! You're white, so you go first. Have fun!`,
      `Awesome! Time to play against ${bot?.name}! Make your first move!`,
      `Here we go! ${bot?.name} is ready. You play as white. Good luck, champion!`
    ];
    setVoiceMessage(startMessages[Math.floor(Math.random() * startMessages.length)]);
    toast.success(`Game started against ${bot?.name}!`);
  }, [botDifficulty]);

  // Schedule game
  const scheduleGame = async () => {
    if (!user || !scheduledDate || !scheduledTime || !botDifficulty) return;
    
    setIsSaving(true);
    
    const { error } = await supabase.from("scheduled_games").insert({
      user_id: user.id,
      scheduled_date: format(scheduledDate, "yyyy-MM-dd"),
      scheduled_time: scheduledTime,
      bot_difficulty: botDifficulty,
    });
    
    setIsSaving(false);
    
    if (error) {
      toast.error("Failed to schedule game");
      return;
    }
    
    const dateLabel = isToday(scheduledDate) ? "Today" : isTomorrow(scheduledDate) ? "Tomorrow" : format(scheduledDate, "MMM d");
    toast.success(`Game scheduled for ${dateLabel} at ${scheduledTime}!`);
    
    setScheduledDate(undefined);
    setScheduledTime("");
    setGamePhase("select");
  };

  // Play scheduled game
  const playScheduledGame = useCallback((difficulty: BotDifficulty) => {
    setBotDifficulty(difficulty);
    setGamePhase("playing");
    const bot = premiumBots.find((b) => b.id === difficulty);
    toast.success(`Game started against ${bot?.name}!`);
  }, []);

  // Get date label
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  // New game
  const handleNewGame = useCallback(() => {
    botRequestTokenRef.current++;
    botWorker.cancelAll();
    stopThinkingTimer();

    setGame(new Chess());
    setLastMove(null);
    setMoveHistory([]);
    setGameHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setIsThinking(false);
    setGamePhase("select");
    setHighlightedSquares(null);
    setScheduledDate(undefined);
    setScheduledTime("");
    setVoiceMessage("");
  }, [botWorker, stopThinkingTimer]);

  // Undo
  const handleUndo = useCallback(() => {
    if (gameHistory.length < 2 || isThinking) return;
    
    botRequestTokenRef.current++;
    botWorker.cancelAll();
    stopThinkingTimer();
    
    const targetIndex = gameHistory.length - 2;
    const targetFen = gameHistory[targetIndex];
    
    if (targetFen) {
      const newGame = new Chess(targetFen);
      setGame(newGame);
      setGameHistory((prev) => prev.slice(0, targetIndex));
      setMoveHistory((prev) => prev.slice(0, -2));
      setLastMove(null);
      setIsThinking(false);
      toast.info("Move taken back!");
    }
  }, [gameHistory, isThinking, botWorker, stopThinkingTimer]);

  // Resign
  const handleResign = useCallback(() => {
    toast.info("You resigned. Better luck next time!");
    playSound("gameEnd");
    handleNewGame();
  }, [playSound, handleNewGame]);

  // Flip board
  const flipBoard = useCallback(() => {
    setPlayerColor((prev) => (prev === "w" ? "b" : "w"));
  }, []);

  // Selected bot info
  const selectedBot = useMemo(() => 
    premiumBots.find((b) => b.id === botDifficulty), 
    [botDifficulty]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Back button */}
          <Link to="/">
            <Button variant="ghost" className="mb-4 sm:mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Bot Selection Phase */}
          <AnimatePresence mode="wait">
            {gamePhase === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto"
              >
                {/* Hero section */}
                <div className="text-center mb-8 sm:mb-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-full mb-4"
                  >
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Play & Learn Chess</span>
                  </motion.div>

                  <motion.h1 
                    className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Play Against{" "}
                    <span className="bg-gradient-to-r from-primary via-orange-500 to-secondary bg-clip-text text-transparent">
                      Smart Bots
                    </span>
                  </motion.h1>
                  
                  <motion.p 
                    className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Choose your opponent and start your chess adventure! 
                    Each bot has a unique personality and skill level.
                  </motion.p>
                </div>

                {/* Scheduled Games Panel */}
                {user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 max-w-md mx-auto"
                  >
                    <ScheduledGamesPanel onPlayGame={playScheduledGame} />
                  </motion.div>
                )}

                {/* Bot Selector */}
                <PremiumBotSelector
                  selectedDifficulty={botDifficulty}
                  onSelect={setBotDifficulty}
                />

                {/* Action buttons */}
                <motion.div 
                  className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    size="lg"
                    onClick={startGameNow}
                    disabled={!botDifficulty}
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary via-orange-500 to-primary hover:from-primary/90 hover:via-orange-500/90 hover:to-primary/90 shadow-lg shadow-primary/25"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Play Now
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={goToSchedule}
                    disabled={!botDifficulty}
                    className="w-full sm:w-auto h-14 px-8 text-lg"
                  >
                    {user ? (
                      <>
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule Game
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Login to Schedule
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
                >
                  {[
                    { icon: "🎯", title: "Smart Hints", desc: "Get move suggestions" },
                    { icon: "🔊", title: "Voice Coach", desc: "Audio explanations" },
                    { icon: "📈", title: "Learn & Grow", desc: "Improve your skills" },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-card/50 border border-border/50"
                    >
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Schedule Phase */}
            {gamePhase === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <Button 
                  variant="ghost" 
                  className="mb-4"
                  onClick={() => setGamePhase("select")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Bot Selection
                </Button>

                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-2">
                    Schedule Your <span className="text-primary">Game</span>
                  </h1>
                  <p className="text-sm sm:text-lg text-muted-foreground">
                    Pick a date and time to play against{" "}
                    <span className="font-bold text-primary">{selectedBot?.name}</span>
                  </p>
                </div>

                <div className="bg-card rounded-3xl border-2 border-border shadow-xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl">
                    <span className="text-4xl">{selectedBot?.emoji}</span>
                    <div className="text-left">
                      <p className="font-display font-bold text-lg text-foreground">
                        {selectedBot?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ELO: {selectedBot?.rating}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Pick a Date
                      </label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-12"
                          >
                            {scheduledDate ? getDateLabel(scheduledDate) : "Choose date..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={scheduledDate}
                            onSelect={(date) => {
                              setScheduledDate(date);
                              setIsCalendarOpen(false);
                            }}
                            disabled={(date) => isBefore(date, startOfToday())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Pick a Time
                      </label>
                      <Select value={scheduledTime} onValueChange={setScheduledTime}>
                        <SelectTrigger className="w-full h-12">
                          <SelectValue placeholder="Choose time..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover max-h-[200px]">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      size="lg"
                      onClick={scheduleGame}
                      disabled={!scheduledDate || !scheduledTime || isSaving}
                      className="w-full h-14 text-lg"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      {isSaving ? "Saving..." : "Schedule Game"}
                    </Button>
                    
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <span className="relative bg-card px-4 text-sm text-muted-foreground">
                        or
                      </span>
                    </div>

                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={startGameNow}
                      className="w-full h-14 text-lg"
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Play Right Now!
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Playing Phase */}
            {gamePhase === "playing" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pb-56 lg:pb-4"
              >
                {/* 3-column layout for desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px] gap-4 lg:gap-6 max-w-7xl mx-auto items-start">
                  
                  {/* Left panel - Game Info */}
                  <div className="order-2 lg:order-1">
                    <PremiumGameInfo
                      game={game}
                      playerColor={playerColor}
                      botName={selectedBot?.name || "Bot"}
                      botEmoji={selectedBot?.emoji || "🤖"}
                      botRating={selectedBot?.rating || "~1000"}
                      moveHistory={moveHistory}
                      capturedPieces={capturedPieces}
                    />
                  </div>

                  {/* Center - Main game area */}
                  <div className="flex flex-col items-center gap-3 order-1 lg:order-2">
                    {/* Quick actions bar */}
                    <QuickActions
                      soundEnabled={soundEnabled}
                      onToggleSound={() => setSoundEnabled(!soundEnabled)}
                      hintsEnabled={autoSuggestions}
                      onToggleHints={toggleAutoSuggestions}
                      onFlipBoard={flipBoard}
                      onUndo={handleUndo}
                      onResign={handleResign}
                      onNewGame={handleNewGame}
                      onShowHelp={() => setShowGuide(true)}
                      canUndo={gameHistory.length >= 2}
                      isThinking={isThinking}
                      isGameOver={game.isGameOver()}
                    />

                    {/* Status banner */}
                    <GameStatusBanner
                      game={game}
                      isThinking={isThinking}
                      isPlayerTurn={game.turn() === playerColor}
                      playerColor={playerColor}
                      botName={selectedBot?.name}
                      thinkingTime={thinkingTime}
                    />

                    {/* Voice coach */}
                    <VoiceCoach
                      message={voiceMessage}
                      isPlayerTurn={game.turn() === playerColor && !isThinking}
                    />

                    {/* Chess board */}
                    <ChessBoard
                      game={game}
                      onMove={handlePlayerMove}
                      playerColor={playerColor}
                      disabled={isThinking || game.isGameOver()}
                      lastMove={lastMove}
                      showHints={true}
                      highlightedSquares={highlightedSquares}
                    />

                    {/* Player info */}
                    <p className="text-sm text-muted-foreground text-center">
                      You are playing as{" "}
                      <span className="font-bold text-foreground">
                        {playerColor === "w" ? "White" : "Black"}
                      </span>
                    </p>
                  </div>

                  {/* Right panel - Live Guide */}
                  <div className="hidden lg:block order-3">
                    <LiveGuide
                      game={game}
                      isPlayerTurn={game.turn() === playerColor && !isThinking}
                      playerColor={playerColor}
                      isGameOver={game.isGameOver()}
                      onHighlightSquares={setHighlightedSquares}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
      <ChessGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setGamePhase("schedule")}
      />
      
      {/* Live Guide - Mobile bottom panel */}
      {gamePhase === "playing" && (
        <div className="lg:hidden">
          <LiveGuide
            game={game}
            isPlayerTurn={game.turn() === playerColor && !isThinking}
            playerColor={playerColor}
            isGameOver={game.isGameOver()}
            onHighlightSquares={setHighlightedSquares}
          />
        </div>
      )}
    </div>
  );
};

export default Play;
