import { useEffect, useState } from "react";
import { Observable } from "rxjs";

export function useObservable<T>(
  observable: Observable<T>,
  default_?: () => Promise<T>
): T | null {
  const [value, setValue] = useState<T | null>(null);
  const setVersion = useState(0)[1];

  useEffect(() => {
    if (default_) {
      default_().then(setValue);
    }
    const subscription = observable.subscribe((v) => {
      setVersion((version) => version + 1); // hack to force rerender when reference to the value doesn't change
      setValue(v);
    });
    return () => subscription.unsubscribe();
  }, [observable, default_]);

  return value;
}
