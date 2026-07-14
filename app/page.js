import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import StatsBar from "@/components/site/StatsBar";
import AboutSection from "@/components/site/AboutSection";
import TeamsSection from "@/components/site/TeamsSection";
import ManagementSection from "@/components/site/ManagementSection";
import GallerySection from "@/components/site/GallerySection";
import RegistrationSection from "@/components/site/RegistrationSection";
import ContactSection from "@/components/site/ContactSection";
import Footer from "@/components/site/Footer";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <Navbar />

      <main>
        <Hero />
        <StatsBar />
        <AboutSection />
        <TeamsSection />
        <ManagementSection />
        <GallerySection />
        <RegistrationSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
