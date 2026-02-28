import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { JwtPayload } from '@/shared/types/index.js';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors/errors.js';
import { prisma } from '@/libs/prisma.js';

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
    const hasCookie = request.cookies?.accessToken;
    const hasHeader = request.headers.authorization?.startsWith('Bearer ');
    if (hasCookie || hasHeader) {
      const decoded = await request.jwtVerify<JwtPayload>();
      request.user = decoded;
    }
  } catch {
    // Token invalid — continue as anonymous (user property remains unset)
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

export async function requirePhoneVerified(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: { phone: true, phoneVerified: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
  }

  if (!user.phoneVerified) {
    throw new ForbiddenError('Phone verification required', 'PHONE_NOT_VERIFIED');
  }
}

export function registerJwtPlugin(app: FastifyInstance): void {
  // @fastify/jwt is registered in app.ts — this is a helper for decorators
  app.decorate('authenticate', authenticate);
  app.decorate('optionalAuth', optionalAuth);
}
