import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Chess, Square, PieceSymbol, Color } from "chess.js";
import { ArrowLeft, Lightbulb, RotateCcw, Volume2, VolumeX, Calendar, Play as PlayIcon, Clock, LogIn, Eye, EyeOff, Undo2, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ChessBoard from "@/components/chess/ChessBoard";
import BotSelector, { BotDifficulty, bots } from "@/components/chess/BotSelector";
import GameInfo from "@/components/chess/GameInfo";
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
  const [gameHistory, setGameHistory] = useState<string[]>([]); // FEN history for undo
  
  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Memoized sound player to avoid recreation
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

  // Start thinking timer
  const startThinkingTimer = useCallback(() => {
    setThinkingTime(0);
    thinkingTimerRef.current = setInterval(() => {
      setThinkingTime((prev) => prev + 100);
    }, 100);
  }, []);

  // Stop thinking timer + watchdog
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

  // Cancel bot move and force quick random move
  const cancelBotMove = useCallback(() => {
    botRequestTokenRef.current++;
    botWorker.cancelAll();
    stopThinkingTimer();
    
    // Make a quick random move for the bot
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

  // Bot move - computed in a Web Worker so the UI never freezes
  const makeBotMove = useCallback(() => {
    if (!botDifficulty || game.isGameOver() || game.turn() === playerColor) return;

    setIsThinking(true);
    startThinkingTimer();

    // New token invalidates any previous pending bot requests
    const token = ++botRequestTokenRef.current;
    const fen = game.fen();

    // Hard cap: if calculation takes too long, force a quick move automatically
    thinkingWatchdogRef.current = setTimeout(() => {
      if (token !== botRequestTokenRef.current) return;
      cancelBotMove();
    }, 1200);

    // Small delay to let the player move render before we show "thinking"
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
          }

          setGame(newGame);
          setLastMove({ from: move.from, to: move.to });
          setMoveHistory((prev) => [...prev, move.san]);

          if (newGame.isGameOver()) {
            playSound("gameEnd");
            const winner = newGame.turn() === playerColor ? "Bot" : "You";
            toast[winner === "You" ? "success" : "info"](
              newGame.isCheckmate()
                ? winner === "You"
                  ? "🎉 Congratulations! You won!"
                  : "Good game! Try again!"
                : "It's a draw!"
            );
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

  // Trigger bot move when it's bot's turn
  useEffect(() => {
    if (gamePhase !== "playing" || game.isGameOver()) return;
    if (game.turn() === playerColor) return;
    if (isThinking) return; // Prevent duplicate calls
    
    // Bot needs to move - use requestAnimationFrame for smooth UI
    const timeoutId = requestAnimationFrame(() => {
      setTimeout(makeBotMove, 100);
    });
    return () => cancelAnimationFrame(timeoutId);
  }, [game.fen(), gamePhase, playerColor, makeBotMove, isThinking]);

  // Player makes a move
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
        } else {
          playSound("move");
        }

        if (newGame.inCheck()) {
          playSound("check");
        }

        setGameHistory((prev) => [...prev, game.fen()]); // Save for undo
        setGame(newGame);
        setLastMove({ from, to });
        setMoveHistory((prev) => [...prev, move.san]);
        setHighlightedSquares(null);

        if (newGame.isGameOver()) {
          playSound("gameEnd");
          toast[newGame.isCheckmate() ? "success" : "info"](
            newGame.isCheckmate() ? "🎉 Checkmate! You won!" : "It's a draw!"
          );
        }

        return true;
      }
    } catch (e) {
      // Invalid move
    }
    return false;
  }, [isThinking, game, playerColor, playSound]);

  // Go to schedule screen - require login
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

  // Start game immediately (no login required)
  const startGameNow = useCallback(() => {
    setGamePhase("playing");
    toast.success(`Game started against ${bots.find((b) => b.id === botDifficulty)?.name}!`);
  }, [botDifficulty]);

  // Schedule game to database
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
    
    // Reset and go back
    setScheduledDate(undefined);
    setScheduledTime("");
    setGamePhase("select");
  };

  // Play scheduled game
  const playScheduledGame = useCallback((difficulty: BotDifficulty) => {
    setBotDifficulty(difficulty);
    setGamePhase("playing");
    toast.success(`Game started against ${bots.find((b) => b.id === difficulty)?.name}!`);
  }, []);

  // Get date label helper
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  // New game
  const handleNewGame = useCallback(() => {
    // invalidate any in-flight bot calculation
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
  }, [botWorker, stopThinkingTimer]);

  // Undo last move (takes back both player and bot move)
  const handleUndo = useCallback(() => {
    if (gameHistory.length < 2 || isThinking) return;
    
    // Cancel any pending bot moves
    botRequestTokenRef.current++;
    botWorker.cancelAll();
    stopThinkingTimer();
    
    // Go back 2 moves (player + bot)
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

  // Selected bot info - memoized
  const selectedBot = useMemo(() => 
    bots.find((b) => b.id === botDifficulty), 
    [botDifficulty]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Always-visible thinking overlay (so users always see feedback) */}
      {gamePhase === "playing" && isThinking && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-card/95 backdrop-blur border border-primary/20 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              Bot thinking… {(thinkingTime / 1000).toFixed(1)}s
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelBotMove}
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
            >
              <X className="w-3 h-3 mr-1" />
              Quick move
            </Button>
          </div>
        </div>
      )}
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-2 sm:px-4">
          {/* Back button */}
          <Link to="/">
            <Button variant="ghost" className="mb-4 sm:mb-6 text-sm sm:text-base">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Bot Selection Phase */}
          {gamePhase === "select" && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6 sm:mb-10">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-2 sm:mb-4">
                  Play Against a <span className="text-primary">Bot</span>
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                  Choose your opponent! Each bot has a unique personality and skill level.
                </p>
              </div>

              {/* Scheduled Games Panel */}
              {user && (
                <div className="mb-6 max-w-md mx-auto">
                  <ScheduledGamesPanel onPlayGame={playScheduledGame} />
                </div>
              )}

              <BotSelector
                selectedDifficulty={botDifficulty}
                onSelect={setBotDifficulty}
              />

              <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={goToSchedule}
                  disabled={!botDifficulty}
                  className="w-full sm:w-auto"
                >
                  {user ? "Schedule Game" : <><LogIn className="w-4 h-4 mr-2" /> Login to Schedule</>}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={startGameNow}
                  disabled={!botDifficulty}
                  className="w-full sm:w-auto"
                >
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Play Now
                </Button>
                <Button variant="outline" size="lg" onClick={() => setShowGuide(true)} className="w-full sm:w-auto">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  How to Play
                </Button>
              </div>
            </div>
          )}

          {/* Schedule Phase */}
          {gamePhase === "schedule" && (
            <div className="max-w-2xl mx-auto">
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
                <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-2xl">
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
            </div>
          )}

          {/* Playing Phase */}
          {gamePhase === "playing" && (
            <div className="pb-52 lg:pb-0">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center items-center lg:items-start">
                <div className="flex flex-col items-center gap-2 sm:gap-4 order-1">
                  <div className="flex gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap justify-center items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGuide(true)}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Help
                    </Button>
                    <Button variant="ghost" size="sm" onClick={flipBoard} className="text-xs sm:text-sm px-2 sm:px-3">
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Flip
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={gameHistory.length < 2 || isThinking}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Undo2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Undo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                    {/* Hints Toggle */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                      {autoSuggestions ? (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      )}
                      <span className="text-xs hidden sm:inline">Hints</span>
                      <Switch
                        checked={autoSuggestions}
                        onCheckedChange={toggleAutoSuggestions}
                        className="scale-75"
                      />
                    </div>
                  </div>

                  {/* Thinking Timer with Cancel */}
                  {isThinking && (
                    <div className="flex items-center justify-center gap-3 mb-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Bot thinking... {(thinkingTime / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelBotMove}
                        className="text-xs px-2 py-1 h-7 text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Force Quick Move
                      </Button>
                    </div>
                  )}

                  <ChessBoard
                    game={game}
                    onMove={handlePlayerMove}
                    playerColor={playerColor}
                    disabled={isThinking || game.isGameOver()}
                    lastMove={lastMove}
                    showHints={true}
                    highlightedSquares={highlightedSquares}
                  />

                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    You are playing as{" "}
                    <span className="font-bold">
                      {playerColor === "w" ? "White ♔" : "Black ♚"}
                    </span>
                  </p>
                </div>

                <div className="w-full sm:w-80 lg:w-64 xl:w-80 order-3 lg:order-2">
                  <GameInfo
                    game={game}
                    playerColor={playerColor}
                    botDifficulty={botDifficulty!}
                    moveHistory={moveHistory}
                    capturedPieces={capturedPieces}
                    onResign={handleResign}
                    onNewGame={handleNewGame}
                    isThinking={isThinking}
                  />
                </div>

                <div className="hidden lg:block order-2 lg:order-3 w-80">
                  <LiveGuide
                    game={game}
                    isPlayerTurn={game.turn() === playerColor && !isThinking}
                    playerColor={playerColor}
                    isGameOver={game.isGameOver()}
                    onHighlightSquares={setHighlightedSquares}
                  />
                </div>
              </div>
            </div>
          )}
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
