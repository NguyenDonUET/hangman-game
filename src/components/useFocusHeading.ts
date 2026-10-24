import { useEffect, useRef } from "react";

export function useFocusHeading<T extends HTMLElement>(key: string | number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [key]);

  return ref;
}
