export const TERMS_META = {
  title: "Official Playing Conditions & Tournament Regulations",
  issuedBy: "Issued by MPL Governing Committee",
  intro:
    "All teams, owners, coaches, players, and officials participating in MPL 2026 shall be bound by the following Playing Conditions and Regulations.",
};

export const TERMS_ARTICLES = [
  {
    heading: "Article 1 – Team Composition",
    points: [
      "1.1 Each team shall register exactly 13 players and 1 coach.",
      "1.2 Only registered players shall be eligible to participate.",
    ],
    penalty: ["Unregistered player → Match forfeiture + 2 penalty points"],
  },
  {
    heading: "Article 2 – Player Movement",
    points: ["2.1 No player exchange or transfer between teams shall be allowed after final squad submission."],
    penalty: ["Player disqualification", "Team deduction of 2 points"],
  },
  {
    heading: "Article 3 – Fielding Restrictions",
    points: ["3.1 A minimum of 4 fielders must remain inside the fielding circle at all times."],
    penalty: ["Umpire warning", "Repeated breach → 5 penalty runs"],
  },
  {
    heading: "Article 4 – Bowling Conditions",
    points: [
      "4.1 A bowler may bowl a maximum of 3 overs.",
      "4.2 Each team must use a minimum of 5 bowlers in an innings.",
    ],
    penalty: ["Illegal over declared dead", "Opponent awarded 5 runs"],
  },
  {
    heading: "Article 5 – Ball Regulations",
    points: ["5.1 Only cricket balls measuring 72 mm or below shall be used."],
    penalty: ["Immediate replacement", "Fine of Rs. 3,000"],
  },
  {
    heading: "Article 6 – Byes & Leg-Byes",
    points: ["6.1 Byes and leg-byes shall be counted as valid runs."],
  },
  {
    heading: "Article 7 – Ownership & Franchise Regulations",
    points: [
      "7.1 Team ownership shall remain valid for 2 years.",
      "7.2 Team names may not be changed during the contract period.",
    ],
    penalty: ["Fine of Rs. 50,000", "Suspension of owner voting rights"],
  },
  {
    heading: "Article 8 – Player Conduct",
    points: ["8.1 Misbehavior, abuse, fighting, and misconduct are prohibited."],
    levels: [
      { level: "Level 1 Offence", desc: "Minor disagreement / unsporting conduct", penalty: "Rs. 1,000" },
      { level: "Level 2 Offence", desc: "Abusive language / repeated misconduct", penalty: "Rs. 2,000 + next match ban" },
      { level: "Level 3 Offence", desc: "Fighting / serious misconduct", penalty: "Committee review + suspension" },
    ],
  },
  {
    heading: "Article 9 – Umpire Authority",
    points: ["9.1 The umpire's decision shall be final."],
    penalty: ["First breach → Warning", "Second breach → Rs. 1,000 fine"],
  },
  {
    heading: "Article 10 – Match Timing",
    points: ["10.1 Teams must report 10 minutes before match start."],
    penalty: ["Delay exceeding 15 minutes → Deduction of 2 batting overs"],
  },
  {
    heading: "Article 11 – Dress & Equipment",
    points: ["11.1 Official team uniform and proper shoes are compulsory."],
    penalty: ["Player not permitted until compliance"],
  },
  {
    heading: "Article 12 – Captain Responsibilities",
    points: [
      "12.1 Only captains may officially communicate with umpires.",
      "12.2 Captains remain responsible for team discipline.",
    ],
    penalty: ["Captain fined Rs. 1,000"],
  },
  {
    heading: "Article 13 – Substitute Fielders",
    points: ["13.1 Substitutes shall only be permitted for injuries.", "13.2 Substitute players cannot bat or bowl."],
    penalty: ["Opponent awarded 5 penalty runs."],
  },
  {
    heading: "Article 14 – Interrupted Matches",
    points: [
      "14.1 If Power-play is completed in the second innings, the match may be decided using the DLS Method.",
      "14.2 If the match cannot be completed due to weather, power failure, or any unavoidable circumstances, the MPL Governing Committee shall have the authority to determine the result.",
    ],
    subList: {
      intro: "The Committee may:",
      items: ["Order the match to be replayed.", "Apply the DLS Method.", "Declare the match a Draw."],
    },
    note: "The decision of the MPL Governing Committee shall be final and binding.",
  },
  {
    heading: "Article 15 – Anti-Corruption Code",
    points: ["15.1 Match fixing, cheating, fake injury, or manipulation is strictly prohibited."],
    penalty: ["Immediate suspension", "Possible lifetime ban"],
  },
  {
    heading: "Article 16 – MPL Name & Brand Protection",
    points: [
      "16.1 No person or group may use the official Maneri Premier League (MPL) name, branding, or identity without approval.",
    ],
    penalty: ["Administrative action", "Legal action where applicable"],
  },
  {
    heading: "Article 17 – Medical & Ball Tampering",
    points: [
      "17.1 Treatment shall only be used for genuine injury.",
      "17.2 Any unfair use affecting bowling performance shall be treated as ball tampering.",
    ],
    penalty: ["5 runs awarded + disciplinary review"],
  },
  {
    heading: "Article 18 – Ownership Exit Policy",
    points: ["18.1 Owners leaving during the agreement period shall pay exit compensation."],
    penalty: ["Rs. 50,000"],
  },
  {
    heading: "Article 19 – Entry Fee & Security",
    points: [
      "19.1 Participation Fee (Season 2): Rs. 50,000",
      "19.2 Security Deposit: Rs. 10,000",
      "19.3 Payment deadline: Before September 2026",
    ],
    penalty: ["Team participation suspended until payment"],
  },
  {
    heading: "Article 20 – Points System",
    points: ["Win → 2 Points", "Tie / No Result → 1 Point", "Loss → 0 Points"],
    subList: {
      intro: "League Position Order:",
      items: ["Total Points", "Net Run Rate (NRR)", "Head-to-Head Result", "Fair Play Record"],
    },
  },
  {
    heading: "Article 21 – Impact Player Rule",
    points: [
      "21.1 The Impact Player shall not be permitted to field at the start of the match and may only enter the field in accordance with MPL playing conditions.",
    ],
    penalty: ["Opponent awarded 5 penalty runs."],
  },
  {
    heading: "Article 22 – Post-Match Ceremony Attendance",
    points: [
      "22.1 All registered players and team officials must remain present for the official post-match presentation and prize ceremony.",
    ],
    penalty: ["Team fined Rs. 1,000."],
  },
  {
    heading: "Article 23 – Team Kit Change",
    points: [
      "23.1 Once the tournament-approved team kit has been finalized, no team shall change its playing kit without prior approval from the MPL Governing Committee.",
    ],
    penalty: ["Opponent awarded 5 penalty runs."],
  },
  {
    heading: "Article 24 – Review (DRS) Procedure",
    points: [
      "24.1 Any review request must be made only by the striker batsman within the prescribed time limit. If any player, coach, support staff member, or any other person interferes with, advises, or influences the review decision before it is requested, the review shall be cancelled immediately.",
    ],
    penalty: ["Review lost and considered used."],
  },
  {
    heading: "Article 25 – Player Eligibility (Maneri Residency)",
    points: [
      "25.1 All registered players must belong to Maneri and shall provide a valid CNIC as proof of eligibility and residency.",
    ],
    penalty: ["Player disqualification.", "Team deduction of 2 points.", "Match forfeiture if an ineligible player participates."],
  },
  {
    heading: "Article 26 – Retention Player Rule",
    points: [
      "26.1 Each franchise may retain only one (1) player before the draft. New players are not eligible for retention and must enter the player draft.",
      "26.2 The retained player may be designated as the Team Captain or Franchise Player.",
      "26.3 No team shall retain more than one player under any circumstances.",
    ],
    penalty: ["Additional retained player(s) shall be declared ineligible.", "Team deduction of 2 points."],
  },
  {
    heading: "Article 27 – Review & Crease Position",
    points: [
      "27.1 For any review involving a run-out, stumping, or dismissal where the batsman's crease position is under consideration, the third umpire shall determine the decision based on the available footage.",
      "27.2 If the reviewed footage confirms that the batsman was outside his crease at the moment the wicket was fairly put down, the batsman shall not be considered Not Out.",
    ],
    penalty: ["Original decision shall stand or be changed to Out, as applicable."],
  },
  {
    heading: "Article 28 – Leaving the Ground During Match",
    points: [
      "28.1 No team shall leave the playing venue or refuse to continue play after the commencement of a match without approval from the MPL Governing Committee or Match Officials.",
    ],
    penalty: [
      "Match forfeiture.",
      "Fine of Rs. 10,000.",
      "Fine must be paid before the team's next scheduled match.",
      "Failure to pay may result in suspension from participation until payment is made.",
    ],
  },
  {
    heading: "Article 29 – Match Ball Custody During Reviews",
    points: [
      "29.1 Whenever a review is requested by the batting side or fielding side, the match ball must immediately be handed to the on-field umpire.",
      "29.2 No player shall carry, alter, clean, or handle the ball during the review process unless instructed by the umpire.",
    ],
    penalty: ["First breach → Official warning.", "Repeated breach → Opponent awarded 5 penalty runs."],
  },
  {
    heading: "Article 30 – Minimum Match Participation",
    points: [
      "Each team owner and captain shall ensure that every player included in the official squad is given the opportunity to play in at least two (2) league matches during the season, unless the player is unavailable due to injury, disciplinary suspension, or other valid reasons approved by the MPL Management Committee. Failure to comply with this article without a valid reason may result in disciplinary action by the league.",
    ],
  },
  {
    heading: "Article 31 – Committee Rights",
    subList: {
      intro: "Committee may:",
      items: ["Modify rules", "Issue fines", "Suspend players/teams/Ownership.", "Committee decision is final and binding."],
    },
  },
];

export const TERMS_UNDERTAKING = {
  intro: "I further undertake that:",
  items: [
    "I shall fully comply with all MPL rules and regulations throughout the duration of the tournament.",
    "I confirm that I have received, carefully read, understood, and signed the Official MPL Playing Conditions & League Regulations, in both English and Urdu languages, consisting of only Six (6) pages and containing Thirty-One (31) Articles, issued on the official letterhead of the Maneri Premier League (MPL). I acknowledge that the said Regulations form an integral part of this Declaration and Agreement. I further agree that I, my team management, coach, players, and representatives shall remain fully bound by all provisions, rules, conditions, penalties, amendments, and directives contained therein and issued by the MPL Governing Committee from time to time.",
    "My team, players, coach, and representatives shall remain bound by all MPL Playing Conditions and disciplinary procedures.",
    "I accept that the decisions of the Match Officials and MPL Governing Committee shall be final and binding.",
    "I acknowledge that any violation of MPL rules may result in penalties, fines, point deductions, suspension, match forfeiture, or any other disciplinary action deemed appropriate by the MPL Governing Committee.",
    "I confirm that all players registered by my franchise are eligible under MPL regulations and that all information provided by me is true and correct.",
  ],
  closing: "I agree to protect and uphold the reputation, integrity, and spirit of the Maneri Premier League.",
};

// ---------------------------------------------------------------------------
// Urdu translation of the Official Playing Conditions & Tournament
// Regulations above. Structure mirrors TERMS_META / TERMS_ARTICLES /
// TERMS_UNDERTAKING exactly (same article order, same heading/points/
// penalty/subList/note/levels shape) so getTermsArticles() etc. can just
// pick which language's array to hand to the page.
// ---------------------------------------------------------------------------

export const TERMS_META_UR = {
  title: "آفیشل پلیئنگ کنڈیشنز اور ٹورنامنٹ ریگولیشنز",
  issuedBy: "ایم پی ایل گورننگ کمیٹی کی جانب سے جاری کردہ",
  intro:
    "ایم پی ایل 2026 میں حصہ لینے والی تمام ٹیمیں، مالکان، کوچز، کھلاڑی، اور عہدیدار درج ذیل پلیئنگ کنڈیشنز اور ریگولیشنز کے پابند ہوں گے۔",
};

export const TERMS_ARTICLES_UR = [
  {
    heading: "آرٹیکل 1 – ٹیم کی تشکیل",
    points: [
      "1.1 ہر ٹیم بالکل 13 کھلاڑی اور 1 کوچ رجسٹر کرے گی۔",
      "1.2 صرف رجسٹرڈ کھلاڑی ہی حصہ لینے کے اہل ہوں گے۔",
    ],
    penalty: ["غیر رجسٹرڈ کھلاڑی → میچ سے محرومی + 2 پنالٹی پوائنٹس"],
  },
  {
    heading: "آرٹیکل 2 – کھلاڑیوں کی منتقلی",
    points: ["2.1 حتمی اسکواڈ جمع کروانے کے بعد ٹیموں کے درمیان کسی بھی کھلاڑی کا تبادلہ یا منتقلی کی اجازت نہیں ہوگی۔"],
    penalty: ["کھلاڑی کی نااہلی", "ٹیم کے 2 پوائنٹس کی کٹوتی"],
  },
  {
    heading: "آرٹیکل 3 – فیلڈنگ کی پابندیاں",
    points: ["3.1 ہر وقت کم از کم 4 فیلڈرز کا فیلڈنگ سرکل کے اندر رہنا لازمی ہے۔"],
    penalty: ["امپائر کی تنبیہ", "بار بار خلاف ورزی پر → 5 پنالٹی رنز"],
  },
  {
    heading: "آرٹیکل 4 – باؤلنگ کی شرائط",
    points: [
      "4.1 ایک باؤلر زیادہ سے زیادہ 3 اوورز کروا سکتا ہے۔",
      "4.2 ہر ٹیم کو ایک اننگز میں کم از کم 5 باؤلرز استعمال کرنا ہوں گے۔",
    ],
    penalty: ["ناجائز اوور کو ڈیڈ قرار دیا جائے گا", "حریف ٹیم کو 5 رنز دیے جائیں گے"],
  },
  {
    heading: "آرٹیکل 5 – گیند کے ضوابط",
    points: ["5.1 صرف 72 ملی میٹر یا اس سے کم پیمائش کی کرکٹ گیند استعمال کی جائے گی۔"],
    penalty: ["فوری تبدیلی", "روپے 3,000 جرمانہ"],
  },
  {
    heading: "آرٹیکل 6 – بائیز اور لیگ بائیز",
    points: ["6.1 بائیز اور لیگ بائیز کو جائز رنز شمار کیا جائے گا۔"],
  },
  {
    heading: "آرٹیکل 7 – ملکیت اور فرنچائز کے ضوابط",
    points: [
      "7.1 ٹیم کی ملکیت 2 سال کے لیے کارآمد رہے گی۔",
      "7.2 معاہدے کی مدت کے دوران ٹیم کا نام تبدیل نہیں کیا جا سکتا۔",
    ],
    penalty: ["روپے 50,000 جرمانہ", "مالک کے ووٹنگ حقوق کی معطلی"],
  },
  {
    heading: "آرٹیکل 8 – کھلاڑیوں کا طرزِ عمل",
    points: ["8.1 بدتمیزی، بدکلامی، لڑائی جھگڑا اور بدانتظامی ممنوع ہے۔"],
    levels: [
      { level: "درجہ 1 خلاف ورزی", desc: "معمولی اختلاف / غیر کھیلانہ رویہ", penalty: "روپے 1,000" },
      { level: "درجہ 2 خلاف ورزی", desc: "بدکلامی / بار بار بدانتظامی", penalty: "روپے 2,000 + اگلے میچ سے پابندی" },
      { level: "درجہ 3 خلاف ورزی", desc: "لڑائی جھگڑا / سنگین بدانتظامی", penalty: "کمیٹی کا جائزہ + معطلی" },
    ],
  },
  {
    heading: "آرٹیکل 9 – امپائر کا اختیار",
    points: ["9.1 امپائر کا فیصلہ حتمی ہوگا۔"],
    penalty: ["پہلی خلاف ورزی → تنبیہ", "دوسری خلاف ورزی → روپے 1,000 جرمانہ"],
  },
  {
    heading: "آرٹیکل 10 – میچ کا وقت",
    points: ["10.1 ٹیموں کو میچ شروع ہونے سے 10 منٹ پہلے رپورٹ کرنا لازمی ہے۔"],
    penalty: ["15 منٹ سے زیادہ تاخیر پر → بیٹنگ کے 2 اوورز کی کٹوتی"],
  },
  {
    heading: "آرٹیکل 11 – لباس اور سامان",
    points: ["11.1 سرکاری ٹیم یونیفارم اور مناسب جوتے پہننا لازمی ہے۔"],
    penalty: ["تعمیل تک کھلاڑی کو کھیلنے کی اجازت نہیں ہوگی"],
  },
  {
    heading: "آرٹیکل 12 – کپتان کی ذمہ داریاں",
    points: [
      "12.1 صرف کپتان ہی باضابطہ طور پر امپائرز سے بات چیت کر سکتے ہیں۔",
      "12.2 ٹیم کے نظم و ضبط کی ذمہ داری کپتان پر ہوگی۔",
    ],
    penalty: ["کپتان پر روپے 1,000 جرمانہ"],
  },
  {
    heading: "آرٹیکل 13 – متبادل فیلڈرز",
    points: ["13.1 متبادل کھلاڑی صرف زخمی ہونے کی صورت میں ہی اجازت یافتہ ہوں گے۔", "13.2 متبادل کھلاڑی بیٹنگ یا باؤلنگ نہیں کر سکتے۔"],
    penalty: ["حریف ٹیم کو 5 پنالٹی رنز دیے جائیں گے۔"],
  },
  {
    heading: "آرٹیکل 14 – میچ میں تعطل",
    points: [
      "14.1 اگر دوسری اننگز میں پاور پلے مکمل ہو جائے تو میچ کا فیصلہ DLS طریقہ کار کے تحت کیا جا سکتا ہے۔",
      "14.2 اگر موسم، بجلی کی بندش، یا کسی ناگزیر وجہ سے میچ مکمل نہ ہو سکے تو نتیجہ طے کرنے کا اختیار ایم پی ایل گورننگ کمیٹی کے پاس ہوگا۔",
    ],
    subList: {
      intro: "کمیٹی یہ کر سکتی ہے:",
      items: ["میچ دوبارہ کھیلنے کا حکم دے سکتی ہے۔", "DLS طریقہ کار لاگو کر سکتی ہے۔", "میچ کو ڈرا قرار دے سکتی ہے۔"],
    },
    note: "ایم پی ایل گورننگ کمیٹی کا فیصلہ حتمی اور قابلِ عمل ہوگا۔",
  },
  {
    heading: "آرٹیکل 15 – انسدادِ بدعنوانی ضابطہ",
    points: ["15.1 میچ فکسنگ، دھوکہ دہی، جعلی زخم، یا ہیرا پھیری سختی سے ممنوع ہے۔"],
    penalty: ["فوری معطلی", "ممکنہ تاحیات پابندی"],
  },
  {
    heading: "آرٹیکل 16 – ایم پی ایل کے نام اور برانڈ کا تحفظ",
    points: [
      "16.1 کوئی بھی فرد یا گروہ منظوری کے بغیر مانیری پریمیئر لیگ (ایم پی ایل) کا سرکاری نام، برانڈنگ، یا شناخت استعمال نہیں کر سکتا۔",
    ],
    penalty: ["انتظامی کارروائی", "حسبِ ضرورت قانونی کارروائی"],
  },
  {
    heading: "آرٹیکل 17 – طبی امداد اور بال ٹیمپرنگ",
    points: [
      "17.1 طبی امداد صرف حقیقی زخم کی صورت میں استعمال کی جائے گی۔",
      "17.2 باؤلنگ کی کارکردگی کو متاثر کرنے والا کوئی بھی غیر منصفانہ استعمال بال ٹیمپرنگ تصور کیا جائے گا۔",
    ],
    penalty: ["5 رنز عطا کیے جائیں گے + تادیبی جائزہ"],
  },
  {
    heading: "آرٹیکل 18 – ملکیت سے دستبرداری کی پالیسی",
    points: ["18.1 معاہدے کی مدت کے دوران دستبردار ہونے والے مالکان کو اخراج معاوضہ ادا کرنا ہوگا۔"],
    penalty: ["روپے 50,000"],
  },
  {
    heading: "آرٹیکل 19 – انٹری فیس اور ضمانت",
    points: [
      "19.1 شرکت فیس (سیزن 2): روپے 50,000",
      "19.2 ضمانتی رقم: روپے 10,000",
      "19.3 ادائیگی کی آخری تاریخ: ستمبر 2026 سے پہلے",
    ],
    penalty: ["ادائیگی تک ٹیم کی شرکت معطل رہے گی"],
  },
  {
    heading: "آرٹیکل 20 – پوائنٹس سسٹم",
    points: ["جیت → 2 پوائنٹس", "ٹائی / نتیجہ نہ نکلنا → 1 پوائنٹ", "شکست → 0 پوائنٹس"],
    subList: {
      intro: "لیگ پوزیشن کی ترتیب:",
      items: ["کل پوائنٹس", "نیٹ رن ریٹ (NRR)", "آمنے سامنے کا نتیجہ", "فیئر پلے ریکارڈ"],
    },
  },
  {
    heading: "آرٹیکل 21 – امپیکٹ پلیئر رول",
    points: [
      "21.1 امپیکٹ پلیئر کو میچ کے آغاز پر فیلڈنگ کرنے کی اجازت نہیں ہوگی اور وہ صرف ایم پی ایل کھیلنے کی شرائط کے مطابق ہی میدان میں داخل ہو سکتا ہے۔",
    ],
    penalty: ["حریف ٹیم کو 5 پنالٹی رنز دیے جائیں گے۔"],
  },
  {
    heading: "آرٹیکل 22 – میچ کے بعد کی تقریب میں شرکت",
    points: [
      "22.1 تمام رجسٹرڈ کھلاڑیوں اور ٹیم عہدیداروں کے لیے میچ کے بعد کی سرکاری تقریب اور انعامی تقریب میں موجود رہنا لازمی ہے۔",
    ],
    penalty: ["ٹیم پر روپے 1,000 جرمانہ۔"],
  },
  {
    heading: "آرٹیکل 23 – ٹیم کٹ کی تبدیلی",
    points: [
      "23.1 ایک بار ٹورنامنٹ کی منظور شدہ ٹیم کٹ حتمی ہو جانے کے بعد، کوئی بھی ٹیم ایم پی ایل گورننگ کمیٹی کی پیشگی منظوری کے بغیر اپنی کھیلنے کی کٹ تبدیل نہیں کر سکتی۔",
    ],
    penalty: ["حریف ٹیم کو 5 پنالٹی رنز دیے جائیں گے۔"],
  },
  {
    heading: "آرٹیکل 24 – ریویو (DRS) کا طریقہ کار",
    points: [
      "24.1 ریویو کی درخواست صرف اسٹرائیکر بیٹسمین ہی مقررہ وقت کے اندر کر سکتا ہے۔ اگر کوئی کھلاڑی، کوچ، معاون عملہ، یا کوئی اور شخص درخواست سے پہلے ریویو کے فیصلے میں مداخلت، مشورہ، یا اثر انداز ہو تو ریویو فوری طور پر منسوخ کر دیا جائے گا۔",
    ],
    penalty: ["ریویو ضائع اور استعمال شدہ تصور ہوگا۔"],
  },
  {
    heading: "آرٹیکل 25 – کھلاڑی کی اہلیت (مانیری رہائش)",
    points: [
      "25.1 تمام رجسٹرڈ کھلاڑیوں کا تعلق مانیری سے ہونا لازمی ہے اور انہیں اہلیت اور رہائش کے ثبوت کے طور پر درست شناختی کارڈ فراہم کرنا ہوگا۔",
    ],
    penalty: ["کھلاڑی کی نااہلی۔", "ٹیم کے 2 پوائنٹس کی کٹوتی۔", "نااہل کھلاڑی کی شرکت کی صورت میں میچ سے محرومی۔"],
  },
  {
    heading: "آرٹیکل 26 – ریٹینشن پلیئر رول",
    points: [
      "26.1 ہر فرنچائز ڈرافٹ سے پہلے صرف ایک (1) کھلاڑی کو برقرار رکھ سکتی ہے۔ نئے کھلاڑی ریٹینشن کے اہل نہیں ہیں اور انہیں پلیئر ڈرافٹ میں شامل ہونا ہوگا۔",
      "26.2 برقرار رکھے گئے کھلاڑی کو ٹیم کپتان یا فرنچائز پلیئر نامزد کیا جا سکتا ہے۔",
      "26.3 کوئی بھی ٹیم کسی بھی صورت میں ایک سے زیادہ کھلاڑی برقرار نہیں رکھ سکتی۔",
    ],
    penalty: ["اضافی برقرار رکھے گئے کھلاڑی/کھلاڑیوں کو نااہل قرار دیا جائے گا۔", "ٹیم کے 2 پوائنٹس کی کٹوتی۔"],
  },
  {
    heading: "آرٹیکل 27 – ریویو اور کریز پوزیشن",
    points: [
      "27.1 کسی بھی رن آؤٹ، اسٹمپنگ، یا آؤٹ کے ریویو میں جہاں بیٹسمین کی کریز پوزیشن زیرِ غور ہو، تھرڈ امپائر دستیاب فوٹیج کی بنیاد پر فیصلہ کرے گا۔",
      "27.2 اگر فوٹیج سے تصدیق ہو جائے کہ وکٹ گرائے جانے کے وقت بیٹسمین اپنی کریز سے باہر تھا تو بیٹسمین کو ناٹ آؤٹ تصور نہیں کیا جائے گا۔",
    ],
    penalty: ["اصل فیصلہ برقرار رہے گا یا حسبِ ضرورت آؤٹ میں تبدیل کر دیا جائے گا۔"],
  },
  {
    heading: "آرٹیکل 28 – میچ کے دوران میدان چھوڑنا",
    points: [
      "28.1 کوئی بھی ٹیم میچ شروع ہونے کے بعد ایم پی ایل گورننگ کمیٹی یا میچ عہدیداروں کی منظوری کے بغیر میدان نہیں چھوڑے گی یا کھیل جاری رکھنے سے انکار نہیں کرے گی۔",
    ],
    penalty: [
      "میچ سے محرومی۔",
      "روپے 10,000 جرمانہ۔",
      "جرمانہ ٹیم کے اگلے مقررہ میچ سے پہلے ادا کرنا لازمی ہے۔",
      "ادائیگی نہ ہونے کی صورت میں ادائیگی تک شرکت سے معطلی ہو سکتی ہے۔",
    ],
  },
  {
    heading: "آرٹیکل 29 – ریویو کے دوران میچ گیند کی نگرانی",
    points: [
      "29.1 جب بھی بیٹنگ یا فیلڈنگ ٹیم ریویو کی درخواست کرے، میچ گیند فوری طور پر آن فیلڈ امپائر کے حوالے کی جانی چاہیے۔",
      "29.2 امپائر کی ہدایت کے بغیر کوئی بھی کھلاڑی ریویو کے دوران گیند کو اپنے ساتھ نہیں رکھے گا، تبدیل نہیں کرے گا، صاف نہیں کرے گا، یا اسے ہاتھ نہیں لگائے گا۔",
    ],
    penalty: ["پہلی خلاف ورزی → سرکاری تنبیہ۔", "بار بار خلاف ورزی → حریف ٹیم کو 5 پنالٹی رنز۔"],
  },
  {
    heading: "آرٹیکل 30 – کم از کم میچ میں شرکت",
    points: [
      "ہر ٹیم مالک اور کپتان کو یہ یقینی بنانا ہوگا کہ سرکاری اسکواڈ میں شامل ہر کھلاڑی کو سیزن کے دوران کم از کم دو (2) لیگ میچز کھیلنے کا موقع دیا جائے، سوائے اس کے کہ کھلاڑی زخم، تادیبی معطلی، یا ایم پی ایل انتظامی کمیٹی کی منظور کردہ کسی اور جائز وجہ سے دستیاب نہ ہو۔ بغیر کسی جائز وجہ کے اس آرٹیکل کی خلاف ورزی پر لیگ کی جانب سے تادیبی کارروائی کی جا سکتی ہے۔",
    ],
  },
  {
    heading: "آرٹیکل 31 – کمیٹی کے اختیارات",
    subList: {
      intro: "کمیٹی یہ کر سکتی ہے:",
      items: ["قواعد میں ترمیم کر سکتی ہے", "جرمانے عائد کر سکتی ہے", "کھلاڑیوں/ٹیموں/ملکیت کو معطل کر سکتی ہے۔", "کمیٹی کا فیصلہ حتمی اور قابلِ عمل ہے۔"],
    },
  },
];

export const TERMS_UNDERTAKING_UR = {
  intro: "میں مزید یہ عہد کرتا ہوں کہ:",
  items: [
    "میں ٹورنامنٹ کی پوری مدت کے دوران ایم پی ایل کے تمام قواعد و ضوابط کی مکمل پابندی کروں گا۔",
    "میں تصدیق کرتا ہوں کہ میں نے مانیری پریمیئر لیگ (ایم پی ایل) کے سرکاری لیٹر ہیڈ پر جاری کردہ آفیشل ایم پی ایل پلیئنگ کنڈیشنز اینڈ لیگ ریگولیشنز، جو انگریزی اور اردو دونوں زبانوں میں صرف چھ (6) صفحات اور اکتیس (31) آرٹیکلز پر مشتمل ہیں، وصول کر لیے ہیں، انہیں غور سے پڑھ لیا ہے، سمجھ لیا ہے، اور ان پر دستخط کر دیے ہیں۔ میں تسلیم کرتا ہوں کہ مذکورہ ریگولیشنز اس اعلامیہ اور معاہدے کا لازمی حصہ ہیں۔ میں مزید اس بات پر متفق ہوں کہ میں، میری ٹیم انتظامیہ، کوچ، کھلاڑی، اور نمائندے ان میں شامل تمام شقوں، قواعد، شرائط، سزاؤں، ترامیم، اور ایم پی ایل گورننگ کمیٹی کی جانب سے وقتاً فوقتاً جاری کردہ ہدایات کے مکمل طور پر پابند رہیں گے۔",
    "میری ٹیم، کھلاڑی، کوچ، اور نمائندے تمام ایم پی ایل پلیئنگ کنڈیشنز اور تادیبی طریقہ کار کے پابند رہیں گے۔",
    "میں تسلیم کرتا ہوں کہ میچ عہدیداروں اور ایم پی ایل گورننگ کمیٹی کے فیصلے حتمی اور قابلِ عمل ہوں گے۔",
    "میں تسلیم کرتا ہوں کہ ایم پی ایل کے قواعد کی کسی بھی خلاف ورزی کے نتیجے میں سزائیں، جرمانے، پوائنٹس کی کٹوتی، معطلی، میچ سے محرومی، یا ایم پی ایل گورننگ کمیٹی کی مناسب سمجھی جانے والی کوئی اور تادیبی کارروائی ہو سکتی ہے۔",
    "میں تصدیق کرتا ہوں کہ میری فرنچائز کی جانب سے رجسٹرڈ تمام کھلاڑی ایم پی ایل ریگولیشنز کے تحت اہل ہیں اور میری فراہم کردہ تمام معلومات درست اور صحیح ہیں۔",
  ],
  closing: "میں مانیری پریمیئر لیگ کی ساکھ، دیانتداری، اور جذبے کے تحفظ اور برقراری پر متفق ہوں۔",
};

export function getTermsMeta(lang) {
  return lang === "ur" ? TERMS_META_UR : TERMS_META;
}

export function getTermsArticles(lang) {
  return lang === "ur" ? TERMS_ARTICLES_UR : TERMS_ARTICLES;
}

export function getTermsUndertaking(lang) {
  return lang === "ur" ? TERMS_UNDERTAKING_UR : TERMS_UNDERTAKING;
}
