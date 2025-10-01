import type { MLCEngineState } from "@/lib/webllm";
import { Progress } from "@/components/ui/progress";
import { Button } from "../ui/button";
import { RefreshCcwIcon, SparklesIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import type { MLCEngine } from "@mlc-ai/web-llm";
import { useEffect } from "react";
import { ProgressCircle } from "../ui/progresscircle";

export function MLCEngineProgress({
  status,
  percentLoaded,
  currentTask,
  loadingTooltip,
}: MLCEngineState & {
  loadingTooltip?: string;
}) {
  // Disappear once the engine is loaded.
  if (status !== "loading") {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center justify-center w-full gap-2">
            <Progress value={percentLoaded} />
            <p className="text-sm text-muted-foreground">
              {currentTask ?? "Loading model"}...
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {loadingTooltip ??
              "Loading AI model. You will be able to use this feature shortly."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MiniMLCEngineProgress({
  status,
  percentLoaded,
  currentTask,
}: MLCEngineState) {
  // Disappear once the engine is loaded.
  if (status !== "loading") {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ProgressCircle value={percentLoaded} />
          </TooltipTrigger>
          <TooltipContent>{currentTask ?? "Loading model"}...</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function WebLlmLoadedWrapper({
  engineState,
  onLoad,
  children,
  loadingTooltip,
}: {
  engineState: MLCEngineState;
  onLoad?: (engine: MLCEngine) => void;
  children: React.ReactNode;
  loadingTooltip?: string;
}) {
  const { status, loadEngine } = engineState;
  if (status === "needs-loading") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={async () => {
                const engine = await loadEngine();
                onLoad?.(engine);
              }}
            >
              <SparklesIcon className="size-4 inline-block mr-2" />
              Enable AI to generate note
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              To write notes with AI, click here to download the
              <br /> model. Only recommended if you are on wi-fi.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === "loading") {
    return (
      <MLCEngineProgress {...engineState} loadingTooltip={loadingTooltip} />
    );
  }

  return <div>{children}</div>;
}

export function MiniWebLlmLoader({
  engineState,
}: {
  engineState: MLCEngineState;
}) {
  const { status, loadEngine } = engineState;

  // Only load engine once on mount. Works because loadEngine is a memoized
  // callback that does not depend on any other engine state, just setters.
  useEffect(() => {
    loadEngine();
  }, [loadEngine]);

  if (status === "needs-loading") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={async () => {
                await loadEngine();
              }}
            >
              <RefreshCcwIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Did not load AI model. Click to retry.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === "loading") {
    return <MiniMLCEngineProgress {...engineState} />;
  }
}
