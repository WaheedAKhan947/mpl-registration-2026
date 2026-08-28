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
