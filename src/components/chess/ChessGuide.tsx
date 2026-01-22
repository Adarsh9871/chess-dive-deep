import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChessGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const tips = [
  {
    title: "How Pieces Move",
    emoji: "♟️",
    content: [
      { piece: "♙ Pawn", move: "Moves forward 1 square (2 on first move)" },
      { piece: "♖ Rook", move: "Moves in straight lines (up, down, left, right)" },
      { piece: "♘ Knight", move: "Moves in an L-shape and can jump over pieces!" },
      { piece: "♗ Bishop", move: "Moves diagonally across the board" },
      { piece: "♕ Queen", move: "Moves in any direction - she's the strongest!" },
      { piece: "♔ King", move: "Moves 1 square in any direction - protect him!" },
    ],
  },
  {
    title: "Beginner Tips",
    emoji: "💡",
    content: [
      { piece: "1. Control the center", move: "Put pawns and pieces in the middle" },
      { piece: "2. Develop pieces", move: "Move knights and bishops out early" },
      { piece: "3. Castle early", move: "Keep your king safe behind pawns" },
      { piece: "4. Don't lose pieces", move: "Always check if pieces are protected" },
      { piece: "5. Think ahead", move: "What will your opponent do next?" },
    ],
  },
  {
    title: "Special Moves",
    emoji: "✨",
    content: [
      { piece: "Castling", move: "Move King 2 squares toward Rook - Rook jumps over!" },
      { piece: "En Passant", move: "Capture a pawn that just moved 2 squares" },
      { piece: "Pawn Promotion", move: "When a pawn reaches the end, become a Queen!" },
      { piece: "Check", move: "When the King is attacked - must escape!" },
      { piece: "Checkmate", move: "King can't escape - Game Over!" },
    ],
  },
  {
    title: "Game Goals",
    emoji: "🏆",
    content: [
      { piece: "Main Goal", move: "Checkmate the opponent's King!" },
      { piece: "Capture pieces", move: "Take opponent's pieces when you can" },
      { piece: "Protect your King", move: "Don't let your King get checkmated" },
      { piece: "Control squares", move: "More control = more power" },
      { piece: "Have fun!", move: "Everyone loses sometimes - that's how you learn!" },
    ],
  },
];

const ChessGuide = ({ isOpen, onClose }: ChessGuideProps) => {
  const [currentTip, setCurrentTip] = useState(0);

  const nextTip = () => setCurrentTip((prev) => (prev + 1) % tips.length);
  const prevTip = () => setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-gold" />
                <h2 className="text-2xl font-display font-bold">Chess Guide</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tip Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <span className="text-5xl mb-2 block">{tips[currentTip].emoji}</span>
                  <h3 className="text-xl font-display font-bold text-primary">
                    {tips[currentTip].title}
                  </h3>
                </div>

                <div className="space-y-3">
                  {tips[currentTip].content.map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-muted rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className="font-display font-bold text-foreground whitespace-nowrap">
                        {item.piece}
                      </span>
                      <span className="text-muted-foreground">{item.move}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button variant="ghost" onClick={prevTip}>
                <ChevronLeft className="w-5 h-5 mr-1" />
                Previous
              </Button>
              <div className="flex gap-2">
                {tips.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTip ? "bg-primary" : "bg-muted"
                    }`}
                    onClick={() => setCurrentTip(index)}
                  />
                ))}
              </div>
              <Button variant="ghost" onClick={nextTip}>
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChessGuide;
