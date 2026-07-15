import { useEffect, useState } from "react";

export function useLiveDuplicateCheck({ value, excludeId, check, delay = 450, }) {
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const normalized = String(value || "").trim();

    if (!normalized) {
      setChecking(false);
      setDuplicate(null);
      setError("");
      return undefined;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      setError("");
      try {
        const match = await check(normalized, excludeId || null);
        if (!cancelled) setDuplicate(match || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Duplicate check failed");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, excludeId, check, delay]);

  return { checking, duplicate, error };
}
