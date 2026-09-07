import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import MFCRegistrationSection from "@/components/site/MFCRegistrationSection";
import Footer from "@/components/site/Footer";

export const metadata = {
  title: "Player Registration — Maneri Football Club",
  description: "Register to play for Maneri Football Club (MFC).",
};

export default function MFCRegisterPage() {
  return (
    <>
      <TopBar />
      <Navbar />

      <main>
        <MFCRegistrationSection />
      </main>

      <Footer />
    </>
  );
}
