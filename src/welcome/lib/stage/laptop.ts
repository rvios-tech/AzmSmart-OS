import * as THREE from "three";
import { ScreenUI, type Lang, type Theme } from "./screen";

/** أبعاد اللابتوب بوحدات المشهد */
const W = 4.2, D = 2.9, T = 0.11, LH = 2.72;

function rounded(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** ظل ناعم تحت اللابتوب */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, "rgba(0,0,0,0.55)");
  gr.addColorStop(0.45, "rgba(0,0,0,0.25)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const THEMES = {
  dark: { shell: "#1C1B1B", keys: "#0F0E0E", pad: "#262424", glow: 0.9, shadow: 0.9 },
  light: { shell: "#BDB9B1", keys: "#1B1A1A", pad: "#B3AFA7", glow: 0.55, shadow: 0.45 },
};

type Key = { x: number; z: number; w: number; d: number; press: number };

/**
 * لابتوب إجرائي بالكامل: هيكل ألمنيوم مشطوف، لوحة مفاتيح بإضاءة خلفية حمراء،
 * لوحة لمس، وغطاء يُفتح بمفصل حقيقي تعرض شاشته واجهات RVIOS الحية.
 */
export class Laptop {
  readonly group = new THREE.Group();
  readonly lid = new THREE.Group();
  /** النقطة فوق لوحة المفاتيح التي يطفو عندها الشعار */
  readonly anchor = new THREE.Object3D();
  readonly screen: ScreenUI;
  private shellMat: THREE.MeshPhysicalMaterial;
  private keyMat: THREE.MeshStandardMaterial;
  private padMat: THREE.MeshPhysicalMaterial;
  private glowMat: THREE.MeshBasicMaterial;
  private shadowMat: THREE.MeshBasicMaterial;
  private keysMesh: THREE.InstancedMesh;
  private keys: Key[] = [];
  private dummy = new THREE.Object3D();
  private typeClock = 0;
  private disposables: { dispose(): void }[] = [];

  constructor(small: boolean, theme: Theme, lang: Lang) {
    this.screen = new ScreenUI(small);
    this.screen.theme = theme;
    this.screen.lang = lang;
    const th = THEMES[theme];

    this.shellMat = new THREE.MeshPhysicalMaterial({ color: th.shell, metalness: 0.8, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.9 });
    this.keyMat = new THREE.MeshStandardMaterial({ color: th.keys, roughness: 0.62, metalness: 0.1 });
    this.padMat = new THREE.MeshPhysicalMaterial({ color: th.pad, metalness: 0.5, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.6, envMapIntensity: 0.8 });
    this.glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#C0141C").multiplyScalar(th.glow), toneMapped: false });

    // ——— القاعدة ———
    const baseGeo = new THREE.ExtrudeGeometry(rounded(W, D, 0.2), { depth: T - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.022, bevelSegments: 5, curveSegments: 10 });
    baseGeo.rotateX(-Math.PI / 2);
    baseGeo.translate(0, 0.02, 0);
    const base = new THREE.Mesh(baseGeo, this.shellMat);
    this.group.add(base);

    // تجويف لوحة المفاتيح مع توهج أحمر يظهر بين المفاتيح
    const u = 3.72 / 14.5, gap = 0.042;
    const rows: number[][] = [
      Array(14).fill(14.5 / 14),
      [...Array(13).fill(1), 1.5],
      [1.5, ...Array(12).fill(1), 1],
      [1.75, ...Array(11).fill(1), 1.75],
      [2.25, ...Array(10).fill(1), 2.25],
      [1, 1, 1, 1.25, 5, 1.25, 1, 1, 1, 1],
    ];
    const kbTop = -D / 2 + 0.24;
    let z = kbTop;
    rows.forEach((row, r) => {
      const depth = (r === 0 ? 0.6 : 1) * u;
      let x = -(14.5 * u) / 2;
      row.forEach((units) => {
        const w = units * u;
        this.keys.push({ x: x + w / 2, z: z + depth / 2, w: w - gap, d: depth - gap, press: 0 });
        x += w;
      });
      z += depth;
    });
    const kbDepth = z - kbTop;
    const well = new THREE.Mesh(new THREE.ShapeGeometry(rounded(14.5 * u + 0.06, kbDepth + 0.06, 0.05)), this.glowMat);
    well.rotation.x = -Math.PI / 2;
    well.position.set(0, T + 0.0015, kbTop + kbDepth / 2);
    this.group.add(well);

    const keyGeo = new THREE.BoxGeometry(1, 1, 1);
    this.keysMesh = new THREE.InstancedMesh(keyGeo, this.keyMat, this.keys.length);
    this.group.add(this.keysMesh);
    this.layoutKeys();

    // لوحة اللمس
    const padZ = z + (D / 2 - z) / 2 - 0.02;
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(rounded(1.6, 0.98, 0.07)), this.padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, T + 0.002, padZ);
    this.group.add(pad);

    // ——— الغطاء والشاشة ———
    this.lid.position.set(0, T - 0.005, -D / 2 + 0.05);
    const lidGeo = new THREE.ExtrudeGeometry(rounded(W, LH, 0.2), { depth: 0.035, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.018, bevelSegments: 4, curveSegments: 10 });
    lidGeo.translate(0, LH / 2, -0.035 - 0.014);
    const lidMesh = new THREE.Mesh(lidGeo, this.shellMat);
    this.lid.add(lidMesh);

    const bezel = new THREE.Mesh(
      new THREE.ShapeGeometry(rounded(W - 0.05, LH - 0.05, 0.18)),
      new THREE.MeshPhysicalMaterial({ color: "#050505", roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    );
    bezel.position.set(0, LH / 2, 0.002);
    this.lid.add(bezel);

    const sw = 3.94, sh = sw / 1.6;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: this.screen.texture, toneMapped: false }));
    scr.position.set(0, 0.13 + sh / 2, 0.004);
    this.lid.add(scr);

    const cam = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: "#1d2a33" }));
    cam.position.set(0, LH - 0.065, 0.0045);
    this.lid.add(cam);

    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, W * 0.78, 24), new THREE.MeshStandardMaterial({ color: "#161515", metalness: 0.7, roughness: 0.4 }));
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, T - 0.01, -D / 2 + 0.05);
    this.group.add(hinge);
    this.group.add(this.lid);

    // ظل أرضي
    this.shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: th.shadow, toneMapped: false });
    const sh2 = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, D * 1.9), this.shadowMat);
    sh2.rotation.x = -Math.PI / 2;
    sh2.position.y = -0.005;
    sh2.renderOrder = -1;
    this.group.add(sh2);

    this.anchor.position.set(0, T + 0.5, 0.02);
    this.group.add(this.anchor);

    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) this.disposables.push(m.geometry);
    });
    this.setLid(4);
  }

  private layoutKeys() {
    const d = this.dummy;
    this.keys.forEach((k, i) => {
      const h = 0.028;
      d.position.set(k.x, T + h / 2 + 0.004 - k.press * 0.012, k.z);
      d.scale.set(k.w, h, k.d);
      d.updateMatrix();
      this.keysMesh.setMatrixAt(i, d.matrix);
    });
    this.keysMesh.instanceMatrix.needsUpdate = true;
  }

  /** زاوية فتح الغطاء بالدرجات (0 مغلق، 90 عمودي) */
  setLid(deg: number) {
    this.lid.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(deg);
  }

  setTheme(theme: Theme) {
    const th = THEMES[theme];
    this.shellMat.color.set(th.shell);
    this.keyMat.color.set(th.keys);
    this.padMat.color.set(th.pad);
    this.glowMat.color.set("#C0141C").multiplyScalar(th.glow);
    this.shadowMat.opacity = th.shadow;
    this.screen.theme = theme;
  }

  /** كتابة تلقائية: مفاتيح تُضغط عشوائياً وكأن أحداً يعمل على الجهاز */
  update(dt: number, typing: boolean, screenOn: boolean) {
    if (screenOn) this.screen.update(dt);
    this.typeClock += dt;
    let dirty = false;
    if (typing && this.typeClock > 0.075) {
      this.typeClock = 0;
      if (Math.random() < 0.8) {
        const k = this.keys[6 + Math.floor(Math.random() * (this.keys.length - 16))];
        k.press = 1;
      }
    }
    for (const k of this.keys) {
      if (k.press > 0) { k.press = Math.max(0, k.press - dt * 7); dirty = true; }
    }
    if (dirty) this.layoutKeys();
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    [this.shellMat, this.keyMat, this.padMat, this.glowMat, this.shadowMat].forEach((m) => m.dispose());
    this.shadowMat.map?.dispose();
    this.screen.dispose();
  }
}
