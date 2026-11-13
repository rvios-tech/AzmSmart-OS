"use client";

import { clearPendingEmail, readPendingCompany, readPendingEmail, setPendingEmail } from "./pending";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import * as authApi from "@/lib/api/auth";
import { SESSION_EXPIRED_EVENT, getToken, setToken } from "@/lib/api/client";
import { switchCompany as switchCompanyApi } from "@/lib/api/workspace";
import { endSupport, inSupport } from "./support";

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: authApi.AuthUser | null;
  company: authApi.AuthCompany | null;
}

interface AuthContextValue extends AuthState {
  /** الشركات التي ينتمي إليها المستخدم (للتبديل بينها) */
  companies: (authApi.AuthCompany & { role: number })[];
  switchCompany: (companyId: string) => Promise<void>;
  /** `true` = بقي رمز البريد (صفحة التحقق) */
  login: (email: string, password: string) => Promise<boolean>;
  verifyEmailCode: (code: string) => Promise<void>;
  /** يعيد `true` لحساب جديد */
  loginWithGoogle: (credential: string) => Promise<boolean>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    companyName: string;
  }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "azm_user";
const COMPANY_KEY = "azm_company";
const COMPANIES_KEY = "azm_companies";
/** رمز «الجهاز الموثوق» — يبقى بعد تسجيل الخروج: هو ثقة بالجهاز لا جلسة */
const TRUST_KEY = "rv_trust";

function readTrust(): string | undefined {
  try {
    return window.localStorage.getItem(TRUST_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function saveTrust(t: string | undefined) {
  if (!t) return;
  try {
    window.localStorage.setItem(TRUST_KEY, t);
  } catch {}
}

function readCached<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * سياق المصادقة الحقيقي — يستبدل صفحات الدخول الوهمية التي كانت مجرّد
 * `<Link href="/dashboard">`. الرمز يُخزَّن محليًا، لكن هويته تُصدَّق من
 * الخادم عند إعادة التحميل لا من التخزين المحلي وحده — التخزين قد يُعبَث
 * به، والخادم هو مصدر الحقيقة الوحيد لمن أنا وماذا يحقّ لي (نفس مبدأ
 * `TenantGuard` في الباكند).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [companies, setCompanies] = useState<(authApi.AuthCompany & { role: number })[]>([]);
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    company: null,
  });

  useEffect(() => {
    async function bootstrap() {
      const token = getToken();
      if (!token) {
        setState({ status: "unauthenticated", user: null, company: null });
        return;
      }

      setCompanies(readCached<(authApi.AuthCompany & { role: number })[]>(COMPANIES_KEY) ?? []);
      const cachedUser = readCached<authApi.AuthUser>(USER_KEY);
      const cachedCompany = readCached<authApi.AuthCompany>(COMPANY_KEY);

      // عرض متفائل من الذاكرة المؤقّتة أثناء التحقّق — لا وميض شاشة دخول
      // لمستخدم لديه جلسة صالحة بالفعل.
      if (cachedUser && cachedCompany) {
        setState({
          status: "authenticated",
          user: cachedUser,
          company: cachedCompany,
        });
      }

      try {
        await authApi.me();
        // جلسة صالحة: تُجدَّد بصمت (جلسات الدعم لا تتجدّد — مدتها القصيرة مقصودة)
        if (!inSupport()) {
          authApi
            .refresh()
            .then((r) => setToken(r.accessToken))
            .catch(() => undefined);
        }
      } catch {
        // الرمز مرفوض أو منتهٍ أو العضوية سُحبت — نفس معالجة الخادم.
        setToken(null);
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(COMPANY_KEY);
        setState({ status: "unauthenticated", user: null, company: null });
      }
    }

    void bootstrap();
  }, []);

  const persist = useCallback(
    (
      token: string,
      user: authApi.AuthUser,
      company: authApi.AuthCompany,
    ) => {
      setToken(token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      window.localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
      setState({ status: "authenticated", user, company });
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password, trustToken: readTrust() });
      if ("verificationRequired" in res) {
        setPendingEmail(res.email);
        return true;
      }
      saveTrust(res.trustToken);
      persist(res.accessToken, res.user, res.company);
      window.localStorage.setItem(COMPANIES_KEY, JSON.stringify(res.companies));
      setCompanies(res.companies);
      return false;
    },
    [persist],
  );

  const verifyEmailCode = useCallback(
    async (code: string) => {
      const email = readPendingEmail();
      if (!email) throw new Error("no pending email");
      const res = await authApi.verifyCode({ email, code, companyId: readPendingCompany() });
      clearPendingEmail();
      saveTrust(res.trustToken);
      persist(res.accessToken, res.user, res.company);
      window.localStorage.setItem(COMPANIES_KEY, JSON.stringify(res.companies));
      setCompanies(res.companies);
    },
    [persist],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const res = await authApi.google(credential);
      persist(res.accessToken, res.user, res.company);
      window.localStorage.setItem(COMPANIES_KEY, JSON.stringify(res.companies));
      setCompanies(res.companies);
      return res.isNew;
    },
    [persist],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      companyName: string;
    }) => {
      const res = await authApi.register(input);
      if ("verificationRequired" in res) {
        setPendingEmail(res.email);
        return true;
      }
      persist(res.accessToken, res.user, res.company);
      return false;
    },
    [persist],
  );

  const switchCompany = useCallback(async (companyId: string) => {
    const res = await switchCompanyApi(companyId);
    setToken(res.accessToken);
    window.localStorage.setItem(COMPANY_KEY, JSON.stringify(res.company));
    // إعادة تحميل كاملة: متاجر الشركة السابقة وسياقها يجب ألا يبقى منها شيء.
    try {
      window.localStorage.removeItem("azm_active_store");
    } catch {}
    window.location.assign("/dashboard");
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(COMPANIES_KEY);
    for (const k of ["azm_staff_token", "azm_staff_company", "azm_support_return"]) window.localStorage.removeItem(k);
    try {
      window.localStorage.removeItem("azm_active_store");
    } catch {}
    setToken(null);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(COMPANY_KEY);
    setState({ status: "unauthenticated", user: null, company: null });
    router.push("/login");
  }, [router]);

  // جلسة رفضها الخادم أثناء العمل — خروج فوري بدل أخطاء متتالية في كل صفحة
  useEffect(() => {
    // جلسة دعم انتهت: يعود الموظف إلى لوحة المنصة لا إلى صفحة الدخول
    const onExpired = () => (inSupport() ? endSupport() : logout());
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, companies, switchCompany, login, verifyEmailCode, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  }
  return ctx;
}
