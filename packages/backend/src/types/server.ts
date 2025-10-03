/**
 * Server-related type definitions
 */

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  frontendBuildPath: string;
}

export interface HealthResponse {
  status: 'OK';
  timestamp: string;
  uptime: number;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  timestamp: string;
}

export interface RequestWithTimestamp extends Express.Request {
  timestamp: string;
}
