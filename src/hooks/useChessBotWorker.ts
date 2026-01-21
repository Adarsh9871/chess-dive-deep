import { useEffect, useMemo, useRef } from "react";

export type BotDifficulty = "easy" | "medium" | "hard" | "expert" | "master";

export type BotWorkerMove = {
  from: string;
  to: string;
  promotion?: string;
} | null;

type WorkerRequest = {
  id: number;
  fen: string;
  difficulty: BotDifficulty;
};

type WorkerResponse = {
  id: number;
  move: BotWorkerMove;
  error?: string;
};

export function useChessBotWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<number, { resolve: (m: BotWorkerMove) => void; reject: (e: Error) => void }>());
  const requestIdRef = useRef(1);

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL("../workers/chessBotWorker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const msg = ev.data;
      const pending = pendingRef.current.get(msg.id);
      if (!pending) return;
      pendingRef.current.delete(msg.id);

      if (msg.error) pending.reject(new Error(msg.error));
      else pending.resolve(msg.move);
    };

    worker.onerror = (err) => {
      // Reject all pending
      for (const [, p] of pendingRef.current) p.reject(err as unknown as Error);
      pendingRef.current.clear();
    };

    workerRef.current = worker;
    return worker;
  };

  const requestMove = (fen: string, difficulty: BotDifficulty): Promise<BotWorkerMove> => {
    const worker = ensureWorker();
    const id = requestIdRef.current++;

    const payload: WorkerRequest = { id, fen, difficulty };

    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      worker.postMessage(payload);
    });
  };

  const cancelAll = () => {
    pendingRef.current.clear();
  };

  useEffect(() => {
    return () => {
      cancelAll();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(
    () => ({ requestMove, cancelAll }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}
