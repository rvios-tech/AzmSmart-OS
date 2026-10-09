"use client";
import { Scene } from "@/welcome/components/stage/Scene";
import { Lines, Rise } from "@/welcome/components/ui/motion";
import { L } from "@/welcome/components/i18n/L";
import { AzmLockup } from "@/welcome/components/layout/Header";
import type { StageCfg } from "@/welcome/lib/stage/glass";
import { site, waLink } from "@/welcome/lib/content/site";
import { content } from "@/welcome/lib/content";
import { RVIOS_URL, contactUrl } from "@/welcome/lib/content/links";

/** الخاتمة: الشعار الزجاجي يعود، دعوة للبدء، ثم التذييل */
export function Closing({ lines, light }: { lines: string[]; light?: string }) {
  const { products } = content("ar");
  const cfg: StageCfg = { d: { x: 0, y: 1.7, s: 0.44 }, m: { x: 0, y: 1.95, s: 0.38 }, light, glow: 0.85 };
  return (
    <>
      <Scene id="closing" cfg={cfg} className="px-[var(--pad)] pb-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="flex min-h-svh flex-col justify-end pt-[40vh] pb-[12vh]">
            <Lines as="h2" className="h1 text-center" lines={lines} />
            <Rise className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <L data-rise href="/register" className="btn btn-gold">ابدأ مجاناً</L>
              <a data-rise href={contactUrl("azmsmart")} className="btn">اطلب عرضاً توضيحياً</a>
              <a data-rise href={waLink("ar", "مرحباً، أود معرفة المزيد عن AzmSmart")} target="_blank" rel="noopener" className="btn">واتساب</a>
            </Rise>
            <p className="mt-8 text-center">
              <a href={`mailto:${site.email}`} className="link-line latin text-lg text-mist hover:text-ivory">{site.email}</a>
            </p>
          </div>
        </div>
      </Scene>
      <Scene id="footer" className="px-[var(--pad)] pb-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <footer className="grid gap-10 border-t border-hair pt-10 text-[14px] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <AzmLockup />
              <p className="mt-5 max-w-[30ch] text-mist">نظام ذكي لإدارة الأعمال — من منتجات RVIOS.</p>
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" className="latin mt-4 inline-block text-mist transition-colors hover:text-ivory" dir="ltr">{site.whatsappDisplay}</a>
            </div>
            <div>
              <b className="mb-3 block text-[13px] font-medium text-gold">النظام</b>
              <L href="/login" className="block py-1 text-mist transition-colors hover:text-ivory">تسجيل الدخول</L>
              <L href="/register" className="block py-1 text-mist transition-colors hover:text-ivory">إنشاء حساب</L>
              <a href="#azm-modules" className="block py-1 text-mist transition-colors hover:text-ivory">الوحدات</a>
            </div>
            <div>
              <b className="mb-3 block text-[13px] font-medium text-gold">منتجات RVIOS</b>
              {products.map((p) => <a key={p.slug} href={p.href} className="block py-1 text-mist transition-colors hover:text-ivory"><span dir="ltr">{p.name}</span></a>)}
            </div>
            <div>
              <b className="mb-3 block text-[13px] font-medium text-gold">RVIOS</b>
              <a href={`${RVIOS_URL}/ar`} className="block py-1 text-mist transition-colors hover:text-ivory">الموقع الرئيسي</a>
              <a href={contactUrl()} className="block py-1 text-mist transition-colors hover:text-ivory">تواصل معنا</a>
            </div>
          </footer>
          <div className="mt-10 flex flex-wrap justify-between gap-3 text-[12px] text-ivory/40">
            <span>© {new Date().getFullYear()} RVIOS Technologies</span>
            <span className="flex gap-5">{site.social.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noopener" className="latin hover:text-ivory">{s.label}</a>)}</span>
          </div>
        </div>
      </Scene>
    </>
  );
}
