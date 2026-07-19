import React, { useState, useEffect } from "react";

type BadgeKey = "blue" | "yellow" | "red" | "grey" | "white";

export default function SnakesLadders() {
  const [youPos, setYouPos] = useState(1);
  const [botPos, setBotPos] = useState(1);
  const [yourTurn, setYourTurn] = useState(true);
  const [dice, setDice] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [badges, setBadges] = useState<Record<BadgeKey, boolean>>({
    blue: false, yellow: false, red: false, grey: false, white: false
  });

  // Snakes = bad safety, Ladders = good safety
  const snakes: Record<number, number> = {17:7, 54:34, 62:19, 87:24, 93:73};
  const ladders: Record<number, number> = {4:14, 9:31, 20:38, 28:84, 51:67, 71:91};

  const rollDice = () => {
    if (!yourTurn) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    movePlayer("you", roll);
    setYourTurn(false);
    setTimeout(() => botTurn(), 800);
  };

  const botTurn = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    movePlayer("bot", roll);
    setYourTurn(true);
  };

  const movePlayer = (player: "you" | "bot", roll: number) => {
    let pos = player === "you"? youPos : botPos;
    pos += roll;
    if (pos > 100) pos = 100 - (pos - 100); // bounce back

    if (snakes[pos]) pos = snakes[pos];
    if (ladders[pos]) pos = ladders[pos];

    if (player === "you") setYouPos(pos); else setBotPos(pos);

    if (pos >= 100) endGame(player);
  };

  const endGame = (winner: "you" | "bot") => {
    setGamesPlayed(prev => prev + 1);
    if (winner === "you") {
      setPoints(p => p + 20);
      setTotalWins(w => w + 1);
      setWinStreak(s => s + 1);
      alert("You Win! +20 Points 🎉");
    } else {
      setPoints(p => p + 5);
      setWinStreak(0);
      alert("Bot Wins! +5 Points");
    }
    setYouPos(1); setBotPos(1); setYourTurn(true);
  };

  useEffect(() => {
    const newBadges: Record<BadgeKey, boolean> = {
      blue: gamesPlayed >= 5,
      yellow: winStreak >= 3,
      red: totalWins >= 15,
      grey: totalWins >= 5, // win 5 games in one game type
      white: totalWins >= 40 && points >= 500 // MOST POWERFUL
    };
    setBadges(newBadges);
  }, [gamesPlayed, winStreak, totalWins, points]);

  const renderCell = (num: number) => {
    let bg = "bg-white";
    if (ladders[num]) bg = "bg-green-100"; // Ladder = safety
    if (snakes[num]) bg = "bg-red-100"; // Snake = danger

    return (
      <div key={num} className={`w-10 h-10 border text-[9px] relative flex items-center justify-center ${bg}`}>
        {num}
        {youPos === num && <div className="absolute bottom-1 right-1 w-3 h-3 bg-red-600 rounded-full"></div>}
        {botPos === num && <div className="absolute bottom-1 left-1 w-3 h-3 bg-blue-600 rounded-full"></div>}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-red-600">Sanel Game Center 🎮</h1>
      <h2 className="text-lg mb-2">Snakes & Ladders: Safety Edition</h2>

      <div className="mb-3">
        <p><b>Points:</b> {points}</p>
        <p><b>Badges:</b> 
          <span className={badges.blue? "" : "opacity-30"}>🔵</span>
          <span className={badges.yellow? "" : "opacity-30"}>🟡</span>
          <span className={badges.red? "" : "opacity-30"}>🔴</span>
          <span className={badges.grey? "" : "opacity-30"}>⚫</span>
          <span className={badges.white? "" : "opacity-30"}>⚪</span>
        </p>
        <p className="text-sm">White = Sanel Legend 🏆</p>
      </div>

      <div className="grid grid-cols-10 gap-0.5 mb-4 mx-auto w-fit">
        {Array.from({ length: 100 }, (_, i) => 100 - i).map(renderCell)}
      </div>

      <p><b>Dice:</b> {dice?? "-"}</p>
      <button 
        onClick={rollDice} 
        disabled={!yourTurn}
        className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold disabled:opacity-50"
      >
        {yourTurn? "Roll Dice" : "Bot Thinking..."}
      </button>
    </div>
  );
}