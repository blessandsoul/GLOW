import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { JwtPayload } from '@/shared/types/index.js';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors/errors.js';

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<JwtPayload>();
    request.user = decoded;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = await request.jwtVerify<JwtPayload>();
      request.user = decoded;
    }
  } catch {
    // Token invalid — continue as anonymous
    request.user = undefined;
  }
}

export function authorize(...roles: string[]): (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void> {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (roles.length > 0 && !roles.includes(request.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}

export function registerJwtPlugin(app: FastifyInstance): void {
  // @fastify/jwt is registered in app.ts — this is a helper for decorators
  app.decorate('authenticate', authenticate);
  app.decorate('optionalAuth', optionalAuth);
}
