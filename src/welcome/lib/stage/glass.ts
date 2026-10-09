import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { LOGO_POINTS } from "./logo-path";
import { Laptop } from "./laptop";
import type { Lang, Theme } from "./screen";

/** لون خلفية المسرح لكل ثيم — يطابق --bg في globals.css */
export const BG = { dark: "#0E0D0D", light: "#EFEBE0" } as const;
export const BRAND_LIGHT = "#E0484E";

export type Place = { x: number; y: number; s: number; tilt?: number };
export type StageCfg = {
  /** موضع الشعار على الشاشات الكبيرة (وحدات المشهد: المركز 0,0 — الارتفاع المرئي ≈ ±2.7) */
  d: Place;
  /** موضع الشعار على الجوال */
  m?: Place;
  /** لون الضوء الذي ينكسر داخل الزجاج */
  light?: string;
  /** شدة جدار الضوء 0..1 */
  glow?: number;
  /** إخفاء الشعار وإيقاف الرسم (للأقسام الفاتحة التي تغطي الشاشة) */
  hide?: boolean;
  /** مشهد البطل: اللابتوب والشعار فوق لوحة المفاتيح */
  hero?: boolean;
};

const MOBILE = () => window.innerWidth <= 900;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * يرسم جدار الضوء: توهج شعاعي + أعمدة ضوء ناعمة، وحوافه بلون الخلفية تماماً
 * حتى يذوب في الصفحة. هذا ما يراه الزجاج وينكسر عبره.
 */
function paintWall(ctx: CanvasRenderingContext2D, light: string, glow: number, theme: Theme) {
  const { width: w, height: h } = ctx.canvas;
  const bg = BG[theme];
  const lightMode = theme === "light";
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const c = new THREE.Color(light);
  const rgba = (a: number, k = 1) => `rgba(${Math.round(Math.min(255, c.r * 255 * k))},${Math.round(Math.min(255, c.g * 255 * k))},${Math.round(Math.min(255, c.b * 255 * k))},${a})`;

  ctx.globalCompositeOperation = lightMode ? "source-over" : "lighter";
  const g = ctx.createRadialGradient(w * 0.5, h * 0.52, 0, w * 0.5, h * 0.52, w * 0.42);
  g.addColorStop(0, rgba((lightMode ? 0.3 : 0.42) * glow));
  g.addColorStop(0.5, rgba((lightMode ? 0.08 : 0.1) * glow));
  g.addColorStop(1, rgba(0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const beams: [number, number, number, boolean][] = [
    [0.38, 0.006, 0.55, true], [0.5, 0.016, 0.8, true], [0.58, 0.005, 0.6, false], [0.64, 0.01, 0.45, true],
  ];
  ctx.filter = `blur(${Math.round(w * 0.005)}px)`;
  for (const [x, bw, a, warm] of beams) {
    const lg = ctx.createLinearGradient(0, h * 0.12, 0, h * 0.88);
    const col = warm ? (k: number) => (lightMode ? `rgba(255,255,255,${k})` : `rgba(255,240,222,${k})`) : (k: number) => rgba(k * (lightMode ? 0.5 : 1), 1.25);
    lg.addColorStop(0, col(0));
    lg.addColorStop(0.5, col(a * glow));
    lg.addColorStop(1, col(0));
    ctx.fillStyle = lg;
    ctx.fillRect(w * (x - bw / 2), 0, w * bw, h);
  }
  const hz = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
  hz.addColorStop(0, "rgba(200,164,93,0)");
  hz.addColorStop(0.5, `rgba(${lightMode ? "176,141,72" : "214,178,110"},${0.55 * glow})`);
  hz.addColorStop(1, "rgba(200,164,93,0)");
  ctx.fillStyle = hz;
  ctx.fillRect(0, h * 0.72, w, h * 0.008);

  // تلاشٍ بيضاوي كامل عند الحواف (كل حافة = لون الخلفية تماماً)
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  const n = parseInt(bg.slice(1), 16);
  const bgA = (a: number) => `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  const edge = ctx.createRadialGradient(0, 0, w * 0.16, 0, 0, w * 0.48);
  edge.addColorStop(0, bgA(0));
  edge.addColorStop(1, bgA(1));
  ctx.fillStyle = edge;
  ctx.fillRect(-w, -w, w * 2, w * 2);
  ctx.restore();
}

type Pose = { x: number; y: number; s: number; rx: number; ry: number };

/** وضعيات اللابتوب على طول تمرير البطل (للعربية؛ تُعكس للإنجليزية) */
function heroPose(p: number, mob: boolean, halfW: number): Pose {
  const side = mob ? 0 : -Math.min(2.25, halfW * 0.47);
  const s0 = mob ? Math.min(0.48, halfW * 0.38) : Math.min(0.86, halfW * 0.195);
  const sc = mob ? Math.min(0.56, halfW * 0.42) : Math.min(1.02, halfW * 0.26);
  const keys: [number, Pose][] = mob
    ? [
        [0, { x: 0, y: 0.85, s: s0, rx: 0.5, ry: 0.28 }],
        [0.22, { x: 0, y: -0.35, s: sc, rx: 0.32, ry: 0 }],
        [0.5, { x: 0, y: -0.35, s: sc, rx: 0.3, ry: -0.16 }],
        [0.8, { x: 0, y: -0.35, s: sc, rx: 0.32, ry: 0.14 }],
        [1, { x: 0, y: -3.4, s: sc * 0.9, rx: 0.8, ry: 0 }],
      ]
    : [
        [0, { x: side, y: -0.8, s: s0, rx: 0.46, ry: 0.4 }],
        [0.22, { x: 0, y: -0.95, s: sc, rx: 0.3, ry: 0 }],
        [0.5, { x: 0, y: -0.95, s: sc, rx: 0.28, ry: -0.16 }],
        [0.8, { x: 0, y: -0.92, s: sc, rx: 0.3, ry: 0.13 }],
        [1, { x: 0, y: -4, s: sc * 0.9, rx: 0.8, ry: 0 }],
      ];
  for (let i = 1; i < keys.length; i++) {
    const [p1, b] = keys[i];
    const [p0, a] = keys[i - 1];
    if (p <= p1) {
      const t = smooth(clamp01((p - p0) / (p1 - p0)));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t) };
    }
  }
  return keys[keys.length - 1][1];
}

export class GlassStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private group = new THREE.Group();
  private spin = new THREE.Group();
  private logo: THREE.Mesh;
  private logoMat: THREE.MeshPhysicalMaterial;
  private wall: THREE.Mesh;
  private wallCtx: CanvasRenderingContext2D;
  private wallTex: THREE.CanvasTexture;
  private laptop: Laptop;
  private redLight: THREE.PointLight;
  private keyLight: THREE.DirectionalLight;
  private st = { x: 0, y: 0, s: 1, tilt: 0, px: 0, py: 0, intro: 0 };
  /** hero: مزج مشهد اللابتوب — lid: زاوية الغطاء — p: تقدم تمرير البطل (مخفّف) */
  private hero = { mix: 0, lid: 4, p: 0, target: 0, logo: 0 };
  private tone = { r: 0, g: 0, b: 0, glow: 1 };
  private raf = 0;
  private running = true;
  private timer = new THREE.Timer();
  private reduced: boolean;
  private disposed = false;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private theme: Theme;
  private mirror: number;
  private tmp = new THREE.Vector3();
  private frame = 0;

  constructor(canvas: HTMLCanvasElement, opts: { reduced?: boolean; introDelay?: number; theme: Theme; lang: Lang }) {
    this.reduced = !!opts.reduced;
    this.theme = opts.theme;
    this.mirror = opts.lang === "en" ? -1 : 1;
    const mob = MOBILE();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mob ? 1.5 : 1.75));
    this.renderer.setClearColor(BG[this.theme], 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.transmissionResolutionScale = mob ? 0.6 : 1;
    this.scene.background = new THREE.Color(BG[this.theme]);

    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.9;
    pm.dispose();

    // ——— جدار الضوء ———
    const wc = document.createElement("canvas");
    wc.width = mob ? 512 : 1024;
    wc.height = wc.width / 2;
    this.wallCtx = wc.getContext("2d")!;
    const c0 = new THREE.Color(BRAND_LIGHT);
    Object.assign(this.tone, { r: c0.r, g: c0.g, b: c0.b, glow: 1 });
    paintWall(this.wallCtx, BRAND_LIGHT, 1, this.theme);
    this.wallTex = new THREE.CanvasTexture(wc);
    this.wallTex.colorSpace = THREE.SRGBColorSpace;
    this.wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: this.wallTex, toneMapped: false }));
    this.wall.position.z = -2.6;
    this.scene.add(this.wall);

    // ——— الإضاءة (للابتوب) ———
    this.keyLight = new THREE.DirectionalLight("#fff4ea", 1.6);
    this.keyLight.position.set(-3, 6, 5);
    this.scene.add(this.keyLight);
    const rim = new THREE.DirectionalLight("#ffd9c7", 0.8);
    rim.position.set(4, 3, -4);
    this.scene.add(rim);
    this.redLight = new THREE.PointLight("#FF2A33", 0, 6, 2);
    this.scene.add(this.redLight);

    // ——— اللابتوب ———
    this.laptop = new Laptop(mob, this.theme, opts.lang);
    this.laptop.group.visible = false;
    this.scene.add(this.laptop.group);

    // ——— الشعار الزجاجي ———
    const shape = new THREE.Shape(LOGO_POINTS.map(([x, y]) => new THREE.Vector2(x - 104.5, -(y - 57))));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 26, bevelEnabled: true, bevelThickness: 7, bevelSize: 3.2, bevelSegments: 12, curveSegments: 8 });
    geo.center();
    geo.computeVertexNormals();
    this.logoMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1,
      thickness: 70, // بوحدات الشكل المحلية (يُضرب في مقياس النموذج 0.02)
      ior: 1.52, dispersion: mob ? 0 : 0.35,
      attenuationColor: new THREE.Color("#B0161F"), attenuationDistance: this.theme === "light" ? 0.95 : 1.25,
      clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1, envMapIntensity: 1.5,
    });
    this.logo = new THREE.Mesh(geo, this.logoMat);
    this.logo.scale.setScalar(0.02);
    this.spin.add(this.logo);
    this.group.add(this.spin);
    this.scene.add(this.group);

    this.cam.position.set(0, 0, 10);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    const delay = opts.introDelay ?? 0.2;
    if (this.reduced) { this.st.intro = 1; this.hero.lid = 108; this.hero.logo = 1; }
    else {
      gsap.to(this.st, { intro: 1, duration: 2.8, ease: "expo.out", delay });
      gsap.to(this.hero, { lid: 108, duration: 2.2, ease: "power3.inOut", delay: delay + 0.1 });
      gsap.to(this.hero, { logo: 1, duration: 2.4, ease: "expo.out", delay: delay + 1.1 });
    }
    this.loop();
  }

  private resize = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.cam.aspect = window.innerWidth / window.innerHeight;
    this.cam.updateProjectionMatrix();
    if (!this.running) this.renderer.render(this.scene, this.cam);
  };

  private onMove = (e: PointerEvent) => {
    this.st.px = (e.clientX / window.innerWidth) * 2 - 1;
    this.st.py = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.running) return;
    this.timer.update();
    const dt = Math.min(0.1, this.timer.getDelta());
    const t = this.timer.getElapsed();
    const { st, hero } = this;
    const idle = this.reduced ? 0 : 1;
    const mob = MOBILE();
    const halfW = 2.68 * this.cam.aspect;
    const M = this.mirror;

    // تقدّم التمرير يُخفَّف ليبدو المشهد ثقيلاً وسلساً
    hero.p += (hero.target - hero.p) * (this.reduced ? 1 : 0.085);

    // ——— اللابتوب ———
    const mix = hero.mix;
    const lap = this.laptop;
    lap.group.visible = mix > 0.002;
    let hx = 0, hy = 0, hz = 0, hs = 0;
    if (lap.group.visible) {
      const pose = heroPose(hero.p, mob, halfW);
      const drop = (1 - smooth(mix)) * 2.2;
      const introS = 0.9 + 0.1 * st.intro;
      lap.group.position.set(pose.x * M, pose.y - drop - (1 - st.intro) * 0.4, 0);
      lap.group.scale.setScalar(pose.s * introS);
      const ry = pose.ry * M + st.px * 0.16 * idle + Math.sin(t * 0.4) * 0.025 * idle;
      const rx = pose.rx + st.py * 0.05 * idle;
      lap.group.rotation.y += (ry - lap.group.rotation.y) * 0.08;
      lap.group.rotation.x += (rx - lap.group.rotation.x) * 0.08;
      lap.setLid(hero.lid);
      lap.update(dt, hero.p < 0.95, hero.lid > 70);
      lap.group.updateMatrixWorld();
      lap.anchor.getWorldPosition(this.tmp);
      hx = this.tmp.x; hy = this.tmp.y; hz = this.tmp.z;
      hs = 0.27 * pose.s;
      // يرتفع الشعار من لوحة المفاتيح في البداية، ويتحرر في نهاية التمرير
      const rise = 1 - hero.logo;
      hy -= rise * 0.55 * pose.s;
      hs *= 0.6 + 0.4 * hero.logo;
      const lift = smooth(clamp01((hero.p - 0.8) / 0.2));
      hx = lerp(hx, 0, lift);
      hy = lerp(hy, mob ? 0.6 : 0.35, lift);
      hz = lerp(hz, 0, lift);
      hs = lerp(hs, mob ? 0.4 : 0.55, lift);
      this.redLight.position.set(hx, hy + 0.05 * pose.s, hz - 0.1);
      this.redLight.intensity = (this.theme === "light" ? 2 : 3.2) * mix * hero.logo * (1 - lift) * (0.85 + 0.15 * Math.sin(t * 2.2));
    } else {
      this.redLight.intensity = 0;
    }

    // ——— الشعار ———
    const bx = st.x, by = st.y + Math.sin(t * 0.6) * 0.05 * idle, bs = st.s * (0.82 + 0.18 * st.intro);
    const gx = lerp(bx, hx, mix), gy = lerp(by, hy + Math.sin(t * 1.1) * 0.04 * idle * mix, mix), gs = lerp(bs, hs, mix);
    this.group.position.set(gx, gy, lerp(0, hz, mix));
    this.group.scale.setScalar(gs);
    const ry = -0.22 * M + (1 - st.intro) * -1.3 + st.px * 0.32 + Math.sin(t * 0.35) * 0.16 * idle + mix * Math.sin(t * 0.5) * 0.25 * idle;
    const rx = 0.08 + st.tilt + st.py * 0.12 + Math.cos(t * 0.3) * 0.05 * idle;
    this.spin.rotation.y += (ry - this.spin.rotation.y) * 0.06;
    this.spin.rotation.x += (rx - this.spin.rotation.x) * 0.06;

    // الجدار يتبع الشعار ويتحرك بعكس المؤشر فيتغير الانكسار
    const wx = lerp(bx, lap.group.position.x, mix), wy = lerp(by, lap.group.position.y + 1.2 * (lap.group.scale.x || 1), mix);
    this.wall.position.set(wx - st.px * 0.5, wy + st.py * 0.25, -2.6);
    this.wall.scale.setScalar(lerp(Math.max(0.55, bs), 1.25, mix));

    this.frame++;
    this.renderer.render(this.scene, this.cam);
  };

  private repaint = () => {
    const c = new THREE.Color(this.tone.r, this.tone.g, this.tone.b);
    paintWall(this.wallCtx, "#" + c.getHexString(), this.tone.glow, this.theme);
    this.wallTex.needsUpdate = true;
  };

  /** تقدّم تمرير البطل 0..1 */
  setHeroProgress(p: number) {
    this.hero.target = p;
    const scr = this.laptop.screen;
    if (p < 0.16) scr.resumeAuto();
    else scr.goto(p < 0.45 ? 0 : p < 0.72 ? 1 : 2, true);
  }

  nextScreen() { this.laptop.screen.next(); }

  setTheme(theme: Theme) {
    this.theme = theme;
    const bg = BG[theme];
    this.renderer.setClearColor(bg, 1);
    (this.scene.background as THREE.Color).set(bg);
    this.laptop.setTheme(theme);
    this.logoMat.attenuationDistance = theme === "light" ? 0.95 : 1.25;
    this.repaint();
    if (!this.running) this.renderer.render(this.scene, this.cam);
  }

  apply(cfg: StageCfg) {
    const mob = MOBILE();
    const place = (mob && cfg.m) || cfg.d;
    const target = { x: place.x * this.mirror, y: place.y, s: place.s, tilt: place.tilt ?? 0 };
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }

    if (cfg.hide) {
      this.hideTimer = setTimeout(() => { this.running = false; }, this.reduced ? 0 : 1400);
      return;
    }
    this.running = true;

    const light = new THREE.Color(cfg.light ?? BRAND_LIGHT);
    const glow = cfg.glow ?? 1;
    const mix = cfg.hero ? 1 : 0;
    if (this.reduced) {
      Object.assign(this.st, target);
      Object.assign(this.tone, { r: light.r, g: light.g, b: light.b, glow });
      this.hero.mix = mix;
      this.repaint();
      return;
    }
    gsap.to(this.st, { ...target, duration: 1.8, ease: "expo.inOut", overwrite: "auto" });
    gsap.to(this.hero, { mix, duration: cfg.hero ? 1.4 : 1.1, ease: "power3.inOut", overwrite: "auto" });
    let frame = 0;
    gsap.to(this.tone, {
      r: light.r, g: light.g, b: light.b, glow, duration: 1.2, ease: "power2.inOut", overwrite: true,
      onUpdate: () => { if (frame++ % 2 === 0) this.repaint(); },
      onComplete: this.repaint,
    });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onMove);
    this.logo.geometry.dispose();
    this.logoMat.dispose();
    this.wall.geometry.dispose();
    (this.wall.material as THREE.Material).dispose();
    this.wallTex.dispose();
    this.laptop.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
