import { useEffect, useState } from 'react';

const ROUND_TIMER_SECONDS = 45 * 60;
const EXTRA_TIME_SECONDS = 5 * 60;

/**
 * Round clock: 45 min of main time, then 5 min of extra time that starts
 * automatically. Lives in the page (not in the modal) so it keeps running
 * while the modal is closed.
 */
export function useRoundTimer() {
  const [timeRemaining45, setTimeRemaining45] = useState(ROUND_TIMER_SECONDS);
  const [isCountdown45Running, setIsCountdown45Running] = useState(false);
  const [timeRemaining5, setTimeRemaining5] = useState(EXTRA_TIME_SECONDS);
  const [isCountdown5Running, setIsCountdown5Running] = useState(false);
  const [firstCountdownCompleted, setFirstCountdownCompleted] = useState(false);

  // One interval per run, with the remaining time derived from a fixed end
  // timestamp. This keeps the timer exact even when the browser throttles
  // timers in a background tab, and avoids recreating the interval every second.
  useEffect(() => {
    if (!isCountdown45Running) return;
    const endAt = Date.now() + timeRemaining45 * 1000;
    const intervalId = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeRemaining45(left);
      if (left === 0) {
        setIsCountdown45Running(false);
        setFirstCountdownCompleted(true);
        setIsCountdown5Running(true);
      }
    }, 250);
    return () => clearInterval(intervalId);
    // timeRemaining45 is only read when a run starts (start or resume).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCountdown45Running]);

  useEffect(() => {
    if (!isCountdown5Running) return;
    const endAt = Date.now() + timeRemaining5 * 1000;
    const intervalId = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeRemaining5(left);
      if (left === 0) setIsCountdown5Running(false);
    }, 250);
    return () => clearInterval(intervalId);
    // timeRemaining5 is only read when a run starts (start or resume).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCountdown5Running]);

  return {
    timeRemaining45,
    timeRemaining5,
    isCountdown45Running,
    isCountdown5Running,
    firstCountdownCompleted,
    start45: () => {
      if (!isCountdown45Running && timeRemaining45 > 0) setIsCountdown45Running(true);
    },
    stop45: () => setIsCountdown45Running(false),
    reset45: () => {
      setIsCountdown45Running(false);
      setTimeRemaining45(ROUND_TIMER_SECONDS);
      setFirstCountdownCompleted(false);
      setIsCountdown5Running(false);
      setTimeRemaining5(EXTRA_TIME_SECONDS);
    },
    start5: () => {
      if (!isCountdown5Running && timeRemaining5 > 0) setIsCountdown5Running(true);
    },
    stop5: () => setIsCountdown5Running(false),
    reset5: () => {
      setIsCountdown5Running(false);
      setTimeRemaining5(EXTRA_TIME_SECONDS);
    },
    resetAll: () => {
      setIsCountdown45Running(false);
      setIsCountdown5Running(false);
      setTimeRemaining45(ROUND_TIMER_SECONDS);
      setTimeRemaining5(EXTRA_TIME_SECONDS);
      setFirstCountdownCompleted(false);
    },
  };
}

export type RoundTimer = ReturnType<typeof useRoundTimer>;
