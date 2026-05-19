const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY ?? "";
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY ?? "";
export const MONNIFY_WALLET_ACCOUNT = process.env.MONNIFY_WALLET_ACCOUNT ?? "";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getMonnifyAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString("base64");
  const res = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}` },
  });

  const data = await res.json() as any;
  if (!data.requestSuccessful) throw new Error(data.responseMessage ?? "Monnify auth failed");

  cachedToken = data.responseBody.accessToken as string;
  tokenExpiry = Date.now() + Number(data.responseBody.expiresIn ?? 3600) * 1000 - 60_000;
  return cachedToken;
}

export interface InitPaymentParams {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  redirectUrl: string;
  description?: string;
}

export interface InitPaymentResult {
  transactionReference: string;
  paymentReference: string;
  checkoutUrl: string;
}

export async function initializePayment(params: InitPaymentParams): Promise<InitPaymentResult> {
  const token = await getMonnifyAccessToken();
  const res = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      paymentReference: params.paymentReference,
      paymentDescription: params.description ?? "Wallet top-up",
      currencyCode: "NGN",
      contractCode: MONNIFY_WALLET_ACCOUNT,
      redirectUrl: params.redirectUrl,
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
    }),
  });

  const data = await res.json() as any;
  if (!data.requestSuccessful) throw new Error(data.responseMessage ?? "Failed to initialize payment");
  return data.responseBody as InitPaymentResult;
}

export interface VerifyPaymentResult {
  paymentStatus: string;
  amountPaid: number;
  totalPayable: number;
  transactionReference: string;
  paymentReference: string;
}

export async function verifyPayment(transactionReference: string): Promise<VerifyPaymentResult> {
  const token = await getMonnifyAccessToken();
  const encoded = encodeURIComponent(transactionReference);
  const res = await fetch(`${MONNIFY_BASE_URL}/api/v2/transactions/${encoded}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json() as any;
  if (!data.requestSuccessful) throw new Error(data.responseMessage ?? "Failed to verify payment");
  return data.responseBody as VerifyPaymentResult;
}

export const BANK_CODES: Record<string, string> = {
  "Access Bank": "044",
  "Citibank": "023",
  "Ecobank": "050",
  "Fidelity Bank": "070",
  "First Bank": "011",
  "First City Monument Bank": "214",
  "Globus Bank": "00103",
  "GT Bank": "058",
  "Heritage Bank": "030",
  "Keystone Bank": "082",
  "Parallex Bank": "526",
  "Polaris Bank": "076",
  "Providus Bank": "101",
  "Stanbic IBTC Bank": "221",
  "Standard Chartered": "068",
  "Sterling Bank": "232",
  "SunTrust Bank": "100",
  "Union Bank": "032",
  "United Bank for Africa": "033",
  "Unity Bank": "215",
  "Wema Bank": "035",
  "Zenith Bank": "057",
  "Kuda Bank": "50211",
  "Opay": "100004",
  "PalmPay": "100033",
  "Moniepoint": "50515",
};

export interface DisbursementParams {
  amount: number;
  reference: string;
  narration: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export async function singleDisbursement(params: DisbursementParams) {
  const token = await getMonnifyAccessToken();
  const res = await fetch(`${MONNIFY_BASE_URL}/api/v2/disbursements/single`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amount,
      reference: params.reference,
      narration: params.narration,
      destinationBankCode: params.bankCode,
      destinationAccountNumber: params.accountNumber,
      currency: "NGN",
      sourceAccountNumber: MONNIFY_WALLET_ACCOUNT,
      destinationAccountName: params.accountName,
    }),
  });

  const data = await res.json() as any;
  if (!data.requestSuccessful) throw new Error(data.responseMessage ?? "Disbursement failed");
  return data.responseBody;
}
