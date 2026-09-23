import { NextRequest } from "next/server";

const HOSTS: Record<string, string> = {
  football: "v3.football.api-sports.io",
  basketball: "v1.basketball.api-sports.io",
  tennis: "v1.tennis.api-sports.io",
  cricket: "v1.cricket.api-sports.io",
};

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport")?.toLowerCase() || "football";
  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const type = req.nextUrl.searchParams.get("type") || "fixtures"; // live, fixtures, results

  const host = HOSTS[sport];
  if (!host) return Response.json({ error: "Invalid sport" }, { status: 400 });

  let endpoint = "";
  if (type === "live") endpoint = `fixtures?live=all`;
  else if (type === "results") endpoint = `fixtures?date=${date}&status=FT`;
  else endpoint = `fixtures?date=${date}`;

  try {
    const res = await fetch(`https://${host}/${endpoint}`, {
      headers: {
        "x-apisports-key": process.env.API_SPORTS_KEY!,
        "x-apisports-host": host,
      },
      next: { revalidate: 30 } // cache 30s, saves quota
    });

    const data = await res.json();
    return Response.json({ response: data.response || [] });
  } catch (e) {
    return Response.json({ response: [], error: "Failed" }, { status: 500 });
  }
}