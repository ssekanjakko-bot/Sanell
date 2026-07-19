"use client";

import Link from "next/link";

export default function GameCenter() {
  const games = [
    { name: "Snakes & Ladders", path: "/games/snakes", emoji: "🐍🪜" },
    { name: "Sanel Chess", path: "/games/chess", emoji: "♟️" },
    { name: "Draft/Dame", path: "/games/draft", emoji: "👑" },
    { name: "Ludo Sanel", path: "/games/ludo", emoji: "🎲" },
    { name: "SOS Tic-Tac-Toe", path: "/games/tictac", emoji: "⭕❌" },
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-red-600 text-center mb-2">Sanel Game Center 🎮</h1>
      <p className="text-center mb-6">Earn Points. Unlock Badges. 🔵🟡🔴⚫⚪</p>

      <div className="grid grid-cols-2 gap-4">
        {games.map((game) => (
          <Link 
            key={game.path} 
            href={game.path}
            className="p-6 bg-white rounded-xl shadow border hover:scale-105 transition text-center"
          >
            <div className="text-4xl mb-2">{game.emoji}</div>
            <div className="font-bold">{game.name}</div>
            <div className="text-xs text-gray-500 mt-1">Play vs Bot</div>
          </Link>
        ))}
      </div>
    </div>
  );
}