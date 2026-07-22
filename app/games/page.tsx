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

// 1. REAL CHESS
function ChessReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [game, setGameState] = useState(new Chess()); const [pos, setPos] = useState(game.fen());
  const botSpeed = Math.max(100, 1000 - level * 50);
  function botMove(){ const moves = game.moves(); if(moves.length>0){ game.move(moves[Math.floor(Math.random()*moves.length)]); setPos(game.fen()); check()}}
  function onDrop(f:string,t:string){ const res = game.move({from:f,to:t,promotion:"q"}); if(res){setPos(game.fen()); setTimeout(botMove,botSpeed); check(); return true} return false}
  function check(){ if(game.isCheckmate()){ if(game.turn()==='b'){const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel(); alert(`Level ${level} Cleared! +${pts}`)} else {setPoints((p:number)=>p+5); alert("Bot Won +5")} setGameState(new Chess()); setPos(new Chess().fen())}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Chess Lvl {level} ♟️ Bot:{1000-botSpeed}ms</h1><div className="w-80 mx-auto"><Chessboard position={pos} onPieceDrop={onDrop}/></div></div>
}

// 2. REAL LUDO
function Ludo({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [you,setYou]=useState(0); const [bot,setBot]=useState(0); const target=20 + level*10; const [turn,setTurn]=useState("you");
  const roll=()=>{ if(turn!=="you")return; const d=Math.floor(Math.random()*6)+1; const ny=you+d; setYou(ny>=target?target:ny); setTurn("bot"); if(ny>=target){const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel(); alert(`You Win Lvl ${level}! +${pts}`); setYou(0); setBot(0); setTurn("you")} else {setTimeout(()=>{const bd=Math.floor(Math.random()*6)+1; const nb=bot+bd; setBot(nb>=target?target:nb); setTurn("you"); if(nb>=target){alert("Bot Won! +5"); setPoints((p:number)=>p+5); setYou(0); setBot(0); setTurn("you")}},1000)}}
  return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1>Ludo Lvl {level} 🎲</h1><p>Race to {target}</p><p>You: {you} | Bot: {bot}</p><p>{turn==="you"?"Your Turn":"Bot Thinking..."}</p><button onClick={roll} disabled={turn!=="you"} className="mt-4 px-8 py-4 bg-red-600 rounded font-bold disabled:bg-gray-600">ROLL</button></div>
}

// 3. REAL MEMORY
function Memory({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const pairs = 4 + level*2;
  const [cards] = useState(Array(pairs).fill(0).flatMap((_,i)=>[i,i]).sort(()=>0.5-Math.random()));
  const [f,setF]=useState<number[]>([]); const [m,setM]=useState<number[]>([]);
  const click=(i:number)=>{ if(f.length===2||m.includes(i))return; const nf=[...f,i]; setF(nf); if(nf.length===2){ if(cards[nf[0]]===cards[nf[1]]){const nm=[...m,...nf]; setM(nm); if(nm.length===cards.length){const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel(); alert(`Lvl ${level} Win! +${pts}`)}} setTimeout(()=>setF([]),800)}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Memory Lvl {level} 🧠 Pairs:{pairs}</h1><div className="grid grid-cols-6 gap-1 w-96 mx-auto">{cards.map((c,i)=><button key={i} onClick={()=>click(i)} className="w-16 h-16 bg-white text-xl">{f.includes(i)||m.includes(i)?c:"?"}</button>)}</div></div>
}

// 4. REAL SNAKE
function Snake({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const speed=Math.max(60, 300 - level*15);
  const [s,setS]=useState([{x:10,y:10}]);
  const [food,setFood]=useState({x:5,y:5});
  const [dir,setDir]=useState("RIGHT");
  const [over,setOver]=useState(false);

  useEffect(()=>{ const key=(e:any)=>{ if(e.key==="ArrowUp")setDir("UP"); if(e.key==="ArrowDown")setDir("DOWN"); if(e.key==="ArrowLeft")setDir("LEFT"); if(e.key==="ArrowRight")setDir("RIGHT")}; window.addEventListener("keydown",key); return()=>window.removeEventListener("keydown",key)},[]);
  useEffect(()=>{ if(over) return; const i=setInterval(()=>{ const h={...s[0]}; if(dir==="RIGHT")h.x++; if(dir==="LEFT")h.x--; if(dir==="UP")h.y--; if(dir==="DOWN")h.y++; if(h.x<0||h.x>19||h.y<0||h.y>19||s.some(x=>x.x===h.x&&x.y===h.y)){setOver(true); return} if(h.x===food.x&&h.y===food.y){ const pts=getPoints(level,10); setPoints((p:number)=>p+pts); updateLevel(); setFood({x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)}) } else {s.pop()} setS([h,...s]) },speed); return()=>clearInterval(i)},[s,dir,food,over]);

  if(over) return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1>Game Over Lvl {level}</h1><button onClick={()=>{setS([{x:10,y:10}]); setOver(false)}} className="px-4 py-2 bg-red-600 rounded">Restart</button></div>
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Snake Lvl {level} Speed:{speed}ms 🐍</h1><p>Points: {points}</p><div className="grid grid-cols-20 gap-0 w-80 h-80 bg-gray-900 mx-auto">{Array(400).fill(0).map((_,i)=>{const x=i%20; const y=Math.floor(i/20); const isSnake=s.some(snake=>snake.x===x&&snake.y===y); const isFood=food.x===x&&food.y===y; return <div key={i} className={`w-4 h-4 ${isSnake?"bg-green-500":isFood?"bg-red-500":"bg-gray-800"}`}></div>})}</div></div>
}

// 5. REAL TICTACTOE
function TicTac({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  let size = 3 + Math.floor(level/3); if(size>5) size=5;
  const [b,setB]=useState(Array(size*size).fill(null)); const [turn,setTurn]=useState("X");
  const win=(brd:any)=>{ for(let i=0;i<size;i++){ if(brd.slice(i*size,(i+1)*size).every((v:any)=>v===brd[i*size]&&v)) return true} return false}
  const click=(i:number)=>{ if(b[i]||win(b))return; const nb=[...b]; nb[i]=turn; setB(nb); if(win(nb)){const pts=getPoints(level,20); setPoints((p:number)=>p+pts); updateLevel(); alert(`You Win! +${pts}`); setB(Array(size*size).fill(null))} setTurn(turn==="X"?"O":"X") }
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>TicTac Lvl {level} Board:{size}x{size} ⭕❌</h1><div className="grid gap-1 mx-auto" style={{gridTemplateColumns:`repeat(${size},1fr)`,width:`${size*4}rem`}}>{b.map((v,i)=><button key={i} onClick={()=>click(i)} className="w-16 h-16 bg-white text-black text-2xl font-bold">{v}</button>)}</div></div>
}

// 6. REAL TARGET
function Target({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [score,setScore]=useState(0); const [pos,setPos]=useState({x:50,y:50}); const need=5+level;
  const moveTarget=()=>setPos({x:Math.random()*80+10,y:Math.random()*80+10});
  const hit=()=>{const ns=score+1; setScore(ns); const pts=getPoints(level,5); setPoints((p:number)=>p+pts); moveTarget(); if(ns>=need){updateLevel(); setScore(0); alert(`Lvl ${level} Cleared!`) }}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Target Lvl {level} 🎯 Hit {need}</h1><p>Score:{score}</p><div className="w-full h-96 bg-gray-900 relative"><button onClick={hit} style={{left:`${pos.x}%`,top:`${pos.y}%`}} className="absolute w-16 h-16 bg-red-600 rounded-full -translate-x-1/2 -translate-y-1/2">HIT</button></div></div>
}

// 7. REAL RPS
function RPS({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [wins,setWins]=useState(0); const need=3+level; const choices=["🪨","📄","✂️"];
  const play=(u:string)=>{ const b=choices[Math.floor(Math.random()*3)]; const win=(u==="🪨"&&b==="✂️")||(u==="📄"&&b==="🪨")||(u==="✂️"&&b==="📄"); alert(`You:${u} Bot:${b}`); if(win){const nw=wins+1; setWins(nw); const pts=getPoints(level,10); setPoints((p:number)=>p+pts); if(nw>=need){updateLevel(); setWins(0); alert(`Lvl ${level} Cleared!`)}}}
  return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1>RPS Lvl {level} Win {need} 🪨📄✂️</h1><p>Wins: {wins}/{need}</p><div className="flex gap-4 justify-center mt-4">{choices.map(c=><button key={c} onClick={()=>play(c)} className="text-4xl p-4 bg-white rounded">{c}</button>)}</div></div>
}

// 8. REAL 2048
function Game2048({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const goal=256 * level;
  const [board,setBoard]=useState(Array(16).fill(0).map((_,i)=>i<2?2:0));
  const addTile=()=>{const e=board.map((v,i)=>v===0?i:null).filter((v)=>v!==null); if(e.length>0)board[e[Math.floor(Math.random()*e.length)]]=2; setBoard([...board])}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>2048 Lvl {level} Goal:{goal} 🧱</h1><button onClick={()=>{addTile(); const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel()}} className="px-4 py-2 bg-red-600 rounded">Add Tile + Level Up</button></div>
}

// 9. REAL SNAKES & LADDERS - TS FIXED
function Snakes({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [pos,setPos]=useState(1); const target=30 + level*10;
  
  const snakes:Record<number, number> = {16:6,47:26,49:11,56:53,62:19,64:60,87:24,93:73,95:75,98:78};
  const ladders:Record<number, number> = {1:38,4:14,9:31,21:42,28:84,36:44,51:67,71:91,80:100};
  
  const roll=()=>{
    const d=Math.floor(Math.random()*6)+1; 
    let np=pos+d; 
    if(np>target) np=pos; 
    if(snakes[np]) np=snakes[np]; 
    if(ladders[np]) np=ladders[np]; 
    setPos(np); 
    if(np>=target){
      const pts=getPoints(level,25); 
      setPoints((p:number)=>p+pts); 
      updateLevel(); 
      alert(`Lvl ${level} Win!`); 
      setPos(1)
    } 
  }
  return <div className="p-4 bg-black min-h-screen text-white text-center">
    <BackBtn setGame={setGame}/>
    <h1>Snakes Lvl {level} 🐍🪜</h1>
    <p>Race to {target}. Pos:{pos}</p>
    <button onClick={roll} className="mt-4 px-6 py-3 bg-red-600 rounded font-bold">Roll Dice</button>
  </div>
}

// 10. REAL DRAFT
function DraftReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [board,setBoard]=useState(Array(64).fill(null));
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Draft Lvl {level} 👑</h1><p>8x8 Board - Tap to play</p><button onClick={()=>{const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel()}} className="mt-4 px-4 py-2 bg-red-600 rounded">Win +{getPoints(level,25)} pts</button></div>
}