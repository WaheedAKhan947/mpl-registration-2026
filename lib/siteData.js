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

export const MANAGEMENT = [
  {
    role: "Chairman MPL",
    name: "Muhammad Hashim Khan",
    copy: "Leads the vision, strategy, and growth of MPL with discipline and professionalism, aiming to make it a symbol of excellence, unity, fair play, and pride for the people of Maneri.",
    photo: null,
  },
  {
    role: "⁠Pro-Chairman",
    name: "Shahzad Ali Shah",
    copy: "Supports the Chairman, oversees league operations, and ensures successful tournament execution.",
    photo: null,
  },
  {
    role: "Director of Communications",
    name: "Tanveer Jamal",
    copy: "Manages official communications, team coordination, public relations, and smooth information flow",
    photo: null,
  },
  {
    role: "Operations & Events Management",
    name: "Abdullah, Seyal Khan, Shamas Khan",
    copy: "Handles scheduling, ground arrangements, logistics, and team coordination.",
    photo: null,
  },
  {
    role: "League Rules & Legal Advisor",
    name: "Mir Azam Khan",
    copy: "Ensures fair play, manages rules, resolves disputes, and provides legal guidance.",
    photo: null,
  },
  {
    role: "Media & Broadcasting",
    name: "M Shayan Khan, M Huzeefa, Junaid Banaras",
    copy: "Manages live coverage, highlights, photography, and digital media content.",
    photo: null,
  },
  {
    role: "Finance Manager",
    name: "Adil Khan",
    copy: "Handles budgeting, expenses, prize distribution, and transparent financial management.",
    photo: null,
  },
];

export const REGISTRATION_FIELDS = [
  { name: "playerName", label: "Player Name", type: "text", required: true, autoComplete: "name", trim: true },
  { name: "fatherName", label: "Father Name", type: "text", required: true, trim: true },
  { name: "age", label: "Age", type: "number", required: true, min: 12, max: 60, trim: true },
  { name: "phone", label: "Phone Number", type: "text", required: true, inputMode: "tel", autoComplete: "tel", trim: true },
  { name: "cnicNumber", label: "CNIC Number", type: "text", required: true, inputMode: "numeric", placeholder: "Example: 12345-1234567-1", trim: true },
  { name: "area", label: "Village / Area", type: "select", required: true, options: VILLAGES, placeholder: "Select village" },
  { name: "preferredTeam", label: "Preferred Team", type: "select", required: true, options: TEAMS, placeholder: "Select team" },
  { name: "playingRole", label: "Playing Role", type: "select", required: true, options: ROLES, placeholder: "Select role" },
  { name: "battingStyle", label: "Batting Style", type: "select", required: true, options: BATTING_STYLES, placeholder: "Select batting style" },
  { name: "bowlingStyle", label: "Bowling Style", type: "select", required: true, options: BOWLING_STYLES, placeholder: "Select bowling style" },
  { name: "cricProId", label: "CricPro ID", type: "text", required: true, placeholder: "Example: CP123456", trim: true },
  // { name: "notes", label: "Notes", type: "textarea", required: true, placeholder: "Add any extra information for MPL management", trim: true, full: true },
  { name: "profilePicture", label: "Profile Picture", type: "file", required: true, accept: "image/*", help: "Upload a clear player photo." },
  { name: "cnicImage", label: "CNIC Image", type: "file", required: true, accept: "image/*,.pdf", help: "Upload CNIC front image or PDF." },
  { name: "feeReceipt", label: "Fee Submission Receipt", type: "file", required: true, accept: "image/*,.pdf", help: "Upload payment receipt screenshot, image, or PDF.", full: true },
];
