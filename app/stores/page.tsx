"use client";
import { useState, useEffect } from "react";

const API_KEY = "dd7ba7eea526856266682cd0d6f32335"; // <-- PUT YOUR API-SPORTS KEY HERE

const HOSTS: Record<string, string> = {
  football: "v3.football.api-sports.io",
  basketball: "v2.basketball.api-sports.io",
  tennis: "v1.tennis.api-sports.io",
  cricket: "v1.cricket.api-sports.io"
};

const SPORTS = ["Football", "Basketball", "Tennis", "Cricket"];
const DATES = ["Yesterday", "Today", "Tomorrow"];

// THIS FUNCTION CALLS API-SPORTS FROM THE SERVER SO IT WON'T BE BLOCKED
async function fetchSports(sport: string, type: "live" | "fixtures" | "results", date: string) {
  const sportKey = sport.toLowerCase();
  const host = HOSTS[sportKey];
  
  let endpoint = "";
  if(type === "live") endpoint = "fixtures?live=all";
  else if(type === "results") endpoint = `fixtures?date=${date}&status=FT`;
  else endpoint = `fixtures?date=${date}`;

  try {
    const res = await fetch(`https://${host}/${endpoint}`, {
      headers: {
        "x-api-key": API_KEY,
        "x-apisports-host": host
      },
      cache: "no-store"
    });
    const data = await res.json();
    return data.response || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default function SanelSports() {
  const [activeSport, setActiveSport] = useState("Football");
  const [activeDate, setActiveDate] = useState("Today");
  const [live, setLive] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getDate = () => {
    const d = new Date();
    if (activeDate === "Tomorrow") d.setDate(d.getDate() + 1);
    if (activeDate === "Yesterday") d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const fetchData = async () => {
    setLoading(true);
    const date = getDate();

    const [liveRes, fixRes, resRes] = await Promise.all([
      fetchSports(activeSport, "live", date),
      fetchSports(activeSport, "fixtures", date),
      fetchSports(activeSport, "results", date),
    ]);

    setLive(liveRes);
    setFixtures(fixRes);
    setResults(resRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeSport, activeDate]);

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#4B2E1E] font-sans">
      <div className="max-w-md mx-auto p-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">Sanel Ug Sports</h1>
          <button onClick={fetchData} className="flex items-center gap-1 text-sm font-semibold">
            🔄 Refresh
          </button>
        </div>

        {/* SPORT TABS */}
        <div className="flex border-b border-[#D9CAB3] mb-3">
          {SPORTS.map(s => (
            <button key={s} onClick={() => setActiveSport(s)}
              className={`flex-1 py-2 text-sm font-semibold ${activeSport === s? "bg-[#8B5E3C] text-white" : "text-[#4B2E1E]"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* DATE TABS */}
        <div className="flex justify-around mb-4 text-sm">
          {DATES.map(d => (
            <button key={d} onClick={() => setActiveDate(d)}
              className={`pb-1 ${activeDate === d? "border-b-2 border-[#8B5E3C] font-bold" : "text-[#8B5E3C]"}`}>
              {d}
            </button>
          ))}
        </div>

        {/* LIVE NOW */}
        <Section title="LIVE NOW" dot>
          {loading? "Loading..." : live.length === 0? `No live ${activeSport} games` : 
            live.map((g: any) => <GameCard key={g.fixture.id} game={g} />)}
        </Section>

        {/* TODAY FIXTURES */}
        <Section title="TODAY FIXTURES">
          {loading? "Loading..." : fixtures.length === 0? `No ${activeSport} fixtures for ${activeDate}` : 
            fixtures.map((g: any) => <FixtureCard key={g.fixture.id} game={g} />)}
        </Section>

        {/* RESULTS */}
        <Section title="RESULTS">
          {loading? "Loading..." : results.length === 0? "No results yet" : 
            results.map((g: any) => <ResultCard key={g.fixture.id} game={g} />)}
        </Section>

        {/* NEWS */}
        <Section title="LATEST NEWS">
          Add News API to show headlines
        </Section>

        <footer className="text-center text-xs mt-6 pt-4 border-t border-[#D9CAB3] text-[#8B5E3C]">
          © Sanel Ug 2026
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children, dot = false }: any) {
  return (
    <div className="mb-5">
      <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
        {dot && <span className="w-2 h-2 bg-red-500 rounded-full"></span>} {title}
      </h2>
      <div className="text-sm text-[#8B5E3C] mb-2">{children}</div>
      <div className="bg-white rounded-lg shadow-sm p-3 min-h-[48px]"></div> {/* FIXED HERE */}
    </div>
  );
}

function GameCard({ game }: any) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
      <div className="flex justify-between font-semibold">
        <span>{game.teams.home.name}</span>
        <span>{game.goals.home} - {game.goals.away}</span>
        <span>{game.teams.away.name}</span>
      </div>
      <p className="text-xs text-[#8B5E3C]">{game.league.name} - {game.fixture.status.elapsed}'</p>
    </div>
  );
}

function FixtureCard({ game }: any) {
  const time = new Date(game.fixture.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
      <div className="flex justify-between">
        <span>{game.teams.home.name}</span>
        <span className="font-semibold">{time}</span>
        <span>{game.teams.away.name}</span>
      </div>
      <p className="text-xs text-[#8B5E3C]">{game.league.name}</p>
    </div>
  );
}

function ResultCard({ game }: any) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
      <div className="flex justify-between font-semibold">
        <span>{game.teams.home.name}</span>
        <span>{game.goals.home} - {game.goals.away}</span>
        <span>{game.teams.away.name}</span>
      </div>
      <p className="text-xs text-[#8B5E3C]">{game.league.name}</p>
    </div>
  );
}