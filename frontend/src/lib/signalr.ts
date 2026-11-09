import * as signalR from '@microsoft/signalr';
import { env } from '@/config/env';

const AUTH_TOKEN_KEY = 'jrmsu_labtrack_auth_token';

/**
 * SignalR Hub Endpoints Configuration
 */
export const SIGNALR_ENDPOINTS = {
  TELEMETRY_HUB: '/hubs/telemetry',
  ATTENDANCE_HUB: '/hubs/attendance',
  ALERT_HUB: '/hubs/alerts',
} as const;

export type SignalRHubEndpoint = typeof SIGNALR_ENDPOINTS[keyof typeof SIGNALR_ENDPOINTS];

/**

 * @param endpoint Relative hub endpoint path (e.g. '/hubs/telemetry')
 * @returns Configured signalR.HubConnection
 */
export const createSignalRConnection = (
  endpoint: SignalRHubEndpoint | string = SIGNALR_ENDPOINTS.TELEMETRY_HUB
): signalR.HubConnection => {
  const hubUrl = `${env.apiBaseUrl}${endpoint}`;

  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        return token || '';
      },
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      skipNegotiation: false,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
     
        if (retryContext.previousRetryCount === 0) return 0;
        if (retryContext.previousRetryCount === 1) return 2000;
        if (retryContext.previousRetryCount === 2) return 5000;
        if (retryContext.previousRetryCount === 3) return 10000;
        return 30000;
      },
    })
    .configureLogging(env.enableDebugLogs ? signalR.LogLevel.Information : signalR.LogLevel.Error)
    .build();
};


export interface TelemetryHubClientEvents {
  ReceiveTelemetryPulse: (data: {
    workstationCode: string;
    laboratoryName: string;
    cpuUsagePercent: number;
    ramUsagePercent: number;
    gpuTempCelsius?: number;
    cpuTempCelsius?: number;
    thermalThrottling: boolean;
    timestamp: string;
  }) => void;

  ReceiveDisruptionAlert: (alert: {
    id: string;
    workstationCode: string;
    laboratoryName: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    timestamp: string;
  }) => void;

  ReceiveSessionUpdate: (session: {
    sessionId: string;
    studentIdNumber: string;
    studentName: string;
    workstationCode: string;
    status: 'ACTIVE' | 'TERMINATED' | 'OVERRIDDEN';
    timestamp: string;
  }) => void;
}

export default createSignalRConnection;