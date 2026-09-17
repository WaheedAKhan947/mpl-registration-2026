import ManagementMember from "@/models/ManagementMember";

// Seed data migrated from the previous hardcoded MANAGEMENT / MANAGEMENT_UR
// constants that used to live in lib/siteData.js. Used once to backfill the
// collection the first time this runs against an empty database, so moving
// this section to the database doesn't lose the existing committee bios.
export const DEFAULT_MANAGEMENT = [
  {
    name: "Muhammad Hashim Khan",
    role: "Chairman MPL",
    roleUr: "چیئرمین ایم پی ایل",
    copy: "Leads the vision, strategy, and growth of MPL with discipline and professionalism, aiming to make it a symbol of excellence, unity, fair play, and pride for the people of Maneri.",
    copyUr:
      "نظم و ضبط اور پیشہ ورانہ مہارت کے ساتھ ایم پی ایل کے وژن، حکمتِ عملی، اور ترقی کی قیادت کرتے ہیں، تاکہ اسے مانیری کے لوگوں کے لیے عمدگی، اتحاد، فیئر پلے، اور فخر کی علامت بنایا جا سکے۔",
  },
  {
    name: "Shahzad Ali Shah",
    role: "⁠Pro-Chairman",
    roleUr: "پرو چیئرمین",
    copy: "Supports the Chairman, oversees league operations, and ensures successful tournament execution.",
    copyUr: "چیئرمین کی معاونت کرتے ہیں، لیگ کے آپریشنز کی نگرانی کرتے ہیں، اور ٹورنامنٹ کے کامیاب انعقاد کو یقینی بناتے ہیں۔",
  },
  {
    name: "Tanveer Jamal",
    role: "Director of Communications",
    roleUr: "ڈائریکٹر کمیونیکیشنز",
    copy: "Manages official communications, team coordination, public relations, and smooth information flow",
    copyUr: "سرکاری ابلاغ، ٹیم کوآرڈینیشن، تعلقاتِ عامہ، اور معلومات کی ہموار ترسیل کا انتظام کرتے ہیں۔",
  },
  {
    name: "Abdullah, Seyal Khan, Shamas Khan",
    role: "Operations & Events Management",
    roleUr: "آپریشنز اینڈ ایونٹس مینجمنٹ",
    copy: "Handles scheduling, ground arrangements, logistics, and team coordination.",
    copyUr: "شیڈولنگ، گراؤنڈ انتظامات، لاجسٹکس، اور ٹیم کوآرڈینیشن کو سنبھالتے ہیں۔",
  },
  {
    name: "Mir Azam Khan",
    role: "League Rules & Legal Advisor",
    roleUr: "لیگ رولز اینڈ لیگل ایڈوائزر",
    copy: "Ensures fair play, manages rules, resolves disputes, and provides legal guidance.",
    copyUr: "فیئر پلے کو یقینی بناتے ہیں، قواعد کا انتظام کرتے ہیں، تنازعات حل کرتے ہیں، اور قانونی رہنمائی فراہم کرتے ہیں۔",
  },
  {
    name: "M Shayan Khan, M Huzeefa, Junaid Banaras",
    role: "Media & Broadcasting",
    roleUr: "میڈیا اینڈ براڈکاسٹنگ",
    copy: "Manages live coverage, highlights, photography, and digital media content.",
    copyUr: "لائیو کوریج، جھلکیاں، فوٹوگرافی، اور ڈیجیٹل میڈیا کا مواد سنبھالتے ہیں۔",
  },
  {
    name: "Adil Khan",
    role: "Finance Manager",
    roleUr: "فنانس منیجر",
    copy: "Handles budgeting, expenses, prize distribution, and transparent financial management.",
    copyUr: "بجٹ سازی، اخراجات، انعامات کی تقسیم، اور شفاف مالی انتظام کو سنبھالتے ہیں۔",
  },
];

let seedPromise = null;

// Backfills the ManagementMember collection with the legacy hardcoded roster
// the first time it's empty. Safe to call on every request -- it's a no-op
// once the collection has any documents (including ones an admin created).
export function ensureManagementSeeded() {
  if (!seedPromise) {
    seedPromise = ManagementMember.countDocuments()
      .then((count) => {
        if (count > 0) return;
        return ManagementMember.insertMany(
          DEFAULT_MANAGEMENT.map((member, index) => ({ ...member, order: index }))
        );
      })
      .catch((error) => {
        // Let the next call retry instead of caching a failure forever.
        seedPromise = null;
        throw error;
      });
  }
  return seedPromise;
}
