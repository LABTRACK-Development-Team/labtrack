export interface EnvironmentConfig {
  apiBaseUrl: string;
  aiServiceUrl: string;
  signalRHubUrl: string;
  defaultCampus: string;
  heartbeatIntervalMs: number;
  enableDebugLogs: boolean;
  isProduction: boolean;
}

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }
  return import.meta.env[key] || defaultValue;
};

export const env: EnvironmentConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.hostname + ':5000' : 'http://localhost:5000'),
  aiServiceUrl: getEnvVar('VITE_AI_SERVICE_URL', typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.hostname + ':8000' : 'http://localhost:8000'),
  signalRHubUrl: getEnvVar('VITE_SIGNALR_HUB_URL', typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.hostname + ':5000/hubs/labtrack' : 'http://localhost:5000/hubs/labtrack'),
  defaultCampus: getEnvVar('VITE_DEFAULT_CAMPUS', 'DAPITAN'),
  heartbeatIntervalMs: Number(getEnvVar('VITE_HEARTBEAT_INTERVAL_MS', '30000')),
  enableDebugLogs: getEnvVar('VITE_ENABLE_DEBUG_LOGS', 'false') === 'true',
  isProduction: import.meta.env.PROD,
};