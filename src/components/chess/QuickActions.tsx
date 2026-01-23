import { motion } from "framer-motion";
import { 
  Lightbulb, 
  RotateCcw, 
  Undo2, 
  Volume2, 
  VolumeX, 
  Flag, 
  RefreshCw,
  Eye,
  EyeOff,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickActionsProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  hintsEnabled: boolean;
  onToggleHints: () => void;
  onFlipBoard: () => void;
  onUndo: () => void;
  onResign: () => void;
  onNewGame: () => void;
  onShowHelp: () => void;
  canUndo: boolean;
  isThinking: boolean;
  isGameOver: boolean;
}

const QuickActions = ({
  soundEnabled,
  onToggleSound,
  hintsEnabled,
  onToggleHints,
  onFlipBoard,
  onUndo,
  onResign,
  onNewGame,
  onShowHelp,
  canUndo,
  isThinking,
  isGameOver
}: QuickActionsProps) => {
  const actions = [
    {
      icon: Lightbulb,
      label: "Help",
      onClick: onShowHelp,
      variant: "ghost" as const,
      show: true,
      tooltip: "Learn how to play"
    },
    {
      icon: RotateCcw,
      label: "Flip",
      onClick: onFlipBoard,
      variant: "ghost" as const,
      show: true,
      tooltip: "Flip the board"
    },
    {
      icon: Undo2,
      label: "Undo",
      onClick: onUndo,
      variant: "ghost" as const,
      show: !isGameOver,
      disabled: !canUndo || isThinking,
      tooltip: "Take back last move"
    },
    {
      icon: soundEnabled ? Volume2 : VolumeX,
      label: soundEnabled ? "Sound" : "Muted",
      onClick: onToggleSound,
      variant: "ghost" as const,
      show: true,
      active: soundEnabled,
      tooltip: soundEnabled ? "Mute sounds" : "Enable sounds"
    },
  ];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-2 bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50"
      >
        {/* Main action buttons */}
        {actions.filter(a => a.show).map((action, index) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`
                    relative h-9 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-xs font-medium
                    ${action.active ? "text-primary bg-primary/10" : ""}
                  `}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {action.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Hints toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              {hintsEnabled ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs font-medium hidden sm:inline">Hints</span>
              <Switch
                checked={hintsEnabled}
                onCheckedChange={onToggleHints}
                className="scale-75"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {hintsEnabled ? "Hide move suggestions" : "Show move suggestions"}
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Game controls */}
        {!isGameOver ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResign}
                disabled={isThinking}
                className="h-9 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Resign</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Give up this game
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={onNewGame}
                className="h-9 px-3 gap-1.5 text-xs font-medium bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Play Again</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Start a new game
            </TooltipContent>
          </Tooltip>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default QuickActions;
