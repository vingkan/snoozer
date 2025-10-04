import { getNamedStats } from "@/lib/dataDictionary";
import { nullishDivide, nullishSum } from "@/lib/math";
import {
  useSleeperFetch,
  useSleeperSeasonToDateWeeklyStats,
} from "@/lib/sleeper";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pluralize } from "@/lib/string";
import { LEAGUES, SEASONS } from "@/static/sleeper";

const FINAL_WEEK = 18;
const MIN_SNAPS = 20;

function getCurrentWeek(data: any[]): number {
  if (!data || data.length === 0) return 1;

  // Find all unique weeks in the data
  const weeks = [...new Set(data.map((row) => row.week))].sort((a, b) => a - b);

  if (weeks.length === 0) return 1;

  // Get the latest week with data
  const latestWeek = Math.max(...weeks);
  const latestWeekData = data.filter((row) => row.week === latestWeek);
  const uniqueTeamsInLatestWeek = new Set(
    latestWeekData.map((row) => row.team)
  );

  // If we have data for fewer than 30 teams in the latest week,
  // it's likely incomplete (some teams haven't played yet)
  if (uniqueTeamsInLatestWeek.size < 30) {
    // Return the previous week as the last complete week
    const previousWeek = weeks[weeks.length - 2];
    return previousWeek || 1;
  }

  // If we have data for most teams, assume the latest week is complete
  return latestWeek;
}

function getInjuredPlayers(data: any[]): Set<string> {
  const injuredPlayers = new Set<string>();

  if (!data || data.length === 0) return injuredPlayers;

  // Group data by player ID to find their latest week data
  const playerData = data.reduce((acc, row) => {
    const playerId = row.player_id.toString();
    if (!acc[playerId]) {
      acc[playerId] = [];
    }
    acc[playerId].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  // For each player, check their most recent injury status
  (Object.values(playerData) as any[][]).forEach((playerWeeks: any[]) => {
    if (playerWeeks.length === 0) return;

    // Sort by week descending to get the most recent week
    const sortedWeeks = playerWeeks.sort((a: any, b: any) => b.week - a.week);
    const latestWeekData = sortedWeeks[0];

    // Check if the player is on IR
    if (latestWeekData.player?.injury_status === "IR") {
      injuredPlayers.add(latestWeekData.player_id.toString());
    }
  });

  return injuredPlayers;
}

function getRows(
  data: any[],
  rostered: Map<string, string>,
  currentWeek: number
): any[] {
  // Filter data to only include weeks up to the current week
  const filteredData = data.filter((row) => row.week <= currentWeek);

  const weeklyRows = filteredData.map((row: any) => {
    const stats = getNamedStats(row.stats);
    return {
      id: row.player_id,
      name: `${row.player.first_name} ${row.player.last_name}`,
      week: row.week,
      team: row.player.team,
      opponent: row.opponent,
      receiving_targets: stats.receiving_targets,
      receiving_yards: stats.receiving_yards,
      ppr_fantasy_points: stats.ppr_scoring_fantasy_points,
      receiving_touchdowns: stats.receiving_touchdowns,
      played_games: stats.played_games,
      offensive_snaps: stats.offensive_snaps,
    };
  });
  const playerTotals = Object.values(
    weeklyRows.reduce((acc, row) => {
      return {
        ...acc,
        [row.id]: {
          ...(acc[row.id] ?? {}),
          id: row.id,
          name: row.name,
          team: row.team,
          is_rostered: rostered.has(row.id.toString()),
          owner: rostered.get(row.id.toString()),
          receiving_targets: nullishSum(
            acc[row.id]?.receiving_targets,
            row?.receiving_targets
          ),
          receiving_yards: nullishSum(
            acc[row.id]?.receiving_yards,
            row?.receiving_yards
          ),
          ppr_fantasy_points: nullishSum(
            acc[row.id]?.ppr_fantasy_points,
            row?.ppr_fantasy_points
          ),
          receiving_touchdowns: nullishSum(
            acc[row.id]?.receiving_touchdowns,
            row?.receiving_touchdowns
          ),
          played_games: nullishSum(
            acc[row.id]?.played_games,
            row?.played_games
          ),
          offensive_snaps: nullishSum(
            acc[row.id]?.offensive_snaps,
            row?.offensive_snaps
          ),
        },
      };
    }, {} as Record<string, any>)
  );

  const rows = playerTotals
    .map((row: any) => {
      return {
        ...row,
        receiving_yards_per_target: nullishDivide(
          row.receiving_yards,
          row.receiving_targets
        ),
        fantasy_points_per_target: nullishDivide(
          row.ppr_fantasy_points,
          row.receiving_targets
        ),
      };
    })
    .filter((row: any) => row.offensive_snaps >= MIN_SNAPS);
  return rows;
}

export default function WideReceivers() {
  const [leagueId, setLeagueId] = useState<string>(LEAGUES[0].id);
  const [season, setSeason] = useState<number>(SEASONS[0]);
  const [yAxisType, setYAxisType] = useState<
    "yards_per_target" | "fantasy_points_per_target"
  >("yards_per_target");

  const ownersQuery = useSleeperFetch(`/v1/league/${leagueId}/users`);
  const owners = useMemo(() => {
    return Object.fromEntries(
      ownersQuery.data?.map((row: any) => [row.user_id, row.display_name]) ?? []
    );
  }, [ownersQuery.data]);

  const rostersQuery = useSleeperFetch(`/v1/league/${leagueId}/rosters`);
  const rosteredPlayers = useMemo(() => {
    return new Map<string, string>(
      rostersQuery.data?.flatMap((roster: any) =>
        roster.players.map((player: any) => [player, owners[roster.owner_id]])
      ) ?? []
    );
  }, [rostersQuery.data, owners]);

  const seasonQuery = useSleeperSeasonToDateWeeklyStats(
    season,
    FINAL_WEEK,
    "WR"
  );

  const currentWeek = useMemo(() => {
    return getCurrentWeek(seasonQuery.data ?? []);
  }, [seasonQuery.data]);

  const injuredPlayers = useMemo(() => {
    return getInjuredPlayers(seasonQuery.data ?? []);
  }, [seasonQuery.data]);

  const rows = useMemo(
    () => getRows(seasonQuery.data ?? [], rosteredPlayers, currentWeek),
    [seasonQuery.data, rosteredPlayers, currentWeek]
  );

  // Calculate averages for reference lines
  const avgTargets =
    rows.reduce(
      (sum: number, row: any) => sum + (row.receiving_targets || 0),
      0
    ) / rows.length;
  const avgYardsPerTarget =
    rows.reduce(
      (sum: number, row: any) => sum + (row.receiving_yards_per_target || 0),
      0
    ) / rows.length;
  const avgFantasyPointsPerTarget =
    rows.reduce(
      (sum: number, row: any) => sum + (row.fantasy_points_per_target || 0),
      0
    ) / rows.length;

  const avgYAxisValue =
    yAxisType === "yards_per_target"
      ? avgYardsPerTarget
      : avgFantasyPointsPerTarget;
  const yAxisLabel =
    yAxisType === "yards_per_target"
      ? "Yards per Target"
      : "Fantasy Points per Target";
  const yAxisDataKey =
    yAxisType === "yards_per_target"
      ? "receiving_yards_per_target"
      : "fantasy_points_per_target";

  // Custom tooltip to show player name
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p>Team: {data.team}</p>
          <p>
            <span>Rostered: </span>
            <span>{rosteredPlayers.has(data.id) ? "Yes" : "No"}</span>
            {data.owner && <span> ({data.owner})</span>}
          </p>
          <p>
            <span>Injury Status: </span>
            <span
              className={
                injuredPlayers.has(data.id)
                  ? "text-red-600 font-semibold"
                  : "text-green-600"
              }
            >
              {injuredPlayers.has(data.id) ? "IR" : "Healthy"}
            </span>
          </p>
          <p>Targets: {data.receiving_targets}</p>
          <p>Yards per Target: {data.receiving_yards_per_target?.toFixed(2)}</p>
          <p>
            Fantasy Points per Target:{" "}
            {data.fantasy_points_per_target?.toFixed(2)}
          </p>
          <p>Receiving Touchdowns: {data.receiving_touchdowns}</p>
          <p>Games: {data.played_games}</p>
          <p>Snaps: {data.offensive_snaps}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl text-center font-bold mb-2">Wide Receivers</h1>
      <p className="text-sm text-center text-muted-foreground mb-2">
        <span>
          NFL {season} Season Through Week {currentWeek}
        </span>
        <span> • </span>
        <span>
          Minimum {pluralize(MIN_SNAPS, "offensive snap", "offensive snaps")}
        </span>
      </p>
      <div className="flex justify-center gap-4 my-4">
        <Select
          value={yAxisType}
          onValueChange={(
            value: "yards_per_target" | "fantasy_points_per_target"
          ) => setYAxisType(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Y-axis metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yards_per_target">Yards per Target</SelectItem>
            <SelectItem value="fantasy_points_per_target">
              Fantasy Points per Target
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={season.toString()}
          onValueChange={(value) => setSeason(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map((s) => (
              <SelectItem key={s} value={s.toString()}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={leagueId} onValueChange={setLeagueId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select league" />
          </SelectTrigger>
          <SelectContent>
            {LEAGUES.map((league) => (
              <SelectItem key={league.id} value={league.id}>
                {league.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full max-w-3xl mx-auto aspect-square">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            data={rows}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceLine
              x={avgTargets}
              stroke="#808080"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgTargets.toFixed(1)} targets`,
                position: "top",
              }}
            />
            <ReferenceLine
              y={avgYAxisValue}
              stroke="#808080"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgYAxisValue.toFixed(2)} ${
                  yAxisType === "yards_per_target" ? "yds" : "pts"
                }`,
                position: "right",
                offset: -80,
              }}
            />
            <XAxis
              type="number"
              dataKey="receiving_targets"
              name="Targets"
              label={{
                value: "Receiving Targets",
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey={yAxisDataKey}
              name={yAxisLabel}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter fillOpacity={0.6} r={6}>
              {rows.map((entry) => {
                let fillColor = "#00CED1"; // Default aqua blue for available players

                if (injuredPlayers.has(entry.id)) {
                  fillColor = "#DC2626"; // Red for injured players
                } else if (entry.is_rostered) {
                  fillColor = "#808080"; // Gray for rostered healthy players
                }

                return <Cell key={entry.id} fill={fillColor} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
