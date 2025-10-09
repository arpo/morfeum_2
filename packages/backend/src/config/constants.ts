/**
 * Application constants
 */

export const DEFAULT_PORT = 3030;
export const DEFAULT_NODE_ENV = 'development';

export const API_ROUTES = {
  ROOT: '/api',
  HEALTH: '/health',
} as const;

export const STATIC_FILE_CONFIG = {
  PRODUCTION_PATH: '/app/packages/frontend/dist',
  DEVELOPMENT_PATH_RELATIVE: '../../frontend/dist',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const CORS_CONFIG = {
  ORIGIN: process.env.CORS_ORIGIN || '*',
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
} as const;

export const AI_MODELS = {
  SEED_GENERATION: 'gemini-2.5-flash-lite',
  VISUAL_ANALYSIS: 'gemini-2.5-flash-lite',
  PROFILE_ENRICHMENT: 'gemini-2.5-flash-lite',
} as const;
