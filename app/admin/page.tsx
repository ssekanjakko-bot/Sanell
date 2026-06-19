"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject
} from "firebase/storage";
import {
  addDoc, collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";

interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: strin
  duration: string;
  genre: string[];
  director: string;
  cast: string;
  videoUrl: string;
  posterUrl: string;
  videoPath: string;
  posterPath: string;
  youtubeId?: string;
  createdAt: any;
}

export default function AdminPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [duration, setDuration] = useState("");
  const [genre, setGenre] = useState<string[]>([]);
  const [director, setDirector] = useState("");
  const [cast, setCast] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState(""); // <-- NEW
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  // 1. Fetch movies live from Firestore
  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moviesData: Movie[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
       ...docSnap.data()
      } as Movie));
      setMovies(moviesData);
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setReleaseDate("");
    setDuration("");
    setGenre([]);
    setDirector("");
    setCast("");
    setYoutubeUrl(""); // <-- NEW
    setVideoFile(null);
    setPosterFile(null);
    setEditingId(null);
    setUploadProgress(0);
    setUploadStatus("");
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setGenre([...genre, value]);
    } else {
      setGenre(genre.filter(g => g!== value));
    }
  };

  // 2. Add or Update Movie
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extract YouTube video ID
    const getYouTubeId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11)? match[7] : null;
    };
    const youtubeId = getYouTubeId(youtubeUrl);

    if (!editingId &&!youtubeId && (!videoFile ||!posterFile)) {
      alert("Please provide a YouTube link OR upload both a video and a poster image.");
      return;
    }
    if (!editingId &&!posterFile) {
      alert("Please select a poster image.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Starting...");

    try {
      let videoUrl = "";
      let posterUrl = "";
      let videoPath = "";
      let posterPath = "";

      // Upload new Poster if selected
      if (posterFile) {
        setUploadStatus("Uploading poster 0%");
        posterPath = `posters/${Date.now()}_${posterFile.name}`;
        const posterRef = ref(storage, posterPath);
        const posterSnap = await uploadBytes(posterRef, posterFile);
        posterUrl = await getDownloadURL(posterSnap.ref);
      } else if (editingId) {
        const oldMovie = movies.find(m => m.id === editingId);
        posterUrl = oldMovie?.posterUrl || "";
        posterPath = oldMovie?.posterPath || "";
      }

      // Upload new Video if selected AND no YouTube link
      if (videoFile &&!youtubeId) {
        setUploadStatus("Uploading video 0%");
        videoPath = `videos/${Date.now()}_${videoFile.name}`;
        const videoRef = ref(storage, videoPath);
        const uploadTask = uploadBytesResumable(videoRef, videoFile);

        videoUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
              const mbTransferred = (snapshot.bytesTransferred / 1024 / 1024).toFixed(1);
              const mbTotal = (snapshot.totalBytes / 1024 / 1024).toFixed(1);
              setUploadStatus(`Uploading video: ${Math.round(progress)}% - ${mbTransferred} MB / ${mbTotal} MB`);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      } else if (editingId &&!youtubeId) {
        const oldMovie = movies.find(m => m.id === editingId);
        videoUrl = oldMovie?.videoUrl || "";
        videoPath = oldMovie?.videoPath || "";
      }

      setUploadStatus("Saving to database...");
      const movieData = {
        title, description, releaseDate, duration, genre, director, cast,
        videoUrl, posterUrl, videoPath, posterPath,
        youtubeId: youtubeId || null, // <-- NEW
        updatedAt: new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, "movies", editingId), movieData);
        alert("Movie updated!");
      } else {
        await addDoc(collection(db, "movies"), {
         ...movieData,
          createdAt: new Date()
        });
        alert("Movie added!");
      }

      resetForm();
    } catch (error: any) {
      console.error("Error adding/updating movie: ", error);
      alert("Error: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id);
    setTitle(movie.title);
    setDescription(movie.description);
    setReleaseDate(movie.releaseDate);
    setDuration(movie.duration);
    setGenre(movie.genre);
    setDirector(movie.director);
    setCast(movie.cast);
    setYoutubeUrl(movie.youtubeId? `https://youtu.be/${movie.youtubeId}` : ""); // <-- NEW
    setVideoFile(null);
    setPosterFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, videoPath: string, posterPath: string) => {
    if (confirm("Are you sure you want to delete this movie?")) {
      try {
        if (videoPath) await deleteObject(ref(storage, videoPath));
        if (posterPath) await deleteObject(ref(storage, posterPath));
        await deleteDoc(doc(db, "movies", id));
        alert("Movie deleted");
      } catch (error) {
        console.error("Error deleting movie: ", error);
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin - Manage Movies</h1>

      <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">{editingId? "Edit Movie" : "Add New Movie"}</h2>

        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 w-full mb-2 rounded" required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="border p-2 w-full mb-2 rounded" required />
        <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="border p-2 w-full mb-2 rounded" required />
        <input type="text" placeholder="Duration e.g. 2h 15m" value={duration} onChange={e => setDuration(e.target.value)} className="border p-2 w-full mb-2 rounded" required />
        <input type="text" placeholder="Director" value={director} onChange={e => setDirector(e.target.value)} className="border p-2 w-full mb-2 rounded" required />
        <input type="text" placeholder="Cast, comma separated" value={cast} onChange={e => setCast(e.target.value)} className="border p-2 w-full mb-2 rounded" required />

        <div className="mb-2">
          <label className="font-semibold block mb-1">Genre</label>
          {["Action", "Comedy", "Drama", "Horror", "Sci-Fi"].map(g => (
            <label key={g} className="mr-4">
              <input type="checkbox" value={g} checked={genre.includes(g)} onChange={handleGenreChange} /> {g}
            </label>
          ))}
        </div>

        <div className="mb-2">
          <label className="font-semibold">YouTube Link</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            className="border p-2 w-full rounded mb-2"
          />
          <label className="text-sm text-gray-500">OR Upload Video File {editingId && "(leave empty to keep current)"}</label>
          <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded" />
        </div>

        <div className="mb-4">
          <label className="font-semibold">Poster Image {editingId && "(leave empty to keep current)"}</label>
          <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="border p-2 w-full rounded" />
        </div>

        {isUploading && (
          <div className="mb-4">
            <div className="w-full bg-gray-300 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-sm mt-1">{uploadStatus}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={isUploading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {editingId? "Update Movie" : "Add Movie"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>}
        </div>
      </form>

      <h2 className="text-2xl font-semibold mb-4">Existing Movies</h2>
      <div className="grid gap-4">
        {movies.map(movie => (
          <div key={movie.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold">{movie.title}</h3>
              <p className="text-sm text-gray-600">
                {movie.youtubeId? "Source: YouTube" : "Source: Uploaded"}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(movie)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => handleDelete(movie.id, movie.videoPath, movie.posterPath)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
