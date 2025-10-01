import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loadingspinner";

export function LoadingPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
