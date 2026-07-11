"use client";
import { useState, useEffect } from "react";

const API_KEY = "PASTE_YOUR_API_KEY_HERE"; // <-- PUT YOUR API-SPORTS KEY HERE

const HOSTS: Record<string, string> = {
  football: "v3.football.api-sports.io",
  basketball: "v2.basketball.api-sports.io",
  tennis: "v1.tennis.api-sports.io",
  cricket: "v1.cricket.api-sports.io"
};

const SPORTS = ["Football", "Basketball", "Tennis", "Cricket"];
const DATES = ["Yesterday", "Today", "Tomorrow"];

// THIS FUNCTION CALLS API-SPORTS FROM THE SERVER SO IT WON'T BE BLOCKED
async function fetchSports(sport: string, type: "live" | "fixtures" | "results", date: string) {
  const sportKey = sport.toLowerCase();
  const host = HOSTS[sportKey];
  
  let endpoint = "";
  if(type === "live") endpoint = "fixtures?live=all";
  else if(type === "results") endpoint = `fixtures?date=${date}&status=FT`;
  else endpoint = `fixtures?date=${date}`;

  try {
    const res = await fetch(`https://${host}/${endpoint}`, {
      headers: {
        "x-api-key": API_KEY,
        "x-apisports-host": host
      },
      cache: "no-store"
    });
    const data = await res.json();
    return data.response || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default function SanelSports() {
  const [activeSport, setActiveSport] = useState("Football");
  const [activeDate, setActiveDate] = useState("Today");
  const [live, setLive] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getDate = () => {
    const d = new Date();
    if (activeDate === "Tomorrow") d.setDate(d.getDate() + 1);
    if (activeDate === "Yesterday") d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const fetchData = async () => {
    setLoading(true);
    const date = getDate();

    const [liveRes, fixRes, resRes] = await Promise.all([
      fetchSports(activeSport, "live", date),
      fetchSports(activeSport, "fixtures", date),
      fetchSports(activeSport, "results", date),
    ]);

    setLive(liveRes);
    setFixtures(fixRes);
    setResults(resRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeSport,