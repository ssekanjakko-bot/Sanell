"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { Lock, Crown } from "lucide-react";

type Movie = {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  duration: string;
  genre: string[] | string;
  posterUrl: string;
  videoUrl?: string;
  youtubeUrl?: string;
  director?: string;
  cast?: string;
};

const FREE_LIMIT = 60 // 1 MIN FREE

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
  const match = url.match(regExp);
  return match? match[2] : null;
};

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [watched, setWatched] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "movies", id));
        if (snap.exists()) {
          setMovie({ id: snap.id,...(snap.data() as Omit<Movie, "id">) });
        } else {
          router.replace("/movies");
        }
      } catch (e) {
        console.error(e);
        router.replace("/movies");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // Check subscription
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (user)=>{
      if(!user){ setHasAccess(false); return }
      const subSnap = await getDoc(doc(db, 'movie_subscriptions', user.uid))
      if(subSnap.exists()){
        const data = subSnap.data()
        const until = data.validUntil?.toDate() as Date
        if(until && until > new Date()) setHasAccess(true)
        else setHasAccess(false)
      } else setHasAccess(false)
    })
    return ()=>unsub()
  }, [])

  // Timer for YouTube (since we can't get time)
  useEffect(()=>{
    if(hasAccess ||!movie) return
    const t = setTimeout(()=>{
      setShowPaywall(true)
    }, FREE_LIMIT * 1000)
    return ()=>clearTimeout(t)
  }, [movie, hasAccess])

  const handleTimeUpdate = () => {
    if(!videoRef.current) return
    const current = videoRef.current.currentTime
    setWatched(Math.floor(current))
    if(!hasAccess && current >= FREE_LIMIT){
      videoRef.current.pause()
      videoRef.current.currentTime = FREE_LIMIT
      setShowPaywall(true)
    }
  }

  const handleSeeking = () => {
    if(!hasAccess && videoRef.current && videoRef.current.currentTime > FREE_LIMIT){
      videoRef.current.currentTime = FREE_LIMIT
      setShowPaywall(true)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-black text-white grid place-items-center">Loading...</div>;
  }

  if (!movie) return null;

  const genreText = Array.isArray(movie.genre)? movie.genre.join(", ") : movie.genre;
  const youtubeId = getYouTubeId(movie.youtubeUrl || "");

  return (
    <main className="min-h-screen bg-black text-white relative">
      {/* 1 MIN PAYWALL */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-5">
          <div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 text-black text-center">
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto"><Crown className="text-yellow-400"/></div>
            <h2 className="font-black text-xl mt-3">1 Min Free Ended 🔒</h2>
            <p className="text-sm text-black/60 mt-2">You watched 60 seconds free. Subscribe to watch full movie</p>
            <div className="mt-3 bg-red-50 text-red-600 text-xs font-bold py-2 px-3 rounded-full">Send money to 0767483636</div>
            <Link href="/movies" className="block w-full bg-black text-white py-3.5 rounded-full font-black mt-5 text-center">Subscribe Now - From 1000 UGX</Link>
            <button onClick={()=>router.push('/movies')} className="w-full mt-3 text-xs font-bold text-gray-500">Back to movies</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/movies" className="text-zinc-400 hover:text-white mb-4 inline-block">← Back</Link>

        <div className="space-y-6">
          {/* MP4 Player - 1 MIN LIMIT */}
          {movie.videoUrl && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Now Playing</h3>
                {!hasAccess && <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-full">{watched}s / {FREE_LIMIT}s FREE</span>}
                {hasAccess && <span className="bg-green-500 text-black text-[10px] font-black px-2 py-1 rounded-full">VIP UNLIMITED</span>}
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-black relative border border-white/10">
                <video
                  ref={videoRef}
                  src={movie.videoUrl}
                  poster={movie.posterUrl}
                  controls={hasAccess ||!showPaywall}
                  onTimeUpdate={handleTimeUpdate}
                  onSeeking={handleSeeking}
                  className="w-full h-full"
                  playsInline
                  controlsList="nodownload"
                />
              </div>
              {!hasAccess &&!showPaywall && <p className="text-[11px] text-white/50 mt-2 text-center">Free preview: 60 seconds only • Subscribe to watch full</p>}
            </div>
          )}

          {/* YouTube Player - Also 1 MIN */}
          {movie.youtubeUrl && youtubeId && (
            <div className="relative">
              <h3 className="text-lg font-bold mb-2">YouTube {hasAccess? '(Full)':'(1 Min Free)'}</h3>
              <div className="aspect-video rounded-xl overflow-hidden relative">
                {!showPaywall? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={movie.title}
                  ></iframe>
                ) : (
                  <div className="w-full h-full bg-zinc-900 grid place-items-center text-white/40">Preview ended - Subscribe to continue</div>
                )}
              </div>
            </div>
          )}

          {!movie.videoUrl &&!movie.youtubeUrl && <p className="text-center text-zinc-400">No video source available.</p>}
        </div>

        <div className="mt-6 grid md:grid-cols-[200px_1fr] gap-6">
          <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-lg hidden md:block" />
          <div>
            <h2 className="text-2xl font-bold">{movie.title}</h2>
            <p className="text-zinc-400 text-sm mt-1">{movie.releaseDate} {movie.duration? `• ${movie.duration}` : ""} {genreText? ` • ${genreText}` : ""}</p>
            <p className="mt-4 text-zinc-200">{movie.description}</p>
            {movie.director && <p className="mt-3 text-sm"><span className="text-zinc-400">Director: </span>{movie.director}</p>}
            {movie.cast && <p className="mt-1 text-sm"><span className="text-zinc-400">Cast: </span>{movie.cast}</p>}
            {!hasAccess && <Link href="/movies" className="inline-flex mt-5 bg-red-600 text-white px-5 py-2.5 rounded-full font-black text-sm gap-2 items-center"><Lock size={14}/> Subscribe to watch full</Link>}
          </div>
        </div>
      </div>
    </main>
  );
}