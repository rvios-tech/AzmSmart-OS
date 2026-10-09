import * as THREE from "three";
import { LOGO_POINTS } from "./logo-path";

export type Lang = "ar" | "en";
export type Theme = "dark" | "light";

/** نصوص الشاشة بحسب اللغة */
const T = {
  ar: {
    siteUrl: "horizon-holding.com", siteBrand: "الأفق القابضة", siteNav: ["الرئيسية", "عن الشركة", "الخدمات", "تواصل"],
    siteH1: "نبني الثقة،", siteH2: "ونصنع المستقبل.", siteP: "حلول استثمارية وعقارية متكاملة في المملكة.", siteCta: "اطلب استشارة",
    storeUrl: "store.rvios.com/alsaeed", storeName: "متجر السعيد للعطور", storeBadge: "متجر موثّق", cats: ["الكل", "عطور شرقية", "بخور", "هدايا"],
    products: [["العود الملكي", "45"], ["مسك أبيض", "28"], ["عنبر فاخر", "52"], ["طقم هدايا", "70"]], add: "أضف للسلة", toast: "أُضيف إلى السلة", wa: "إتمام الطلب عبر واتساب",
    appUrl: "app.azmsmart.com", appTitle: "لوحة التحكم", kpis: ["مبيعات اليوم", "طلبات جديدة", "صافي الربح"], chart: "المبيعات هذا الأسبوع", orders: "آخر الطلبات",
    rows: [["طلب ‎#2381", "تم الشحن"], ["طلب ‎#2382", "قيد التجهيز"], ["طلب ‎#2383", "بانتظار الدفع"], ["طلب ‎#2384", "تم التسليم"]],
    menu: ["الرئيسية", "المبيعات", "المخزون", "العملاء", "المالية"],
  },
  en: {
    siteUrl: "horizon-holding.com", siteBrand: "Horizon Holding", siteNav: ["Home", "About", "Services", "Contact"],
    siteH1: "Building trust,", siteH2: "shaping tomorrow.", siteP: "Integrated investment and real-estate solutions.", siteCta: "Book a consultation",
    storeUrl: "store.rvios.com/alsaeed", storeName: "Al-Saeed Perfumes", storeBadge: "Verified", cats: ["All", "Oriental", "Incense", "Gifts"],
    products: [["Royal Oud", "45"], ["White Musk", "28"], ["Fine Amber", "52"], ["Gift Set", "70"]], add: "Add to cart", toast: "Added to cart", wa: "Checkout on WhatsApp",
    appUrl: "app.azmsmart.com", appTitle: "Dashboard", kpis: ["Today's sales", "New orders", "Net profit"], chart: "Sales this week", orders: "Latest orders",
    rows: [["Order #2381", "Shipped"], ["Order #2382", "Preparing"], ["Order #2383", "Awaiting pay"], ["Order #2384", "Delivered"]],
    menu: ["Overview", "Sales", "Inventory", "Customers", "Finance"],
  },
};

const PAL = {
  dark: { bg: "#131212", panel: "#1C1A1A", panel2: "#242121", fg: "#FAF8ED", mist: "rgba(250,248,237,.55)", hair: "rgba(250,248,237,.10)", bar: "#1A1818" },
  light: { bg: "#FAF8ED", panel: "#FFFFFF", panel2: "#F1EDE2", fg: "#171717", mist: "rgba(23,23,23,.55)", hair: "rgba(23,23,23,.10)", bar: "#EFEBDF" },
};
const RUBY = "#C8323A", RED = "#9E2226", GOLD = "#C8A45D";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

function cssVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * شاشة اللابتوب: لوحة رسم ثنائية الأبعاد تُرسم كل إطار وتُستخدم كخامة.
 * ثلاثة تطبيقات تتبدل تلقائياً (أو بالتمرير/النقر): موقع شركة، متجر StoreOS، لوحة AzmSmart.
 */
export class ScreenUI {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  /** أبعاد التصميم (960×600) — تُرسم على لوحة أكبر بمقياس sc للحدة */
  private W = 960;
  private H = 600;
  private k = 1;
  private sc: number;
  lang: Lang = "ar";
  theme: Theme = "dark";
  index = 0;
  private prev = -1;
  private switchT = 1; // تقدم الانتقال 0..1
  private sceneT = 0; // الزمن داخل الشاشة الحالية
  private bootT = 0;
  private auto = true;
  private autoTimer = 0;
  private cart = 0;
  private logoPath: Path2D;

  constructor(small = false) {
    const cw = small ? 960 : 1440;
    this.sc = cw / this.W;
    this.canvas = document.createElement("canvas");
    this.canvas.width = cw;
    this.canvas.height = Math.round(cw / 1.6);
    this.ctx = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    const p = new Path2D();
    LOGO_POINTS.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    this.logoPath = p;
    if (typeof window !== "undefined") (window as unknown as { __rvScreen?: HTMLCanvasElement }).__rvScreen = this.canvas;
  }

  /** الانتقال إلى شاشة محددة (من التمرير) */
  goto(i: number, fromScroll = false) {
    if (fromScroll) this.auto = false;
    const n = ((i % 3) + 3) % 3;
    if (n === this.index) return;
    this.prev = this.index;
    this.index = n;
    this.switchT = 0;
    this.sceneT = 0;
  }
  next() { this.goto(this.index + 1); this.autoTimer = 0; }
  resumeAuto() { this.auto = true; }

  private f(size: number, weight = 500, display = false) {
    const fam = display
      ? this.lang === "ar" ? cssVar("--font-zain", "serif") : cssVar("--font-yapari", "sans-serif")
      : cssVar("--font-thm", "serif");
    return `${weight} ${Math.round(size * this.k)}px ${fam}`;
  }

  update(dt: number) {
    this.bootT += dt;
    this.sceneT += dt;
    if (this.switchT < 1) this.switchT = Math.min(1, this.switchT + dt / 0.75);
    if (this.auto && this.bootT > 2.2) {
      this.autoTimer += dt;
      if (this.autoTimer > 5.2) { this.autoTimer = 0; this.goto(this.index + 1); }
    }
    this.draw();
    this.texture.needsUpdate = true;
  }

  // ———————————————————— الرسم ————————————————————
  private draw() {
    const { ctx, W, H } = this;
    const P = PAL[this.theme];
    ctx.save();
    ctx.setTransform(this.sc, 0, 0, this.sc, 0, 0);
    ctx.direction = this.lang === "ar" ? "rtl" : "ltr";
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);

    // شاشة الإقلاع: الشعار يتوهج ثم يتلاشى
    if (this.bootT < 2.2) {
      this.drawBoot(this.bootT);
      ctx.restore();
      return;
    }
    const e = ease(this.switchT);
    if (this.switchT < 1 && this.prev >= 0) {
      ctx.save();
      ctx.globalAlpha = 1 - e;
      ctx.translate(0, -e * H * 0.12);
      this.drawApp(this.prev, 10);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(0, (1 - e) * H * 0.18);
      this.drawApp(this.index, this.sceneT);
      ctx.restore();
    } else {
      this.drawApp(this.index, this.sceneT);
    }
    // لمعان زجاج الشاشة
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(255,255,255,0.07)");
    g.addColorStop(0.4, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  private drawBoot(t: number) {
    const { ctx, W, H } = this;
    ctx.fillStyle = this.theme === "dark" ? "#0B0A0A" : "#141313";
    ctx.fillRect(0, 0, W, H);
    const a = clamp01(t / 0.6) * (1 - seg(t, 1.7, 2.2));
    const s = (W * 0.2) / 209;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2 - 104.5 * s, H / 2 - 57 * s - 20 * this.k);
    ctx.scale(s, s);
    ctx.shadowColor = RUBY;
    ctx.shadowBlur = 40;
    ctx.fillStyle = RUBY;
    ctx.fill(this.logoPath);
    ctx.restore();
    // شريط تحميل
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(250,248,237,.15)";
    const bw = W * 0.16, by = H * 0.68;
    ctx.fillRect(W / 2 - bw / 2, by, bw, 3 * this.k);
    ctx.fillStyle = "#FAF8ED";
    ctx.fillRect(W / 2 - bw / 2, by, bw * clamp01(t / 1.6), 3 * this.k);
    ctx.globalAlpha = 1;
  }

  private drawApp(i: number, t: number) {
    if (i === 0) this.drawSite(t);
    else if (i === 1) this.drawStore(t);
    else this.drawDash(t);
  }

  /** شريط المتصفح */
  private chrome(url: string) {
    const { ctx, W, k } = this;
    const P = PAL[this.theme];
    ctx.fillStyle = P.bar;
    ctx.fillRect(0, 0, W, 44 * k);
    ctx.save();
    ctx.direction = "ltr";
    ["#E0484E", "#C8A45D", "#6B6B6B"].forEach((c, n) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc((26 + n * 20) * k, 22 * k, 6 * k, 0, 7);
      ctx.fill();
    });
    ctx.fillStyle = P.panel2;
    this.rr(W / 2 - 220 * k, 10 * k, 440 * k, 24 * k, 12 * k);
    ctx.fill();
    ctx.fillStyle = P.mist;
    ctx.font = this.f(13);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(url, W / 2, 22.5 * k);
    ctx.restore();
  }

  private rr(x: number, y: number, w: number, h: number, r: number) {
    const c = this.ctx;
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  }

  /** موضع أفقي يحترم اتجاه اللغة: start = بداية السطر */
  private sx(fromStart: number) { return this.lang === "ar" ? this.W - fromStart : fromStart; }

  // ——— 1) موقع شركة ———
  private drawSite(t: number) {
    const { ctx, W, H, k } = this;
    const P = PAL[this.theme];
    const L = T[this.lang];
    const rtl = this.lang === "ar";
    this.chrome(L.siteUrl);
    const top = 44 * k;
    // صورة البطل: أفق مدينة عند الغروب
    const hx = rtl ? 0 : W * 0.46, hw = W * 0.54;
    const sky = ctx.createLinearGradient(0, top, 0, H);
    sky.addColorStop(0, this.theme === "dark" ? "#3A1D1B" : "#F4D9C3");
    sky.addColorStop(0.6, this.theme === "dark" ? "#7A2A24" : "#E7A987");
    sky.addColorStop(1, this.theme === "dark" ? "#1A1212" : "#C98B6E");
    ctx.fillStyle = sky;
    ctx.fillRect(hx, top, hw, H - top);
    // الشمس
    ctx.fillStyle = this.theme === "dark" ? "rgba(255,190,140,.85)" : "rgba(255,245,225,.95)";
    ctx.beginPath();
    ctx.arc(hx + hw * 0.55, H * 0.6 - Math.sin(t * 0.4) * 6 * k, 46 * k, 0, 7);
    ctx.fill();
    // ناطحات
    const drift = t * 6 * k;
    const buildings = [0.06, 0.13, 0.2, 0.3, 0.36, 0.44, 0.52, 0.6, 0.7, 0.78, 0.86, 0.93];
    buildings.forEach((b, n) => {
      const bh = (0.18 + ((n * 37) % 11) / 30) * H;
      const bw2 = (20 + ((n * 13) % 5) * 7) * k;
      ctx.fillStyle = this.theme === "dark" ? `rgba(12,10,10,${0.75 + (n % 3) * 0.08})` : `rgba(60,40,36,${0.55 + (n % 3) * 0.1})`;
      ctx.fillRect(hx + hw * b - drift * (0.3 + (n % 3) * 0.2), H - bh, bw2, bh);
    });
    // برج
    ctx.fillStyle = this.theme === "dark" ? "#0C0A0A" : "#3C2A26";
    ctx.beginPath();
    const tx = hx + hw * 0.4;
    ctx.moveTo(tx, H);
    ctx.lineTo(tx + 20 * k, H * 0.28);
    ctx.lineTo(tx + 40 * k, H);
    ctx.fill();
    // تلاشي نحو النص
    const fade = ctx.createLinearGradient(rtl ? hw : hx, 0, rtl ? hw - 160 * k : hx + 160 * k, 0);
    fade.addColorStop(0, P.bg);
    fade.addColorStop(1, "rgba(0,0,0,0)");

    // الشريط العلوي للموقع
    ctx.fillStyle = P.bg;
    ctx.fillRect(rtl ? hw : 0, top, W - hw, H - top);
    ctx.textBaseline = "middle";
    ctx.fillStyle = P.fg;
    ctx.font = this.f(22, 700);
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(L.siteBrand, this.sx(44 * k), top + 44 * k);
    ctx.font = this.f(14);
    ctx.fillStyle = P.mist;
    L.siteNav.forEach((n, m) => {
      ctx.fillText(n, this.sx(44 * k + m * 78 * k), top + 88 * k);
    });
    // العنوان يظهر تدريجياً
    const a1 = ease(seg(t, 0.1, 0.9)), a2 = ease(seg(t, 0.35, 1.2));
    ctx.fillStyle = P.fg;
    ctx.font = this.f(rtl ? 62 : 36, 400, true);
    ctx.save();
    ctx.globalAlpha = a1;
    ctx.fillText(L.siteH1, this.sx(44 * k), top + (200 - 20 * (1 - a1)) * k);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a2;
    ctx.fillStyle = RUBY;
    ctx.font = this.f(rtl ? 62 : 36, 400, true);
    ctx.fillText(L.siteH2, this.sx(44 * k), top + (275 - 20 * (1 - a2)) * k);
    ctx.restore();
    ctx.font = this.f(16);
    ctx.fillStyle = P.mist;
    ctx.fillText(L.siteP, this.sx(44 * k), top + 345 * k);
    // زر
    const a3 = ease(seg(t, 0.9, 1.5));
    ctx.save();
    ctx.globalAlpha = a3;
    const bw = 190 * k, bh = 50 * k, bx = rtl ? W - 44 * k - bw : 44 * k, by = top + 392 * k;
    const pressed = t > 3.1 && t < 3.4;
    ctx.fillStyle = RED;
    this.rr(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = "#FAF8ED";
    ctx.textAlign = "center";
    ctx.font = this.f(15, 700);
    ctx.fillText(L.siteCta, bx + bw / 2, by + bh / 2 + (pressed ? 1 : 0));
    ctx.restore();
    this.cursor(t, [[W * 0.5, H * 0.5], [bx + bw * 0.6, by + bh * 0.6]], 2.2, 3.2);
  }

  // ——— 2) متجر StoreOS ———
  private drawStore(t: number) {
    const { ctx, W, H, k } = this;
    const P = PAL[this.theme];
    const L = T[this.lang];
    const rtl = this.lang === "ar";
    this.chrome(L.storeUrl);
    const top = 44 * k, pad = 48 * k;
    // الغلاف
    const cg = ctx.createLinearGradient(0, top, W, top + 150 * k);
    cg.addColorStop(0, RED);
    cg.addColorStop(1, "#5E1216");
    ctx.fillStyle = cg;
    this.rr(pad, top + 20 * k, W - pad * 2, 140 * k, 18 * k);
    ctx.fill();
    // زخرفة
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 2 * k;
    for (let n = 0; n < 6; n++) { ctx.beginPath(); ctx.arc(W * (rtl ? 0.2 : 0.8), top + 90 * k, (40 + n * 26) * k, 0, 7); ctx.stroke(); }
    // الشعار والاسم
    const lx = rtl ? W - pad - 110 * k : pad + 30 * k;
    ctx.fillStyle = RED;
    ctx.strokeStyle = P.bg;
    ctx.lineWidth = 5 * k;
    this.rr(lx, top + 120 * k, 80 * k, 80 * k, 20 * k);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = this.f(34, 400, true);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rtl ? "س" : "S", lx + 40 * k, top + 162 * k);
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = P.fg;
    ctx.font = this.f(24, 700);
    const nameX = rtl ? lx - 20 * k : lx + 100 * k;
    ctx.fillText(L.storeName, nameX, top + 188 * k);
    // شارة التوثيق
    ctx.font = this.f(12, 700);
    const bwid = ctx.measureText(L.storeBadge).width + 24 * k;
    const nw = (() => { ctx.font = this.f(24, 700); return ctx.measureText(L.storeName).width; })();
    const bxx = rtl ? nameX - nw - 16 * k - bwid : nameX + nw + 16 * k;
    ctx.fillStyle = "rgba(200,164,93,.18)";
    this.rr(bxx, top + 174 * k, bwid, 28 * k, 14 * k);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.font = this.f(12, 700);
    ctx.textAlign = "center";
    ctx.fillText(L.storeBadge, bxx + bwid / 2, top + 188.5 * k);
    // السلة
    const cx = rtl ? pad + 30 * k : W - pad - 30 * k;
    ctx.strokeStyle = P.fg;
    ctx.lineWidth = 2.4 * k;
    ctx.beginPath();
    ctx.moveTo(cx - 14 * k, top + 180 * k);
    ctx.lineTo(cx + 14 * k, top + 180 * k);
    ctx.lineTo(cx + 11 * k, top + 202 * k);
    ctx.lineTo(cx - 11 * k, top + 202 * k);
    ctx.closePath();
    ctx.stroke();
    const added = t > 2.6 ? 1 : 0;
    const cartN = this.cart + added;
    if (cartN > 0) {
      const pop = 1 + 0.35 * Math.max(0, 1 - Math.abs(t - 2.7) * 5);
      ctx.fillStyle = RUBY;
      ctx.beginPath();
      ctx.arc(cx + 14 * k, top + 176 * k, 11 * k * pop, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = this.f(12, 700);
      ctx.fillText(String(cartN), cx + 14 * k, top + 176.5 * k);
    }
    // التصنيفات
    ctx.font = this.f(14, 500);
    let x = rtl ? W - pad : pad;
    L.cats.forEach((c, n) => {
      const w = ctx.measureText(c).width + 36 * k;
      const bx = rtl ? x - w : x;
      ctx.fillStyle = n === 0 ? RED : P.panel2;
      this.rr(bx, top + 232 * k, w, 38 * k, 19 * k);
      ctx.fill();
      ctx.fillStyle = n === 0 ? "#fff" : P.fg;
      ctx.fillText(c, bx + w / 2, top + 251.5 * k);
      x = rtl ? x - w - 10 * k : x + w + 10 * k;
    });
    // المنتجات
    const cols = 4, gap = 20 * k, cw = (W - pad * 2 - gap * (cols - 1)) / cols, ch = H - top - 300 * k - 20 * k;
    const hues = [["#6B2A1E", "#C8783D"], ["#DAD2C4", "#F7F3EA"], ["#7A4E1A", "#E0B062"], ["#3A1D2B", "#9E2226"]];
    L.products.forEach(([name, price], n) => {
      const i = rtl ? cols - 1 - n : n;
      const px = pad + i * (cw + gap), py = top + 292 * k;
      const appear = ease(seg(t, 0.1 + n * 0.12, 0.7 + n * 0.12));
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.translate(0, (1 - appear) * 30 * k);
      ctx.fillStyle = P.panel;
      this.rr(px, py, cw, ch, 18 * k);
      ctx.fill();
      // صورة المنتج: قارورة عطر
      const ig = ctx.createLinearGradient(px, py, px, py + ch * 0.62);
      ig.addColorStop(0, hues[n][1]);
      ig.addColorStop(1, hues[n][0]);
      ctx.fillStyle = ig;
      this.rr(px + 10 * k, py + 10 * k, cw - 20 * k, ch * 0.6, 12 * k);
      ctx.fill();
      const bxc = px + cw / 2, byc = py + ch * 0.33;
      ctx.fillStyle = "rgba(255,255,255,.28)";
      this.rr(bxc - 32 * k, byc - 20 * k, 64 * k, 84 * k, 14 * k);
      ctx.fill();
      ctx.fillStyle = "rgba(20,14,12,.55)";
      ctx.fillRect(bxc - 12 * k, byc - 44 * k, 24 * k, 24 * k);
      // الاسم والسعر
      ctx.textAlign = rtl ? "right" : "left";
      ctx.fillStyle = P.fg;
      ctx.font = this.f(17, 700);
      ctx.fillText(name, rtl ? px + cw - 18 * k : px + 18 * k, py + ch * 0.72);
      ctx.fillStyle = GOLD;
      ctx.font = this.f(16, 700);
      ctx.textAlign = rtl ? "left" : "right";
      ctx.fillText(`$${price}`, rtl ? px + 18 * k : px + cw - 18 * k, py + ch * 0.72);
      // زر الإضافة
      const hot = n === 0 && t > 2.4 && t < 2.8;
      ctx.fillStyle = hot ? RUBY : P.panel2;
      this.rr(px + 14 * k, py + ch - 56 * k, cw - 28 * k, 40 * k, 20 * k);
      ctx.fill();
      ctx.fillStyle = hot ? "#fff" : P.fg;
      ctx.textAlign = "center";
      ctx.font = this.f(14, 700);
      ctx.fillText(L.add, px + cw / 2, py + ch - 35.5 * k);
      ctx.restore();
    });
    // إشعار
    const ta = seg(t, 2.7, 3) * (1 - seg(t, 4.3, 4.7));
    if (ta > 0) {
      ctx.save();
      ctx.globalAlpha = ta;
      ctx.font = this.f(15, 700);
      const w = ctx.measureText(L.toast).width + 60 * k;
      ctx.fillStyle = this.theme === "dark" ? "#FAF8ED" : "#171717";
      this.rr(W / 2 - w / 2, H - 80 * k - (1 - ta) * 20 * k, w, 46 * k, 23 * k);
      ctx.fill();
      ctx.fillStyle = this.theme === "dark" ? "#171717" : "#FAF8ED";
      ctx.textAlign = "center";
      ctx.fillText("✓  " + L.toast, W / 2, H - 57 * k - (1 - ta) * 20 * k);
      ctx.restore();
    }
    const firstCol = rtl ? cols - 1 : 0;
    const bx = pad + firstCol * (cw + gap) + cw / 2, by = top + 292 * k + ch - 36 * k;
    this.cursor(t, [[W * 0.55, H * 0.35], [bx, by]], 1.3, 2.4);
  }

  // ——— 3) لوحة AzmSmart ———
  private drawDash(t: number) {
    const { ctx, W, H, k } = this;
    const P = PAL[this.theme];
    const L = T[this.lang];
    const rtl = this.lang === "ar";
    this.chrome(L.appUrl);
    const top = 44 * k, side = 190 * k;
    // الشريط الجانبي
    const sxp = rtl ? W - side : 0;
    ctx.fillStyle = P.panel;
    ctx.fillRect(sxp, top, side, H - top);
    ctx.fillStyle = GOLD;
    this.rr(rtl ? W - 60 * k : 24 * k, top + 24 * k, 36 * k, 36 * k, 10 * k);
    ctx.fill();
    ctx.fillStyle = "#171717";
    ctx.font = this.f(13, 700);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save(); ctx.direction = "ltr"; ctx.fillText("AZ", rtl ? W - 42 * k : 42 * k, top + 42.5 * k); ctx.restore();
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = P.fg;
    ctx.font = this.f(16, 700);
    ctx.fillText("AzmSmart", rtl ? W - 72 * k : 72 * k, top + 42 * k);
    L.menu.forEach((m, n) => {
      const y = top + (110 + n * 52) * k;
      if (n === 0) {
        ctx.fillStyle = "rgba(200,164,93,.14)";
        this.rr(sxp + 14 * k, y - 20 * k, side - 28 * k, 40 * k, 10 * k);
        ctx.fill();
      }
      ctx.fillStyle = n === 0 ? GOLD : P.mist;
      ctx.font = this.f(15, n === 0 ? 700 : 500);
      ctx.fillText(m, rtl ? W - 34 * k : 34 * k, y);
    });
    // المحتوى
    const cx0 = rtl ? 36 * k : side + 36 * k, cw = W - side - 72 * k;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = P.fg;
    ctx.font = this.f(rtl ? 38 : 24, 400, true);
    ctx.fillText(L.appTitle, rtl ? cx0 + cw : cx0, top + 50 * k);
    // مؤشرات تعدّ
    const vals = [4320, 86, 1840];
    const pre = ["$", "", "$"];
    const kw = (cw - 40 * k) / 3;
    vals.forEach((v, n) => {
      const i = rtl ? 2 - n : n;
      const x = cx0 + i * (kw + 20 * k), y = top + 90 * k;
      ctx.fillStyle = P.panel;
      this.rr(x, y, kw, 110 * k, 16 * k);
      ctx.fill();
      ctx.fillStyle = P.mist;
      ctx.font = this.f(14);
      ctx.textAlign = rtl ? "right" : "left";
      ctx.fillText(L.kpis[n], rtl ? x + kw - 20 * k : x + 20 * k, y + 30 * k);
      const cur = Math.round(v * ease(seg(t, 0.2, 1.6)));
      ctx.fillStyle = P.fg;
      ctx.font = this.f(30, 700);
      ctx.save(); ctx.direction = "ltr";
      ctx.textAlign = rtl ? "right" : "left";
      ctx.fillText(pre[n] + cur.toLocaleString("en-US"), rtl ? x + kw - 20 * k : x + 20 * k, y + 76 * k);
      ctx.restore();
      // نسبة
      ctx.fillStyle = n === 1 ? GOLD : "#3FA66B";
      ctx.font = this.f(13, 700);
      ctx.save(); ctx.direction = "ltr";
      ctx.textAlign = rtl ? "left" : "right";
      ctx.fillText(["+12%", "+8", "+18%"][n], rtl ? x + 20 * k : x + kw - 20 * k, y + 30 * k);
      ctx.restore();
    });
    // الرسم البياني
    const chx = rtl ? cx0 + cw * 0.42 : cx0, chw = cw * 0.58, chy = top + 222 * k, chh = H - chy - 30 * k;
    ctx.fillStyle = P.panel;
    this.rr(chx, chy, chw, chh, 16 * k);
    ctx.fill();
    ctx.fillStyle = P.mist;
    ctx.font = this.f(14);
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(L.chart, rtl ? chx + chw - 20 * k : chx + 20 * k, chy + 30 * k);
    const bars = [42, 58, 51, 70, 64, 88, 76];
    const bw = (chw - 60 * k) / bars.length;
    const base = chy + chh - 26 * k, maxh = chh - 90 * k;
    bars.forEach((b, n) => {
      const grow = ease(seg(t, 0.3 + n * 0.08, 1.2 + n * 0.08));
      const h = (b / 100) * maxh * grow;
      const g = ctx.createLinearGradient(0, base - h, 0, base);
      g.addColorStop(0, n === 5 ? RUBY : GOLD);
      g.addColorStop(1, n === 5 ? "rgba(200,50,58,.25)" : "rgba(200,164,93,.2)");
      ctx.fillStyle = g;
      this.rr(chx + 30 * k + n * bw + bw * 0.2, base - h, bw * 0.6, h, 6 * k);
      ctx.fill();
    });
    // خط الاتجاه يُرسم
    const lp = ease(seg(t, 1.2, 2.6));
    ctx.strokeStyle = P.fg;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    const pts = bars.map((b, n) => [chx + 30 * k + n * bw + bw / 2, base - (b / 100) * maxh - 18 * k]);
    const upto = lp * (pts.length - 1);
    pts.forEach(([px, py], n) => {
      if (n > upto + 1) return;
      if (n === 0) ctx.moveTo(px, py);
      else if (n <= upto) ctx.lineTo(px, py);
      else { const f = upto - (n - 1); const [ax, ay] = pts[n - 1]; ctx.lineTo(ax + (px - ax) * f, ay + (py - ay) * f); }
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    // قائمة الطلبات
    const lx = rtl ? cx0 : cx0 + cw * 0.6, lw = cw * 0.4 - 0 * k;
    ctx.fillStyle = P.panel;
    this.rr(lx, chy, lw - 0, chh, 16 * k);
    ctx.fill();
    ctx.fillStyle = P.mist;
    ctx.font = this.f(14);
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillText(L.orders, rtl ? lx + lw - 20 * k : lx + 20 * k, chy + 30 * k);
    L.rows.forEach(([a, s], n) => {
      const ra = ease(seg(t, 0.8 + n * 0.25, 1.4 + n * 0.25));
      const y = chy + (74 + n * 58) * k;
      ctx.save();
      ctx.globalAlpha = ra;
      ctx.translate((rtl ? -1 : 1) * (1 - ra) * 20 * k, 0);
      ctx.fillStyle = P.fg;
      ctx.font = this.f(15, 700);
      ctx.textAlign = rtl ? "right" : "left";
      ctx.fillText(a, rtl ? lx + lw - 20 * k : lx + 20 * k, y);
      ctx.font = this.f(12, 700);
      const w = ctx.measureText(s).width + 22 * k;
      const px = rtl ? lx + 20 * k : lx + lw - 20 * k - w;
      ctx.fillStyle = n === 2 ? "rgba(216,55,61,.18)" : "rgba(200,164,93,.16)";
      this.rr(px, y - 13 * k, w, 26 * k, 13 * k);
      ctx.fill();
      ctx.fillStyle = n === 2 ? RUBY : GOLD;
      ctx.textAlign = "center";
      ctx.fillText(s, px + w / 2, y + 0.5);
      ctx.fillStyle = P.hair;
      if (n < 3) ctx.fillRect(lx + 20 * k, y + 29 * k, lw - 40 * k, 1);
      ctx.restore();
    });
  }

  /** مؤشر فأرة يتحرك ويضغط */
  private cursor(t: number, path: [number, number][], t0: number, t1: number) {
    const { ctx, k } = this;
    const p = ease(seg(t, t0, t1));
    const [ax, ay] = path[0], [bx, by] = path[1];
    const x = ax + (bx - ax) * p, y = ay + (by - ay) * p;
    const a = seg(t, t0 - 0.4, t0) * (1 - seg(t, t1 + 1.2, t1 + 1.6));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    if (t > t1 && t < t1 + 0.5) {
      ctx.strokeStyle = "rgba(216,55,61,.6)";
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.arc(x, y, (8 + (t - t1) * 60) * k, 0, 7);
      ctx.stroke();
    }
    ctx.translate(x, y);
    ctx.scale(k * 1.2, k * 1.2);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(6, 17);
    ctx.lineTo(10, 26);
    ctx.lineTo(14, 24);
    ctx.lineTo(10, 15);
    ctx.lineTo(17, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  dispose() { this.texture.dispose(); }
}
