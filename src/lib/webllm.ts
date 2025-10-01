import { useCallback, useState } from "react";
import { MLCEngine } from "@mlc-ai/web-llm";
import { nullIfEmpty } from "./string";

function parseProgressPercentage(raw: string): number {
  const extracted = raw.match(/\[(\d+)\/(\d+)\]/) ?? ["", "", ""];
  const current = parseInt(extracted[1]);
  const total = parseInt(extracted[2]);
  if (isNaN(current) || isNaN(total)) {
    return 100;
  }
  return (current / total) * 100;
}

function parseCurrentTask(raw: string): string | null {
  return nullIfEmpty(raw.split("[")[0].trim());
}

type MLCEngineStatus = "needs-loading" | "loading" | "loaded";

export type MLCEngineState = {
  engine: MLCEngine | null;
  status: MLCEngineStatus;
  loadEngine: () => Promise<MLCEngine>;
  percentLoaded: number;
  currentTask: string | null;
};

function useMLCEngine({ model }: { model: string }): MLCEngineState {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [percentLoaded, setPercentLoaded] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [status, setStatus] = useState<MLCEngineStatus>("needs-loading");

  const loadEngine = useCallback(async () => {
    setStatus("loading");
    setCurrentTask(null);
    setPercentLoaded(0);

    const engineInstance = new MLCEngine({
      initProgressCallback: (progress) => {
        const task = parseCurrentTask(progress.text);
        const percent = parseProgressPercentage(progress.text);
        setCurrentTask(task);
        setPercentLoaded(percent);
      },
    });

    try {
      await engineInstance.reload(model);
      setStatus("loaded");
      setEngine(engineInstance);
    } catch {
      setStatus("needs-loading");
    }

    return engineInstance;
  }, [model]);

  return { engine, status, loadEngine, percentLoaded, currentTask };
}

// Models: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
const DEFAULT_MODEL = "Llama-3-8B-Instruct-q4f16_1-MLC";

export function useDefaultMLCEngine(): MLCEngineState {
  return useMLCEngine({ model: DEFAULT_MODEL });
}
