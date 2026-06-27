import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@/shared/responses/successResponse.js';
import { paginatedResponse } from '@/shared/responses/paginatedResponse.js';
import {
  UsernameParamSchema,
  BookingIdParamSchema,
  SlotsQuerySchema,
  RequestOtpSchema,
  BookSchema,
  MasterListQuerySchema,
  UpdateStatusSchema,
} from './booking.schemas.js';
import type { BookingService } from './booking.service.js';

export function createBookingController(service: BookingService) {
  return {
    async getServices(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const data = await service.getServices(username);
      reply.send(successResponse('Master services retrieved', data));
    },

    async getSlots(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const { date, serviceName } = SlotsQuerySchema.parse(request.query);
      const data = await service.getSlots(username, date, serviceName);
      reply.send(successResponse('Slots retrieved', data));
    },

    async requestOtp(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const input = RequestOtpSchema.parse(request.body);
      const result = await service.requestBookOtp(username, input);
      reply.send(successResponse('Verification code sent', result));
    },

    async book(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { username } = UsernameParamSchema.parse(request.params);
      const input = BookSchema.parse(request.body);
      const booking = await service.verifyAndBook(username, input);
      reply.status(201).send(successResponse('Booked', booking));
    },

    async listMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const query = MasterListQuerySchema.parse(request.query);
      const { items, totalItems } = await service.listForMaster(request.user!.id, query);
      reply.send(paginatedResponse('Bookings retrieved', items, query.page, query.limit, totalItems));
    },

    async summaryMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const summary = await service.summaryForMaster(request.user!.id);
      reply.send(successResponse('Booking summary retrieved', summary));
    },

    async updateStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = BookingIdParamSchema.parse(request.params);
      const { status } = UpdateStatusSchema.parse(request.body);
      const booking = await service.updateStatus(request.user!.id, id, status);
      reply.send(successResponse('Booking updated', booking));
    },

    async depositReceived(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      const { id } = BookingIdParamSchema.parse(request.params);
      const booking = await service.markDepositReceived(request.user!.id, id);
      reply.send(successResponse('Deposit marked received', booking));
    },
  };
}
