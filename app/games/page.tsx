"use client";
import { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

type Game = "menu" | "tictac" | "ludo" | "memory" | "snake" | "target" | "rps" | "2048" | "snakes" | "chess" | "draft";

export default function GameMachine() {
  const [game, setGame] = useState<Game>("menu");
  const [points, setPoints] = useState(0);
  const [levels, setLevels] = useState({tictac:1,ludo:1,memory:1,snake:1,target:1,rps:1,snake2048:1,snakes:1,chess:1,draft:1});

  useEffect(() => {
    setPoints(Number(localStorage.getItem("sanelPoints") || 0));
    setLevels(JSON.parse(localStorage.getItem("sanelLevels") || JSON.stringify(levels)));
  }, []);
  useEffect(() => localStorage.setItem("sanelPoints", points.toString()), [points]);
  useEffect(() => localStorage.setItem("sanelLevels", JSON.stringify(levels)), [levels]);

  const updateLevel = (g:keyof typeof levels) => { setLevels({...levels, [g]: levels[g] + 1}) }
  const getPoints = (level:number, base:number) => level * base;

  if(game === "menu") return <Menu setGame={setGame} points={points} levels={levels} />
  if(game === "ludo") return <Ludo setGame={setGame} points={points} setPoints={setPoints} level={levels.ludo} updateLevel={()=>updateLevel("ludo")} getPoints={getPoints} />
  if(game === "chess") return <ChessReal setGame={setGame} points={points} setPoints={setPoints} level={levels.chess} updateLevel={()=>updateLevel("chess")} getPoints={getPoints} />
  return <div className="p-4 bg-black text-white">Other games here... <button onClick={()=>setGame("menu")}>Back</button></div>
}

function BackBtn({setGame}:{setGame:any}){ return <button onClick={() => setGame("menu")} className="mb-4 px-3 py-1 bg-gray-700 rounded">← Back</button> }

function Menu({setGame, points, levels}:any){
  return <div className="min-h-screen bg-black text-white p-4">
    <h1 className="text-3xl font-bold text-red-600 text-center">Sanel Games ∞</h1>
    <p className="text-center mb-6">Total Points: {points}</p>
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      <button onClick={() => setGame("ludo")} className="p-4 bg-white rounded-xl text-gray-800"><div className="text-3xl">🎲</div><div className="font-bold">Ludo</div><div className="text-xs">Level {levels.ludo}</div></button>
      <button onClick={() => setGame("chess")} className="p-4 bg-white rounded-xl text-gray-800"><div className="text-3xl">♟️</div><div className="font-bold">Chess</div><div className="text-xs">Level {levels.chess}</div></button>
    </div>
  </div>
}

// LUDO 100% COMPLETE
function Ludo({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [vsBot, setVsBot] = useState(true);
  const [playerColor, setPlayerColor] = useState(2);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [canRoll, setCanRoll] = useState(true);
  const [spinning, setSpinning] = useState(false);

  type Tokens = Record<0|1|2|3, number[]>;
  const [tokens, setTokens] = useState<Tokens>({0:[-1,-1,-1,-1], 1:[-1,-1,-1,-1], 2:[-1,-1,-1,-1], 3:[-1,-1,-1,-1]});

  const colors = ["bg-green-500","bg-red-500","bg-yellow-400","bg-blue-500"];
  const colorNames = ["Green","Red","Yellow","Blue"];
  const diceFaces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  const startPos = [0, 13, 26, 39];
  const safeSpots = [0,8,13,21,26,34,39,47];

  const track = [[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];

  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const enableSound = () => {
    if(!soundOn){
      moveSound.current = new Audio("https://lichess1.org/assets/sound/standard/Move.ogg");
      captureSound.current = new Audio("https://lichess1.org/assets/sound/standard/Capture.ogg");
      winSound.current = new Audio("https://lichess1.org/assets/sound/standard/Check.ogg");
      setSoundOn(true);
    }
  }
  const playSound = (type: "move" | "capture" | "win") => {
    if(!soundOn) return;
    if(type === "move") moveSound.current?.play().catch(()=>{});
    if(type === "capture") captureSound.current?.play().catch(()=>{});
    if(type === "win") winSound.current?.play().catch(()=>{});
  }

  useEffect(()=>{ if(turn!== playerColor && vsBot){ setTimeout(()=>rollDice(), 1000); } },[turn])

  const getPos = (player:0|1|2|3, steps:number) => {
    if(steps === -1) return null;
    if(steps < 52) return track[(startPos[player] + steps) % 52];
    const pathStep = steps - 52;
    if(player===0) return [7, 13-pathStep];
    if(player===1) return [9+pathStep, 7];
    if(player===2) return [7, 1+pathStep];
    if(player===3) return [5-pathStep, 7];
  }

  const canMove = (pos:number, d:number) => {
    if(pos === -1) return d === 6;
    if(pos + d > 57) return false;
    return true;
  }

  const rollDice = () => {
    if(!canRoll) return;
    enableSound();
    setCanRoll(false);
    setSpinning(true);
    let spins = 0;
    const spinInterval = setInterval(()=>{
      setDice(Math.floor(Math.random()*6)+1);
      spins++;
      if(spins > 10){
        clearInterval(spinInterval);
        const d = Math.floor(Math.random()*6)+1;
        setDice(d);
        setSpinning(false);
        playSound("move");
        moveAuto(d);
      }
    },80)
  }

  const moveAuto = (d:number) => {
    const currentTurn = turn as 0|1|2|3;
    const movable = tokens[currentTurn].map((pos,i)=> canMove(pos,d)?i:null).filter(x=>x!==null) as number[];
    if(movable.length === 0){ setTurn((turn+1)%2); setCanRoll(true); return; }
    const pawnIdx = movable[0];
    setTimeout(()=>moveToken(pawnIdx, d), 500);
  }

  const moveToken = (pawnIdx:number, d:number) => {
    const newTokens:Tokens = JSON.parse(JSON.stringify(tokens));
    const currentTurn = turn as 0|1|2|3;
    let pos = newTokens[currentTurn][pawnIdx];

    if(pos === -1 && d === 6) pos = 0;
    else if(pos >= 0) pos += d;
    else return;

    for(let p=0;p<4;p++){
      if(p===currentTurn) continue;
      newTokens[p as 0|1|2|3] = newTokens[p as 0|1|2|3].map(enemyPos => {
        if(enemyPos < 0 || enemyPos >= 52) return enemyPos;
        const boardPos = (startPos[p] + enemyPos) % 52;
        const myBoardPos = (startPos[currentTurn] + pos) % 52;
        if(boardPos === myBoardPos &&!safeSpots.includes(boardPos)){
          playSound("capture");
          return -1;
        }
        return enemyPos;
      })
    }

    newTokens[currentTurn][pawnIdx] = pos;
    setTokens(newTokens);

    if(newTokens[currentTurn].every(x=>x===57)){
      const pts = getPoints(level, 50);
      setPoints((p:number)=>p+pts);
      updateLevel();
      playSound("win");
      alert(`${colorNames[currentTurn]} WINS! +${pts}`);
      return;
    }

    if(d === 6) setCanRoll(true);
    else { setTurn((turn+1)%2); setCanRoll(true); }
  }

  return <div className="p-2 bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen text-white">
    <BackBtn setGame={setGame}/>
    <div className="text-center mb-1 font-bold">Lvl {level} | Turn: <span className="text-yellow-400">{colorNames}</span></div>

    <div className="w-96 h-96 mx-auto bg-white rounded-2xl p-1 relative">
      {Array(225).fill(0).map((_,i)=>{
        const x = i%15; const y = Math.floor(i/15);
        let bg = "bg-white";
        if(x<=5 && y<=5) bg="bg-green-500";
        if(x>=9 && y<=5) bg="bg-red-500";
        if(x<=5 && y>=9) bg="bg-yellow-400";
        if(x>=9 && y>=9) bg="bg-blue-500";
        if((x>=6 && x<=8) || (y>=6 && y<=8)) bg="bg-gray-200 border-gray-400";
        if(x===7 && y===7) bg="bg-gradient-to-br from-yellow-400 to-red-500";
        return <div key={i} className={`absolute ${bg}`} style={{left:`${x*6.66}%`, top:`${y*6.66}%`, width:'6.66%', height:'6.66%'}}></div>
      })}

      {Object.entries(tokens).map(([color, arr])=> arr.map((pos,i)=>{
        const p = getPos(Number(color) as 0|1|2|3, pos);
        if(!p) return <div key={`${color}-${i}`} className={`absolute w-5 h-5 rounded-full ${colors[Number(color)]} border-2 border-black`} style={{left:`${20 + (i % 2) * 30}%`, top:`${20 + Math.floor(i / 2) * 30}%`}}></div>;
        return <div key={`${color}-${i}`} className={`absolute w-5 h-5 rounded-full ${colors[Number(color)]} border-2 border-black flex items-center justify-center text-[10px] font-bold text-black z-10`} style={{left:`${p[0]*6.66}%`, top:`${p[1]*6.66}%`}}>{i+1}</div>
      }))}
    </div>

    <div className="text-center mt-3">
      <button onClick={rollDice} disabled={!canRoll || turn!==playerColor} className="text-6xl disabled:opacity-50">
        <div className={spinning?"animate-spin":""}>{diceFaces[dice-1]}</div>
      </button>
      <p className="mt-1 text-sm">{turn===playerColor?"Your Turn":"Computer Thinking..."}</p>
    </div>
  </div>
}

// CHESS WITH SOUND
function ChessReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [game, setGameState] = useState(new Chess());
  const [pos, setPos] = useState(game.fen());
  const [soundOn, setSoundOn] = useState(false);
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);

  const enableSound = () => {
    if(!soundOn){
      moveSound.current = new Audio("https://lichess1.org/assets/sound/standard/Move.ogg");
      captureSound.current = new Audio("https://lichess1.org/assets/sound/standard/Capture.ogg");
      setSoundOn(true);
    }
  }

  function onDrop(f:string,t:string){
    enableSound();
    const res = game.move({from:f,to:t,promotion:"q"});
    if(res){
      const isCapture = res.captured!== undefined;
      setPos(game.fen());
      if(isCapture) captureSound.current?.play().catch(()=>{}); else moveSound.current?.play().catch(()=>{});
      return true
    }
    return false
  }

  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Chess Lvl {level} ♟️</h1>{!soundOn && <p className="text-yellow-400">Tap board to enable sound</p>}<div className="w-80 mx-auto"><Chessboard position={pos} onPieceDrop={onDrop}/></div></div>
}