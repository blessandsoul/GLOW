import type { FastifyRequest, FastifyReply } from 'fastify';

export type Controller = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void>;

export interface JwtPayload {
  id: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
