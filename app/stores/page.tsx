'use client';

import { useState } from "react";

export default function LiveSports() {
  const [activeSport, setActiveSport] = useState("football");

  const sports = [
    { id: "football", label: "⚽ Football Live" },
    { id: "basketball", label: "🏀 Basketball Live" },
    { id: "tennis", label: "🎾 Tennis Live" },
    { id: "cricket", label: "🏏 Cricket Live" },
    { id: "rugby", label: "🏉 Rugby" },
    { id: "ufc", label: "🥊 UFC / Boxing" },
    { id: "results", label: "📊 Results & Standings" },
    { id: "news", label: "📰 Sports News" },
    { id: "shop", label: "🛒 Shop Jerseys" },
  ];

  const BETPAWA_LINK = "YOUR_BETPAWA_LINK";
  const ONEXBET_LINK = "YOUR_1XBET_LINK";

  const renderContent = () => {
    switch (activeSport) {
      case "football":
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Football - Today</h3>
            <MatchCard 
              teams="Arsenal vs Chelsea" 
              time="9:00 PM | Premier League"
              betpawa={BETPAWA_LINK}
              onebet={ONEXBET_LINK}
            />
            <MatchCard 
              teams="Barcelona vs Real Madrid" 
              time="11:00 PM | La Liga"
              betpawa={BETPAWA_LINK}
              onebet={ONEXBET_LINK}
            />
          </div>
        );
      case "basketball":
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">NBA - Today</h3>
            <MatchCard 
              teams="Lakers vs Warriors" 
              time="2:30 AM | NBA"
              betpawa={BETPAWA_LINK}
            />
          </div>
        );
      case "tennis": return <p>🎾 ATP/WTA Live matches will load here</p>;
      case "cricket": return <p>🏏 IPL & World Cup matches here</p>;
      case "rugby": return <p>🏉 Uganda Cranes + International Rugby</p>;
      case "ufc": return <p>🥊 Next UFC / Boxing fights + odds</p>;
      case "results": return <p>📊 Live scores and league tables</p>;
      case "news": return <p>📰 Latest sports news</p>;
      case "shop": return <p>🛒 Your old sports products/jerseys go here</p>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto p-4 bg-[#0d1b2a] sticky top-0">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setActiveSport(sport.id)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition
              ${activeSport === sport.id 
                ? "bg-red-600 text-white" 
                : "bg-[#1b263b] text-white hover:bg-[#415a77]"}`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
}

// Reusable Match Card Component
function MatchCard({ teams, time, betpawa, onebet }: any) {
  return (
    <div className="bg-white rounded-xl p-4 mb-3 shadow-md">
      <div className="text-lg font-bold">{teams}</div>
      <div className="text-sm text-gray-600">{time}</div>
      <div className="flex gap-2 mt-3">
        {betpawa && (
          <a href={betpawa} target="_blank" 
            className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg font-semibold">
            Bet on BetPawa
          </a>
        )}
        {onebet && (
          <a href={onebet} target="_blank" 
            className="flex-1 bg-red-600 text-white text-center py-2 rounded-lg font-semibold">
            Bet on 1xBet
          </a>
        )}
        <a href="#" className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg font-semibold">
          Watch
        </a>
      </div>
    </div>
  );
}