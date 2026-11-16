import mongoose from "mongoose";
import TopBar from "@/components/site/TopBar";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PlayerProfile from "@/components/site/player/PlayerProfile";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  let title = "Player — MPL";
  try {
    if (mongoose.isValidObjectId(params.id)) {
      await connectToDatabase();
      const player = await Registration.findById(params.id).select("playerName allocatedTeam").lean();
      // Same rule as the profile API: only drafted players get a named page.
      if (player?.allocatedTeam) title = `${player.playerName} (${player.allocatedTeam}) — MPL`;
    }
  } catch {
    // Generic title; the page shows any error.
  }
  return { title, description: "Player profile and tournament stats from the Maneri Premier League." };
}

export default function PlayerPage({ params }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <main className="min-h-screen bg-paper">
        <PlayerProfile playerId={params.id} />
      </main>
      <Footer />
    </>
  );
}
