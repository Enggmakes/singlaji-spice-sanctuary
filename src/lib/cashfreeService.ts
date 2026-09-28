/**
 * Cashfree Payment Gateway Service for Singlaji
 * Handles client-side payment initiation, SDK integration, and backend coordination.
 * Securely communicates with backend API without exposing any secret keys.
 */

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_modal' | '_self' | '_top';
        returnUrl?: string;
      }) => Promise<any>;
    };
  }
}

export interface CreateOrderParams {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  order_amount: number;
  payment_session_id: string;
  order_currency?: string;
  error?: string;
  message?: string;
}

/**
 * Ensures Cashfree Web Checkout SDK v3 is loaded on window
 */
export async function getCashfreeInstance(mode: 'sandbox' | 'production' = 'sandbox') {
  if (typeof window === 'undefined') {
    throw new Error('Cashfree is only available in browser');
  }

  if (window.Cashfree) {
    return window.Cashfree({ mode });
  }

  // Load SDK dynamically if not already available
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src*="cashfree.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')));
      // In case it already loaded
      setTimeout(() => {
        if (window.Cashfree) resolve();
      }, 500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });

  if (!window.Cashfree) {
    throw new Error('Cashfree SDK could not be initialized');
  }

  return window.Cashfree({ mode });
}

/**
 * Creates Cashfree Order through backend endpoint
 */
export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeOrderResponse> {
  const returnUrl = `${window.location.origin}/checkout?cf_id={order_id}`;
  
  const payload = {
    order_id: params.orderId,
    order_amount: Number(params.orderAmount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: params.customerId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50),
      customer_name: params.customerName.slice(0, 50),
      customer_email: params.customerEmail || 'orders@singlaji.in',
      customer_phone: params.customerPhone.replace(/\D/g, '').slice(-10),
    },
    order_meta: {
      return_url: returnUrl,
    },
    order_note: `Singlaji Order ${params.orderId}`,
  };

  // Attempt standard rewrite endpoint first, then PHP endpoint fallback
  const endpoints = ['/api/cashfree/create-order', '/api/cashfree.php?action=create-order'];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_session_id) {
          return data;
        } else if (data.message) {
          throw new Error(data.message);
        }
      } else if (response.status !== 404) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error ${response.status}`);
      }
    } catch (err: any) {
      lastError = err;
      // If network or critical error, try fallback endpoint
    }
  }

  throw lastError || new Error('Could not connect to Cashfree payment gateway');
}

/**
 * Verifies Order status with backend
 */
export async function verifyCashfreeOrder(orderId: string): Promise<CashfreeOrderResponse> {
  const endpoints = [
    `/api/cashfree/verify-order?order_id=${encodeURIComponent(orderId)}`,
    `/api/cashfree.php?action=verify-order&order_id=${encodeURIComponent(orderId)}`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else if (response.status !== 404) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Verification failed: ${response.status}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to verify payment status');
}

/**
 * Triggers modal checkout with Cashfree
 */
export async function openCashfreeCheckout(paymentSessionId: string): Promise<{
  success: boolean;
  error?: string;
  raw?: any;
}> {
  const cashfree = await getCashfreeInstance('sandbox');

  return new Promise((resolve) => {
    cashfree
      .checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      })
      .then((result: any) => {
        if (result?.error) {
          resolve({ success: false, error: result.error.message || 'Payment was cancelled or failed', raw: result });
        } else {
          resolve({ success: true, raw: result });
        }
      })
      .catch((err: any) => {
        resolve({ success: false, error: err?.message || 'Payment window closed', raw: err });
      });
  });
}
