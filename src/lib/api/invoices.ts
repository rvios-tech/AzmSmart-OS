import { apiFetch } from "./client";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

/** حالة الفاتورة كما يخزّنها الخادم — أرقام لا نصوص، انظر تعليق DTO. */
export const INVOICE_STATUS = {
  DRAFT: 0,
  SENT: 1,
  PARTIALLY_PAID: 2,
  PAID: 3,
  OVERDUE: 4,
  VOID: 5,
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: "مسودة",
  [INVOICE_STATUS.SENT]: "مُرسَلة",
  [INVOICE_STATUS.PARTIALLY_PAID]: "مدفوعة جزئياً",
  [INVOICE_STATUS.PAID]: "مدفوعة",
  [INVOICE_STATUS.OVERDUE]: "متأخرة",
  [INVOICE_STATUS.VOID]: "ملغاة",
};

/** فاتورة كما يعيدها الخادم — المبالغ Decimal تصل نصًّا، انظر تعليقها في clients.ts. */
export interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string | null;
  issueDate: string;
  dueDate: string | null;
  items: InvoiceItem[];
  subtotal: string;
  discountAmount: string;
  taxPercent: string;
  taxAmount: string;
  total: string;
  paidAmount: string;
  remainingAmount: string;
  currency: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateInvoiceInput {
  clientId?: string;
  issueDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  discountAmount?: number;
  taxPercent?: number;
  currency?: string;
  status?: InvoiceStatus;
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput> & {
  paidAmount?: number;
};

export function listInvoices(): Promise<ApiInvoice[]> {
  return apiFetch<ApiInvoice[]>("/invoices");
}

export function getInvoice(id: string): Promise<ApiInvoice> {
  return apiFetch<ApiInvoice>(`/invoices/${id}`);
}

export function createInvoice(input: CreateInvoiceInput): Promise<ApiInvoice> {
  return apiFetch<ApiInvoice>("/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateInvoice(
  id: string,
  input: UpdateInvoiceInput,
): Promise<ApiInvoice> {
  return apiFetch<ApiInvoice>(`/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteInvoice(id: string): Promise<void> {
  return apiFetch<void>(`/invoices/${id}`, { method: "DELETE" });
}
