import { useQuery } from "@tanstack/react-query";

const BASE_URL = "https://api.sleeper.app";

async function fetchJson(url: string) {
  const response = await fetch(url);
  return response.json();
}

async function fetchFromSleeper(path: string) {
  return fetchJson(`${BASE_URL}${path}`);
}

export function useSleeperFetch(path: string) {
  return useQuery({
    queryKey: ["sleeper", path],
    queryFn: () => fetchFromSleeper(path),
  });
}

async function fetchSleeperSeasonToDateWeeklyStats(
  season: number,
  weeks: number,
  position: string
) {
  const weekPromises = Array.from({ length: weeks }, (_, i) => {
    const week = i + 1;
    const url = new URL(`${BASE_URL}/stats/nfl/${season}/${week}`);
    url.searchParams.set("season_type", "regular");
    url.searchParams.set("position", position);
    return fetchJson(url.toString());
  });
  const results = await Promise.all(weekPromises);
  return results.flat();
}

export function useSleeperSeasonToDateWeeklyStats(
  season: number,
  weeks: number,
  position: string
) {
  return useQuery({
    queryKey: ["sleeper", "season", season, weeks, position],
    queryFn: () => fetchSleeperSeasonToDateWeeklyStats(season, weeks, position),
  });
}
