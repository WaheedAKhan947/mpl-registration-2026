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
    copy: "Leads planning, decision-making, and league execution while maintaining discipline, fair play, and professional standards.",
    photo: null,
  },
  {
    role: "Director of Communications",
    name: "Tanveer Jamal",
    copy: "Acts as official spokesperson, handling announcements, public communication, and league representation.",
    photo: null,
  },
  {
    role: "Operations & Events",
    name: "M Shahzad, Seyal Khan, Abdullah",
    copy: "Manage scheduling, ground arrangements, logistics, and coordination between teams.",
    photo: null,
  },
  {
    role: "Finance Secretary",
    name: "Adil Khan",
    copy: "Handles budgeting, expenses, prize distribution, and transparent management of league funds.",
    photo: null,
  },
  {
    role: "Media Team",
    name: "M Huzeefa & Junaid Banaras",
    copy: "Lead promotions, match coverage, content creation, and the public image of MPL.",
    photo: null,
  },
  {
    role: "Official Commentator",
    name: "Muhammad Hizam",
    copy: "Provides live commentary and adds energy to the match experience through professional narration.",
    photo: null,
  },
];

export const SPONSORS = [
  { name: "Sponsor One", logo: null, url: "https://example.com" },
  { name: "Sponsor Two", logo: null, url: "https://example.com" },
  { name: "Sponsor Three", logo: null, url: "https://example.com" },
  { name: "Sponsor Four", logo: null, url: "https://example.com" },
  { name: "Sponsor Five", logo: null, url: "https://example.com" },
  { name: "Sponsor Six", logo: null, url: "https://example.com" },
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
  { name: "notes", label: "Notes", type: "textarea", required: true, placeholder: "Add any extra information for MPL management", trim: true, full: true },
  { name: "profilePicture", label: "Profile Picture", type: "file", required: true, accept: "image/*", help: "Upload a clear player photo." },
  { name: "cnicImage", label: "CNIC Image", type: "file", required: true, accept: "image/*,.pdf", help: "Upload CNIC front image or PDF." },
  { name: "feeReceipt", label: "Fee Submission Receipt", type: "file", required: true, accept: "image/*,.pdf", help: "Upload payment receipt screenshot, image, or PDF.", full: true },
];
