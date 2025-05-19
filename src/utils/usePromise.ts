import { useEffect, useState } from "react";

export function usePromise<T>(promise: Promise<T>) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    promise.then(setData);
  }, [promise, setData]);

  return data;
}
