"use client";
import { useState } from "react";

export default function Draft() {
  const [board, setBoard] = useState(Array(8).fill(null).map(() => Array(8).fill(0)));
  const [points, setPoints] = useState(0);

  // Setup pieces
  useState(() => {
    const b = Array(8).fill(null).map(() => Array(8).fill(0));
    for(let i=0; i<3; i++) for(let j=0; j<8; j++) if((i+j)%2===1) b[i][j]=1; // Bot
    for(let i=5; i<8; i++) for(let j=0; j<8; j++) if((i+j)%2===1) b[i][j]=2; // You
    setBoard(b);
  });

  const botMove = () => {
    setPoints(p=>p+5); alert("Bot moved. +5 to you for playing");
  }

  return (
    <div className="p-4 text-center bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-600">Draft/Dame 👑</h1>
      <p>Points: {points}</p>
      <div className="grid grid-cols-8 gap-0 w-80 mx-auto mt-4">
        {board.map((row,i) => row.map((cell,j) => (
          <div key={`${i}-${j}`} className={`w-10 h-10 ${(i+j)%2===0?'bg-[#f0d9b5]':'bg-[#b58863]'}`}>
            {cell===1 && <div className="w-8 h-8 bg-black rounded-full m-1"></div>}
            {cell===2 && <div className="w-8 h-8 bg-red-600 rounded-full m-1"></div>}
          </div>
        )))}
      </div>
      <button onClick={botMove} className="mt-4 px-4 py-2 bg-red-600 rounded">Bot Move</button>
    </div>
  );
}