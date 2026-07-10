import crypto from 'node:crypto';
import { env } from '@/config/env.js';
import { logger } from '@/libs/logger.js';

// Flitt (ex-Fondy) Payment API adapter.
// Docs: https://docs.flitt.com/api/ (signature + create-order + callback verified 2026-06-28).
// Signature = sha1( secret_key | non-empty-param-values-sorted-by-key, joined by "|" ), lowercase.
// "signature" and "response_signature_string" are excluded from the calculation.

const FLITT_VERSION = '1.0.1';
const FLITT_REVERSE_URL = 'https://pay.flitt.com/api/reverse/order_id';
const FLITT_STATUS_URL = 'https://pay.flitt.com/api/status/order_id';

export interface FlittCheckoutParams {
  orderId: string;
  amountMinor: number;
  description: string;
  responseUrl: string; // browser redirect target after payment
  serverCallbackUrl: string; // server-to-server callback (webhook)
  currency?: string;
}

export interface FlittReversalParams {
  orderId: string;
  amountMinor: number;
  currency: string;
  reverseId: string;
  comment?: string;
}

export type FlittReversalResult =
  | {
      status: 'SUCCEEDED' | 'PROCESSING';
      providerRefundId?: string;
      reversalAmountMinor: number;
    }
  | {
      status: 'FAILED';
      failureCode: string;
      failureMessage: string;
      reversalAmountMinor: number;
    };

export interface FlittOrderStatusResult {
  orderStatus: string;
  reversalAmountMinor: number;
  actualAmountMinor: number;
  currency: string;
  merchantId: number;
}

/** Build the exact pre-hash string Flitt signs. Exposed for deterministic testing. */
export function flittSignatureBase(secretKey: string, params: Record<string, unknown>): string {
  const values = Object.keys(params)
    .filter((k) => k !== 'signature' && k !== 'response_signature_string')
    .sort()
    .map((k) => params[k])
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => String(v));
  return [secretKey, ...values].join('|');
}

export function flittSignature(secretKey: string, params: Record<string, unknown>): string {
  return crypto.createHash('sha1').update(flittSignatureBase(secretKey, params), 'utf8').digest('hex');
}

export function isFlittConfigured(): boolean {
  return env.FLITT_MERCHANT_ID > 0 && env.FLITT_SECRET_KEY.length > 0;
}

/** Create a checkout order, return the hosted checkout URL to redirect the payer to. */
export async function createFlittCheckout(p: FlittCheckoutParams): Promise<string> {
  const request: Record<string, unknown> = {
    version: FLITT_VERSION,
    order_id: p.orderId,
    merchant_id: String(env.FLITT_MERCHANT_ID),
    order_desc: p.description,
    amount: String(Math.max(0, Math.trunc(p.amountMinor))),
    currency: p.currency ?? 'GEL',
    response_url: p.responseUrl,
    server_callback_url: p.serverCallbackUrl,
  };
  request.signature = flittSignature(env.FLITT_SECRET_KEY, request);

  const res = await fetch(env.FLITT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
    signal: AbortSignal.timeout(15_000),
  });

  const json = (await res.json().catch(() => null)) as {
    response?: { response_status?: string; checkout_url?: string; error_message?: string; error_code?: number };
  } | null;
  const r = json?.response;

  if (!res.ok || !r || r.response_status !== 'success' || !r.checkout_url) {
    logger.error({ status: res.status, flitt: r }, 'Flitt checkout creation failed');
    throw new Error('FLITT_CHECKOUT_FAILED');
  }
  return r.checkout_url;
}

/** Issue an idempotent full or partial reversal against a captured Flitt order. */
export async function createFlittReversal(p: FlittReversalParams): Promise<FlittReversalResult> {
  if (!isFlittConfigured()) {
    return {
      status: 'FAILED',
      failureCode: 'FLITT_NOT_CONFIGURED',
      failureMessage: 'Payment gateway is not configured',
      reversalAmountMinor: 0,
    };
  }

  const request: Record<string, unknown> = {
    version: FLITT_VERSION,
    order_id: p.orderId,
    merchant_id: String(env.FLITT_MERCHANT_ID),
    amount: String(Math.max(0, Math.trunc(p.amountMinor))),
    currency: p.currency,
    reverse_id: p.reverseId,
    ...(p.comment ? { comment: p.comment } : {}),
  };
  request.signature = flittSignature(env.FLITT_SECRET_KEY, request);

  const res = await fetch(FLITT_REVERSE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as {
    response?: {
      response_status?: string;
      reverse_status?: string;
      reversal_amount?: string | number;
      transaction_id?: string | number;
      reverse_id?: string;
      response_code?: string | number;
      response_description?: string;
      error_code?: string | number;
      error_message?: string;
    };
  } | null;
  const response = json?.response;
  const reversalAmountMinor = Number(response?.reversal_amount ?? 0);

  if (res.ok && response?.response_status === 'success' && response.reverse_status === 'approved') {
    return {
      status: 'SUCCEEDED',
      providerRefundId: String(response.transaction_id ?? response.reverse_id ?? '') || undefined,
      reversalAmountMinor: Number.isFinite(reversalAmountMinor) ? reversalAmountMinor : 0,
    };
  }
  if (res.ok && response?.response_status === 'success' && ['created', 'processing'].includes(response.reverse_status ?? '')) {
    return {
      status: 'PROCESSING',
      providerRefundId: String(response.transaction_id ?? response.reverse_id ?? '') || undefined,
      reversalAmountMinor: Number.isFinite(reversalAmountMinor) ? reversalAmountMinor : 0,
    };
  }

  return {
    status: 'FAILED',
    failureCode: String(response?.response_code ?? response?.error_code ?? res.status),
    failureMessage: response?.response_description ?? response?.error_message ?? 'Flitt reversal failed',
    reversalAmountMinor: Number.isFinite(reversalAmountMinor) ? reversalAmountMinor : 0,
  };
}

/** Reconcile accumulated reversal value for an order after a timeout or delayed callback. */
export async function getFlittOrderStatus(orderId: string): Promise<FlittOrderStatusResult> {
  if (!isFlittConfigured()) throw new Error('FLITT_NOT_CONFIGURED');
  const request: Record<string, unknown> = {
    version: FLITT_VERSION,
    order_id: orderId,
    merchant_id: String(env.FLITT_MERCHANT_ID),
  };
  request.signature = flittSignature(env.FLITT_SECRET_KEY, request);
  const res = await fetch(FLITT_STATUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as {
    response?: {
      response_status?: string;
      order_status?: string;
      reversal_amount?: string | number;
      actual_amount?: string | number;
      currency?: string;
      merchant_id?: string | number;
    };
  } | null;
  if (!res.ok || json?.response?.response_status !== 'success') throw new Error('FLITT_STATUS_FAILED');
  const reversalAmountMinor = Number(json.response.reversal_amount ?? 0);
  const actualAmountMinor = Number(json.response.actual_amount ?? 0);
  return {
    orderStatus: json.response.order_status ?? 'unknown',
    reversalAmountMinor: Number.isFinite(reversalAmountMinor) ? reversalAmountMinor : 0,
    actualAmountMinor: Number.isFinite(actualAmountMinor) ? actualAmountMinor : 0,
    currency: json.response.currency ?? '',
    merchantId: Number(json.response.merchant_id),
  };
}

/** Verify the signature on an inbound Flitt server callback. */
export function verifyFlittCallback(body: Record<string, unknown>): boolean {
  // Fail closed when the gateway is not configured. With an empty FLITT_SECRET_KEY the
  // expected signature would be sha1('' | values) — a value any attacker can reproduce,
  // so a forged "approved" callback would validate. Never verify over an empty secret.
  if (!isFlittConfigured()) {
    logger.warn('Flitt callback received while gateway is not configured (empty secret) — rejecting');
    return false;
  }
  const provided = typeof body.signature === 'string' ? body.signature : '';
  if (!provided) return false;
  const expected = flittSignature(env.FLITT_SECRET_KEY, body);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) {
    // Keep the caller's 400 (so a real forgery is rejected), but make a genuine
    // mis-key operationally visible: a mis-keyed gateway will otherwise retry forever
    // with no signal in the logs. Never log the secret or the expected signature.
    logger.warn(
      { orderId: typeof body.order_id === 'string' ? body.order_id : undefined },
      'Flitt callback signature verification FAILED — forged callback or FLITT_SECRET_KEY mismatch',
    );
  }
  return ok;
}

export function isFlittApproved(body: Record<string, unknown>): boolean {
  return body.order_status === 'approved';
}

/** Terminal non-approved states that should release the held slot. */
export function isFlittTerminalFailure(body: Record<string, unknown>): boolean {
  return body.order_status === 'declined' || body.order_status === 'expired' || body.order_status === 'reversed';
}
