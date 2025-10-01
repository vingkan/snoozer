import { useState } from "react";

export function useWithLoading<T, A>(
  fn: (args: A) => Promise<T>
): [boolean, (args: A) => Promise<T>] {
  const [isLoading, setIsLoading] = useState(false);
  const doWithLoading = async (args: A) => {
    setIsLoading(true);
    try {
      return await fn(args);
    } finally {
      setIsLoading(false);
    }
  };
  return [isLoading, doWithLoading];
}
