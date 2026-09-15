import { Anton, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import AnnouncementBar from "@/components/site/AnnouncementBar";
import RegistrationAlertModal from "@/components/site/RegistrationAlertModal";
import HtmlLangSync from "@/components/site/HtmlLangSync";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const displayFont = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const urduFont = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
  display: "swap",
});

// Runs before React hydrates so a returning visitor who picked Urdu doesn't
// see an English/LTR flash before the language context takes over.
const BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var lang = localStorage.getItem("mpl-lang");
    if (lang === "ur") {
      document.documentElement.lang = "ur";
      document.documentElement.dir = "rtl";
      document.documentElement.classList.add("lang-ur");
    }
  } catch (e) {}
})();
`;

export const metadata = {
  title: "Maneri Premier League — Player Registration",
  description: "Register to play in the Maneri Premier League (MPL).",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${urduFont.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_SCRIPT }} />
        <LanguageProvider>
          <HtmlLangSync />
          <AnnouncementBar />
          <RegistrationAlertModal />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
