import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../api/apiClient';

export interface PcSession {
  sessionId: string;
  workstationId: string;
  studentId: string;
  startTime: string;
  status: 'ACTIVE' | 'WARNING_GRACE' | 'ENDED' | 'EXPIRED';
  lastHeartbeatTime: string;
}

export const usePcSession = (sessionId: string | null) => {
  const [session, setSession] = useState<PcSession | null>(null);
  const [isWarningActive, setIsWarningActive] = useState<boolean>(false);
  const [graceCountdown, setGraceCountdown] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await apiClient.post<PcSession>('/api/v1/pc-usage/heartbeat', { sessionId, qrToken: 'placeholder-token' });
      setSession(response.data);

      if (response.data.status === 'WARNING_GRACE') {
        setIsWarningActive(true);
      } else {
        setIsWarningActive(false);
        setGraceCountdown(30);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Heartbeat sync failed.');
    }
  }, [sessionId]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await apiClient.post("/api/v1/pc-usage/end-session/" + sessionId);
      setSession(null);
      setIsWarningActive(false);
      window.location.href = '/admin/login';
    } catch (err: any) {
      setError(err?.message || 'Failed to end session cleanly.');
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    sendHeartbeat();
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 10000);
    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [sessionId, sendHeartbeat]);

  useEffect(() => {
    if (isWarningActive) {
      countdownTimerRef.current = setInterval(() => {
        setGraceCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setGraceCountdown(30);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isWarningActive, endSession]);

  return { session, isWarningActive, graceCountdown, error, sendHeartbeat, endSession };
};
export default usePcSession;
