"use client";
import { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

type Game = "menu" | "chess" | "draft" | "ludo" | "snakes" | "tictac" | "memory" | "snake" | "s2048" | "target";

export default function GameMachine() {
  const [game, setGame] = useState<Game>("menu");
  const [points, setPoints] = useState(0);
  const [levels, setLevels] = useState({chess:1,draft:1,ludo:1,snakes:1,tictac:1,memory:1,snake:1,s2048:1,target:1});

  useEffect(() => {
    setPoints(Number(localStorage.getItem("sanelPoints") || 0));
    const saved = localStorage.getItem("sanelLevels");
    if(saved) setLevels(JSON.parse(saved));
  }, []);
  useEffect(() => localStorage.setItem("sanelPoints", points.toString()), [points]);
  useEffect(() => localStorage.setItem("sanelLevels", JSON.stringify(levels)), [levels]);

  const updateLevel = (g:keyof typeof levels) => { setLevels(prev => ({...prev, [g]: prev[g] + 1})) }
  const getPoints = (level:number, base:number) => level * base;

  return (
    <div className="font-sans">
      {game === "menu" && <Menu setGame={setGame} points={points} levels={levels} />}
      {game === "chess" && <ChessGame setGame={setGame} points={points} setPoints={setPoints} level={levels.chess} updateLevel={()=>updateLevel("chess")} getPoints={getPoints} />}
      {game === "draft" && <DraftGame setGame={setGame} />}
      {game === "ludo" && <LudoGame setGame={setGame} points={points} setPoints={setPoints} level={levels.ludo} updateLevel={()=>updateLevel("ludo")} getPoints={getPoints} />}
      {game === "snakes" && <SnakesGame setGame={setGame} points={points} setPoints={setPoints} level={levels.snakes} updateLevel={()=>updateLevel("snakes")} getPoints={getPoints} />}
      {game === "tictac" && <TicTacGame setGame={setGame} points={points} setPoints={setPoints} level={levels.tictac} updateLevel={()=>updateLevel("tictac")} getPoints={getPoints} />}
      {game === "memory" && <MemoryGame setGame={setGame} points={points} setPoints={setPoints} level={levels.memory} updateLevel={()=>updateLevel("memory")} getPoints={getPoints} />}
      {game === "snake" && <SnakeGame setGame={setGame} points={points} setPoints={setPoints} level={levels.snake} updateLevel={()=>updateLevel("snake")} getPoints={getPoints} />}
      {game === "s2048" && <Game2048 setGame={setGame} points={points} setPoints={setPoints} level={levels.s2048} updateLevel={()=>updateLevel("s2048")} getPoints={getPoints} />}
      {game === "target" && <TargetGame setGame={setGame} points={points} setPoints={setPoints} level={levels.target} updateLevel={()=>updateLevel("target")} getPoints={getPoints} />}
    </div>
  )
}

function BackBtn({setGame}:{setGame:any}){
  return <button onClick={() => setGame("menu")} className="mb-4 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">← Back</button>
}

// 1. MENU
function Menu({setGame, points, levels}:any){
  const games = [
    {id:"chess", name:"Chess vs Bot", emoji:"♟️", lvl:levels.chess},
    {id:"draft", name:"Draft", emoji:"👑", lvl:levels.draft},
    {id:"ludo", name:"Ludo vs Bot", emoji:"🎲", lvl:levels.ludo},
    {id:"snakes", name:"Snakes & Ladders", emoji:"🐍🪜", lvl:levels.snakes},
    {id:"tictac", name:"TicTac vs Bot", emoji:"❌", lvl:levels.tictac},
    {id:"memory", name:"Memory", emoji:"🧠", lvl:levels.memory},
    {id:"snake", name:"Snake", emoji:"🐍", lvl:levels.snake},
    {id:"s2048", name:"2048", emoji:"🧱", lvl:levels.s2048},
    {id:"target", name:"Target", emoji:"🎯", lvl:levels.target},
  ];
  return <div className="min-h-screen bg-black text-white p-4"><h1 className="text-3xl font-bold text-red-600 text-center">Sanel Games ∞</h1><p className="text-center mb-6">Total Points: {points}</p><div className="grid grid-cols-2 gap-3 max-w-md mx-auto">{games.map(g => <button key={g.id} onClick={() => setGame(g.id)} className="p-4 bg-white rounded-xl text-gray-800 hover:scale-105 transition"><div className="text-3xl">{g.emoji}</div><div className="font-bold">{g.name}</div><div className="text-xs">Lvl {g.lvl}</div></button>)}</div></div>
}

// 2. CHESS VS BOT - REAL
function ChessGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [game, setGameState] = useState(new Chess());
  const [pos, setPos] = useState(game.fen());

  const makeBotMove = () => {
    const moves = game.moves();
    if(moves.length === 0) return;
    const move = moves[Math.floor(Math.random()*moves.length)];
    game.move(move);
    setPos(game.fen());
  }

  const onDrop = (f:string,t:string) => {
    const res = game.move({from:f,to:t,promotion:"q"});
    if(res){
      setPos(game.fen());
      setTimeout(()=>makeBotMove(), 500);
      return true
    }
    return false
  }

  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold mb-2">Chess vs Bot Lvl {level} ♟️</h1><div className="w-80 mx-auto"><Chessboard position={pos} onPieceDrop={onDrop}/></div></div>
}

// 3. DRAFT
function DraftGame({setGame}:any){
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">Draft 👑</h1><p className="mt-4">Coming Soon</p></div>
}

// 4. LUDO VS BOT - REAL
function LudoGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [turn, setTurn] = useState(0); // 0=You, 1=Bot
  const [dice, setDice] = useState(1);
  const [canRoll, setCanRoll] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [you, setYou] = useState([-1,-1,-1,-1]);
  const [bot, setBot] = useState([-1,-1,-1,-1]);

  const track = [[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
  const startPos = [26, 39];
  const safe = [0,8,13,21,26,34,39,47];
  const diceFaces = ["⚀","⚁","⚂","⚃","⚄","⚅"];

  useEffect(()=>{ if(turn === 1 && canRoll){ setTimeout(()=>rollDice(), 1000) } },[turn, canRoll])

  const getBoardXY = (player:number, steps:number, i:number) => {
    if(steps === -1){ const homeX = player === 0? 2 : 12; const homeY = player === 0? 12 : 2; return [homeX + (i % 2) * 2, homeY + Math.floor(i / 2) * 2] }
    if(steps < 52){ const pos = (startPos[player] + steps) % 52; return track[pos] }
    const pathStep = steps - 52;
    if(player === 0) return [7, 13 - pathStep];
    if(player === 1) return [9 + pathStep, 7];
    return [7,7]
  }

  const canMovePawn = (steps:number, d:number) => {
    if(steps === -1) return d === 6;
    if(steps + d > 57) return false;
    return true;
  }

  const rollDice = () => {
    if(!canRoll) return;
    setCanRoll(false);
    setSpinning(true);
    let c = 0;
    const spin = setInterval(()=>{
      setDice(Math.floor(Math.random()*6)+1);
      c++;
      if(c > 10){
        clearInterval(spin);
        const d = Math.floor(Math.random()*6)+1;
        setDice(d);
        setSpinning(false);
        movePawn(d);
      }
    },70)
  }

  const movePawn = (d:number) => {
    const current = turn === 0? [...you] : [...bot];
    const enemy = turn === 0? [...bot] : [...you];
    let movable = current.map((p,i)=>canMovePawn(p,d)?i:-1).filter(i=>i!==-1);
    if(movable.length === 0){
      setTurn(turn===0?1:0);
      setCanRoll(true);
      return
    }
    const pawnIndex = movable[0]; // bot picks first, you click dice
    let newPos = current[pawnIndex];
    if(newPos === -1 && d === 6) newPos = 0;
    else newPos += d;
    current[pawnIndex] = newPos;

    if(newPos < 52){
      const myBoardPos = (startPos + newPos) % 52;
      enemy.forEach((ePos,i)=>{
        if(ePos >= 0 && ePos < 52){
          const enemyBoardPos = (startPos[turn===0?1:0] + ePos) % 52;
          if(myBoardPos === enemyBoardPos &&!safe.includes(myBoardPos)){
            enemy[i] = -1;
          }
        }
      })
    }

    if(turn === 0) { setYou(current); setBot(enemy) }
    else { setBot(current); setYou(enemy) }

    if(current.every(p => p === 57)){
      const pts = getPoints(level,50);
      setPoints(points + pts);
      updateLevel();
      alert(`YOU WIN! +${pts}`);
      return;
    }

    if(d === 6) setCanRoll(true);
    else { setTurn(turn===0?1:0); setCanRoll(true); }
  }

  return <div className="p-2 bg-gradient-to-b from-blue-900 to-black min-h-screen text-white">
    <BackBtn setGame={setGame}/>
    <div className="text-center font-bold mb-1">Ludo Lvl {level} | Turn: <span className="text-yellow-400">{turn===0?"You":"Bot"}</span></div>
    <div className="w-96 h-96 mx-auto bg-white rounded-2xl relative">
      {Array(225).fill(0).map((_,i)=>{
        const x = i%15; const y = Math.floor(i/15);
        let bg = "bg-white";
        if(x<=5 && y<=5) bg="bg-yellow-400";
        if(x>=9 && y<=5) bg="bg-red-500";
        if((x>=6 && x<=8) || (y>=6 && y<=8)) bg="bg-gray-200 border border-gray-400";
        if(x===7 && y===7) bg="bg-gradient-to-br from-yellow-400 to-red-500";
        return <div key={i} className={`absolute ${bg}`} style={{left:`${x*6.66}%`, top:`${y*6.66}%`, width:'6.66%', height:'6.66%'}}></div>
      })}
      {you.map((pos,i)=>{ const xy = getBoardXY(0,pos,i); return <div key={`y-${i}`} className="absolute w-6 h-6 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center text-xs font-bold text-black z-10" style={{left:`${xy[0]*6.66}%`, top:`${xy[1]*6.66}%`}}>{i+1}</div> })}
      {bot.map((pos,i)=>{ const xy = getBoardXY(1,pos,i); return <div key={`r-${i}`} className="absolute w-6 h-6 rounded-full bg-red-500 border-2 border-black flex items-center justify-center text-xs font-bold text-white z-10" style={{left:`${xy[0]*6.66}%`, top:`${xy[1]*6.66}%`}}>{i+1}</div> })}
    </div>
    <div className="text-center mt-3">
      <button onClick={rollDice} disabled={!canRoll || turn!==0} className="text-6xl disabled:opacity-50">
        <div className={spinning?"animate-spin":""}>{diceFaces[dice-1]}</div>
      </button>
      <p className="mt-1">{turn===0?"Your Turn":"Bot Thinking..."}</p>
    </div>
  </div>
}

// 5. SNAKES & LADDERS - FIXED
function SnakesGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [pos,setPos]=useState(1);
  const target=30 + level*10;
  const snakes:any = {16:6,47:26,49:11,56:53,62:19,64:60,87:24,93:73,95:75,98:78};
  const ladders:any = {1:38,4:14,9:31,21:42,28:84,36:44,51:67,71:91,80:100};
  const [msg,setMsg]=useState("");

  const roll=()=>{
    const d=Math.floor(Math.random()*6)+1;
    let np=pos+d;
    if(np>target){setMsg("Too high!"); return}
    setMsg(`Rolled ${d}`);
    if(snakes[np]){setMsg(`Snake! ${np} → ${snakes[np]}`); np=snakes[np]}
    else if(ladders[np]){setMsg(`Ladder! ${np} → ${ladders[np]}`); np=ladders[np]}
    setPos(np);
    if(np>=target){const pts=getPoints(level,40); setPoints(points+pts); updateLevel(); setMsg(`WIN +${pts}`)}
  }

  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">Snakes & Ladders Lvl {level} 🐍</h1><p className="my-2">Position: {pos}/{target}</p><p className="text-yellow-400">{msg}</p><button onClick={roll} className="mt-4 px-6 py-3 bg-red-600 rounded-xl text-xl">Roll Dice 🎲</button></div>
}

// 6. TICTAC VS BOT
function TicTacGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [b,setB]=useState(Array(9).fill(null)); const [turn,setTurn]=useState("X");
  const win=(brd:any, p:string)=>{ const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; return wins.some(w=>w.every(i=>brd[i]===p))}
  const botMove=(brd:any)=>{ const e=brd.map((v,i)=>v===null?i:null).filter(v=>v!==null); if(e.length>0){const nb=[...brd]; nb[e[Math.floor(Math.random()*e.length)]]="O"; return nb} return brd}
  const click=(i:number)=>{ if(b[i]||win(b,"X")||win(b,"O"))return; const nb=[...b]; nb[i]="X"; if(win(nb,"X")){const pts=getPoints(level,20); setPoints(points+pts); updateLevel(); alert(`Win +${pts}`); setB(Array(9).fill(null)); return} const afterBot=botMove(nb); setB(afterBot); if(win(afterBot,"O")){alert("Bot Wins"); setB(Array(9).fill(null))} }
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">TicTac vs Bot Lvl {level}</h1><div className="grid grid-cols-3 gap-1 w-64 mx-auto mt-4">{b.map((v,i)=><button key={i} onClick={()=>click(i)} className="w-20 h-20 bg-white text-black text-3xl font-bold">{v}</button>)}</div></div>
}

// 7. MEMORY
function MemoryGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const pairs = 4 + level*2;
  const [cards] = useState(()=>Array(pairs).fill(0).flatMap((_,i)=>[i,i]).sort(()=>0.5-Math.random()));
  const [f,setF]=useState<number[]>([]); const [m,setM]=useState<number[]>([]);
  const click=(i:number)=>{ if(f.length===2||m.includes(i))return; const nf=[...f,i]; setF(nf); if(nf.length===2){ if(cards[nf[0]]===cards[nf[1]]){const nm=[...m,...nf]; setM(nm); if(nm.length===cards.length){const pts=getPoints(level,30); setPoints(points+pts); updateLevel(); alert(`Win +${pts}`)}} setTimeout(()=>setF([]),800)}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">Memory Lvl {level} 🧠 Pairs:{pairs}</h1><div className="grid grid-cols-6 gap-1 w-96 mx-auto mt-4">{cards.map((c,i)=><button key={i} onClick={()=>click(i)} className="w-16 h-16 bg-white text-xl text-black font-bold">{f.includes(i)||m.includes(i)?c:"?"}</button>)}</div></div>
}

// 8. SNAKE WITH BUTTONS - FIXED
function SnakeGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const speed = Math.max(60, 300 - level*15);
  const [s, setS] = useState([{x:10,y:10}]);
  const [food, setFood] = useState({x:5,y:5});
  const [dir, setDir] = useState("RIGHT");
  const [over, setOver] = useState(false);

  useEffect(()=>{ const key=(e:any)=>{ if(e.key==="ArrowUp" && dir!== "DOWN") setDir("UP"); if(e.key==="ArrowDown" && dir!== "UP") setDir("DOWN"); if(e.key==="ArrowLeft" && dir!== "RIGHT") setDir("LEFT"); if(e.key==="ArrowRight" && dir!== "LEFT") setDir("RIGHT") }; window.addEventListener("keydown",key); return()=>window.removeEventListener("keydown",key) },[dir]);

  useEffect(()=>{ if(over) return; const i = setInterval(()=>{ setS(prev=>{ const h={...prev[0]}; if(dir==="RIGHT")h.x++; if(dir==="LEFT")h.x--; if(dir==="UP")h.y--; if(dir==="DOWN")h.y++; if(h.x<0||h.x>19||h.y<0||h.y>19||prev.some(x=>x.x===h.x&&x.y===h.y)){ setOver(true); return prev } let newSnake=[h,...prev]; if(h.x===food.x && h.y===food.y){ const pts = getPoints(level,10); setPoints(points+pts); updateLevel(); setFood({x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)}) } else { newSnake.pop() } return newSnake }) },speed); return()=>clearInterval(i) },[dir,food,over]);

  const move=(d:string)=>{ if(d==="UP" && dir!=="DOWN")setDir("UP"); if(d==="DOWN" && dir!=="UP")setDir("DOWN"); if(d==="LEFT" && dir!=="RIGHT")setDir("LEFT"); if(d==="RIGHT" && dir!=="LEFT")setDir("RIGHT") }

  if(over) return <div className="p-4 bg-black min-h-screen text-white text-center"><BackBtn setGame={setGame}/><h1 className="text-2xl font-bold">Game Over</h1><p>Score: {s.length}</p><button onClick={()=>{setS([{x:10,y:10}]); setDir("RIGHT"); setOver(false)}} className="mt-4 px-4 py-2 bg-red-600 rounded">Restart</button></div>

  return <div className="p-4 bg-black min-h-screen text-white flex-col items-center"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">Snake Lvl {level} 🐍</h1><p>Score: {s.length}</p><div className="grid grid-cols-20 gap-0 w-80 h-80 bg-gray-900 border-2 border-gray-600 mt-2">{Array(400).fill(0).map((_,i)=>{const x = i%20; const y = Math.floor(i/20); const isHead = s[0].x===x && s[0].y===y; const isBody = s.some((snake, idx)=> snake.x===x && snake.y===y && idx!== 0); const isFood = food.x===x && food.y===y; return <div key={i} className={`w-4 h-4 ${isHead? "bg-green-400" : isBody? "bg-green-600" : isFood? "bg-red-500" : "bg-gray-800"}`}></div>})}</div><div className="grid grid-cols-3 gap-2 mt-4"><div></div><button onClick={()=>move("UP")} className="p-2 bg-gray-700 rounded">⬆️</button><div></div><button onClick={()=>move("LEFT")} className="p-2 bg-gray-700 rounded">⬅️</button><div></div><button onClick={()=>move("RIGHT")} className="p-2 bg-gray-700 rounded">➡️</button><div></div><button onClick={()=>move("DOWN")} className="p-2 bg-gray-700 rounded">⬇️</button><div></div></div></div>
}

// 9. 2048
function Game2048({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const goal=256 * level;
  const [board,setBoard]=useState(Array(16).fill(0).map((_,i)=>i<2?2:0));
  const addTile=()=>{const e=board.map((v,i)=>v===0?i:null).filter((v)=>v!==null); if(e.length>0){board[e[Math.floor(Math.random()*e.length)]]=2; setBoard([...board])}}
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">2048 Lvl {level} Goal:{goal}</h1><div className="grid grid-cols-4 gap-2 w-80 h-80 bg-gray-700 p-2 rounded mt-4">{board.map((v,i)=><div key={i} className="bg-gray-500 flex items-center justify-center text-xl font-bold">{v||""}</div>)}</div><button onClick={()=>{addTile(); const pts=getPoints(level,30); setPoints(points+pts); updateLevel()}} className="mt-4 px-4 py-2 bg-red-600 rounded">Add Tile + Level Up</button></div>
}

// 10. TARGET
function TargetGame({setGame, points, setPoints, level, updateLevel, getPoints}:any){
  const [score,setScore]=useState(0);
  const need=5+level;
  const hit=()=>{const ns=score+1; setScore(ns); setPoints(points+getPoints(level,5)); if(ns>=need){updateLevel(); setScore(0); alert(`Lvl Cleared`) }};
  return <div className="p-4 bg-black min-h-screen text-white"><BackBtn setGame={setGame}/><h1 className="text-xl font-bold">Target Lvl {level} 🎯</h1><p>Hit {need} times</p><button onClick={hit} className="mt-4 w-20 h-20 bg-red-600 rounded-full">HIT {score}/{need}</button></div>
}