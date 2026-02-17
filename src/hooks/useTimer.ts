'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TimerMode = 'up' | 'down';

type UseTimerOptions = {
  mode?: TimerMode;
  durationMs?: number;
  autoStart?: boolean;
  intervalMs?: number;
  onExpire?: () => void;
};

export function useTimer(options: UseTimerOptions = {}) {
  const {
    mode = 'up',
    durationMs = 0,
    autoStart = false,
    intervalMs = 50,
    onExpire,
  } = options;

  const [running, setRunning] = useState(autoStart);
  const [nowMs, setNowMs] = useState(0);
  const startedAtRef = useRef<number | null>(autoStart ? performance.now() : null);

  useEffect(() => {
    if (!running) return;

    let rafId: number;
    let lastUpdate = 0;

    const tick = (now: number) => {
      if (!startedAtRef.current) return;

      if (now - lastUpdate >= intervalMs) {
        lastUpdate = now;
        const elapsed = performance.now() - startedAtRef.current;
        setNowMs(elapsed);

        if (mode === 'down' && durationMs > 0 && elapsed >= durationMs) {
          setRunning(false);
          onExpire?.();
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running, mode, durationMs, intervalMs, onExpire]);

  const elapsedMs = nowMs;
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const valueMs = mode === 'down' ? remainingMs : elapsedMs;

  const start = useCallback(() => {
    startedAtRef.current = performance.now();
    setNowMs(0);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  const pause = useCallback(() => {
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now();
      setNowMs(0);
    } else {
      startedAtRef.current = performance.now() - nowMs;
    }
    setRunning(true);
  }, [nowMs]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    setNowMs(0);
    setRunning(false);
  }, []);

  const progress = useMemo(() => {
    if (mode === 'up') {
      if (!durationMs) return 0;
      return Math.min(1, elapsedMs / durationMs);
    }
    if (!durationMs) return 0;
    return Math.min(1, elapsedMs / durationMs);
  }, [mode, durationMs, elapsedMs]);

  return {
    running,
    elapsedMs,
    remainingMs,
    valueMs,
    progress,
    start,
    stop,
    pause,
    resume,
    reset,
  };
}
