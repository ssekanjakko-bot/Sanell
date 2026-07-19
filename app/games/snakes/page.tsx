"use client";
import { useState } from "react";

export default function Snakes() {
  const [pos, setPos] = useState(1);
  const [points, setPoints] = useState(0);
  const snakes = {17:7, 54:34, 62:19};
  const ladders = {4:14, 9:31, 20:38};

  const roll = () => {
    const d = Math.floor(Math.random()*6)+1;
    let newPos = pos + d;
    if(snakes[newPos]) newPos = snakes[newPos];
    if(ladders[newPos]) newPos = ladders[newPos];
    setPos(newPos);
    if(newPos >= 100){ setPoints(p=>p+20); alert("You Win! +20"); setPos(1); }
  }

  return (
    <div className="p-4 text-center bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-600">Snakes & Ladders 🐍🪜</h1>
      <p>Points: {points} | You are on: {pos}</p>
      <button onClick={roll} className="mt-4 px-6 py-3 bg-red-600 rounded font-bold">Roll Dice</button>
    </div>
  );
}