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
const MIN_SNAPS = 10;

function getRows(data: any[], rostered: Map<string, string>): any[] {
  const weeklyRows = data.map((row: any) => {
    const stats = getNamedStats(row.stats);
    return {
      id: row.player_id,
      name: `${row.player.first_name} ${row.player.last_name}`,
      week: row.week,
      team: row.player.team,
      opponent: row.opponent,
      rushing_attempts: stats.rushing_attempts,
      rushing_yards: stats.rushing_yards,
      receiving_targets: stats.receiving_targets,
      receiving_yards: stats.receiving_yards,
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
          rushing_attempts: nullishSum(
            acc[row.id]?.rushing_attempts,
            row?.rushing_attempts
          ),
          rushing_yards: nullishSum(
            acc[row.id]?.rushing_yards,
            row?.rushing_yards
          ),
          receiving_targets: nullishSum(
            acc[row.id]?.receiving_targets,
            row?.receiving_targets
          ),
          receiving_yards: nullishSum(
            acc[row.id]?.receiving_yards,
            row?.receiving_yards
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
        rushing_opportunities: row.rushing_attempts,
        receiving_opportunities: row.receiving_targets,
        all_opportunities: nullishSum(
          row.rushing_attempts,
          row.receiving_targets
        ),
        rushing_yards_per_opportunity: nullishDivide(
          row.rushing_yards,
          row.rushing_attempts
        ),
        receiving_yards_per_opportunity: nullishDivide(
          row.receiving_yards,
          row.receiving_targets
        ),
        all_yards_per_opportunity:
          nullishSum(row.rushing_yards, row.receiving_yards) /
          nullishSum(row.rushing_attempts, row.receiving_targets),
      };
    })
    .filter((row: any) => row.all_opportunities >= MIN_SNAPS);
  return rows;
}

export default function Example() {
  const [leagueId, setLeagueId] = useState<string>(LEAGUES[0].id);
  const [season, setSeason] = useState<number>(SEASONS[0]);
  const [opportunityType, setOpportunityType] = useState<
    "all" | "rushing" | "receiving"
  >("all");

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
    "RB"
  );
  const rows = useMemo(
    () => getRows(seasonQuery.data ?? [], rosteredPlayers),
    [seasonQuery.data, rosteredPlayers]
  );

  // Get current opportunity type data
  const getCurrentData = () => {
    const opportunityKey = `${opportunityType}_opportunities`;
    const yardsKey = `${opportunityType}_yards_per_opportunity`;

    return rows.map((row: any) => ({
      ...row,
      opportunities: row[opportunityKey] || 0,
      yards_per_opportunity: row[yardsKey] || 0,
    }));
  };

  const currentData = getCurrentData();

  // Calculate averages for reference lines
  const avgOpportunities =
    currentData.reduce(
      (sum: number, row: any) => sum + (row.opportunities || 0),
      0
    ) / currentData.length;
  const avgYardsPerOpportunity =
    currentData.reduce(
      (sum: number, row: any) => sum + (row.yards_per_opportunity || 0),
      0
    ) / currentData.length;

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
          <p>Opportunities: {data.opportunities}</p>
          <p>Yards per Opportunity: {data.yards_per_opportunity?.toFixed(2)}</p>
          <p>Games: {data.played_games}</p>
          <p>Snaps: {data.offensive_snaps}</p>
        </div>
      );
    }
    return null;
  };

  const getOpportunityTypeLabel = () => {
    switch (opportunityType) {
      case "rushing":
        return "Rushing";
      case "receiving":
        return "Receiving";
      default:
        return "All";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl text-center font-bold mb-2">Running Backs</h1>
      <p className="text-sm text-center  text-muted-foreground mb-2">
        <span>NFL {season} Season to Date</span>
        <span> • </span>
        <span>Minimum {pluralize(MIN_SNAPS, "snap", "snaps")}</span>
      </p>
      <div className="flex justify-center gap-4 my-4">
        <Select
          value={opportunityType}
          onValueChange={(value: "all" | "rushing" | "receiving") =>
            setOpportunityType(value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select opportunity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Opportunities</SelectItem>
            <SelectItem value="rushing">Rushing Only</SelectItem>
            <SelectItem value="receiving">Receiving Only</SelectItem>
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
            data={currentData}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceLine
              x={avgOpportunities}
              stroke="#808080"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgOpportunities.toFixed(1)} opp`,
                position: "top",
              }}
            />
            <ReferenceLine
              y={avgYardsPerOpportunity}
              stroke="#808080"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${avgYardsPerOpportunity.toFixed(2)} yds`,
                position: "right",
                offset: -80,
              }}
            />
            <XAxis
              type="number"
              dataKey="opportunities"
              name="Opportunities"
              label={{
                value: `${getOpportunityTypeLabel()} Opportunities`,
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey="yards_per_opportunity"
              name="Yards per Opportunity"
              label={{
                value: `${getOpportunityTypeLabel()} Yards per Opportunity`,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter fillOpacity={0.6} r={6}>
              {currentData.map((entry) => (
                <Cell
                  key={entry.id}
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
