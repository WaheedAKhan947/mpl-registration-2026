export const IMG_BASE =
  "https://mpl.unaux.com/wp-content/themes/cricket-club-league/assets/images";

export const VILLAGES = ["Maneri Payan", "Maneri Bala"];

export const TEAMS = [
  "Any Team",
  "Maneri Eleven",
  "Maneri Baturan",
  "Maneri Strikers",
  "Maneri Kings",
  "Maneri Markhor",
  "Maneri Azmari",
];

// The real franchises players can be drafted onto, i.e. TEAMS minus the
// "Any Team" placeholder option used at registration.
export const ROSTER_TEAMS = TEAMS.slice(1);

export const ROLES = ["Batsman", "Bowler", "All-rounder", "Wicket Keeper"];

export const BATTING_STYLES = ["Right-hand Bat", "Left-hand Bat"];

export const BOWLING_STYLES = [
  "Right-arm Fast",
  "Left-arm Fast",
  "Right-arm Spin",
  "Left-arm Spin",
  "Not a Bowler",
];

export const TEAM_CARDS = [
  { code: "/Maneri_XI.png", name: "Maneri Eleven", copy: "Sharp, balanced, and built for pressure." },
  { code: "/Maneri_batoor.png", name: "Maneri Baturan", copy: "Powerful identity with fearless cricket." },
  { code: "/Maneri_Strickers.png", name: "Maneri Strikers", copy: "Attack-minded players with a high-tempo." },
  { code: "/Maneri_Kings.png", name: "Maneri Kings", copy: "Commanding presence and ambition." },
  { code: "/Maneri_Markhor.png", name: "Maneri Markhor", copy: "Resilient cricket with a proud local edge." },
  { code: "/Maneri_Azmari.png", name: "Maneri Azmari", copy: "Competitive spirit with disciplined." },
];

// Urdu blurbs for the team cards above, keyed by the (untranslated) team
// name -- team/franchise names stay in Roman script since they're brand
// names, not ordinary vocabulary.
const TEAM_CARD_COPY_UR = {
  "Maneri Eleven": "تیز، متوازن، اور دباؤ میں کارآمد۔",
  "Maneri Baturan": "بے خوف کرکٹ کے ساتھ طاقتور شناخت۔",
  "Maneri Strikers": "جارحانہ سوچ اور تیز رفتار کھلاڑی۔",
  "Maneri Kings": "دبنگ موجودگی اور بلند حوصلے۔",
  "Maneri Markhor": "ثابت قدم کرکٹ اور مقامی فخر کا جذبہ۔",
  "Maneri Azmari": "نظم و ضبط کے ساتھ مسابقتی جذبہ۔",
};

// Same list of teams, with the display copy swapped for Urdu when needed.
// `name`/`code` are left untouched so team matching elsewhere (points
// table, roster lookups, match logos) keeps working off the English name.
export function getTeamCards(lang) {
  if (lang !== "ur") return TEAM_CARDS;
  return TEAM_CARDS.map((team) => ({ ...team, copy: TEAM_CARD_COPY_UR[team.name] || team.copy }));
}

// Management committee members now live in MongoDB (see models/ManagementMember.js,
// managed from the admin dashboard) instead of a hardcoded list here. The old
// seed content moved to lib/management.js as DEFAULT_MANAGEMENT, used to
// backfill the collection the first time it's empty. The public homepage
// section fetches the roster from GET /api/management.

export const REGISTRATION_FIELDS = [
  { name: "playerName", label: "Player Name", type: "text", required: true, autoComplete: "name", trim: true },
  { name: "fatherName", label: "Father Name", type: "text", required: true, trim: true },
  { name: "age", label: "Age", type: "number", required: true, min: 12, max: 60, trim: true },
  { name: "phone", label: "Phone Number", type: "text", required: true, inputMode: "tel", autoComplete: "tel", trim: true },
  { name: "cnicNumber", label: "CNIC Number", type: "text", required: true, inputMode: "numeric", placeholder: "Example: 12345-1234567-1", trim: true },
  { name: "area", label: "Village / Area", type: "select", required: true, options: VILLAGES, placeholder: "Select village" },
  // Preferred team option disabled on the registration form. The API defaults
  // preferredTeam to "Any Team" for new submissions, so downstream admin
  // views (which still read/display this field) keep working unchanged.
  // { name: "preferredTeam", label: "Preferred Team", type: "select", required: true, options: TEAMS, placeholder: "Select team" },
  { name: "playingRole", label: "Playing Role", type: "select", required: true, options: ROLES, placeholder: "Select role" },
  { name: "battingStyle", label: "Batting Style", type: "select", required: true, options: BATTING_STYLES, placeholder: "Select batting style" },
  { name: "bowlingStyle", label: "Bowling Style", type: "select", required: true, options: BOWLING_STYLES, placeholder: "Select bowling style" },
  { name: "cricProId", label: "CricPro ID", type: "text", required: true, placeholder: "Example: CP123456", trim: true },
  // { name: "notes", label: "Notes", type: "textarea", required: true, placeholder: "Add any extra information for MPL management", trim: true, full: true },
  { name: "profilePicture", label: "Profile Picture", type: "file", required: true, accept: "image/*", help: "Upload a clear player photo." },
  { name: "cnicImage", label: "CNIC Image", type: "file", required: true, accept: "image/*,.pdf", help: "Upload CNIC front image or PDF." },
  // `help` is overridden at render time in RegistrationForm.js with the live fee amount from admin settings.
  { name: "feeReceipt", label: "Fee Submission Receipt", type: "file", required: true, accept: "image/*,.pdf", help: "Upload payment receipt screenshot, image, or PDF.", helpVariant: "danger", full: true },
];

export const MFC_POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward / Striker"];

export const MFC_PREFERRED_FOOT = ["Right", "Left", "Both"];

export const MFC_JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const MFC_REGISTRATION_FIELDS = [
  { name: "fullName", label: "Full Name", type: "text", required: true, autoComplete: "name", trim: true },
  { name: "fatherName", label: "Father's Name", type: "text", required: true, trim: true },
  { name: "dob", label: "Date of Birth", type: "date", required: true },
  { name: "cnicNumber", label: "CNIC / B-Form Number", type: "text", required: true, inputMode: "numeric", placeholder: "Example: 12345-1234567-1", trim: true },
  { name: "phone", label: "Mobile / WhatsApp Number", type: "text", required: true, inputMode: "tel", autoComplete: "tel", trim: true },
  { name: "email", label: "Email Address", type: "email", required: false, autoComplete: "email", trim: true, help: "Optional" },
  { name: "village", label: "Village / Area", type: "text", required: true, trim: true },
  { name: "tehsil", label: "Tehsil", type: "text", required: true, trim: true },
  { name: "district", label: "District", type: "text", required: true, trim: true },
  { name: "position", label: "Preferred Playing Position", type: "select", required: true, options: MFC_POSITIONS, placeholder: "Select position" },
  { name: "preferredFoot", label: "Preferred Foot", type: "select", required: true, options: MFC_PREFERRED_FOOT, placeholder: "Select preferred foot" },
  { name: "previousClub", label: "Previous Club / Team", type: "text", required: false, trim: true, help: "Optional" },
  { name: "experience", label: "Football Experience", type: "textarea", required: false, placeholder: "Years of experience, level played, etc.", trim: true, help: "Optional" },
  { name: "previousTournaments", label: "Previous Tournaments Played", type: "textarea", required: false, trim: true, help: "Optional" },
  { name: "height", label: "Height", type: "text", required: false, placeholder: "Example: 5'8\"", trim: true, help: "Optional" },
  { name: "jerseySize", label: "Jersey Size", type: "select", required: true, options: MFC_JERSEY_SIZES, placeholder: "Select jersey size" },
  { name: "jerseyNumber", label: "Preferred Jersey Number", type: "text", required: false, inputMode: "numeric", trim: true, help: "Optional, subject to availability" },
  { name: "photo", label: "Passport-Size Photo", type: "file", required: true, accept: "image/*", help: "Upload a recent passport-size photo." },
  { name: "cnicImage", label: "CNIC / B-Form Copy", type: "file", required: true, accept: "image/*,.pdf", help: "Upload CNIC or B-Form image or PDF.", full: true },
];

// ---------------------------------------------------------------------------
// Urdu display text for the registration forms.
//
// Only the *display* text is translated -- the values a <select> actually
// submits (village, team, role, batting/bowling style, position, foot)
// stay as the original English strings, because they're stored as-is in
// MongoDB and matched elsewhere (admin filters, points table, team roster
// lookups, exports) by that exact English string. Translating the stored
// value would silently split each option into two different values
// depending on which language a player registered in.
// ---------------------------------------------------------------------------

const OPTION_LABELS_UR = {
  "Any Team": "کوئی بھی ٹیم",
  Batsman: "بلے باز",
  Bowler: "باؤلر",
  "All-rounder": "آل راؤنڈر",
  "Wicket Keeper": "وکٹ کیپر",
  "Right-hand Bat": "دائیں ہاتھ کا بلے باز",
  "Left-hand Bat": "بائیں ہاتھ کا بلے باز",
  "Right-arm Fast": "دائیں ہاتھ فاسٹ باؤلر",
  "Left-arm Fast": "بائیں ہاتھ فاسٹ باؤلر",
  "Right-arm Spin": "دائیں ہاتھ اسپن باؤلر",
  "Left-arm Spin": "بائیں ہاتھ اسپن باؤلر",
  "Not a Bowler": "باؤلر نہیں",
  "Maneri Payan": "مانیری پایاں",
  "Maneri Bala": "مانیری بالا",
  Goalkeeper: "گول کیپر",
  Defender: "ڈیفینڈر",
  Midfielder: "مڈفیلڈر",
  "Forward / Striker": "فارورڈ / اسٹرائیکر",
  Right: "دایاں",
  Left: "بایاں",
  Both: "دونوں",
};

function localizeOptions(options, lang) {
  return options.map((value) => ({
    value,
    label: lang === "ur" ? OPTION_LABELS_UR[value] || value : value,
  }));
}

const REGISTRATION_FIELD_TEXT_UR = {
  playerName: { label: "کھلاڑی کا نام" },
  fatherName: { label: "والد کا نام" },
  age: { label: "عمر" },
  phone: { label: "فون نمبر" },
  cnicNumber: { label: "شناختی کارڈ نمبر" },
  area: { label: "گاؤں / علاقہ", placeholder: "گاؤں منتخب کریں" },
  preferredTeam: { label: "پسندیدہ ٹیم", placeholder: "ٹیم منتخب کریں" },
  playingRole: { label: "کھیلنے کا کردار", placeholder: "کردار منتخب کریں" },
  battingStyle: { label: "بیٹنگ اسٹائل", placeholder: "بیٹنگ اسٹائل منتخب کریں" },
  bowlingStyle: { label: "باؤلنگ اسٹائل", placeholder: "باؤلنگ اسٹائل منتخب کریں" },
  cricProId: { label: "کرک پرو آئی ڈی" },
  profilePicture: { label: "پروفائل تصویر", help: "کھلاڑی کی واضح تصویر اپ لوڈ کریں۔" },
  cnicImage: { label: "شناختی کارڈ کی تصویر", help: "شناختی کارڈ کا اگلا حصہ تصویر یا PDF اپ لوڈ کریں۔" },
  feeReceipt: { label: "فیس جمع کرانے کی رسید" },
};

const MFC_REGISTRATION_FIELD_TEXT_UR = {
  fullName: { label: "مکمل نام" },
  fatherName: { label: "والد کا نام" },
  dob: { label: "تاریخ پیدائش" },
  cnicNumber: { label: "شناختی کارڈ / بی فارم نمبر" },
  phone: { label: "موبائل / واٹس ایپ نمبر" },
  email: { label: "ای میل ایڈریس", help: "اختیاری" },
  village: { label: "گاؤں / علاقہ" },
  tehsil: { label: "تحصیل" },
  district: { label: "ضلع" },
  position: { label: "پسندیدہ کھیلنے کی پوزیشن", placeholder: "پوزیشن منتخب کریں" },
  preferredFoot: { label: "پسندیدہ پاؤں", placeholder: "پسندیدہ پاؤں منتخب کریں" },
  previousClub: { label: "سابقہ کلب / ٹیم", help: "اختیاری" },
  experience: { label: "فٹبال کا تجربہ", placeholder: "تجربے کے سال، کھیلنے کی سطح، وغیرہ", help: "اختیاری" },
  previousTournaments: { label: "سابقہ کھیلے گئے ٹورنامنٹس", help: "اختیاری" },
  height: { label: "قد", help: "اختیاری" },
  jerseySize: { label: "جرسی سائز", placeholder: "جرسی سائز منتخب کریں" },
  jerseyNumber: { label: "پسندیدہ جرسی نمبر", help: "اختیاری، دستیابی سے مشروط" },
  photo: { label: "پاسپورٹ سائز تصویر", help: "حالیہ پاسپورٹ سائز تصویر اپ لوڈ کریں۔" },
  cnicImage: { label: "شناختی کارڈ / بی فارم کی کاپی", help: "شناختی کارڈ یا بی فارم کی تصویر یا PDF اپ لوڈ کریں۔" },
};

function localizeFields(fields, textMap, lang) {
  return fields.map((field) => {
    const options = field.options ? localizeOptions(field.options, lang) : undefined;
    if (lang !== "ur") return options ? { ...field, options } : field;
    const overrides = textMap[field.name] || {};
    return {
      ...field,
      ...overrides,
      ...(options ? { options } : {}),
    };
  });
}

export function getRegistrationFields(lang) {
  return localizeFields(REGISTRATION_FIELDS, REGISTRATION_FIELD_TEXT_UR, lang);
}

export function getMfcRegistrationFields(lang) {
  return localizeFields(MFC_REGISTRATION_FIELDS, MFC_REGISTRATION_FIELD_TEXT_UR, lang);
}
