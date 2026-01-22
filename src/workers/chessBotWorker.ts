import { Chess, Move } from "chess.js";
import { getBotMove } from "../lib/chessBot";

export type BotDifficulty = "easy" | "medium" | "hard" | "expert" | "master";

type WorkerRequest = {
  id: number;
  fen: string;
  difficulty: BotDifficulty;
};

type WorkerResponse = {
  id: number;
  move: { from: string; to: string; promotion?: string } | null;
  error?: string;
};

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const { id, fen, difficulty } = ev.data;

  try {
    const game = new Chess(fen);
    const move: Move | null = getBotMove(game, difficulty);

    const response: WorkerResponse = {
      id,
      move: move
        ? {
            from: move.from,
            to: move.to,
            promotion: move.promotion ?? undefined,
          }
        : null,
    };

    self.postMessage(response);
  } catch (e) {
    const response: WorkerResponse = {
      id,
      move: null,
      error: e instanceof Error ? e.message : "Unknown worker error",
    };

    self.postMessage(response);
  }
};
