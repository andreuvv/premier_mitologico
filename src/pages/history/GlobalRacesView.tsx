import type { TournamentRacesResponse } from '../../services/tournamentAPI';
import styles from '../TournamentHistoryPage.module.css';
import { RaceUsageChart, RaceWinrateChart } from './RaceCharts';

/** Race usage and winrates across all archived premier tournaments. */
export default function GlobalRacesView({ globalRaces }: { globalRaces: TournamentRacesResponse | null }) {
  return (
    <div className={styles.resumenView}>
      <div className={styles.chartsContainer}>
        <RaceUsageChart title="Uso de Razas en Primer Bloque" raceData={globalRaces?.pb_races} format="pb" emptyText="No hay datos de razas para Primer Bloque" />
        <RaceUsageChart title="Uso de Razas en Furia Extendido" raceData={globalRaces?.bf_races} format="bf" emptyText="No hay datos de razas para Furia Extendido" />
        <RaceWinrateChart title="Winrate por Raza - Primer Bloque" winrates={globalRaces?.pb_race_winrates} fill="#38A169" emptyText="No hay datos de winrates para Primer Bloque" />
        <RaceWinrateChart title="Winrate por Raza - Furia Extendido" winrates={globalRaces?.bf_race_winrates} fill="#E53E3E" emptyText="No hay datos de winrates para Furia Extendido" />
      </div>
    </div>
  );
}
