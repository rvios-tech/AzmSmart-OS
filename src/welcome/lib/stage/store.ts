import type { GlassStage, StageCfg } from "./glass";

let stageRef: GlassStage | null = null;
let pending: StageCfg | null = null;
let heroP = 0;

/** جسر بين أقسام الصفحات والمسرح ثلاثي الأبعاد الثابت في الـ layout */
export const stage = {
  attach(s: GlassStage) { stageRef = s; if (pending) s.apply(pending); s.setHeroProgress(heroP); },
  detach() { stageRef = null; },
  apply(cfg: StageCfg) { pending = cfg; stageRef?.apply(cfg); },
  hero(p: number) { heroP = p; stageRef?.setHeroProgress(p); },
  nextScreen() { stageRef?.nextScreen(); },
};
