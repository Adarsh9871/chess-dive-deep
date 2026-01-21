import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { Star, Trophy, Lightbulb, RotateCcw, ChevronRight, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface Puzzle {
  id: string;
  fen: string;
  solution: string[];
  difficulty: "easy" | "medium" | "hard";
  title: string;
  description: string;
  theme: string;
  stars: number;
}

const dailyPuzzles: Puzzle[] = [
  {
    id: "1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["Qxf7"],
    difficulty: "easy",
    title: "Scholar's Mate!",
    description: "Can you spot the winning move for White?",
    theme: "Checkmate",
    stars: 1,
  },
  {
    id: "2",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    solution: ["Ng5"],
    difficulty: "easy",
    title: "Attack the Weak Spot",
    description: "Find the best developing move that creates a threat!",
    theme: "Attack",
    stars: 1,
  },
  {
    id: "3",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 2 4",
    solution: ["Bg5"],
    difficulty: "medium",
    title: "Pin to Win!",
    description: "Find the move that pins a piece to the king!",
    theme: "Pin",
    stars: 2,
  },
  {
    id: "4",
    fen: "r2qkb1r/ppp2ppp/2n1bn2/3pp3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    solution: ["exd5"],
    difficulty: "medium",
    title: "Central Control",
    description: "Capture and gain the center!",
    theme: "Center Control",
    stars: 2,
  },
  {
    id: "5",
    fen: "r1bqk2r/pppp1Npp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5",
    solution: ["Qe7"],
    difficulty: "hard",
    title: "Defend the Knight",
    description: "Black must find the best defense against the fork!",
    theme: "Defense",
    stars: 3,
  },
  {
    id: "6",
    fen: "r1b1k2r/ppppqppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 5 5",
    solution: ["Nxf7"],
    difficulty: "hard",
    title: "Knight Sacrifice!",
    description: "Find the powerful knight sacrifice!",
    theme: "Sacrifice",
    stars: 3,
  },
];

const pieceSymbols: { [key: string]: string } = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
};

const Puzzles = () => {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [game, setGame] = useState<Chess | null>(null);
  const [solved, setSolved] = useState<boolean[]>(new Array(dailyPuzzles.length).fill(false));
  const [totalStars, setTotalStars] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const currentPuzzle = dailyPuzzles[currentPuzzleIndex];

  useEffect(() => {
    const newGame = new Chess(currentPuzzle.fen);
    setGame(newGame);
    setSelectedSquare(null);
    setShowHint(false);
    setAttempts(0);
  }, [currentPuzzleIndex]);

  const getSquareColor = (row: number, col: number) => {
    return (row + col) % 2 === 0 ? "bg-board-light" : "bg-board-dark";
  };

  const getPieceAt = (square: string): string | null => {
    if (!game) return null;
    const piece = game.get(square as any);
    if (!piece) return null;
    const symbol = piece.type;
    return piece.color === "w" ? symbol.toUpperCase() : symbol.toLowerCase();
  };

  const handleSquareClick = (square: string) => {
    if (!game || solved[currentPuzzleIndex]) return;

    if (selectedSquare) {
      const move = selectedSquare + square;
      const expectedMove = currentPuzzle.solution[0];
      
      // Check if the move matches the solution (handle both formats)
      const isCorrect = 
        move === expectedMove || 
        move.toLowerCase() === expectedMove.toLowerCase() ||
        square.toLowerCase() === expectedMove.slice(-2).toLowerCase();

      if (isCorrect) {
        // Correct move!
        try {
          const legalMoves = game.moves({ verbose: true });
          const matchingMove = legalMoves.find(m => 
            m.from === selectedSquare && m.to === square
          );
          
          if (matchingMove) {
            game.move(matchingMove);
            setGame(new Chess(game.fen()));
            
            const newSolved = [...solved];
            newSolved[currentPuzzleIndex] = true;
            setSolved(newSolved);
            
            const earnedStars = Math.max(1, currentPuzzle.stars - Math.floor(attempts / 2));
            setTotalStars(prev => prev + earnedStars);
            
            toast.success(`🌟 Correct! You earned ${earnedStars} star${earnedStars > 1 ? 's' : ''}!`, {
              description: currentPuzzle.theme,
            });
          }
        } catch (e) {
          // Invalid move
        }
      } else {
        setAttempts(prev => prev + 1);
        toast.error("Not quite! Try again! 💪");
      }
      setSelectedSquare(null);
    } else {
      const piece = getPieceAt(square);
      if (piece) {
        const turn = game.turn();
        const isPlayerPiece = turn === 'w' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
        if (isPlayerPiece) {
          setSelectedSquare(square);
        }
      }
    }
  };

  const resetPuzzle = () => {
    const newGame = new Chess(currentPuzzle.fen);
    setGame(newGame);
    setSelectedSquare(null);
    setShowHint(false);
  };

  const getHint = () => {
    setShowHint(true);
    const solution = currentPuzzle.solution[0];
    const fromSquare = solution.length >= 4 ? solution.slice(0, 2) : solution.slice(0, 1);
    toast.info(`💡 Hint: Look at the ${fromSquare.toUpperCase()} area!`);
  };

  const nextPuzzle = () => {
    if (currentPuzzleIndex < dailyPuzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1);
    }
  };

  const renderBoard = () => {
    if (!game) return null;

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    return (
      <div className="relative">
        <div className="grid grid-cols-8 rounded-xl overflow-hidden shadow-xl border-4 border-board-dark">
          {ranks.map((rank, rowIndex) =>
            files.map((file, colIndex) => {
              const square = `${file}${rank}`;
              const piece = getPieceAt(square);
              const isSelected = selectedSquare === square;

              return (
                <motion.div
                  key={square}
                  className={`
                    aspect-square flex items-center justify-center cursor-pointer relative
                    ${getSquareColor(rowIndex, colIndex)}
                    ${isSelected ? "ring-4 ring-secondary ring-inset" : ""}
                    hover:brightness-110 transition-all
                  `}
                  onClick={() => handleSquareClick(square)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {piece && (
                    <span className={`text-2xl sm:text-3xl md:text-4xl select-none ${
                      piece === piece.toUpperCase() ? "drop-shadow-md" : "drop-shadow-md"
                    }`}>
                      {pieceSymbols[piece]}
                    </span>
                  )}
                  
                  {/* Coordinate labels */}
                  {colIndex === 0 && (
                    <span className="absolute left-1 top-1 text-xs font-bold text-muted-foreground/60">
                      {rank}
                    </span>
                  )}
                  {rowIndex === 7 && (
                    <span className="absolute right-1 bottom-1 text-xs font-bold text-muted-foreground/60">
                      {file}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const solvedCount = solved.filter(Boolean).length;
  const progressPercent = (solvedCount / dailyPuzzles.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              <Badge variant="secondary" className="text-sm">
                Daily Puzzles
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
              Solve Puzzles, Earn Stars! ⭐
            </h1>
            <p className="text-muted-foreground font-nunito text-lg">
              Complete today's puzzles to become a chess master!
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold" />
                    <span className="font-display font-bold text-foreground">
                      {solvedCount}/{dailyPuzzles.length} Puzzles
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                    <span className="font-display font-bold text-gold">{totalStars}</span>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Puzzle Board */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge 
                        className={`mb-2 ${
                          currentPuzzle.difficulty === "easy" ? "bg-secondary" :
                          currentPuzzle.difficulty === "medium" ? "bg-accent" : "bg-destructive"
                        }`}
                      >
                        {currentPuzzle.difficulty.toUpperCase()}
                      </Badge>
                      <CardTitle className="text-xl md:text-2xl">{currentPuzzle.title}</CardTitle>
                      <p className="text-primary-foreground/80 mt-1">{currentPuzzle.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(currentPuzzle.stars)].map((_, i) => (
                        <Star key={i} className={`w-6 h-6 ${solved[currentPuzzleIndex] ? "text-gold fill-gold" : "text-primary-foreground/40"}`} />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="max-w-md mx-auto">
                    {renderBoard()}
                  </div>

                  {/* Puzzle Controls */}
                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={resetPuzzle}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={getHint}
                      disabled={showHint}
                      className="gap-2"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Hint
                    </Button>
                    {solved[currentPuzzleIndex] && currentPuzzleIndex < dailyPuzzles.length - 1 && (
                      <Button
                        onClick={nextPuzzle}
                        className="gap-2"
                      >
                        Next Puzzle
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Success Message */}
                  <AnimatePresence>
                    {solved[currentPuzzleIndex] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mt-6 text-center"
                      >
                        <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-6 py-3 rounded-full">
                          <Sparkles className="w-5 h-5 text-gold" />
                          <span className="font-display font-bold">Puzzle Solved!</span>
                          <Sparkles className="w-5 h-5 text-gold" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Puzzle List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Today's Puzzles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dailyPuzzles.map((puzzle, index) => (
                    <motion.button
                      key={puzzle.id}
                      onClick={() => setCurrentPuzzleIndex(index)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        currentPuzzleIndex === index
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            solved[index] ? "bg-secondary text-secondary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                          }`}>
                            {solved[index] ? "✓" : index + 1}
                          </div>
                          <div>
                            <p className="font-display font-semibold text-foreground text-sm">
                              {puzzle.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {puzzle.difficulty} • {puzzle.theme}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(puzzle.stars)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                solved[index] ? "text-gold fill-gold" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="mt-4 bg-gradient-to-br from-accent/20 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display font-bold text-foreground mb-1">Pro Tip!</p>
                      <p className="text-sm text-muted-foreground">
                        Look for checks, captures, and threats first! 
                        The best moves usually force your opponent to respond.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Puzzles;
