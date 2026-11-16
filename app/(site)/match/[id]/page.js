import mongoose from "mongoose";
import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import MatchCentre from "@/components/site/match/MatchCentre";
import { connectToDatabase } from "@/lib/mongodb";
import Match from "@/models/Match";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  let title = "Match Centre — MPL";
  try {
    if (mongoose.isValidObjectId(params.id)) {
      await connectToDatabase();
      const match = await Match.findById(params.id).select("teamA teamB matchNumber").lean();
      if (match) {
        const number = match.matchNumber ? `Match ${match.matchNumber}: ` : "";
        title = `${number}${match.teamA} vs ${match.teamB} — MPL`;
      }
    }
  } catch {
    // Fall back to the generic title; the page itself shows any error.
  }
  return { title, description: "Live score, scorecard and ball-by-ball commentary from the Maneri Premier League." };
}

export default function MatchPage({ params }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <main className="min-h-screen bg-paper">
        <MatchCentre matchId={params.id} />
      </main>
      <Footer />
    </>
  );
}
