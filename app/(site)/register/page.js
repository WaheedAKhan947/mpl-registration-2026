import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import RegistrationSection from "@/components/site/RegistrationSection";
import Footer from "@/components/site/Footer";

export const metadata = {
  title: "Player Registration — Maneri Premier League",
  description: "Register to play in the Maneri Premier League (MPL) 2026 season.",
};

export default function RegisterPage() {
  return (
    <>
      <TopBar />
      <Navbar />

      <main>
        <RegistrationSection />
      </main>

      <Footer />
    </>
  );
}
