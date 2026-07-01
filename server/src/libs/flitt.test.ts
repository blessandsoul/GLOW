import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mutable env stub so verifyFlittCallback can be exercised both configured and not.
// The pure signature helpers below pass the secret explicitly and ignore env.
const envStub = { FLITT_MERCHANT_ID: 0, FLITT_SECRET_KEY: '' };
vi.mock('@/config/env.js', () => ({
  get env(): typeof envStub {
    return envStub;
  },
}));
vi.mock('./logger.js', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { flittSignatureBase, flittSignature, verifyFlittCallback } from './flitt.js';

// Locks the signature recipe to the example in https://docs.flitt.com/api/building-signature/
describe('flittSignatureBase', () => {
  it('reproduces the documented example concatenation (secret first, values sorted by key, "|"-joined)', () => {
    const base = flittSignatureBase('test', {
      order_id: 'TestOrder2',
      merchant_id: 1549901,
      order_desc: 'Test payment',
      amount: 1000,
      currency: 'GEL',
      server_callback_url: 'http://myshop/callback/',
    });
    expect(base).toBe('test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/');
  });

  it('excludes empty values, the signature field, and response_signature_string', () => {
    const base = flittSignatureBase('sk', {
      b: '2',
      a: '1',
      empty: '',
      signature: 'ignore',
      response_signature_string: 'ignore',
    });
    expect(base).toBe('sk|1|2');
  });

  it('produces a deterministic lowercase sha1 hex of length 40', () => {
    const sig = flittSignature('test', { amount: 1000, currency: 'GEL' });
    expect(sig).toMatch(/^[0-9a-f]{40}$/);
    expect(sig).toBe(flittSignature('test', { currency: 'GEL', amount: 1000 })); // key order irrelevant
  });
});

describe('verifyFlittCallback — fail closed on an empty/unconfigured secret', () => {
  beforeEach(() => {
    envStub.FLITT_MERCHANT_ID = 0;
    envStub.FLITT_SECRET_KEY = '';
  });

  it('rejects ANY callback when the gateway is not configured, even a self-consistent signature', () => {
    // With secret '' an attacker can compute sha1('' | values) themselves — this is the
    // fail-open bug. Build a body whose signature is valid FOR the empty secret and confirm
    // it is still rejected because the gateway is unconfigured.
    const body: Record<string, unknown> = { order_id: 'O1', order_status: 'approved', amount: 1000 };
    body.signature = flittSignature('', body);
    expect(verifyFlittCallback(body)).toBe(false);
  });

  it('rejects a forged approved callback with a bogus signature when unconfigured', () => {
    expect(
      verifyFlittCallback({ order_id: 'O1', order_status: 'approved', signature: 'deadbeef' }),
    ).toBe(false);
  });

  it('accepts a correctly-signed callback once the gateway IS configured', () => {
    envStub.FLITT_MERCHANT_ID = 1549901;
    envStub.FLITT_SECRET_KEY = 'live-secret';
    const body: Record<string, unknown> = { order_id: 'O1', order_status: 'approved', amount: 1000 };
    body.signature = flittSignature('live-secret', body);
    expect(verifyFlittCallback(body)).toBe(true);
  });

  it('rejects a wrong signature even when configured', () => {
    envStub.FLITT_MERCHANT_ID = 1549901;
    envStub.FLITT_SECRET_KEY = 'live-secret';
    expect(
      verifyFlittCallback({ order_id: 'O1', order_status: 'approved', signature: 'not-the-right-hash' }),
    ).toBe(false);
  });

  it('rejects a callback with no signature field when configured', () => {
    envStub.FLITT_MERCHANT_ID = 1549901;
    envStub.FLITT_SECRET_KEY = 'live-secret';
    expect(verifyFlittCallback({ order_id: 'O1', order_status: 'approved' })).toBe(false);
  });
});
