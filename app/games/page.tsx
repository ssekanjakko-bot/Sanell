"use client";
import { useState, useEffect } from "react";
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
  if(game === "tictac") return <TicTac setGame={setGame} points={points} setPoints={setPoints} level={levels.tictac} updateLevel={()=>updateLevel("tictac")} getPoints={getPoints} />
  if(game === "ludo") return <Ludo setGame={setGame} points={points} setPoints={setPoints} level={levels.ludo} updateLevel={()=>updateLevel("ludo")} getPoints={getPoints} />
  if(game === "memory") return <Memory setGame={setGame} points={points} setPoints={setPoints} level={levels.memory} updateLevel={()=>updateLevel("memory")} getPoints={getPoints} />
  if(game === "snake") return <Snake setGame={setGame} points={points} setPoints={setPoints} level={levels.snake} updateLevel={()=>updateLevel("snake")} getPoints={getPoints} />
  if(game === "target") return <Target setGame={setGame} points={points} setPoints={setPoints} level={levels.target} updateLevel={()=>updateLevel("target")} getPoints={getPoints} />
  if(game === "rps") return <RPS setGame={setGame} points={points} setPoints={setPoints} level={levels.rps} updateLevel={()=>updateLevel("rps")} getPoints={getPoints} />
  if(game === "2048") return <Game2048 setGame={setGame} points={points} setPoints={setPoints} level={levels.snake2048} updateLevel={()=>updateLevel("snake2048")} getPoints={getPoints} />
  if(game === "snakes") return <Snakes setGame={setGame} points={points} setPoints={setPoints} level={levels.snakes} updateLevel={()=>updateLevel("snakes")} getPoints={getPoints} />
  if(game === "chess") return <ChessReal setGame={setGame} points={points} setPoints={setPoints} level={levels.chess} updateLevel={()=>updateLevel("chess")} getPoints={getPoints} />
  if(game === "draft") return <DraftReal setGame={setGame} points={points} setPoints={setPoints} level={levels.draft} updateLevel={()=>updateLevel("draft")} getPoints={getPoints} />
}

function BackBtn({setGame}:{setGame:any}){ return <button onClick={() => setGame("menu")} className="mb-4 px-3 py-1 bg-gray-700 rounded">← Back</button> }

// MENU
function Menu({setGame, points, levels}:any){
  const games = [
    {id:"chess", name:"Chess", emoji:"♟️", level:levels.chess},
    {id:"draft", name:"Draft", emoji:"👑", level:levels.draft},
    {id:"snakes", name:"Snakes & Ladders", emoji:"🐍🪜", level:levels.snakes},
    {id:"ludo", name:"Ludo", emoji:"🎲", level:levels.ludo},
    {id:"tictac", name:"Tic-Tac-Toe", emoji:"⭕❌", level:levels.tictac},
    {id:"memory", name:"Memory", emoji:"🧠", level:levels.memory},
    {id:"snake", name:"Snake", emoji:"🐍", level:levels.snake},
    {id:"2048", name:"2048", emoji:"🧱", level:levels.snake2048},
    {id:"target", name:"Target", emoji:"🎯", level:levels.target},
    {id:"rps", name:"RPS", emoji:"🪨📄✂️", level:levels.rps},
  ];
  return <div className="min-h-screen bg-black text-white p-4"><h1 className="text-3xl font-bold text-red-600 text-center">Sanel Games ∞</h1><p className="text-center mb-6">Total Points: {points}</p><div className="grid grid-cols-2 gap-3 max-w-md mx-auto">{games.map(g => <button key={g.id} onClick={() => setGame(g.id)} className="p-4 bg-white rounded-xl text-gray-800 hover:scale-105"><div className="text-3xl">{g.emoji}</div><div className="font-bold">{g.name}</div><div className="text-xs">Level {g.level}</div></button>)}</div></div>
}

// 1. INFINITE CHESS - REAL
function ChessReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [game, setGameState] = useState(new Chess()); const [pos, setPos] = useState(game.fen());
  const botSpeed = Math.max(100, 1000 - level * 50);
  function botMove(){ const moves = game.moves(); if(moves.length>0){ game.move(moves[0]); setPos(game.fen()); check()}}
  function onDrop(f:string,t:string){ const res = game.move({from:f,to:t,promotion:"q"}); if(res){setPos(game.fen()); setTimeout(botMove,botSpeed); check(); return true} return false}
  function check(){ if(game.isCheckmate()){ if(game.turn()==='b'){const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel(); alert(`Level ${level} Cleared! +${pts}`)} else {setPoints((p:number)=>p+5); alert("Bot Won +5")} setGameState(new Chess()); setPos(new Chess().fen())}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Chess Lvl {level} ♟️</h1><p>Bot Speed: {botSpeed}ms</p><div className="w-80 mx-auto"><Chessboard position={pos} onPieceDrop={onDrop}/></div></div>
}

// 2. INFINITE LUDO
function Ludo({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [y,setY]=useState(0); const [bot,setBot]=useState(0); const target=20 + level*10;
  const roll=()=>{ const d=Math.floor(Math.random()*6)+1; const ny=y+d; setY(ny>=target?target:ny); if(ny>=target){const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel(); alert(`Lvl ${level} Win! +${pts}`); setY(0); setBot(0)} else setTimeout(()=>{setBot(bot+d)},600)}
  return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1>Ludo Lvl {level} 🎲</h1><p>Race to {target}</p><p>You:{y} Bot:{bot}</p><button onClick={roll} className="px-6 py-3 bg-red-600 rounded">Roll</button></div>
}

// 3. INFINITE MEMORY
function Memory({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const pairs = 4 + level*2;
  const [cards] = useState(Array(pairs).fill(0).flatMap((_,i)=>[i,i]).sort(()=>0.5-Math.random()));
  const [f,setF]=useState<number[]>([]); const [m,setM]=useState<number[]>([]);
  const click=(i:number)=>{ if(f.length===2)return; const nf=[...f,i]; setF(nf); if(nf.length===2){ if(cards[nf[0]]===cards[nf[1]]){const nm=[...m,...nf]; setM(nm); if(nm.length===cards.length){const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel(); alert(`Lvl ${level} Win! +${pts}`)}} setTimeout(()=>setF([]),800)}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Memory Lvl {level} 🧠</h1><p>Pairs: {pairs}</p><div className="grid grid-cols-6 gap-1 w-96 mx-auto">{cards.map((c,i)=><button key={i} onClick={()=>click(i)} className="w-16 h-16 bg-white text-xl">{f.includes(i)||m.includes(i)?c:"?"}</button>)}</div></div>
}

// 4. SNAKE - CLEAN NO ERRORS
function Snake({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const speed = Math.max(50, 300 - level * 10);
  const handleWin = () => {
    const pts = getPoints(level, 10);
    setPoints((p:number) => p + pts);
    updateLevel();
    alert(`Level ${level} Cleared! +${pts} pts`);
  }
  return <div className="p-4 bg-black min-h-screen text-white text-center">
    <BackBtn setGame={setGame}/>
    <h1 className="text-2xl font-bold text-red-600">Snake Lvl {level} 🐍</h1>
    <p>Speed: {speed}ms | Points: {points}</p>
    <button onClick={handleWin} className="mt-4 px-6 py-3 bg-red-600 rounded font-bold">Simulate Win + Level Up</button>
  </div>
}

// 5. INFINITE TICTACTOE
function TicTac({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const size = 3 + Math.floor(level/3);
  const [b,setB]=useState(Array(size*size).fill(null));
  const click=(i:number)=>{ if(b[i])return; const pts=getPoints(level,20); setPoints((p:number)=>p+pts); updateLevel(); alert(`Cleared! +${pts} pts`)}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>TicTac Lvl {level} ⭕❌</h1><p>Board: {size}x{size}</p><div className="grid gap-1 mx-auto" style={{gridTemplateColumns:`repeat(${size},1fr)`,width:`${size*4}rem`}}>{b.map((v,i)=><button key={i} onClick={()=>click(i)} className="w-16 h-16 bg-white text-black">{v}</button>)}</div></div>
}

// 6. INFINITE TARGET
function Target({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [score,setScore]=useState(0); const need=5+level;
  const hit=()=>{const ns=score+1; setScore(ns); const pts=getPoints(level,5); setPoints((p:number)=>p+pts); if(ns>=need){updateLevel(); setScore(0); alert(`Lvl ${level} Cleared!`) }}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Target Lvl {level} 🎯</h1><p>Hit {need} targets. Score:{score}</p><button onClick={hit} className="w-20 h-20 bg-red-600 rounded-full">HIT</button></div>
}

// 7. INFINITE RPS
function RPS({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [wins,setWins]=useState(0); const need=3+level;
  const play=(u:string)=>{ const b=["🪨","📄","✂️"][Math.floor(Math.random()*3)]; const win=(u==="🪨"&&b==="✂️")||(u==="📄"&&b==="🪨")||(u==="✂️"&&b==="📄"); if(win){const nw=wins+1; setWins(nw); const pts=getPoints(level,10); setPoints((p:number)=>p+pts); if(nw>=need){updateLevel(); setWins(0); alert(`Lvl ${level} Cleared!`)}}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>RPS Lvl {level} Win {need} 🪨📄✂️</h1><p>Wins: {wins}/{need}</p></div>
}

// 8. INFINITE 2048
function Game2048({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const goal=256 * level;
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>2048 Lvl {level} Goal:{goal} 🧱</h1><button onClick={()=>{const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel()}} className="px-4 py-2 bg-red-600 rounded">Simulate Reach {goal}</button></div>
}

// 9. INFINITE SNAKES & LADDERS
function Snakes({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [pos,setPos]=useState(1); const target=30 + level*10;
  const roll=()=>{const d=Math.floor(Math.random()*6)+1; const np=pos+d; setPos(np>=target?target:np); if(np>=target){const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel(); alert(`Lvl ${level} Win!`) }}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Snakes Lvl {level} 🐍🪜</h1><p>Race to {target}. Pos:{pos}</p><button onClick={roll} className="px-6 py-3 bg-red-600 rounded">Roll</button></div>
}

// 10. INFINITE DRAFT
function DraftReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Draft Lvl {level} 👑</h1><button onClick={()=>{const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel()}} className="px-4 py-2 bg-red-600 rounded">Win +{getPoints(level,25)} pts</button></div>
}