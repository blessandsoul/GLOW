import { describe, it, expect } from 'vitest';
import { flittSignatureBase, flittSignature } from './flitt.js';

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
