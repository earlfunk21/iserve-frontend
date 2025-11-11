import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export type AutoUpdateOptions = {
  checkOnAppStart?: boolean;
  checkOnForeground?: boolean;
  checkIntervalMs?: number | null;
  autoReload?: boolean;
  reloadDelayMs?: number;
  allowCheckInDev?: boolean;
  onDownloaded?: () => void;
  log?: (message: string, extra?: Record<string, unknown>) => void;
};

export type AutoUpdateState = {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  checkNow: () => void;
  reloadNow: () => void;
  dismiss: () => void;
  error?: Error | null;
};

const now = () => Date.now();

export function useAutoUpdates(options: AutoUpdateOptions = {}): AutoUpdateState {
  const {
    checkOnAppStart = true,
    checkOnForeground = true,
    checkIntervalMs = null,
    autoReload = false,
    reloadDelayMs = 250,
    allowCheckInDev = false,
    onDownloaded,
    log,
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastCheckRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shouldSkip = __DEV__ && !allowCheckInDev;

  const reloadNow = useCallback(() => {
    (async () => {
      try {
        const Updates: any = await import("expo-updates");
        await Updates.reloadAsync();
      } catch (e: any) {
        setError(e);
        log?.("updates.reloadAsync failed", { message: String(e?.message || e) });
      }
    })();
  }, [log]);

  const markReady = useCallback(() => {
    setIsUpdateReady(true);
    onDownloaded?.();
    if (autoReload) {
      const timeout = setTimeout(reloadNow, Math.max(0, reloadDelayMs || 0));
      return () => clearTimeout(timeout);
    }
    return () => void 0;
  }, [autoReload, onDownloaded, reloadNow, reloadDelayMs]);

  const checkAndFetch = useCallback(async () => {
    if (shouldSkip) return;
    try {
      setError(null);
      setIsChecking(true);
      const Updates: any = await import("expo-updates");
      if (!Updates?.checkForUpdateAsync) return;
      const result = await Updates.checkForUpdateAsync();
      setIsUpdateAvailable(Boolean(result?.isAvailable));
      lastCheckRef.current = now();
      if (result?.isAvailable) {
        setIsDownloading(true);
        const fetchResult = await Updates.fetchUpdateAsync();
        setIsDownloading(false);
        if (fetchResult?.isNew) {
          const cleanup = markReady();
          return cleanup;
        }
      }
    } catch (e: any) {
      setError(e);
      log?.("updates.checkAndFetch failed", { message: String(e?.message || e) });
    } finally {
      setIsChecking(false);
    }
  }, [log, markReady, shouldSkip]);

  const dismiss = useCallback(() => setIsUpdateReady(false), []);
  const checkNow = useCallback(() => { void checkAndFetch(); }, [checkAndFetch]);

  useEffect(() => { if (checkOnAppStart) void checkAndFetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!checkOnForeground) return;
    const handler = (state: AppStateStatus) => {
      if (state === "active") {
        const elapsed = now() - (lastCheckRef.current || 0);
        if (elapsed > 30_000) void checkAndFetch();
      }
    };
    const sub = AppState.addEventListener("change", handler);
    return () => sub.remove();
  }, [checkOnForeground, checkAndFetch]);

  useEffect(() => {
    if (!checkIntervalMs) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (Platform.OS !== "web" && AppState.currentState !== "active") return;
      void checkAndFetch();
    }, Math.max(60_000, checkIntervalMs));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [checkIntervalMs, checkAndFetch]);

  return { isChecking, isDownloading, isUpdateAvailable, isUpdateReady, checkNow, reloadNow, dismiss, error };
}
