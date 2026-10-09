"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import * as authApi from "@/lib/api/auth";
import { getToken, setToken } from "@/lib/api/client";
import { switchCompany as switchCompanyApi } from "@/lib/api/workspace";

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: authApi.AuthUser | null;
  company: authApi.AuthCompany | null;
}

interface AuthContextValue extends AuthState {
  /** الشركات التي ينتمي إليها المستخدم (للتبديل بينها) */
  companies: (authApi.AuthCompany & { role: number })[];
  switchCompany: (companyId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    companyName: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "azm_user";
const COMPANY_KEY = "azm_company";
const COMPANIES_KEY = "azm_companies";

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
      const res = await authApi.login({ email, password });
      persist(res.accessToken, res.user, res.company);
      window.localStorage.setItem(COMPANIES_KEY, JSON.stringify(res.companies));
      setCompanies(res.companies);
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
      persist(res.accessToken, res.user, res.company);
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
    try {
      window.localStorage.removeItem("azm_active_store");
    } catch {}
    setToken(null);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(COMPANY_KEY);
    setState({ status: "unauthenticated", user: null, company: null });
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ ...state, companies, switchCompany, login, register, logout }}>
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
