"use client";
import { useEffect, useState } from "react";

const COFFEE = "#6F4E37";
const COFFEE_LIGHT = "#A67B5B";
const API_KEY = "dd7ba7eea526856266682cd0d6f32335" // <- PUT YOUR KEY HERE

const sports = [
  { name: "Football", host: "v3.football.api-sports.io", endpoint: "fixtures" },
  { name: "Basketball", host: "v2.basketball.api-sports.io", endpoint: "games" },
  { name: "Tennis", host: "v1.tennis.api-sports.io", endpoint: "matches" },
  { name: "Cricket", host: "v2.cricket.api-sports.io", endpoint: "matches" },
];

type Game = any;

export default function SportsPage() {
  const [activeSport, setActiveSport] = useState(sports[0]);
  const [activeDate, setActiveDate] = useState("Today");
  const [live, setLive] = useState<Game[]>([]);
  const [today, setToday] = useState<Game[]>([]);
  const [results, setResults] = useState<Game[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLive([]); setToday([]); setResults([]);

      let dateParam = "";
      if(activeDate === "Today") dateParam = getDate(0);
      if(activeDate === "Yesterday") dateParam = getDate(-1);
      if(activeDate === "Tomorrow") dateParam = getDate(1);

      const headers = {
        "x-api-key": API_KEY,
        "x-apisports-host": activeSport.host
      };

      try {
        // 1. LIVE GAMES
        const liveRes = await fetch(`https://${activeSport.host}/${activeSport.endpoint}?live=all`, { headers });
        const liveJson = await liveRes.json();
        setLive(liveJson.response || []);

        // 2. TODAY/TOMORROW/YESTERDAY FIXTURES
        const todayRes = await fetch(`https://${activeSport.host}/${activeSport.endpoint}?date=${dateParam}`, { headers });
        const todayJson = await todayRes.json();
        const allGames = todayJson.response || [];

        // Split into upcoming and finished
        setToday(allGames.filter((g: any) => g.fixture?.status?.short === "NS" || g.status?.short === "NS"));
        setResults(allGames.filter((g: any) => g.fixture?.status?.short === "FT" || g.status?.short === "FT"));

        // 3. NEWS API GOES HERE
        // TODO: Add your news API call and setNews()

      } catch(e) {
        console.error("API Error:", e)
      }
      setLoading(false);
    };
    fetchData();
  }, [activeSport, activeDate]);

  const getTeamName = (g: any) => g.teams?.home?.name || g.home?.name || g.home;
  const getAwayName = (g: any) => g.teams?.away?.name || g.away?.name || g.away;
  const getScore = (g: any) => `${g.goals?.home?? g.scores?.home?? "-"} - ${g.goals?.away?? g.scores?.away?? "-"}`;
  const getTime = (g: any) => g.fixture?.status?.elapsed? `LIVE ${g.fixture.status.elapsed}'` : g.status?.timer || g.league?.round;
  const getLeague = (g: any) => g.league?.name || g.league;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDFBF7" }}>
      <div className="w-full max-w-[1400px] mx-auto p-4">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold" style={{ color: COFFEE }}>Sanel Ug Sports</h1>
          <button onClick={() => window.location.reload()} className="text-sm font-semibold" style={{ color: COFFEE }}>🔄 Refresh</button>
        </div>

        {/* SPORT TABS */}
        <div className="flex gap-2 mb-4 border-b-2 overflow-x-auto" style={{ borderColor: COFFEE_LIGHT }}>
          {sports.map((s) => (
            <button
              key={s.name}
              onClick={() => setActiveSport(s)}
              className="px-6 py-3 font-semibold whitespace-nowrap transition"
              style={{
                backgroundColor: activeSport.name === s.name? COFFEE : "transparent",
                color: activeSport.name === s.name? "white" : COFFEE,
                borderBottom: activeSport.name === s.name? `3px solid ${COFFEE}` : "3px solid transparent"
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* DATE FILTER */}
        <div className="flex justify-center gap-4 mb-6">
          {["Yesterday", "Today", "Tomorrow"].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className="px-4 py-2 font-semibold"
              style={{
                color: activeDate === d? COFFEE : COFFEE_LIGHT,
                borderBottom: activeDate === d? `2px solid ${COFFEE}` : "2px solid transparent"
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {loading && <p className="text-center" style={{color: COFFEE}}>Loading {activeSport.name}...</p>}

        {/* LIVE NOW */}
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: COFFEE }}>
          <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: "red" }}></span> LIVE NOW
        </h2>
        {live.length === 0 &&!loading && <p className="mb-6" style={{color: COFFEE_LIGHT}}>No live {activeSport.name} games</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {live.map((g, i) => (
            <div key={i} className="bg-white p-5 rounded-xl shadow-md" style={{ borderLeft: `4px solid red` }}>
              <p className="text-xs mb-2" style={{ color: COFFEE_LIGHT }}>{getLeague(g)}</p>
              <div className="flex justify-between items-center text-lg font-bold" style={{ color: COFFEE }}>
                <span>{getTeamName(g)}</span>
                <span className="text-2xl">{getScore(g)}</span>
                <span>{getAwayName(g)}</span>
              </div>
              <p className="text-center font-semibold mt-2" style={{ color: "red" }}>{getTime(g)}</p>
            </div>
          ))}
        </div>

        {/* 2 COLUMN GRID BELOW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: FIXTURES */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-3" style={{ color: COFFEE }}>{activeDate.toUpperCase()} FIXTURES</h2>
            {today.length === 0 &&!loading && <p style={{color: COFFEE_LIGHT}}>No {activeSport.name} fixtures for {activeDate}</p>}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              {today.map((g, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2" style={{ borderColor: "#eee" }}>
                  <div>
                    <p className="text-xs" style={{ color: COFFEE_LIGHT }}>{getLeague(g)}</p>
                    <p className="font-semibold" style={{ color: COFFEE }}>{getTeamName(g)} vs {getAwayName(g)}</p>
                  </div>
                  <span className="font-bold text-lg" style={{ color: COFFEE }}>
                    {new Date(g.fixture?.date || g.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="space-y-6">
            {/* RESULTS */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: COFFEE }}>RESULTS</h2>
              {results.length === 0 &&!loading && <p style={{color: COFFEE_LIGHT}}>No results yet</p>}
              <div className="bg-white rounded-xl shadow p-4 space-y-3">
                {results.map((g, i) => (
                  <div key={i} className="border-b pb-2" style={{ borderColor: "#eee" }}>
                    <p className="text-xs" style={{ color: COFFEE_LIGHT }}>{getLeague(g)}</p>
                    <p className="font-semibold" style={{ color: COFFEE }}>{getTeamName(g)} {getScore(g)} {getAwayName(g)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* NEWS */}
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: COFFEE }}>LATEST NEWS</h2>
              {news.length === 0 && <p style={{color: COFFEE_LIGHT}}>Add News API to show headlines</p>}
              <div className="bg-white rounded-xl shadow p-4 space-y-3">
                {news.map((n, i) => (
                  <div key={i} className="border-b pb-2" style={{ borderColor: "#eee" }}>
                    <p className="font-semibold text-sm" style={{ color: COFFEE }}>{n.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="text-center mt-12 pt-4 border-t" style={{ borderColor: COFFEE_LIGHT, color: COFFEE_LIGHT }}>
          © Sanel Ug 2026
        </footer>
      </div>
    </div>
  );
}