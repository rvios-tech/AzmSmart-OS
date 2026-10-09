import { Scene } from "@/welcome/components/stage/Scene";
import { Lines, Rise } from "@/welcome/components/ui/motion";
import { Steps } from "@/welcome/components/ui/Steps";
import { Faq } from "@/welcome/components/ui/Faq";
import { Flow } from "@/welcome/components/azm/Flow";
import { AzmModules } from "@/welcome/components/azm/AzmModules";
import { Closing } from "@/welcome/components/layout/Closing";
import { L } from "@/welcome/components/i18n/L";
import type { StageCfg } from "@/welcome/lib/stage/glass";
import { content } from "@/welcome/lib/content";
import { contactUrl } from "@/welcome/lib/content/links";

/**
 * الصفحة الترحيبية لعزم سمارت — صفحة AzmSmart في موقع RVIOS الرئيسي، نُقلت
 * إلى هنا لتكون واجهة النظام نفسه، وموقع RVIOS يحوّل إليها. الفرق عن الأصل:
 * أزرار البدء تدخل النظام مباشرةً (`/register`، `/login`)، وطلب العرض
 * التوضيحي يفتح صفحة التواصل في موقع RVIOS.
 */
const t = {
  label: "AzmSmart — من منتجات RVIOS",
  head: ["إدارة أعمالك بذكاء،", "من مكان واحد."],
  lead: "نظام ذكي لإدارة الأعمال والتجارة الإلكترونية: المبيعات والمخزون والعملاء والمالية والموارد البشرية مترابطة في منصة واحدة.",
  facts: "ست وحدات مترابطة — يعمل من أي جهاز — عربي بالكامل — مرتبط بمتجرك الإلكتروني",
  pains: [
    { t: "بيانات في كل مكان", d: "المخزون في جدول، والطلبات في واتساب، والحسابات في دفتر. ولا أحد يرى الصورة كاملة." },
    { t: "طلبات تضيع", d: "طلب لم يُسجَّل، أو منتج بيع وهو غير متوفر، أو عميل انتظر ولم يرد عليه أحد." },
    { t: "قرارات متأخرة", d: "لا تعرف أرباح الشهر إلا بعد انتهائه بأيام، ولا الأكثر مبيعاً إلا بالتخمين." },
  ],
};

const GOLD = "#E0B062";
const HERO: StageCfg = { d: { x: -2.1, y: 0.25, s: 0.78 }, m: { x: 0, y: 1.6, s: 0.5 }, light: GOLD };
const FLOW: StageCfg = { d: { x: 0, y: 1.55, s: 0.55 }, m: { x: 0, y: 2.1, s: 0.35 }, light: GOLD, glow: 0.7 };
const MODULES: StageCfg = { d: { x: -2, y: 0, s: 0.92 }, m: { x: 0, y: -9, s: 0.5 }, light: GOLD, glow: 0.9 };

export default function WelcomePage() {
  const { products, azm } = content("ar");
  const { azmFaq, onboarding, sectors } = azm;
  const others = products.filter((p) => p.slug !== "azmsmart");
  return (
    <>
      <Scene id="azm-hero" cfg={HERO} className="flex min-h-svh flex-col justify-end px-[var(--pad)] pt-[46vh] pb-[10vh] lg:justify-center lg:pt-32">
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="max-w-[820px]">
            <span className="label">{t.label}</span>
            <Lines immediate as="h1" className="h1 mt-6" lines={[t.head[0], <span key="m" className="text-mist">{t.head[1]}</span>]} />
            <Rise immediate delay={0.5}>
              <p data-rise className="lead mt-8 max-w-[48ch] text-mist">{t.lead}</p>
              <div data-rise className="mt-9 flex flex-wrap gap-3">
                <L href="/register" className="btn btn-gold">ابدأ مجاناً</L>
                <a href={contactUrl("azmsmart")} className="btn">اطلب عرضاً توضيحياً</a>
                <a href="#azm-modules" className="btn">استكشف الوحدات</a>
              </div>
              <p data-rise className="mt-12 text-[14px] text-ivory/50">{t.facts}</p>
            </Rise>
          </div>
        </div>
      </Scene>

      <Scene id="azm-pains" theme="paper" className="px-[var(--pad)] py-[clamp(100px,16vh,170px)]">
        <div className="mx-auto max-w-[1480px]">
          <span className="label">قبل AzmSmart</span>
          <Lines className="h2 mt-6" lines={["هل يبدو يوم عملك هكذا؟"]} />
          <Rise className="mt-16 grid border-t border-hair-ink md:grid-cols-3" stagger={0.1}>
            {t.pains.map((p, i) => (
              <div data-rise key={p.t} className={`py-10 md:px-10 ${i ? "md:border-s md:border-hair-ink" : "md:ps-0"}`}>
                <h3 className="h3">{p.t}</h3>
                <p className="mt-4 text-[16px] text-ink/65">{p.d}</p>
              </div>
            ))}
          </Rise>
        </div>
      </Scene>

      <Scene id="azm-flow" cfg={FLOW} className="px-[var(--pad)] pt-[clamp(300px,46vh,440px)] pb-[clamp(100px,16vh,170px)]">
        <div className="mx-auto max-w-[1480px]">
          <span className="label">كيف يعمل</span>
          <Lines className="h2 mt-6" lines={["عملية واحدة،", "تتحدّث بها كل الأقسام."]} />
          <Rise><p data-rise className="lead mt-6 max-w-[52ch] text-mist">حين يصل طلب، لا يحتاج أحد أن يُدخله مرة ثانية. ينقله AzmSmart تلقائياً عبر كل قسم يعنيه.</p></Rise>
          <Flow />
        </div>
      </Scene>

      <Scene id="azm-modules" cfg={MODULES} className="px-[var(--pad)] py-[clamp(100px,16vh,170px)]">
        <div className="mx-auto max-w-[1480px]">
          <span className="label">الوحدات</span>
          <Lines className="h2 mt-6" lines={["ست وحدات،", "نظام واحد."]} />
          <AzmModules />
        </div>
      </Scene>

      <Scene id="azm-sectors" theme="paper" className="px-[var(--pad)] py-[clamp(100px,16vh,170px)]">
        <div className="mx-auto max-w-[1480px]">
          <span className="label">لمن AzmSmart</span>
          <Lines className="h2 mt-6" lines={["مصمم لأعمال مثل عملك."]} />
          <Rise className="mt-16 grid border-t border-hair-ink sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {sectors.map((s, i) => (
              <div data-rise key={s.title} className={`py-10 lg:px-8 ${i ? "lg:border-s lg:border-hair-ink" : "lg:ps-0"}`}>
                <h3 className="serif text-[26px]">{s.title}</h3>
                <p className="mt-3 text-[15px] text-ink/65">{s.desc}</p>
              </div>
            ))}
          </Rise>
          <div className="mt-[14vh] border-t border-hair-ink pt-[12vh]">
            <span className="label">البداية</span>
            <Lines className="h2 mt-6" lines={["نبدأ معك خطوة بخطوة."]} />
            <div className="mt-16"><Steps items={onboarding} /></div>
          </div>
        </div>
      </Scene>

      <Scene id="azm-faq" className="px-[var(--pad)] py-[clamp(100px,16vh,170px)]">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div><span className="label">أسئلة شائعة</span><Lines className="h2 mt-6" lines={["قبل أن", "تبدأ."]} /></div>
            <Faq items={azmFaq} />
          </div>
          <div className="mt-[14vh] grid gap-5 md:grid-cols-2">
            {others.map((p) => (
              <a key={p.slug} href={p.href} className="glass group rounded-[22px] p-9 transition-transform duration-700 hover:-translate-y-1.5">
                <span className="text-[13px] text-mist">من منتجات RVIOS أيضاً</span>
                <h3 dir="ltr" className="yap mt-5 text-start text-[34px] leading-none rtl:text-end">{p.name}</h3>
                <p className="mt-3 text-[15px]" style={{ color: p.tone }}>{p.role}</p>
                <p className="mt-3 text-[15px] text-mist">{p.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </Scene>

      <Closing lines={["جاهز لتجربة", "AzmSmart؟"]} light={GOLD} />
    </>
  );
}
