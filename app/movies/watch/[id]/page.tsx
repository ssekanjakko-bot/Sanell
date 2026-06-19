"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type Movie = {
          id: string;
          title: string;
          description: string;
          releaseDate: string;
          duration: string;
          genre: string[] | string; // old docs are string, new are array
          director: string;
          cast: string;
          videoUrl: string;
          posterUrl: string;
};

export default function WatchPage() {
          const { id } = useParams<{ id: string }>();
          const router = useRouter();
          const [movie, setMovie] = useState<Movie | null>(null);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
                    if (!id) return;
                    const load = async () => {
                              try {
                                        const snap = await getDoc(doc(db, "movies", id));
                                        if (snap.exists()) {
                                                  setMovie({ id: snap.id, ...(snap.data() as Omit<Movie, "id">) });
                                        } else {
                                                  router.replace("/");
                                        }
                              } catch (e) {
                                        console.error(e);
                                        router.replace("/");
                              } finally {
                                        setLoading(false);
                              }
                    };
                    load();
          }, [id, router]);

          if (loading) {
                    return <div className="min-h-screen bg-black text-white grid place-items-center">Loading...</div>;
          }

          if (!movie) {
                    return null;
          }

          const genreText = Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre;

          return (
                    <main className="min-h-screen bg-black text-white">
                              <header className="p-4 flex items-center gap-4 border-b border-zinc-800">
                                        <Link href="/" className="text-red-600 hover:text-red-400">← Back</Link>
                                        <h1 className="font-bold text-lg truncate">{movie.title}</h1>
                              </header>

                              <div className="max-w-6xl mx-auto px-4 py-6">
                                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                                                  <video
                                                            src={movie.videoUrl}
                                                            poster={movie.posterUrl}
                                                            controls
                                                            autoPlay
                                                            className="w-full h-full"
                                                  />
                                        </div>

                                        <div className="mt-6 grid md:grid-cols-[200px_1fr] gap-6">
                                                  <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-lg hidden md:block" />
                                                  <div>
                                                            <h2 className="text-2xl font-bold">{movie.title}</h2>
                                                            <p className="text-zinc-400 text-sm mt-1">
                                                                      {movie.releaseDate} {movie.duration ? `• ${movie.duration}` : ""} {genreText ? `• ${genreText}` : ""}
                                                            </p>
                                                            <p className="mt-4 text-zinc-200">{movie.description}</p>
                                                            {movie.director && <p className="mt-3 text-sm"><span className="text-zinc-400">Director:</span> {movie.director}</p>}
                                                            {movie.cast && <p className="mt-1 text-sm"><span className="text-zinc-400">Cast:</span> {movie.cast}</p>}
                                                  </div>
                                        </div>
                              </div>
                    </main>
          );
}
