import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, X, Trophy, Zap, Brain, Smile, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, addDays, isToday, isTomorrow, isBefore, startOfToday } from "date-fns";
import { BotDifficulty } from "./BotSelector";

interface ScheduledGame {
  id: string;
  date: Date;
  time: string;
  difficulty: BotDifficulty;
  status: "scheduled" | "completed" | "missed";
}

interface GameSchedulerProps {
  scheduledGames: ScheduledGame[];
  onSchedule: (game: Omit<ScheduledGame, "id" | "status">) => void;
  onDelete: (id: string) => void;
  onPlayNow: (difficulty: BotDifficulty) => void;
}

const difficultyConfig = {
  easy: { name: "Friendly Freddie", emoji: "🐣", icon: Smile, color: "bg-secondary text-secondary-foreground" },
  medium: { name: "Clever Charlie", emoji: "🦊", icon: Brain, color: "bg-accent text-accent-foreground" },
  hard: { name: "Master Magnus", emoji: "🦁", icon: Zap, color: "bg-primary text-primary-foreground" },
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

const GameScheduler = ({ scheduledGames, onSchedule, onDelete, onPlayNow }: GameSchedulerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSchedule = () => {
    if (selectedDate && selectedTime && selectedDifficulty) {
      onSchedule({
        date: selectedDate,
        time: selectedTime,
        difficulty: selectedDifficulty,
      });
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedDifficulty(null);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const upcomingGames = scheduledGames
    .filter(g => g.status === "scheduled" && !isBefore(g.date, startOfToday()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="bg-card rounded-2xl border-2 border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-primary-foreground" />
        <h3 className="font-display font-bold text-primary-foreground">Schedule a Game</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Pick a Date
          </label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {selectedDate ? getDateLabel(selectedDate) : "Choose date..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
                disabled={(date) => isBefore(date, startOfToday())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pick a Time
          </label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="w-full">
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

        {/* Difficulty Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Choose Opponent
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(difficultyConfig) as [BotDifficulty, typeof difficultyConfig.easy][]).map(([diff, config]) => (
              <motion.button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`p-2 rounded-xl border-2 transition-all ${
                  selectedDifficulty === diff
                    ? `${config.color} border-gold ring-2 ring-gold`
                    : "bg-muted border-transparent hover:border-muted-foreground/30"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl block">{config.emoji}</span>
                <span className="text-xs font-medium block mt-1 truncate">
                  {config.name.split(" ")[1]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Schedule Button */}
        <Button
          onClick={handleSchedule}
          disabled={!selectedDate || !selectedTime || !selectedDifficulty}
          className="w-full"
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          Schedule Game
        </Button>

        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              Upcoming Games ({upcomingGames.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <AnimatePresence>
                {upcomingGames.map((game) => {
                  const config = difficultyConfig[game.difficulty];
                  const isPlayable = isToday(game.date);
                  
                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center justify-between p-3 rounded-xl ${config.color}/10 border border-${config.color.split(' ')[0].replace('bg-', '')}/30`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{config.emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            vs {config.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getDateLabel(game.date)} at {game.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPlayable && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onPlayNow(game.difficulty)}
                            className="text-xs"
                          >
                            Play!
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(game.id)}
                          className="p-1 h-7 w-7"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Quick Play */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Or play right now! 👇
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(difficultyConfig) as [BotDifficulty, typeof difficultyConfig.easy][]).map(([diff, config]) => (
              <Button
                key={diff}
                variant="outline"
                size="sm"
                onClick={() => onPlayNow(diff)}
                className="text-xs"
              >
                {config.emoji} Quick
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScheduler;