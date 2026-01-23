import { motion } from "framer-motion";
import PremiumBotCard, { BotDifficulty } from "./PremiumBotCard";

interface PremiumBotSelectorProps {
  selectedDifficulty: BotDifficulty | null;
  onSelect: (difficulty: BotDifficulty) => void;
}

const premiumBots = [
  {
    id: "easy" as BotDifficulty,
    name: "Friendly Freddie",
    description: "Makes friendly mistakes. Perfect for learning!",
    emoji: "🐣",
    rating: "~500",
    color: "bg-emerald-500",
    gradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
    personality: "Let's have fun learning!",
  },
  {
    id: "medium" as BotDifficulty,
    name: "Clever Charlie",
    description: "A balanced challenge with smart moves.",
    emoji: "🦊",
    rating: "~1000",
    color: "bg-amber-500",
    gradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
    personality: "Hmm, let me think...",
  },
  {
    id: "hard" as BotDifficulty,
    name: "Master Magnus",
    description: "Strong tactics. Can you beat the master?",
    emoji: "🦁",
    rating: "~1400",
    color: "bg-violet-500",
    gradient: "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600",
    personality: "Show me your best moves!",
  },
  {
    id: "expert" as BotDifficulty,
    name: "Expert Elena",
    description: "Tournament-level play. Advanced tactics!",
    emoji: "🦅",
    rating: "~1700",
    color: "bg-cyan-500",
    gradient: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600",
    personality: "Every move counts!",
    isNew: true,
  },
  {
    id: "master" as BotDifficulty,
    name: "Grandmaster Gary",
    description: "The ultimate challenge. Plays like a GM!",
    emoji: "🐉",
    rating: "~2000+",
    color: "bg-rose-500",
    gradient: "bg-gradient-to-br from-rose-500 via-pink-600 to-red-700",
    personality: "Prepare to be amazed!",
    isNew: true,
    isPremium: true,
  },
];

const PremiumBotSelector = ({ selectedDifficulty, onSelect }: PremiumBotSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">
          Choose Your Opponent
        </h2>
        <p className="text-sm text-muted-foreground">
          Each bot has unique personality and skill level
        </p>
      </motion.div>

      {/* Bot grid - all cards in single row on desktop */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-2 sm:px-0">
        {premiumBots.map((bot, index) => (
          <div key={bot.id} className="w-[calc(50%-0.5rem)] sm:w-[180px] md:w-[170px] lg:w-[180px] xl:w-[190px]">
            <PremiumBotCard
              bot={bot}
              isSelected={selectedDifficulty === bot.id}
              onSelect={() => onSelect(bot.id)}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Selected bot highlight */}
      {selectedDifficulty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="font-bold text-primary">
              {premiumBots.find(b => b.id === selectedDifficulty)?.name}
            </span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PremiumBotSelector;
export { premiumBots };
