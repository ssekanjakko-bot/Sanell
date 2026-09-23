"use client";
import { useState, useEffect } from "react";

const SPORTS = [
  { name: "Football", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard" },
  { name: "Basketball", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" },
];

export default function SanelSports() {
  const [activeSport, setActiveSport] = useState(SPORTS[0]);
  const [live, setLive] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [finished, setFinished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Proxy to avoid CORS block in Uganda
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(activeSport.url)}`;
      const res = await fetch(proxyUrl, { cache: "no-store" });

      if(!res.ok) throw new Error("API blocked");

      const data = await res.json();
      console.log("API DATA:", data); // check console

      const games = data.events || [];
      if(games.length === 0) setError("No games today - check tomorrow");

      setLive(games.filter((g: any) => g.status.type.state === "in"));
      setUpcoming(games.filter((g: any) => g.status.type.state === "pre"));
      setFinished(games.filter((g: any) => g.status.type.state === "post"));
    } catch (e: any) {
      setError(e.message);
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeSport]);

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#4B2E1E] p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">Sanel Ug Sports</h1>
          <button onClick={fetchData} className="text-sm border px-3 py-1 rounded-full">🔄 Refresh</button>
        </div>

        <div className="flex border-b border-[#D9CAB3] mb-4">
          {SPORTS.map(s => (
            <button key={s.name} onClick={() => setActiveSport(s)}
              className={`flex-1 py-2 text-sm font-bold ${activeSport.name === s.name? "bg-[#8B5E3C] text-white" : ""}`}>
              {s.name}
            </button>
          ))}
        </div>

        {error && <p className="bg-red-100 p-2 rounded text-sm mb-3">{error}</p>}

        <Section title="LIVE NOW" dot>
          {loading? "Loading..." : live.length === 0? "No live games" : live.map((g: any) => <GameCard key={g.id} game={g} />)}
        </Section>

        <Section title="FIXTURES">
          {loading? "Loading..." : upcoming.length === 0? "No fixtures" : upcoming.map((g: any) => <GameCard key={g.id} game={g} />)}
        </Section>

        <Section title="RESULTS">
          {loading? "Loading..." : finished.length === 0? "No results" : finished.map((g: any) => <GameCard key={g.id} game={g} />)}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, dot = false }: any) {
  return (
    <div className="mb-5">
      <h2 className="font-bold mb-2 flex items-center gap-2">{dot && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>} {title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function GameCard({ game }: any) {
  const comp = game.competitions?.[0]?.competitors;
  const home = comp?.[0]; const away = comp?.[1];
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm">
      <div className="flex justify-between font-semibold text-sm">
        <span>{home?.team?.displayName || "Home"}</span>
        <span>{home?.score || "0"} - {away?.score || "0"}</span>
        <span>{away?.team?.displayName || "Away"}</span>
      </div>
      <p className="text-xs text-[#8B5E3C]">{game.status?.type?.detail}</p>
    </div>
  );
}