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
import { LEAGUES, SEASONS } from "@/static/sleeper";

const FINAL_WEEK = 18;
const MIN_GAMES = 1;

function getDefenseRows(data: any[]): any[] {
  const defensePointsFor = data
    .map((row: any) => {
      const stats = getNamedStats(row.stats);
      return {
        id: row.player_id,
        team: row.player.team,
        standard_scoring_fantasy_points: stats.standard_scoring_fantasy_points,
        played_games: stats.played_games,
      };
    })
    .reduce((acc, row) => {
      return {
        ...acc,
        [row.team]: {
          id: row.id,
          team: row.team,
          scores: [
            ...(acc[row.team]?.scores ?? []),
            row?.standard_scoring_fantasy_points ?? 0,
          ],
          standard_scoring_fantasy_points: nullishSum(
            acc[row.team]?.standard_scoring_fantasy_points,
            row?.standard_scoring_fantasy_points
          ),
          played_games: nullishSum(
            acc[row.team]?.played_games,
            row?.played_games
          ),
        },
      };
    }, {} as Record<string, any>);

  const opponentPointsAgainst = data
    .map((row: any) => {
      const stats = getNamedStats(row.stats);
      return {
        // Teams whose defense played against this opponent.
        team: row.opponent,
        standard_scoring_fantasy_points: stats.standard_scoring_fantasy_points,
        played_games: stats.played_games,
      };
    })
    .reduce((acc, row) => {
      return {
        ...acc,
        [row.team]: {
          team: row.team,
          scores: [
            ...(acc[row.team]?.scores ?? []),
            row?.standard_scoring_fantasy_points ?? 0,
          ],
          standard_scoring_fantasy_points: nullishSum(
            acc[row.team]?.standard_scoring_fantasy_points,
            row?.standard_scoring_fantasy_points
          ),
          played_games: nullishSum(
            acc[row.team]?.played_games,
            row?.played_games
          ),
        },
      };
    }, {} as Record<string, any>);

  console.log({ defensePointsFor, opponentPointsAgainst });

  return [];
}

function getRows(data: any[], rostered: Map<string, string>): any[] {
  const weeklyRows = data
    .map((row: any) => {
      const stats = getNamedStats(row.stats);
      return {
        id: row.player_id,
        name: `${row.player.first_name} ${row.player.last_name}`,
        week: row.week,
        team: row.player.team,
        opponent: row.opponent,
        ppr_scoring_fantasy_points: stats.ppr_scoring_fantasy_points,
        played_games: stats.played_games,
      };
    })
    .sort((a, b) => a.week - b.week);

  // Group by defense team and calculate totals
  const defenseTotals = Object.values(
    weeklyRows.reduce((acc, row) => {
      return {
        ...acc,
        [row.team]: {
          ...(acc[row.team] ?? {}),
          team: row.team,
          next_week_opponent: row.opponent,
          is_rostered: rostered.has(row.team),
          owner: rostered.get(row.team),
          ppr_scoring_fantasy_points: nullishSum(
            acc[row.team]?.ppr_scoring_fantasy_points,
            row?.ppr_scoring_fantasy_points
          ),
          played_games: nullishSum(
            acc[row.team]?.played_games,
            row?.played_games
          ),
          weeks: [...(acc[row.team]?.weeks ?? []), row.week],
        },
      };
    }, {} as Record<string, any>)
  );

  // Filter defenses with minimum games
  const rows = defenseTotals.filter(
    (defense: any) => defense.played_games >= MIN_GAMES
  );

  return rows;
}

function getNextWeek(data: any[]): number {
  // Find the highest week number in the data
  const maxWeek = Math.max(...data.map((row) => row.week));

  // Check if we have data for the next week
  const hasNextWeek = data.some((row) => row.week === maxWeek + 1);

  // If we have data for the next week, return it, otherwise return maxWeek + 1
  return hasNextWeek ? maxWeek + 1 : maxWeek + 1;
}

function getOpponentDefensePoints(
  data: any[],
  nextWeek: number
): Map<string, number> {
  // Create a map of team -> average fantasy points of defenses they've faced
  const opponentDefensePoints = new Map<string, number>();

  // Get all unique teams
  const teams = [...new Set(data.map((row) => row.team))];

  teams.forEach((team) => {
    // Find all games this team has played so far (excluding next week)
    const teamGames = data.filter(
      (row) => row.team === team && row.week < nextWeek
    );

    if (teamGames.length > 0) {
      let totalDefensePoints = 0;
      let totalGames = 0;

      // For each game this team played, find the defense stats of their opponent
      teamGames.forEach((game) => {
        const opponent = game.opponent;

        // Find the defense stats for this specific opponent in this specific week
        const opponentDefenseGame = data.find(
          (row) => row.team === opponent && row.week === game.week
        );

        if (opponentDefenseGame) {
          const stats = getNamedStats(opponentDefenseGame.stats);
          totalDefensePoints += stats.ppr_scoring_fantasy_points || 0;
          totalGames += 1;
        }
      });

      const averagePoints =
        totalGames > 0 ? totalDefensePoints / totalGames : 0;
      opponentDefensePoints.set(team, averagePoints);
    }
  });

  return opponentDefensePoints;
}

function getDefenseData(
  data: any[],
  rostered: Map<string, string>,
  nextWeek: number
) {
  const defenseRows = getRows(data, rostered);
  const opponentDefensePoints = getOpponentDefensePoints(data, nextWeek);

  getDefenseRows(data);

  return defenseRows.map((defense: any) => {
    const opponentDefenseAvg =
      opponentDefensePoints.get(defense.next_week_opponent) || 0;

    return {
      ...defense,
      avg_fantasy_points_per_game: nullishDivide(
        defense.ppr_scoring_fantasy_points,
        defense.played_games
      ),
      next_week_opponent_defense_avg: opponentDefenseAvg,
    };
  });
}

export default function Defense() {
  const [leagueId, setLeagueId] = useState<string>(LEAGUES[0].id);
  const [season, setSeason] = useState<number>(SEASONS[0]);

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
    "DEF"
  );

  const nextWeek = useMemo(() => {
    return getNextWeek(seasonQuery.data ?? []);
  }, [seasonQuery.data]);

  const defenseData = useMemo(() => {
    return getDefenseData(seasonQuery.data ?? [], rosteredPlayers, nextWeek);
  }, [seasonQuery.data, rosteredPlayers, nextWeek]);

  // Calculate averages for reference lines
  const avgDefensePoints =
    defenseData.reduce(
      (sum: number, row: any) => sum + (row.avg_fantasy_points_per_game || 0),
      0
    ) / defenseData.length;
  const avgOpponentDefensePoints =
    defenseData.reduce(
      (sum: number, row: any) =>
        sum + (row.next_week_opponent_defense_avg || 0),
      0
    ) / defenseData.length;

  // Custom tooltip to show defense info
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{data.team} Defense</p>
          <p>
            <span>Rostered: </span>
            <span>{data.is_rostered ? "Yes" : "No"}</span>
            {data.owner && <span> ({data.owner})</span>}
          </p>
          <p>
            Avg Fantasy Points/Game:{" "}
            {data.avg_fantasy_points_per_game?.toFixed(2)}
          </p>
          <p>Next Week vs: {data.next_week_opponent}</p>
          <p>
            Opponent Defense Avg:{" "}
            {data.next_week_opponent_defense_avg?.toFixed(2)}
          </p>
          <p>Games Played: {data.played_games}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl text-center font-bold mb-2">
        Defense Evaluation
      </h1>
      <p className="text-sm text-center text-muted-foreground mb-2">
        <span>NFL {season} Season to Date</span>
        <span> • </span>
        <span>Week {nextWeek} Matchups</span>
        <span> • </span>
        <span>
          Minimum {MIN_GAMES} {MIN_GAMES === 1 ? "game" : "games"}
        </span>
      </p>
      <div className="flex justify-center gap-4 my-4">
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
            data={defenseData}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceLine
              x={avgDefensePoints}
              stroke="#808080"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgDefensePoints.toFixed(1)} pts`,
                position: "top",
              }}
            />
            <ReferenceLine
              y={avgOpponentDefensePoints}
              stroke="#808080"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgOpponentDefensePoints.toFixed(2)} pts`,
                position: "right",
                offset: -80,
              }}
            />
            <XAxis
              type="number"
              dataKey="avg_fantasy_points_per_game"
              name="Defense Fantasy Points"
              label={{
                value: "Defense Avg Fantasy Points per Game",
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey="next_week_opponent_defense_avg"
              name="Opponent Defense Avg"
              label={{
                value: "Next Week Opponent Defense Avg Points",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter fillOpacity={0.6} r={6}>
              {defenseData.map((entry) => (
                <Cell
                  key={entry.team}
                  fill={entry.is_rostered ? "#808080" : "#FF69B4"}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
