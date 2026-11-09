// src/hooks/useNotificationPolling.ts
// Polls /api/v1/notifications every 30s. Returns unread count + refresh trigger.
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

export interface UseNotificationPollingResult {
  unreadCount: number;
  polling: boolean;
  refresh: () => void;
}

export function useNotificationPolling(intervalMs: number = 30000): UseNotificationPollingResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const [polling, setPolling] = useState(false);

  const fetchCount = useCallback(async () => {
    setPolling(true);
    try {
      const res = await apiClient.get('/api/v1/notifications', {
        params: { isRead: false, pageNumber: 1, pageSize: 1 }
      });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      const items = Array.isArray(data) ? data : [];
      const total = res.data?.data?.totalCount ?? res.data?.totalCount ?? items.length;
      setUnreadCount(total);
    } catch {
      // silent
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, intervalMs);
    return () => clearInterval(timer);
  }, [fetchCount, intervalMs]);

  return { unreadCount, polling, refresh: fetchCount };
}
