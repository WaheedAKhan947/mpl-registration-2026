import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Leaderboards from "@/components/site/stats/Leaderboards";

export const metadata = {
  title: "Leaderboards — MPL",
  description: "Orange cap, purple cap and every batting, bowling and fielding leaderboard from the Maneri Premier League.",
};

export default function StatsPage() {
  return (
    <>
      <TopBar />
      <Navbar />
      <main className="min-h-screen bg-paper">
        <Leaderboards />
      </main>
      <Footer />
    </>
  );
}
