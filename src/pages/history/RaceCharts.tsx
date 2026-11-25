import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from '../TournamentHistoryPage.module.css';
import { getColorForRace, prepareChartData, prepareWinrateData, type RaceFormat } from './historyUtils';

interface RaceUsageChartProps {
  title: string;
  raceData: { [race: string]: number } | null | undefined;
  format: RaceFormat;
  emptyText: string;
}

/** Pie chart with how many times each race was played. */
export function RaceUsageChart({ title, raceData, format, emptyText }: RaceUsageChartProps) {
  const data = raceData ? prepareChartData(raceData, format) : null;
  return (
    <div className={styles.chartSection}>
      <h2>{title}</h2>
      {data ? (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={(entry) => entry.value > 0 ? `${entry.value}` : ''}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorForRace(entry.name, format)} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              formatter={(_, entry) => (entry.payload as { displayName: string }).displayName}
              wrapperStyle={{ color: 'var(--beige)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

interface RaceWinrateChartProps {
  title: string;
  winrates: { [race: string]: number } | null | undefined;
  fill: string;
  emptyText: string;
}

/** Bar chart with the winrate of each race, highest first. */
export function RaceWinrateChart({ title, winrates, fill, emptyText }: RaceWinrateChartProps) {
  return (
    <div className={styles.chartSection}>
      <h2>{title}</h2>
      {winrates ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={prepareWinrateData(winrates)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="race"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis label={{ value: 'Winrate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value}%`, 'Winrate']} contentStyle={{ color: 'var(--coal-grey)' }} />
            <Bar dataKey="winrate" fill={fill} label={{ fill: 'white', fontSize: 12, position: 'inside' }} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}
