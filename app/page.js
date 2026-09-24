import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import StatsBar from "@/components/site/StatsBar";
import ScorecardSection from "@/components/site/ScorecardSection";
import AboutSection from "@/components/site/AboutSection";
import TeamsSection from "@/components/site/TeamsSection";
import PointsTableSection from "@/components/site/PointsTableSection";
import ManagementSection from "@/components/site/ManagementSection";
import GallerySection from "@/components/site/GallerySection";
import HighlightsSection from "@/components/site/HighlightsSection";
import ContactSection from "@/components/site/ContactSection";
import BrandAmbassadorsSection from "@/components/site/BrandAmbassadorsSection";
import SponsorsSection from "@/components/site/SponsorsSection";
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
        <PointsTableSection />
        <ScorecardSection />
        <ManagementSection />
        <GallerySection />
        <HighlightsSection />
        <BrandAmbassadorsSection />
        <SponsorsSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
