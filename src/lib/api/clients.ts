import { apiFetch } from "./client";

/**
 * عميل كما يعيده الخادم — المبالغ Decimal تصل نصًّا (`"1250.00"`) لا رقمًا،
 * لأن Prisma.Decimal تُسلسَل بـ`toJSON` نصّيًا. حوّلها بـ`Number(...)` عند
 * الحاجة للحساب، وأبقها نصًّا للعرض المباشر.
 */
export interface ApiClient {
  id: string;
  name: string;
  nameNormalized: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  taxNumber: string | null;
  currentBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ClientInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  taxNumber?: string;
}

export function listClients(): Promise<ApiClient[]> {
  return apiFetch<ApiClient[]>("/clients");
}

export function getClient(id: string): Promise<ApiClient> {
  return apiFetch<ApiClient>(`/clients/${id}`);
}

export function createClient(input: ClientInput): Promise<ApiClient> {
  return apiFetch<ApiClient>("/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateClient(
  id: string,
  input: Partial<ClientInput>,
): Promise<ApiClient> {
  return apiFetch<ApiClient>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteClient(id: string): Promise<void> {
  return apiFetch<void>(`/clients/${id}`, { method: "DELETE" });
}
