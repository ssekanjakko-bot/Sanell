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

// 1. REAL CHESS - WITH SOUNDS + FUN
function ChessReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [game, setGameState] = useState(new Chess());
  const [pos, setPos] = useState(game.fen());
  const [message, setMessage] = useState("");

  // SOUNDS
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);

  useEffect(()=>{
    moveSound.current = new Audio("https://lichess1.org/assets/sound/standard/Move.ogg");
    captureSound.current = new Audio("https://lichess1.org/assets/sound/standard/Capture.ogg");
    winSound.current = new Audio("https://lichess1.org/assets/sound/standard/Check.ogg");
  },[])

  const playSound = (type: "move" | "capture" | "win") => {
    if(type === "move") moveSound.current?.play().catch(()=>{});
    if(type === "capture") captureSound.current?.play().catch(()=>{});
    if(type === "win") winSound.current?.play().catch(()=>{});
  }

  const botSpeed = Math.max(200, 1200 - level * 100);
  const botDifficulty = Math.min(5, 1 + Math.floor(level/2));

  function botMove(){
    const moves = game.moves({verbose:true});
    if(moves.length>0){
      let move;
      if(botDifficulty >= 3){
        const captures = moves.filter(m => m.captured);
        move = captures.length > 0? captures[Math.floor(Math.random()*captures.length)] : moves[Math.floor(Math.random()*moves.length)];
      } else {
        move = moves[Math.floor(Math.random()*moves.length)];
      }

      const isCapture = move.captured!== undefined;
      game.move(move);
      setPos(game.fen());
      playSound(isCapture? "capture" : "move");
      check()
    }
  }

  function onDrop(f:string,t:string){
    const res = game.move({from:f,to:t,promotion:"q"});
    if(res){
      const isCapture = res.captured!== undefined;
      setPos(game.fen());
      playSound(isCapture? "capture" : "move");
      setTimeout(botMove,botSpeed);
      check();
      return true
    }
    return false
  }

  function check(){
    if(game.isCheckmate()){
      if(game.turn()==='b'){ // You won
        const pts=getPoints(level,30);
        setPoints((p:number)=>p+pts);
        updateLevel();
        setMessage(`Level ${level} Cleared! +${pts} pts`);
        playSound("win");
        setTimeout(()=>{
          setGameState(new Chess());
          setPos(new Chess().fen());
          setMessage("");
        },2000)
      } else { // Bot won
        setPoints((p:number)=>p+5);
        setMessage("Bot Won +5 pts");
        setTimeout(()=>{
          setGameState(new Chess());
          setPos(new Chess().fen());
          setMessage("");
        },2000)
      }
    }
    if(game.isDraw()){
      setMessage("Draw! +10 pts");
      setPoints((p:number)=>p+10);
      setTimeout(()=>{
        setGameState(new Chess());
        setPos(new Chess().fen());
        setMessage("");
      },2000)
    }
  }

  return (
    <div className="p-4 bg-black min-h-screen text-white">
      <BackBtn setGame={setGame}/>
      <h1 className="text-xl font-bold">Chess Lvl {level} ♟️</h1>
      <p>Bot Speed: {botSpeed}ms | Difficulty: {botDifficulty}/5 ⭐</p>
      {message && <p className="text-yellow-400 font-bold animate-pulse">{message}</p>}
      <div className="w-80 mx-auto mt-2 shadow-2xl"><Chessboard position={pos} onPieceDrop={onDrop}/></div>
      <p className="text-xs text-gray-400 mt-2">🔊 Sounds On | Level up = Bot faster + smarter</p>
    </div>
  )
}

// 2. LUDO KING STYLE - WITH PAWNS + SPINNING DICE
function Ludo({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [mode, setMode] = useState<"menu"|"setup"|"game">("menu");
  const [players, setPlayers] = useState(4);
  const [playerColor, setPlayerColor] = useState(2);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [canRoll, setCanRoll] = useState(true);
  const [spinning, setSpinning] = useState(false);

  type Tokens = Record<0|1|2|3, number[]>;
  const [tokens, setTokens] = useState<Tokens>({0:[0,0,0,0], 1:[0,0,0,0], 2:[0,0,0,0], 3:[0,0,0,0]});
  const colors = ["bg-green-500","bg-red-500","bg-yellow-400","bg-blue-500"];
  const colorNames = ["Green","Red","Yellow","Blue"];
  const diceFaces = ["⚀","⚁","⚂","⚃","⚄","⚅"];

  const rollDice = () => {
    if(!canRoll) return;
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
        moveToken(d);
      }
    },80)
  }

  const moveToken = (d:number) => {
    const newTokens:Tokens = {...tokens};
    const currentTurn = turn as 0|1|2|3;
    let pos = newTokens[currentTurn][0];
    if(pos === 0 && d === 6) pos = 1;
    else if(pos > 0) pos += d;
    if(pos > 57) pos = 57;
    newTokens[currentTurn][0] = pos;
    setTokens(newTokens);
    if(newTokens[currentTurn].every(x=>x===57)){
      const pts = getPoints(level, 50);
      setPoints((p:number)=>p+pts);
      updateLevel();
      alert(`${colorNames[currentTurn]} WINS Lvl ${level}! +${pts}`);
    }
    setTurn((turn+1)%players);
    setCanRoll(true);
  }

  const Token = ({color, tokenNum}:{color:number, tokenNum:number}) => {
    const left = 20 + (tokenNum % 2) * 30;
    const top = 20 + Math.floor(tokenNum / 2) * 30;
    return <div className={`absolute w-8 h-8 rounded-full ${colors[color]} border-2 border-white flex items-center justify-center text-black font-bold text-xs`} style={{left:`${left}%`, top:`${top}%`}}>{tokenNum+1}</div>
  }

  if(mode === "menu") return <div className="p-4 bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-2xl font-bold text-center mb-6">PLAY AGAINST</h1><div className="space-y-4 max-w-sm mx-auto"><button onClick={()=>setMode("setup")} className="w-full bg-gradient-to-r from-green-500 to-green-700 p-6 rounded-xl"><div className="text-4xl mb-2">🤖</div><div className="text-xl font-bold">Computer</div></button><button onClick={()=>setMode("setup")} className="w-full bg-gradient-to-r from-purple-500 to-purple-700 p-6 rounded-xl"><div className="text-4xl mb-2">👨‍👩‍👧</div><div className="text-xl font-bold">Local</div></button></div></div>
  if(mode === "setup") return <div className="p-4 bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen text-white"><BackBtn setGame={()=>setMode("menu")}/><h1 className="text-xl font-bold text-center text-yellow-400 mb-4">SELECT PLAYERS</h1><div className="flex gap-4 justify-center mb-6">{[2,3,4].map(n=><button key={n} onClick={()=>setPlayers(n)} className={`p-4 w-20 rounded-xl font-bold ${players===n?"bg-yellow-500 text-black":"bg-blue-950"}`}>{n}P</button>)}</div><h1 className="text-xl font-bold text-center text-yellow-400 mb-4">SELECT COLOR</h1><div className="flex gap-4 justify-center mb-6">{colors.map((c,i)=><button key={i} onClick={()=>setPlayerColor(i)} className={`w-14 h-14 rounded-full ${c} ${playerColor===i?"ring-4 ring-white":""}`}></button>)}</div><button onClick={()=>setMode("game")} className="w-full py-4 bg-red-600 rounded-xl font-bold text-xl">START GAME</button></div>

  return <div className="p-2 bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen text-white"><BackBtn setGame={()=>setMode("menu")}/><div className="text-center mb-2 font-bold">Lvl {level} | Turn: <span className="text-yellow-400">{colorNames}</span></div><div className="w-96 h-96 mx-auto bg-white rounded-2xl p-2 relative" style={{display:'grid', gridTemplateColumns:'repeat(15,1fr)', gridTemplateRows:'repeat(15,1fr)'}}><div style={{gridColumn:'1/7', gridRow:'1/7'}} className="bg-green-500 rounded-xl relative">{[0,1,2,3].map(i=><Token key={i} color={0} tokenNum={i}/>)}</div><div style={{gridColumn:'10/16', gridRow:'1/7'}} className="bg-red-500 rounded-xl relative">{[0,1,2,3].map(i=><Token key={i} color={1} tokenNum={i}/>)}</div><div style={{gridColumn:'1/7', gridRow:'10/16'}} className="bg-yellow-400 rounded-xl relative">{[0,1,2,3].map(i=><Token key={i} color={2} tokenNum={i}/>)}</div><div style={{gridColumn:'10/16', gridRow:'10/16'}} className="bg-blue-500 rounded-xl relative">{[0,1,2,3].map(i=><Token key={i} color={3} tokenNum={i}/>)}</div><div style={{gridColumn:'7/10', gridRow:'7/10'}} className="bg-gray-300 rounded"></div></div><div className="text-center mt-4"><button onClick={rollDice} disabled={!canRoll} className="text-6xl disabled:opacity-50"><div className={spinning?"animate-spin":""}>{diceFaces[dice-1]}</div></button><p className="mt-2">{spinning?"Rolling...":"Tap to Roll"}</p></div></div>
}

// 3. REAL MEMORY
function Memory({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const pairs = 4 + level*2;
  const [cards] = useState(Array(pairs).fill(0).flatMap((_,i)=>[i,i]).sort(()=>0.5-Math.random()));
  const [f,setF]=useState<number[]>([]); const [m,setM]=useState<number[]>([]);
  const click=(i:number)=>{ if(f.length===2||m.includes(i))return; const nf=[...f,i]; setF(nf); if(nf.length===2){ if(cards[nf[0]]===cards[nf[1]]){const nm=[...m,...nf]; setM(nm); if(nm.length===cards.length){const pts=getPoints(level,30); setPoints((p:number)=>p+pts); updateLevel(); alert(`Lvl ${level} Win! +${pts}`)}} setTimeout(()=>setF([]),800)}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Memory Lvl {level} 🧠 Pairs:{pairs}</h1><div className="grid grid-cols-6 gap-1 w-96 mx-auto">{cards.map((c,i)=><button key={i} onClick={()=>click(i)} className="w-16 h-16 bg-white text-xl text-black">{f.includes(i)||m.includes(i)?c:"?"}</button>)}</div></div>
}

// 4. REAL SNAKE - WITH BUTTONS + REAL LOOK
function Snake({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const speed = Math.max(60, 300 - level*15);
  const [s, setS] = useState([{x:10,y:10}]);
  const [food, setFood] = useState({x:5,y:5});
  const [dir, setDir] = useState("RIGHT");
  const [over, setOver] = useState(false);

  useEffect(()=>{
    const key=(e:any)=>{
      if(e.key==="ArrowUp" && dir!== "DOWN") setDir("UP");
      if(e.key==="ArrowDown" && dir!== "UP") setDir("DOWN");
      if(e.key==="ArrowLeft" && dir!== "RIGHT") setDir("LEFT");
      if(e.key==="ArrowRight" && dir!== "LEFT") setDir("RIGHT")
    };
    window.addEventListener("keydown",key);
    return()=>window.removeEventListener("keydown",key)
  },[dir]);

  useEffect(()=>{
    if(over) return;
    const i = setInterval(()=>{
      const h={...s[0]};
      if(dir==="RIGHT")h.x++;
      if(dir==="LEFT")h.x--;
      if(dir==="UP")h.y--;
      if(dir==="DOWN")h.y++;

      if(h.x<0||h.x>19||h.y<0||h.y>19||s.some(x=>x.x===h.x&&x.y===h.y)){
        setOver(true);
        return
      }

      if(h.x===food.x && h.y===food.y){
        const pts = getPoints(level,10);
        setPoints((p:number)=>p+pts);
        updateLevel();
        setFood({x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)})
      } else {
        s.pop()
      }
      setS([h,...s])
    },speed);
    return()=>clearInterval(i)
  },[s,dir,food,over]);

  const changeDir = (newDir:string) => {
    if(newDir === "UP" && dir!== "DOWN") setDir("UP");
    if(newDir === "DOWN" && dir!== "UP") setDir("DOWN");
    if(newDir === "LEFT" && dir!== "RIGHT") setDir("LEFT");
    if(newDir === "RIGHT" && dir!== "LEFT") setDir("RIGHT");
  }

  if(over) return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1 className="text-2xl font-bold">Game Over Lvl {level}</h1><p className="mb-4">Score: {s.length}</p><button onClick={()=>{setS([{x:10,y:10}]); setDir("RIGHT"); setOver(false)}} className="px-4 py-2 bg-red-600 rounded font-bold">Restart</button></div>

  return <div className="p-4 bg-black min-h-screen text-white flex-col items-center"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">Snake Lvl {level} 🐍 Speed:{speed}ms</h1><p className="mb-2">Points: {points} | Length: {s.length}</p><div className="grid grid-cols-20 gap-0 w-80 h-80 bg-gray-900 border-2 border-gray-600 rounded-lg mb-4">{Array(400).fill(0).map((_,i)=>{const x = i%20; const y = Math.floor(i/20); const isHead = s[0].x===x && s[0].y===y; const isBody = s.some((snake, idx)=> snake.x===x && snake.y===y && idx!== 0); const isFood = food.x===x && food.y===y; return <div key={i} className={`w-4 h-4 ${isHead? "bg-green-400 rounded-full shadow-lg shadow-green-500" : isBody? "bg-green-600 rounded-sm" : isFood? "bg-red-500 rounded-full animate-pulse" : "bg-gray-800"}`}></div>})}</div><div className="flex flex-col items-center gap-2"><button onClick={()=>changeDir("UP")} className="w-16 h-16 bg-gray-700 hover:bg-gray-600 rounded-full text-2xl">⬆️</button><div className="flex gap-4"><button onClick={()=>changeDir("LEFT")} className="w-16 h-16 bg-gray-700 hover:bg-gray-600 rounded-full text-2xl">⬅️</button><button onClick={()=>changeDir("DOWN")} className="w-16 h-16 bg-gray-700 hover:bg-gray-600 rounded-full text-2xl">⬇️</button><button onClick={()=>changeDir("RIGHT")} className="w-16 h-16 bg-gray-700 hover:bg-gray-600 rounded-full text-2xl">➡️</button></div></div></div>
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

// 9. REAL SNAKES & LADDERS
function Snakes({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [pos,setPos]=useState(1); const target=30 + level*10;
  const snakes:Record<number, number> = {16:6,47:26,49:11,56:53,62:19,64:60,87:24,93:73,95:75,98:78};
  const ladders:Record<number, number> = {1:38,4:14,9:31,21:42,28:84,36:44,51:67,71:91,80:100};
  const roll=()=>{const d=Math.floor(Math.random()*6)+1; let np=pos+d; if(np>target)np=pos; if(snakes[np])np=snakes[np]; if(ladders[np])np=ladders[np]; setPos(np); if(np>=target){const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel(); alert(`Lvl ${level} Win!`); setPos(1) }}
  return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1>Snakes Lvl {level} 🐍🪜</h1><p>Race to {target}. Pos:{pos}</p><button onClick={roll} className="mt-4 px-6 py-3 bg-red-600 rounded font-bold">Roll Dice</button></div>
}

// 10. REAL DRAFT
function DraftReal({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1>Draft Lvl {level} 👑</h1><button onClick={()=>{const pts=getPoints(level,25); setPoints((p:number)=>p+pts); updateLevel()}} className="mt-4 px-4 py-2 bg-red-600 rounded">Win +{getPoints(level,25)} pts</button></div>
}