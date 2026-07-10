import { describe, expect, it } from 'vitest';
import { api, assertErrorEnvelope } from '@/test/api/harness.js';

describe('payments API authorization and management tokens', () => {
  it('does not disclose a booking for an invalid management token', async () => {
    const token = 'a'.repeat(64);
    const response = await api('GET', `/payments/manage/${token}`);
    expect(response.status).toBe(404);
    expect(response.body?.error?.code).toBe('MANAGE_TOKEN_INVALID');
    assertErrorEnvelope(response);
  });

  it('requires authentication for master booking cancellation', async () => {
    const response = await api('POST', `/payments/me/bookings/${crypto.randomUUID()}/cancel`, {
      body: { reason: 'unauthorized probe' },
    });
    expect(response.status).toBe(401);
    assertErrorEnvelope(response);
  });

  it('requires administrator authentication for payment records', async () => {
    const response = await api('GET', '/payments/admin/payments');
    expect(response.status).toBe(401);
    assertErrorEnvelope(response);
  });
});
