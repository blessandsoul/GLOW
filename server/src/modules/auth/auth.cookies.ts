import type { FastifyReply } from 'fastify';
import type { CookieSerializeOptions } from '@fastify/cookie';
import { env } from '@/config/env.js';

function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)(m|h|d)$/);
  if (!match) return 15 * 60;
  const [, num, unit] = match;
  const value = parseInt(num, 10);
  switch (unit) {
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 15 * 60;
  }
}

function getAccessTokenCookieOptions(): CookieSerializeOptions {
  const options: CookieSerializeOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: parseExpiryToSeconds(env.JWT_ACCESS_EXPIRY),
  };
  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }
  return options;
}

function getRefreshTokenCookieOptions(): CookieSerializeOptions {
  const options: CookieSerializeOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: parseExpiryToSeconds(env.JWT_REFRESH_EXPIRY),
  };
  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }
  return options;
}

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  reply
    .setCookie('accessToken', accessToken, getAccessTokenCookieOptions())
    .setCookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
}

export function clearAuthCookies(reply: FastifyReply): void {
  const clearAccessOptions: CookieSerializeOptions = { path: '/' };
  const clearRefreshOptions: CookieSerializeOptions = { path: '/api/v1/auth' };
  if (env.COOKIE_DOMAIN) {
    clearAccessOptions.domain = env.COOKIE_DOMAIN;
    clearRefreshOptions.domain = env.COOKIE_DOMAIN;
  }
  reply
    .clearCookie('accessToken', clearAccessOptions)
    .clearCookie('refreshToken', clearRefreshOptions);
}
