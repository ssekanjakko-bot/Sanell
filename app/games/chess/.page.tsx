"use client";
import { useState } from "react";
import { Chess } from "chess.js";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [points, setPoints] = useState(0);

  const botMove = () => {
    const moves = game.moves();
    if(moves.length > 0){
      const move = moves[Math.floor(Math.random() * moves.length)];
      game.move(move);
      setFen(game.fen());
      if(game.isCheckmate()){ setPoints(p=>p+5); alert("Bot Wins +5"); setGame(new Chess()); }
    }
  }

  const playerMove = (from:string, to:string) => {
    const result = game.move({from, to, promotion: 'q'});
    if(result){
      setFen(game.fen());
      if(game.isCheckmate()){ setPoints(p=>p+20); alert("You Win +20"); setGame(new Chess()); }
      else setTimeout(botMove, 500);
    }
  }

  return (
    <div className="p-4 text-center bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold text-red-600">Sanel Chess ♟️</h1>
      <p>Points: {points}</p>
      <p className="text-xs mt-2">Board FEN: {fen}</p>
      <p className="mt-4">*Full drag-drop board needs react-chessboard library. This is playable logic*</p>
      <button onClick={botMove} className="mt-4 px-4 py-2 bg-red-600 rounded">Bot Move Random</button>
    </div>
  );
}