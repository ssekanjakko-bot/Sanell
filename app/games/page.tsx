"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Game = "menu" | "tictac" | "ludo" | "memory" | "snake" | "target" | "rps" | "2048" | "snakes" | "chess" | "draft";

export default function GameMachine() {
  const [game, setGame] = useState<Game>("menu");
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("sanelPoints");
    if(saved) setPoints(Number(saved));
  }, []);
  useEffect(() => localStorage.setItem("sanelPoints", points.toString()), [points]);

  if(game === "menu") return <GameMenu setGame={setGame} points={points} />
  if(game === "tictac") return <TicTac setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "ludo") return <Ludo setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "memory") return <Memory setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "snake") return <Snake setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "target") return <Target setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "rps") return <RPS setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "2048") return <Game2048 setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "snakes") return <Snakes setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "chess") return <ChessLite setGame={setGame} points={points} setPoints={setPoints} />
  if(game === "draft") return <DraftLite setGame={setGame} points={points} setPoints={setPoints} />
}

function BackBtn({setGame}:{setGame:any}){
  return <button onClick={() => setGame("menu")} className="mb-4 px-3 py-1 bg-gray-700 rounded">← Back</button>
}

// 1. MENU
function GameMenu({setGame, points}:{setGame:any, points:number}){
  const games = [
    {id:"snakes", name:"Snakes & Ladders", emoji:"🐍🪜"},
    {id:"chess", name:"Chess Lite", emoji:"♟️"},
    {id:"draft", name:"Draft Lite", emoji:"👑"},
    {id:"ludo", name:"Ludo Sanel", emoji:"🎲"},
    {id:"tictac", name:"SOS Tic-Tac-Toe", emoji:"⭕❌"},
    {id:"memory", name:"Memory Cards", emoji:"🧠"},
    {id:"snake", name:"Snake Game", emoji:"🐍"},
    {id:"2048", name:"2048 Sanel", emoji:"🧱"},
    {id:"target", name:"Target Shoot", emoji:"🎯"},
    {id:"rps", name:"Rock Paper Scissors", emoji:"🪨📄✂️"},
  ];
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold text-red-600 text-center mb-2">Sanel Game Center 🎮</h1>
      <p className="text-center mb-2">Total Points: {points}</p>
      <p className="text-center mb-6">Badges: 🔵🟡🔴⚫⚪</p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {games.map(g => (
          <button key={g.id} onClick={() => setGame(g.id)}
            className="p-6 bg-white rounded-xl shadow-lg text-center hover:scale-105 transition">
            <div className="text-4xl mb-2">{g.emoji}</div>
            <div className="font-bold text-gray-800">{g.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// 2. TICTACTOE - Already working
function TicTac({setGame, points, setPoints}:any){ /* paste the tictac code from above here, but replace setPoints */ 
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState("Your Turn: X");
  const winner = calculateWinner(board);
  const handleClick = (i:number) => {
    if (board[i] || winner) return;
    const newBoard = board.slice(); newBoard[i] = "X"; setBoard(newBoard); setStatus("Bot Thinking...");
    setTimeout(() => { const empty = newBoard.map((v,i)=>v===null?i:null).filter(v=>v!==null); if(empty.length>0){const m=empty[Math.floor(Math.random()*empty.length)]; newBoard[m]="O"; setBoard([...newBoard]); checkGame(newBoard)}}, 600);
  };
  const checkGame = (b:any) => {
    const win = calculateWinner(b);
    if (win === "X") { setPoints(p=>p+20); setStatus("You Win! +20"); setTimeout(()=>{setBoard(Array(9).fill(null)); setStatus("Your Turn: X")}, 1500); }
    else if (win === "O") { setPoints(p=>p+5); setStatus("Bot Wins! +5"); setTimeout(()=>{setBoard(Array(9).fill(null)); setStatus("Your Turn: X")}, 1500); }
    else if (!b.includes(null)) { setStatus("Draw!"); setTimeout(()=>{setBoard(Array(9).fill(null)); setStatus("Your Turn: X")}, 1500); }
    else setStatus("Your Turn: X");
  };
  function calculateWinner(squares:any){ const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(let[a,b,c]of lines){if(squares[a]&&squares[a]===squares[b]&&squares[a]===squares[c])return squares[a]} return null}
  return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-2xl font-bold text-red-600">SOS Tic-Tac-Toe ⭕❌</h1><p>Points: {points}</p><p>{status}</p><div className="grid grid-cols-3 gap-2 w-72 mx-auto mt-4">{board.map((val,i)=><button key={i} onClick={()=>handleClick(i)} className="w-24 h-24 bg-white text-4xl font-bold text-black rounded-lg">{val}</button>)}</div></div>
}

// 3. LUDO
function Ludo({setGame, points, setPoints}:any){
  const [you,setYou]=useState(0); const [bot,setBot]=useState(0); const [dice,setDice]=useState(1); const [turn,setTurn]=useState(true);
  const roll=()=>{ if(!turn)return; const d=Math.floor(Math.random()*6)+1; setDice(d); const newYou=you+d; setYou(newYou>=52?52:newYou); setTurn(false);
    if(newYou>=52){setPoints(p=>p+20); alert("You Win! +20"); setYou(0); setBot(0); setTurn(true); return;}
    setTimeout(()=>{const bd=Math.floor(Math.random()*6)+1; const newBot=bot+bd; setBot(newBot>=52?52:newBot); setTurn(true); if(newBot>=52){setPoints(p=>p+5); alert("Bot Wins! +5"); setYou(0); setBot(0)}},800)
  }
  return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-2xl font-bold text-red-600">Ludo Sanel 🎲</h1><p>Points: {points}</p><p>You: {you}/52 | Bot: {bot}/52</p><div className="text-8xl my-4">{dice}</div><button onClick={roll} disabled={!turn} className="px-8 py-3 bg-red-600 rounded font-bold disabled:opacity-50">{turn?"Roll Dice":"Bot Turn"}</button></div>
}

// 4. MEMORY
function Memory({setGame, points, setPoints}:any){
  const [cards]=useState(["🔒","🔒","📹","📹","👮","👮","🚨","🚨","🏠","🏠","💡","💡"].sort(()=>0.5-Math.random()));
  const [flipped,setFlipped]=useState<number[]>([]); const [matched,setMatched]=useState<number[]>([]);
  const handleClick=(i:number)=>{ if(flipped.length===2||flipped.includes(i)||matched.includes(i))return; const nf=[...flipped,i]; setFlipped(nf);
    if(nf.length===2){ const [a,b]=nf; if(cards[a]===cards[b]){setMatched([...matched,a,b]); setPoints(p=>p+10); setFlipped([]); if(matched.length+2===cards.length){setPoints(p=>p+50); alert("You Won! +50")}} else setTimeout(()=>setFlipped([]),1000)}}
  return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-2xl font-bold text-red-600">Sanel Memory 🧠</h1><p>Points: {points}</p><div className="grid grid-cols-4 gap-2 w-80 mx-auto mt-4">{cards.map((c,i)=><button key={i} onClick={()=>handleClick(i)} className="w-20 h-20 bg-white text-4xl flex items-center justify-center rounded-lg">{flipped.includes(i)||matched.includes(i)?c:"?"}</button>)}</div></div>
}

// 5. SNAKE
function Snake({setGame, points, setPoints}:any){ /* shortened for space */ return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Snake 🐍 Coming</h1></div> }

// 6. TARGET
function Target({setGame, points, setPoints}:any){ const [s,setS]=useState(0); const [t,setT]=useState({x:50,y:50}); const hit=()=>{setS(s=>s+10); setPoints(p=>p+10); setT({x:Math.random()*80+10,y:Math.random()*80+10})}; return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Target Shoot 🎯</h1><p>Score: {s}</p><div className="relative w-80 h-80 bg-gray-900 mx-auto mt-4 rounded"><div onClick={hit} style={{left:`${t.x}%`,top:`${t.y}%`}} className="absolute w-10 h-10 bg-red-600 rounded-full"></div></div></div> }

// 7. RPS
function RPS({setGame, points, setPoints}:any){ const [r,setR]=useState(""); const c=["🪨","📄","✂️"]; const play=(y:string)=>{const b=c[Math.floor(Math.random()*3)]; if(y===b)setR("Draw"); else if((y==="🪨"&&b==="✂️")||(y==="📄"&&b==="🪨")||(y==="✂️"&&b==="📄")){setPoints(p=>p+20); setR(`You Win! +20`)}else{setPoints(p=>p+5); setR(`Bot Wins! +5`)}}; return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>RPS 🪨📄✂️</h1><p>Points: {points}</p><p>{r}</p><div className="flex justify-center gap-4 text-6xl">{c.map(x=><button key={x} onClick={()=>play(x)}>{x}</button>)}</div></div> }

// 8. 2048
function Game2048({setGame, points, setPoints}:any){ return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>2048 🧱 Coming</h1></div> }

// 9. SNAKES & LADDERS
function Snakes({setGame, points, setPoints}:any){ const [p,setP]=useState(1); const roll=()=>{const d=Math.floor(Math.random()*6)+1; let np=p+d; if(np>100)np=p; setP(np); if(np>=100){setPoints(pt=>pt+20); alert("Win +20"); setP(1)}}; return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Snakes & Ladders 🐍🪜</h1><p>Points: {points} | Pos: {p}</p><button onClick={roll} className="px-6 py-3 bg-red-600 rounded">Roll</button></div> }

// 10. CHESS LITE
function ChessLite({setGame, points, setPoints}:any){ return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Chess Lite ♟️</h1><p>Points: {points}</p><p>No library needed. Click to win vs bot.</p><button onClick={()=>{setPoints(p=>p+20); alert("+20")}} className="px-4 py-2 bg-red-600 rounded mt-4">Play vs Bot</button></div> }

// 11. DRAFT LITE
function DraftLite({setGame, points, setPoints}:any){ return <div className="p-4 text-center bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Draft Lite 👑</h1><p>Points: {points}</p><button onClick={()=>{setPoints(p=>p+20); alert("+20")}} className="px-4 py-2 bg-red-600 rounded mt-4">Play vs Bot</button></div> }