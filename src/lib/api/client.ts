// ---------------------------------------------------------------------------
// طبقة الاتصال بالباكند الموحّد (AZM API). كل استدعاء API في النظام يمرّ من
// هنا — لا `fetch` مباشر في أي صفحة.
// ---------------------------------------------------------------------------

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const TOKEN_KEY = "azm_access_token";

/** يقرأ الرمز من التخزين المحلي. `null` دائمًا على الخادم — لا نافذة هناك. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // وضع خاص أو تخزين محظور — نتعامل معه كغياب رمز، لا كخطأ يوقف الصفحة.
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // نفس التسامح أعلاه — لا حاجة لإسقاط الجلسة لمجرد فشل الكتابة.
  }
}

/** خطأ من الخادم يحمل الحالة والرسالة كما أعادهما `DomainErrorFilter`. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchInit extends RequestInit {
  /** إرفاق ترويسة التفويض. `true` افتراضيًا — `/auth/*` فقط يُعطّلها. */
  auth?: boolean;
}

/**
 * غلاف `fetch` موحّد: يرفق الرمز، يضبط JSON، ويحوّل ردود الخطأ إلى
 * [ApiError] بدل ترك كل صفحة تتحقّق من `res.ok` بنفسها.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const token = auth ? getToken() : null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    // فشل الشبكة نفسه (خادم متوقف، بلا اتصال) — رسالة تُفهم لا استثناء خام.
    throw new ApiError(0, "تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مجددًا.");
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? extractMessage((body as { message: unknown }).message)
        : null) ?? `خطأ غير متوقّع (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

/** `message` من class-validator قد يكون نصًّا أو مصفوفة أخطاء حقول. */
function extractMessage(message: unknown): string | null {
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  return null;
}

/**
 * رفع ملف بصيغة `multipart/form-data`. منفصلة عن [apiFetch] عمدًا: تلك
 * تفرض `Content-Type: application/json` على كل طلب، وهذا يكسر الحد الفاصل
 * (boundary) الذي يضبطه المتصفح تلقائيًا لبيانات الفورم.
 */
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
  } catch {
    throw new ApiError(0, "تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مجددًا.");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? extractMessage((body as { message: unknown }).message)
        : null) ?? `خطأ غير متوقّع (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}
