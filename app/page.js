"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const VILLAGES = ["Maneri Payan", "Maneri Bala"];
const TEAMS = [
  "Any Team",
  "Maneri Eleven",
  "Maneri Baturan",
  "Maneri Strikers",
  "Maneri Kings",
  "Maneri Markhor",
  "Maneri Azmari",
];
const ROLES = ["Batsman", "Bowler", "All-rounder", "Wicket Keeper"];
const BATTING_STYLES = ["Right-hand Bat", "Left-hand Bat"];
const BOWLING_STYLES = [
  "Right-arm Fast",
  "Left-arm Fast",
  "Right-arm Spin",
  "Left-arm Spin",
  "Not a Bowler",
];

const TEAM_CARDS = [
  { code: "11", name: "Maneri Eleven", copy: "Sharp, balanced, and built for pressure." },
  { code: "MB", name: "Maneri Baturan", copy: "Powerful local identity with fearless cricket." },
  { code: "MS", name: "Maneri Strikers", copy: "Attack-minded players with a high-tempo style." },
  { code: "MK", name: "Maneri Kings", copy: "Commanding presence and tournament ambition." },
  { code: "MM", name: "Maneri Markhor", copy: "Resilient cricket with a proud local edge." },
  { code: "MA", name: "Maneri Azmari", copy: "Competitive spirit with disciplined execution." },
];

const MANAGEMENT = [
  { role: "Chairman MPL", name: "Muhammad Hashim Khan", copy: "Leads planning, decision-making, and league execution while maintaining discipline, fair play, and professional standards." },
  { role: "Director of Communications", name: "Tanveer Jamal", copy: "Acts as official spokesperson, handling announcements, public communication, and league representation." },
  { role: "Operations & Events", name: "M Shahzad, Seyal Khan, Abdullah", copy: "Manage scheduling, ground arrangements, logistics, and coordination between teams." },
  { role: "Finance Secretary", name: "Adil Khan", copy: "Handles budgeting, expenses, prize distribution, and transparent management of league funds." },
  { role: "Media Team", name: "M Huzeefa & Junaid Banaras", copy: "Lead promotions, match coverage, content creation, and the public image of MPL." },
  { role: "Official Commentator", name: "Muhammad Hizam", copy: "Provides live commentary and adds energy to the match experience through professional narration." },
];

const IMG_BASE = "https://mpl.unaux.com/wp-content/themes/cricket-club-league/assets/images";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error(`${file.name} is larger than 3MB. Please upload a smaller file.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type || "application/octet-stream", data: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function HomePage() {
  const [navOpen, setNavOpen] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [year, setYear] = useState(2026); // Fallback year

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });

    const form = event.target;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      const registration = {
        playerName: formData.get("playerName").trim(),
        fatherName: formData.get("fatherName").trim(),
        age: formData.get("age").trim(),
        phone: formData.get("phone").trim(),
        cnicNumber: formData.get("cnicNumber").trim(),
        area: formData.get("area"),
        preferredTeam: formData.get("preferredTeam"),
        playingRole: formData.get("playingRole"),
        battingStyle: formData.get("battingStyle"),
        bowlingStyle: formData.get("bowlingStyle"),
        experience: formData.get("experience").trim(),
        notes: formData.get("notes").trim(),
        profilePicture: await readFileAsDataUrl(form.elements.profilePicture.files[0]),
        cnicImage: await readFileAsDataUrl(form.elements.cnicImage.files[0]),
        feeReceipt: await readFileAsDataUrl(form.elements.feeReceipt.files[0]),
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration could not be submitted.");

      form.reset();
      setStatus({
        type: "success",
        text: `Registration submitted. Your registration ID is ${result.id}. MPL management can view it in Admin.`,
      });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Registration could not be submitted. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="quick-links">
            <span>+92 310 9898996</span>
            <span>maneripremierleague@gmail.com</span>
          </div>
          <div className="socials" aria-label="Social links">
            <a target="_blank" href="https://www.facebook.com/share/1CbeTudQ6f/?mibextid=wwXIfr">Facebook</a>
            <a target="_blank" href="https://www.tiktok.com/@maneri.premier.league?_r=1&_t=ZS-95h8v7XZhw5">TikTok</a>
            <a target="_blank" href="https://youtube.com/@maneripremierleague?si=CLwdeXA7aufIUHLZ">YouTube</a>
          </div>
        </div>
      </div>

      <nav className="site-nav" aria-label="Main navigation">
        <div className="nav-inner">
          <a className="brand" href="#home" aria-label="Maneri Premier League home">
            <span className="brand-mark">
              <Image src={"/logo.png"} alt="logo" width={40} height={40}/>
            </span>
            <span>
              Maneri Premier League
              <small>Swabi, KP, Pakistan</small>
            </span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span aria-hidden="true" />
          </button>
          <div className={`nav-links${navOpen ? " open" : ""}`} onClick={() => setNavOpen(false)}>
            <a href="#about">About</a>
            <a href="#teams">Teams</a>
            <a href="#management">Management</a>
            <a href="#gallery">Gallery</a>
            <a href="#register">Register</a>
            <a className="button" href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <main id="home">
        <header className="hero">
          <div className="hero-inner">
            <div>
              <p className="eyebrow">Welcome Back</p>
              <h1>Maneri Premier League</h1>
              <p className="hero-copy">
                A structured local cricket league built for disciplined competition, fair play,
                organized match management, and the next generation of Maneri cricket talent.
              </p>
              <div className="hero-actions">
                <a className="button" href="#teams">View Teams</a>
                <a className="button secondary" href="#management">Meet Management</a>
              </div>
            </div>
            <aside className="hero-panel" aria-label="League summary">
              <strong>19 Nov 2025</strong>
              <span>Officially established to raise local cricket standards</span>
            </aside>
          </div>
        </header>

        <div className="stats" aria-label="League highlights">
          <div className="stat"><strong>6</strong><span>Competitive teams</span></div>
          <div className="stat"><strong>1</strong><span>Professional local platform</span></div>
          <div className="stat"><strong>100%</strong><span>Focus on fair play</span></div>
        </div>

        <section id="about">
          <div className="section-inner about-grid">
            <div className="photo-stack" aria-label="Cricket images">
              <img src={`${IMG_BASE}/about01.png`} alt="Cricket match moment" />
              <img src={`${IMG_BASE}/about02.png`} alt="Cricket player" />
              <img src={`${IMG_BASE}/about03.png`} alt="Cricketer in action" />
            </div>
            <div>
              <p className="eyebrow">About Us</p>
              <h2>Local Cricket With Professional Standards</h2>
              <div className="about-copy">
                <p>
                  Maneri Premier League was created to provide a serious and organized platform
                  for emerging players. The league brings teams together under proper rules,
                  transparent management, and a competitive tournament structure.
                </p>
                <p>
                  Since formation, MPL has focused on discipline, teamwork, and talent
                  development, turning local cricket into a stronger opportunity-driven system
                  for future players.
                </p>
              </div>
              <div className="pill-list">
                <span className="pill">Discipline</span>
                <span className="pill">Fair Play</span>
                <span className="pill">Teamwork</span>
                <span className="pill">Talent Development</span>
              </div>
            </div>
          </div>
        </section>

        <section className="teams" id="teams">
          <div className="section-inner">
            <div className="section-head">
              <h2>Six Teams. One League.</h2>
              <p>Each side represents local pride, strong identity, and the competitive spirit of Maneri cricket.</p>
            </div>
            <div className="team-grid">
              {TEAM_CARDS.map((team) => (
                <article className="team-card" key={team.code}>
                  <span>{team.code}</span>
                  <div>
                    <h3>{team.name}</h3>
                    <p>{team.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="management">
          <div className="section-inner">
            <div className="section-head">
              <h2>Management MPL</h2>
              <p>The people responsible for planning, operations, communication, finance, media, and match experience.</p>
            </div>
            <div className="management-grid">
              {MANAGEMENT.map((member) => (
                <article className="member-card" key={member.name}>
                  <span className="role">{member.role}</span>
                  <h3>{member.name}</h3>
                  <p>{member.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="gallery" id="gallery">
          <div className="section-inner">
            <div className="section-head">
              <h2>Match-Day Energy</h2>
              <p>A cleaner visual gallery gives the league a more official and memorable presence.</p>
            </div>
            <div className="gallery-grid">
              <img src={`${IMG_BASE}/gallery-img.png`} alt="MPL gallery feature" />
              <img src={`${IMG_BASE}/gallery01.png`} alt="Cricket player portrait" />
              <img src={`${IMG_BASE}/gallery02.png`} alt="Cricket action" />
            </div>
          </div>
        </section>

        <section className="registration" id="register">
          <div className="section-inner">
            <div className="section-head">
              <h2>Player Registration MPL 2026</h2>
              <p>Players can register themselves for the upcoming MPL 2026 season. Submissions are saved for the admin and can be exported to Excel.</p>
            </div>
            <div className="registration-layout">
              <aside className="registration-note">
                <h3>Before You Submit</h3>
                <p>Use correct contact details so the MPL management team can reach you for selection, trials, or team coordination.</p>
                <ul>
                  <li>Register only once with your active phone number.</li>
                  <li>Choose the playing role that best describes you.</li>
                  <li>Admin can export all entries as an Excel file.</li>
                </ul>
              </aside>

              <form className="player-form" id="playerRegistrationForm" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Player Name <span className="required-star">*</span>
                    <input name="playerName" autoComplete="name" required />
                  </label>
                  <label>
                    Father Name <span className="required-star">*</span>
                    <input name="fatherName" required />
                  </label>
                  <label>
                    Age <span className="required-star">*</span>
                    <input name="age" type="number" min="12" max="60" required />
                  </label>
                  <label>
                    Phone Number <span className="required-star">*</span>
                    <input name="phone" inputMode="tel" autoComplete="tel" required />
                  </label>
                  <label>
                    CNIC Number <span className="required-star">*</span>
                    <input name="cnicNumber" inputMode="numeric" placeholder="Example: 12345-1234567-1" required />
                  </label>
                  <label>
                    Village / Area <span className="required-star">*</span>
                    <select name="area" required defaultValue="">
                      <option value="" disabled>Select village</option>
                      {VILLAGES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                  <label>
                    Preferred Team <span className="required-star">*</span>
                    <select name="preferredTeam" required defaultValue="">
                      <option value="" disabled>Select team</option>
                      {TEAMS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label>
                    Playing Role <span className="required-star">*</span>
                    <select name="playingRole" required defaultValue="">
                      <option value="" disabled>Select role</option>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </label>
                  <label>
                    Batting Style <span className="required-star">*</span>
                    <select name="battingStyle" required defaultValue="">
                      <option value="" disabled>Select batting style</option>
                      {BATTING_STYLES.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label>
                    Bowling Style <span className="required-star">*</span>
                    <select name="bowlingStyle" required defaultValue="">
                      <option value="" disabled>Select bowling style</option>
                      {BOWLING_STYLES.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label>
                    Previous Experience <span className="required-star">*</span>
                    <input name="experience" placeholder="Example: club, school, local cricket" required />
                  </label>
                  <label className="form-full">
                    Notes <span className="required-star">*</span>
                    <textarea name="notes" placeholder="Add any extra information for MPL management" required />
                  </label>
                  <label>
                    Profile Picture <span className="required-star">*</span>
                    <input name="profilePicture" type="file" accept="image/*" required />
                    <span className="form-help">Upload a clear player photo.</span>
                  </label>
                  <label>
                    CNIC Image <span className="required-star">*</span>
                    <input name="cnicImage" type="file" accept="image/*,.pdf" required />
                    <span className="form-help">Upload CNIC front image or PDF.</span>
                  </label>
                  <label className="form-full">
                    Fee Submission Receipt <span className="required-star">*</span>
                    <input name="feeReceipt" type="file" accept="image/*,.pdf" required />
                    <span className="form-help">Upload payment receipt screenshot, image, or PDF.</span>
                  </label>
                </div>

                <div className="hero-actions">
                  <button className="button" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Registration"}
                  </button>
                  {/* <a className="button secondary" href="/admin">Admin Excel Export</a> */}
                </div>

                <p className={`form-message${status.text ? " show" : ""}${status.type === "error" ? " closed" : ""}`}>
                  {status.text || "Registration submitted. MPL management can view it in Admin."}
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="cta" id="contact">
          <div className="cta-inner">
            <div>
              <h2>Connect With MPL</h2>
              <p>For team coordination, announcements, sponsorship, media, or league inquiries, contact the Maneri Premier League management team.</p>
            </div>
            <div className="contact-card">
              <span>Email</span>
              <a href="mailto:maneripremierleague@gmail.com">maneripremierleague@gmail.com</a>
              <span>Phone</span>
              <a href="tel:+923109898996">+92 310 9898996</a>
              <span>Location</span>
              <span>Maneri Payan, Swabi, KP, Pakistan</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <strong>Maneri Premier League</strong>
          <span>&copy; {year} MPL</span>
          {/* <a href="/admin">Admin</a> */}
        </div>
      </footer>
    </>
  );
}
