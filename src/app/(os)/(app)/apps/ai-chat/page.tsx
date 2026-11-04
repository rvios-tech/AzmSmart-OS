import { redirect } from "next/navigation";

/** صفحة القالب صارت المساعد الحقيقي — RVIOS AI على /ai */
export default function AiChatRedirect() {
  redirect("/ai");
}
