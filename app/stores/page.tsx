'use client';
import { useState, useEffect } from "react";

// STEP 1: PASTE ALL YOUR API KEYS HERE ONCE. Leave "" if you don't have it yet
const API_KEYS = {
  football: "dd7ba7eea526856266682cd0d6f32335", // api-football.com
  basketball: "dd7ba7eea526856266682cd0d6f32335", // api-sports.io basketball
  tennis: "dd7ba7eea526856266682cd0d6f32335", // api-sports.io tennis
  cricket: "dd7ba7eea526856266682cd0d6f32335", // api-cricket.com
  rugby: "dd7ba7eea526856266682cd0d6f32335", // api-sports.io rugby
  ufc: "dd7ba7eea526856266682cd0d6f32335", // api-sports.io mma
  results: "", // No API needed, uses data from above
  news: "", // We will add news API later
  shop: "", // Your products
};

export default function LiveSports() {
  const [activeSport, setActiveSport] = useState("football");
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sports = [
    { id: "football", label: "⚽ Football Live", host: "v3.football.api-sports.io" },
    { id: "basketball", label: "🏀 Basketball Live", host: "v3.basketball.api-sports.io" },
    { id: "tennis", label: "🎾 Tennis Live", host: "v3.tennis.api-sports.io" },
    { id: "cricket", label: "🏏 Cricket Live", host: "v3.cricket.api-sports.io" },
    { id: "rugby", label: "🏉 Rugby", host: "v3.rugby.api-sports.io" },
    { id: "ufc", label: "🥊 UFC / Boxing", host: "v3.mma.api-sports.io" },
    { id: "results", label: "📊 Results & Standings", host: "" },
    { id: "news", label: "📰 Sports News", host: "" },
    { id: "shop", label: "🛒 Shop Jerseys", host: "" },
  ];

  // STEP 2: PASTE YOUR AFFILIATE LINKS HERE ONCE
  const BETPAWA_LINK = "https://your-betpawa-link.com";
  const ONEXBET_LINK = "https://your-1xbet-link.com";

  const MatchCard = ({ home, away, league, minute, score, homeLogo, awayLogo }: any) => {
    return (
      <div className="bg-white rounded-xl p-4 mb-3 shadow-md border">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{league}</span>
          <span className="text-green-600 font-bold">{minute}' LIVE</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 w-1/3">
            <img src={homeLogo} className="w-6 h-6" />
            <span className="text-sm font-semibold text-black">{home}</span>
          </div>
          <span className="text-2xl font-bold text-black">{score}</span>
          <div className="flex items-center gap-2 w-1/3 justify-end">
            <span className="text-sm font-semibold text-black">{away}</span>
            <img src={awayLogo} className="w-6 h-6" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <a href={BETPAWA_LINK} target="_blank" className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg font-semibold text-sm">BetPawa</a>
          <a href={ONEXBET_LINK} target="_blank" className="flex-1 bg-red-600 text-white text-center py-2 rounded-lg font-semibold text-sm">1XBet</a>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const sportConfig = sports.find(s => s.id === activeSport);
      const key = API_KEYS[activeSport as keyof typeof API_KEYS];

      if (!key ||!sportConfig?.host) { setGames([]); setLoading(false); return; }

      setLoading(true);
    
      let url = "";

      try {
// All API-Sports use same structure
if (activeSport === "football") {
  url = `https://${sportConfig.host}/fixtures?live=all`;
} else if (activeSport === "basketball") {
  url = `https://${sportConfig.host}/games?live=all`;
} else if (activeSport === "tennis") {
  url = `https://${sportConfig.host}/matches?live=all`;
} else if (activeSport === "cricket") {
  url = `https://${sportConfig.host}/matches?live=all`;
} else if (activeSport === "rugby") {
  url = `https://${sportConfig.host}/matches?live=all`;
} else if (activeSport === "ufc") {
  url = `https://${sportConfig.host}/fights?live=all`;
}

if (!url) {
  setGames([]);
  setLoading(false);
  return;
}

        const res = await fetch(url, {
          headers: { "x-api-key": key, "x-apisports-host": sportConfig.host }
        });
        const data = await res.json();
        setGames(data.response || []); // Auto removes finished games
      } catch (e) { console.log(e); }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 900000); // Auto refresh
    return () => clearInterval(interval);
  }, [activeSport]);

  const renderContent = () => {
    if (loading) return <p className="text-center text-gray-500">Loading {activeSport}...</p>;
    if (games.length === 0 && ["football","basketball","tennis","cricket","rugby","ufc"].includes(activeSport))
      return <p className="text-center text-gray-500">No live games right now</p>;

    if (["results"].includes(activeSport)) return <p className="text-center py-10 text-black">📊 Standings + Results will show here</p>;
    if (["news"].includes(activeSport)) return <p className="text-center py-10 text-black">📰 Latest sports news will show here</p>;
    if (["shop"].includes(activeSport)) return <p className="text-center py-10 text-black">🛒 Your jerseys/products go here</p>;

    return games.map((g) => (
      <MatchCard
        key={g.id || g.fixture?.id || g.match?.id}
        home={g.teams?.home?.name || g.teams?.home?.team?.name}
        away={g.teams?.away?.name || g.teams?.away?.team?.name}
        league={g.league?.name || g.league?.country}
        minute={g.fixture?.status?.elapsed || g.status?.long}
        score={`${g.goals?.home || g.scores?.home?.total || 0} - ${g.goals?.away || g.scores?.away?.total || 0}`}
        homeLogo={g.teams?.home?.logo}
        awayLogo={g.teams?.away?.logo}
      />
    ));
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* CATEGORIES */}
      <div className="flex gap-2 overflow-x-auto p-4 bg-[#0d1b2a] sticky top-0">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setActiveSport(sport.id)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
              activeSport === sport.id? "bg-red-600 text-white" : "bg-[#1b263b] text-white"
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4 text-black">{sports.find(s=>s.id===activeSport)?.label}</h3>
        {renderContent()}
      </div>
    </div>
  );
}