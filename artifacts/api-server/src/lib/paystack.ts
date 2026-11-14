import { createHmac, timingSafeEqual } from "crypto";

// Paystack API Base URL
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Retrieve keys from environment variables
export function getPaystackSecretKey(): string {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export function getPaystackPublicKey(): string {
  return process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || "";
}

export function isPaystackLive(): boolean {
  return getPaystackSecretKey().startsWith("sk_live_");
}

export function isPaystackConfigured(): boolean {
  const key = getPaystackSecretKey();
  return Boolean(key && (key.startsWith("sk_live_") || key.startsWith("sk_test_")));
}

// ---------------------------------------------------------------------------
// 1. Initialize Paystack Transaction (Card, Bank Transfer, USSD, Visa, etc.)
// ---------------------------------------------------------------------------
export interface InitPaystackParams {
  amount: number; // in NGN (e.g. 5000)
  email: string;
  reference: string;
  callbackUrl: string;
  description?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface InitPaystackResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializePaystackPayment(
  params: InitPaystackParams
): Promise<InitPaystackResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error(
      "Paystack secret key is missing. Please set PAYSTACK_SECRET_KEY in your environment variables or Vercel dashboard."
    );
  }

  // Convert amount from NGN to Kobo (1 NGN = 100 Kobo)
  const amountInKobo = Math.round(params.amount * 100);

  const payload = {
    email: params.email,
    amount: amountInKobo,
    reference: params.reference,
    callback_url: params.callbackUrl,
    currency: "NGN",
    channels: params.channels ?? [
      "card",
      "bank_transfer",
      "bank",
      "ussd",
      "qr",
      "mobile_money",
    ],
    metadata: {
      custom_fields: [
        {
          display_name: "Platform",
          variable_name: "platform",
          value: "2torConnect",
        },
        {
          display_name: "Payment Description",
          variable_name: "description",
          value: params.description ?? "2torConnect Payment",
        },
      ],
      ...params.metadata,
    },
  };

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as any;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize Paystack payment");
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

// ---------------------------------------------------------------------------
// 2. Verify Paystack Transaction
// ---------------------------------------------------------------------------
export interface VerifyPaystackResult {
  status: "success" | "failed" | "abandoned";
  amount: number; // in NGN
  reference: string;
  channel: string;
  cardType?: string;
  bank?: string;
  last4?: string;
  paidAt?: string;
  customerEmail: string;
  metadata?: Record<string, any>;
  gatewayResponse?: string;
  raw: any;
}

export async function verifyPaystackPayment(
  reference: string
): Promise<VerifyPaystackResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error(
      "Paystack secret key is missing. Please set PAYSTACK_SECRET_KEY."
    );
  }

  const encodedRef = encodeURIComponent(reference.trim());
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodedRef}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await response.json()) as any;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to verify Paystack payment");
  }

  const tx = data.data;
  // Convert amount back from Kobo to NGN
  const amountInNgn = (tx.amount ?? 0) / 100;

  return {
    status: tx.status,
    amount: amountInNgn,
    reference: tx.reference,
    channel: tx.channel ?? "card",
    cardType: tx.authorization?.card_type ?? tx.authorization?.brand,
    bank: tx.authorization?.bank,
    last4: tx.authorization?.last4,
    paidAt: tx.paid_at,
    customerEmail: tx.customer?.email ?? "",
    metadata: tx.metadata,
    gatewayResponse: tx.gateway_response,
    raw: tx,
  };
}

// ---------------------------------------------------------------------------
// 3. Verify Paystack Webhook HMAC Signature
// ---------------------------------------------------------------------------
export function verifyPaystackWebhookSignature(
  signature: string | undefined,
  body: any
): boolean {
  const secretKey = getPaystackSecretKey();
  if (!secretKey || !signature) return false;

  try {
    const rawString = typeof body === "string" ? body : JSON.stringify(body);
    const hash = createHmac("sha512", secretKey).update(rawString).digest("hex");
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 4. Paystack Bank Resolution (Resolve NUBAN account name)
// ---------------------------------------------------------------------------
export async function resolvePaystackAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ accountNumber: string; accountName: string }> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error("Paystack secret key is missing.");
  }

  const url = `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(
    accountNumber.trim()
  )}&bank_code=${encodeURIComponent(bankCode.trim())}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const data = (await response.json()) as any;
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Could not resolve bank account details");
  }

  return {
    accountNumber: data.data.account_number,
    accountName: data.data.account_name,
  };
}

// ---------------------------------------------------------------------------
// 5. Paystack Transfers / Payouts (for Tutor withdrawals)
// ---------------------------------------------------------------------------
export interface TransferRecipientParams {
  name: string;
  accountNumber: string;
  bankCode: string;
}

export async function createPaystackTransferRecipient(
  params: TransferRecipientParams
): Promise<string> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) throw new Error("Paystack secret key is missing.");

  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber.trim(),
      bank_code: params.bankCode.trim(),
      currency: "NGN",
    }),
  });

  const data = (await response.json()) as any;
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to create transfer recipient");
  }

  return data.data.recipient_code as string;
}

export interface InitiateTransferParams {
  amount: number; // in NGN
  recipientCode: string;
  reason: string;
  reference: string;
}

export async function initiatePaystackTransfer(
  params: InitiateTransferParams
): Promise<{ reference: string; transferCode: string; status: string }> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) throw new Error("Paystack secret key is missing.");

  const amountInKobo = Math.round(params.amount * 100);

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountInKobo,
      recipient: params.recipientCode,
      reason: params.reason,
      reference: params.reference,
    }),
  });

  const data = (await response.json()) as any;
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initiate transfer");
  }

  return {
    reference: data.data.reference,
    transferCode: data.data.transfer_code,
    status: data.data.status,
  };
}

// ---------------------------------------------------------------------------
// 6. Comprehensive Nigerian Bank Directory for Paystack
// ---------------------------------------------------------------------------
export const PAYSTACK_NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay Digital Services (Paycom)", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Parallex Bank", code: "526" },
  { name: "Polaris Bank", code: "076" },
  { name: "Premium Trust Bank", code: "000031" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "SunTrust Bank", code: "100" },
  { name: "Taj Bank", code: "302" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

export const PAYSTACK_BANK_CODES: Record<string, string> = Object.fromEntries(
  PAYSTACK_NIGERIAN_BANKS.map((b) => [b.name, b.code])
);
