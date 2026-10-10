# عزم سمارت (AzmSmart)

نظام إدارة الأعمال الذكي من RVIOS — منصة سحابية متكاملة لإدارة المبيعات
والعملاء والفواتير والمشاريع، مبنية بالكامل للغة العربية (RTL) وبهوية
بصرية خاصة بعزم سمارت.

هذا مستودع خاص وملكية RVIOS Technologies. غير مخصّص للنشر العلني أو
إعادة التوزيع.

## التقنيات

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
- [Recharts](https://recharts.org) للرسوم البيانية
- [TanStack Table](https://tanstack.com/table) لجداول البيانات
- الباكند: NestJS + Prisma + PostgreSQL (المستودع `RVIOS_APP/api`)

## التشغيل محلياً

```bash
npm install
npm run dev
```

يفتح على [http://localhost:3001](http://localhost:3001) (انظر
`.claude/launch.json`). يتطلب تشغيل الباكند (`RVIOS_APP/api`) على المنفذ
3000 للحصول على بيانات حقيقية — بدونه تعمل صفحات تسجيل الدخول والعملاء
والفواتير فقط، وبقية الصفحات تعرض بيانات توضيحية.

```bash
npm run build   # بناء الإنتاج
npm run start   # تشغيل البناء
```

## النشر

دليل نشر المنظومة كاملة (الباكند، AzmSmart، منصة المتاجر، الموقع الرئيسي) مع متغيّرات
البيئة والتشغيل الأول: `F:\RVIOS_APP\api\docs\DEPLOY.md`. متغيّرات هذا التطبيق في `.env.example`.

## بنية المشروع

```
src/
  app/
    (app)/          # الصفحات المصادَق عليها (شريط جانبي + ترويسة)
    (auth)/         # تسجيل الدخول، إنشاء حساب، استعادة كلمة المرور
    landing/  onboarding/  maintenance/  coming-soon/
  components/       # الشريط الجانبي، الترويسة، جدول البيانات، مخصّص المظهر، ui/
  config/nav.ts     # قائمة التنقل الجانبية
  data/index.ts     # بيانات توضيحية (للصفحات غير المربوطة بعد بالباكند)
  lib/api/          # طبقة الاتصال بالباكند الحقيقي
  lib/auth/         # سياق المصادقة
```

الصفحات المربوطة فعلياً بالباكند الحقيقي حالياً: تسجيل الدخول/الحساب،
العملاء، والفواتير. بقية الصفحات لا تزال تعرض بيانات `src/data/index.ts`
التوضيحية بانتظار ربطها.
