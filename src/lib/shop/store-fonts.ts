/**
 * خطوط «شكل المتجر» — المعرّفات نفسها في منصة المتاجر (`lib/store/fonts.ts`) حيث تُحمَّل.
 * الخط الرئيسي للعناوين، والثانوي لبقية النصوص.
 */
export const DISPLAY_FONTS = [
  { id: "foda", name: "فودا" },
  { id: "hacen", name: "هاكن سمراء" },
  { id: "palestine", name: "فلسطين" },
  { id: "medad", name: "مداد" },
  { id: "milan", name: "ميلان" },
  { id: "maghfira", name: "مغفرة" },
  { id: "typocar", name: "تايبوكار" },
  { id: "cortoba", name: "قرطبة" },
  { id: "zain", name: "زين" },
  { id: "thmanyah", name: "ثمانية" },
  { id: "cairo", name: "القاهرة" },
  { id: "tajawal", name: "تجوّل" },
  { id: "kufi", name: "نوتو كوفي" },
];

export const BODY_FONTS = [
  { id: "zain", name: "زين" },
  { id: "thmanyah", name: "ثمانية" },
  { id: "cairo", name: "القاهرة" },
  { id: "tajawal", name: "تجوّل" },
  { id: "plex", name: "آي بي إم بلكس" },
  { id: "almarai", name: "المراعي" },
  { id: "kufi", name: "نوتو كوفي" },
];

/** حسابات التواصل بترتيب عرضها في المتجر */
export const SOCIAL_NETWORKS = [
  { key: "instagram", label: "إنستغرام", hint: "اسم المستخدم أو الرابط" },
  { key: "tiktok", label: "تيك توك", hint: "اسم المستخدم أو الرابط" },
  { key: "snapchat", label: "سناب شات", hint: "اسم المستخدم أو الرابط" },
  { key: "x", label: "إكس (تويتر)", hint: "اسم المستخدم أو الرابط" },
  { key: "facebook", label: "فيسبوك", hint: "اسم الصفحة أو الرابط" },
  { key: "youtube", label: "يوتيوب", hint: "اسم القناة أو الرابط" },
  { key: "telegram", label: "تيليغرام", hint: "اسم القناة أو الرابط" },
  { key: "whatsapp", label: "واتساب", hint: "الرقم مع رمز الدولة" },
] as const;

export const SOCIAL_PLACEMENTS = [
  { id: "info", label: "قسم «تابعنا» في المتجر" },
  { id: "footer", label: "أسفل المتجر" },
  { id: "both", label: "الاثنان" },
] as const;
