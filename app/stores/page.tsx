"use client";
import { useState, useEffect } from "react";

const SPORTS = ["Football", "Basketball", "Tennis", "Cricket"];
const DATES = ["Yesterday", "Today", "Tomorrow"];

async function fetchFromOurAPI(sport: string, type: string, date: string) {
  const res = await fetch(`/api/sanel-sports?sport=${sport}&type=${type}&date=${date}`, {
    cache: "no-store"
  });
  const data = await res.json();
  return data.response || [];
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
      fetchFromOurAPI(activeSport, "live", date),
      fetchFromOurAPI(activeSport, "fixtures", date),
      fetchFromOurAPI(activeSport, "results", date),
    ]);
    setLive(liveRes);
    setFixtures(fixRes);
    setResults(resRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeSport, activeDate]);

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#4B2E1E]">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">Sanel Ug Sports</h1>
          <button onClick={fetchData} className="text-sm font-semibold border px-3 py-1 rounded-full">🔄 Refresh</button>
        </div>

        <div className="flex border-b border-[#D9CAB3] mb-3">
          {SPORTS.map(s => (
            <button key={s} onClick={() => setActiveSport(s)}
              className={`flex-1 py-2 text-sm font-bold ${activeSport === s? "bg-[#8B5E3C] text-white" : ""}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex justify-around mb-4 text-sm">
          {DATES.map(d => (
            <button key={d} onClick={() => setActiveDate(d)}
              className={`pb-1 ${activeDate === d? "border-b-2 border-[#8B5E3C] font-bold" : "text-[#8B5E3C]"}`}>
              {d}
            </button>
          ))}
        </div>

        <Section title="LIVE NOW" dot>
          {loading? "Loading..." : live.length === 0? `No live ${activeSport}` : live.map((g: any) => <GameCard key={g.fixture.id} game={g} live />)}
        </Section>

        <Section title={`${activeDate.toUpperCase()} FIXTURES`}>
          {loading? "Loading..." : fixtures.length === 0? `No fixtures for ${activeDate}` : fixtures.map((g: any) => <FixtureCard key={g.fixture.id} game={g} />)}
        </Section>

        <Section title="RESULTS">
          {loading? "Loading..." : results.length === 0? "No results yet" : results.map((g: any) => <ResultCard key={g.fixture.id} game={g} />)}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, dot = false }: any) {
  return (
    <div className="mb-5">
      <h2 className="font-bold text-lg mb-2 flex items-center gap-2">{dot && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>} {title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function GameCard({ game, live }: any) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
      <div className="flex-1">
        <p className="font-semibold text-sm">{game.teams.home.name} vs {game.teams.away.name}</p>
        <p className="text-xs text-[#8B5E3C]">{game.league.name} • {game.fixture.status.elapsed}'</p>
      </div>
      <div className="font-bold">{game.goals.home} - {game.goals.away}</div>
    </div>
  );
}
function FixtureCard({ game }: any) {
  const time = new Date(game.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between">
      <span className="text-sm">{game.teams.home.name} vs {game.teams.away.name}</span>
      <span className="text-sm font-bold">{time}</span>
    </div>
  );
}
function ResultCard({ game }: any) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between">
      <span className="text-sm">{game.teams.home.name} vs {game.teams.away.name}</span>
      <span className="text-sm font-bold">{game.goals.home} - {game.goals.away}</span>
    </div>
  );
}