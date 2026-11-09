import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const useRealtime = (onDataUpdate?: () => void, onNotificationUpdate?: () => void) => {
  const callbackRef = useRef({ onDataUpdate, onNotificationUpdate });
  callbackRef.current = { onDataUpdate, onNotificationUpdate };

  useEffect(() => {
    const token = sessionStorage.getItem('labtrack_token') || localStorage.getItem('labtrack_token');
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/labtrack`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.on('ReportUpdated', () => callbackRef.current.onDataUpdate?.());
    connection.on('NotificationCreated', () => {
      callbackRef.current.onNotificationUpdate?.();
      callbackRef.current.onDataUpdate?.();
    });
    connection.on('ScheduleUpdated', () => callbackRef.current.onDataUpdate?.());
    connection.on('LaboratoryStatusChanged', () => callbackRef.current.onDataUpdate?.());
    connection.on('ReservationUpdated', () => callbackRef.current.onDataUpdate?.());

    connection.start().catch(() => {
      // Quiet fail if SignalR hub is offline/connecting
    });

    return () => {
      connection.stop().catch(() => {});
    };
  }, []);
};

export default useRealtime;
