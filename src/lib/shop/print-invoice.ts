import type { Order, Store } from "@/lib/api/shop";
import { PAY_METHOD_LABEL } from "@/lib/shop/constants";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";

/** نصّ آمن داخل HTML — كل ما يكتبه العميل أو التاجر يمرّ من هنا */
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * فاتورة الطلب للطباعة: A4 للتاجر والعميل، أو إيصال حراري ٨٠ مم لطابعات نقاط البيع.
 * نافذة مستقلة بلا إطار اللوحة — تُطبع ثم تُغلق، ولا تحمّل شيئًا من خارجها سوى شعار المتجر.
 */
export function printInvoice(order: Order, store: Store, size: "a4" | "80mm" = "a4") {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return false;
  const money = (n: number) => esc(formatMoney(n, store.currency));
  const thermal = size === "80mm";
  const rows = order.items
    .map((i) => `<tr><td>${esc(i.name)}${i.variant ? `<small>${esc(i.variant)}</small>` : ""}</td><td class="n">${esc(formatNumber(i.qty))}</td>${thermal ? "" : `<td class="n">${money(i.price)}</td>`}<td class="n">${money(i.price * i.qty)}</td></tr>`)
    .join("");
  const logo = /^https:\/\//.test(store.logo || "") ? `<img class="logo" src="${esc(store.logo)}" alt="">` : "";
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(`فاتورة ${order.ref}`)}</title>
<style>
  @page { size: ${thermal ? "80mm auto" : "A4"}; margin: ${thermal ? "4mm" : "14mm"}; }
  * { box-sizing: border-box; }
  body { font-family: Tahoma, "Segoe UI", Arial, sans-serif; color: #111; margin: 0; font-size: ${thermal ? "11px" : "13px"}; }
  .wrap { max-width: ${thermal ? "72mm" : "100%"}; margin: 0 auto; }
  header { display: flex; ${thermal ? "flex-direction: column; text-align: center; align-items: center;" : "justify-content: space-between; align-items: flex-start;"} gap: 8px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 12px; }
  .logo { max-height: ${thermal ? "40px" : "56px"}; max-width: 160px; object-fit: contain; }
  h1 { font-size: ${thermal ? "15px" : "20px"}; margin: 0 0 4px; }
  .muted { color: #555; }
  .meta { ${thermal ? "" : "text-align: left;"} }
  .grid { display: ${thermal ? "block" : "grid"}; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .box { border: 1px solid #ddd; border-radius: 6px; padding: 8px 10px; ${thermal ? "margin-bottom: 8px;" : ""} }
  .box b { display: block; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: ${thermal ? "4px 2px" : "8px 6px"}; border-bottom: 1px solid #e5e5e5; text-align: right; vertical-align: top; }
  th { background: ${thermal ? "none" : "#f4f4f4"}; font-weight: 700; }
  td small { display: block; color: #666; }
  .n { text-align: left; white-space: nowrap; direction: ltr; }
  .totals { margin-top: 10px; margin-inline-start: auto; width: ${thermal ? "100%" : "300px"}; }
  .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
  .totals .t { border-top: 2px solid #111; font-weight: 700; font-size: 1.15em; margin-top: 4px; padding-top: 6px; }
  .disc { color: #15803d; }
  footer { margin-top: 18px; text-align: center; color: #666; font-size: 0.9em; }
  @media screen { body { background: #eee; padding: 20px; } .wrap { background: #fff; padding: ${thermal ? "10px" : "28px"}; box-shadow: 0 2px 12px #0002; } }
</style></head><body><div class="wrap">
<header>
  <div>${logo}<h1>${esc(store.name)}</h1><div class="muted">${esc([store.city, store.address].filter(Boolean).join(" — "))}</div>${store.whatsapp ? `<div class="muted" dir="ltr">+${esc(store.whatsapp)}</div>` : ""}</div>
  <div class="meta"><h1>فاتورة</h1><div>رقم الطلب: <b dir="ltr">${esc(order.ref)}</b></div><div class="muted">${esc(formatDateTime(order.createdAt))}</div></div>
</header>
<div class="grid">
  <div class="box"><b>العميل</b>${esc(order.custName || "—")}<br><span dir="ltr">${esc(order.custPhone)}</span>${order.custAddress ? `<br>${esc(order.custAddress)}` : ""}${order.zoneName ? `<br>المنطقة: ${esc(order.zoneName)}` : ""}</div>
  <div class="box"><b>الدفع</b>${esc(PAY_METHOD_LABEL[order.payMethod] ?? order.payMethod)}${order.payStatus === 3 ? " — مدفوع" : ""}${order.note ? `<br><span class="muted">ملاحظة: ${esc(order.note)}</span>` : ""}</div>
</div>
<table><thead><tr><th>المنتج</th><th class="n">الكمية</th>${thermal ? "" : '<th class="n">السعر</th>'}<th class="n">المجموع</th></tr></thead><tbody>${rows}</tbody></table>
<div class="totals">
  <div><span>المجموع</span><span class="n">${money(order.subtotal)}</span></div>
  <div><span>التوصيل</span><span class="n">${order.deliveryFee ? money(order.deliveryFee) : "مجاني"}</span></div>
  ${order.discount > 0 ? `<div class="disc"><span>الخصم${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</span><span class="n">−${money(order.discount)}</span></div>` : ""}
  <div class="t"><span>الإجمالي</span><span class="n">${money(order.total)}</span></div>
</div>
<footer>شكرًا لطلبك من ${esc(store.name)}</footer>
</div><script>window.onload=function(){setTimeout(function(){window.print()},250)};window.onafterprint=function(){window.close()}</script></body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
