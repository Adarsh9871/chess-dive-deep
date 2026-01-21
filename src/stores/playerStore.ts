import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BotDifficulty } from '@/components/chess/BotSelector';

export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface PlayerProgress {
  level: PlayerLevel;
  xp: number;
  gamesPlayed: number;
  gamesWon: number;
  hintsEnabled: boolean;
  autoSuggestions: boolean;
}

interface PlayerStore extends PlayerProgress {
  setLevel: (level: PlayerLevel) => void;
  addXp: (amount: number) => void;
  recordGame: (won: boolean, botDifficulty: BotDifficulty) => void;
  toggleHints: () => void;
  toggleAutoSuggestions: () => void;
  getRecommendedBot: () => BotDifficulty;
  getSuggestionCount: () => number;
}

const levelThresholds = {
  beginner: 0,
  intermediate: 500,
  advanced: 1500,
  expert: 3500,
};

const xpForWin: Record<BotDifficulty, number> = {
  easy: 25,
  medium: 50,
  hard: 100,
  expert: 175,
  master: 300,
};

const xpForLoss: Record<BotDifficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
  expert: 35,
  master: 60,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      level: 'beginner',
      xp: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      hintsEnabled: true,
      autoSuggestions: true,

      setLevel: (level) => set({ level }),

      addXp: (amount) => {
        const newXp = get().xp + amount;
        let newLevel = get().level;

        // Check for level up
        if (newXp >= levelThresholds.expert) {
          newLevel = 'expert';
        } else if (newXp >= levelThresholds.advanced) {
          newLevel = 'advanced';
        } else if (newXp >= levelThresholds.intermediate) {
          newLevel = 'intermediate';
        }

        set({ xp: newXp, level: newLevel });
      },

      recordGame: (won, botDifficulty) => {
        const xpGained = won ? xpForWin[botDifficulty] : xpForLoss[botDifficulty];
        set((state) => ({
          gamesPlayed: state.gamesPlayed + 1,
          gamesWon: won ? state.gamesWon + 1 : state.gamesWon,
        }));
        get().addXp(xpGained);
      },

      toggleHints: () => set((state) => ({ hintsEnabled: !state.hintsEnabled })),

      toggleAutoSuggestions: () => set((state) => ({ autoSuggestions: !state.autoSuggestions })),

      getRecommendedBot: () => {
        const level = get().level;
        const botMap: Record<PlayerLevel, BotDifficulty> = {
          beginner: 'easy',
          intermediate: 'medium',
          advanced: 'hard',
          expert: 'expert',
        };
        return botMap[level];
      },

      getSuggestionCount: () => {
        const level = get().level;
        // Fewer suggestions as player gets better
        const countMap: Record<PlayerLevel, number> = {
          beginner: 5,
          intermediate: 4,
          advanced: 3,
          expert: 2,
        };
        return countMap[level];
      },
    }),
    {
      name: 'chess-player-progress',
    }
  )
);

// Level configuration
export const levelConfig: Record<PlayerLevel, {
  name: string;
  emoji: string;
  color: string;
  description: string;
  nextLevelXp: number;
}> = {
  beginner: {
    name: 'Beginner',
    emoji: '🐣',
    color: 'bg-secondary',
    description: 'Just starting your chess journey!',
    nextLevelXp: levelThresholds.intermediate,
  },
  intermediate: {
    name: 'Intermediate',
    emoji: '🦊',
    color: 'bg-accent',
    description: 'Learning tactics and strategy!',
    nextLevelXp: levelThresholds.advanced,
  },
  advanced: {
    name: 'Advanced',
    emoji: '🦁',
    color: 'bg-primary',
    description: 'A skilled chess player!',
    nextLevelXp: levelThresholds.expert,
  },
  expert: {
    name: 'Expert',
    emoji: '🐉',
    color: 'bg-gold',
    description: 'A true chess master!',
    nextLevelXp: 10000,
  },
};