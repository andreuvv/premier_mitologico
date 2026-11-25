import type { Tournament, TournamentRacesResponse } from '../../services/tournamentAPI';
import styles from '../TournamentHistoryPage.module.css';
import FormatDescription from './FormatDescription';
import { RaceUsageChart, RaceWinrateChart } from './RaceCharts';
import { formatFlags, secondSubformatName } from './historyUtils';

interface TournamentSummaryViewProps {
  tournament: Tournament | null;
  races: TournamentRacesResponse | null;
}

/** "Resumen" of a tournament: race usage and winrate charts for each format played. */
export default function TournamentSummaryView({ tournament, races }: TournamentSummaryViewProps) {
  const { shouldShowPB, shouldShowBF, isFormatSpecific } = formatFlags(tournament);
  const format = tournament?.format;
  const raceFormat = format === 'PB' ? 'pb' : 'bf';
  const second = secondSubformatName(tournament);

  return (
    <div className={styles.resumenView}>
      <FormatDescription tournament={tournament} />
      <div className={styles.chartsContainer}>
        {shouldShowPB && !isFormatSpecific && (
          <>
            <RaceUsageChart title="Uso de Razas en Primer Bloque" raceData={races?.pb_races} format="pb" emptyText="No hay datos de razas para Primer Bloque" />
            <RaceWinrateChart title="Winrate por Raza - Primer Bloque" winrates={races?.pb_race_winrates} fill="#38A169" emptyText="No hay datos de winrates para Primer Bloque" />
          </>
        )}
        {shouldShowBF && !isFormatSpecific && (
          <>
            <RaceUsageChart title="Uso de Razas en Furia Extendido" raceData={races?.bf_races} format="bf" emptyText="No hay datos de razas para Furia Extendido" />
            <RaceWinrateChart title="Winrate por Raza - Furia Extendido" winrates={races?.bf_race_winrates} fill="#E53E3E" emptyText="No hay datos de winrates para Furia Extendido" />
          </>
        )}
        {isFormatSpecific && (
          <>
            <RaceUsageChart title={`Uso de Razas en ${format} - Libre`} raceData={races?.libre_races} format={raceFormat} emptyText="No hay datos de razas" />
            <RaceWinrateChart title={`Winrate por Raza - ${format} Libre`} winrates={races?.libre_race_winrates} fill="#3182CE" emptyText="No hay datos de winrates" />
            <RaceUsageChart title={`Uso de Razas en ${format} - ${second}`} raceData={races?.vcr_races} format={raceFormat} emptyText="No hay datos de razas" />
            <RaceWinrateChart title={`Winrate por Raza - ${format} ${second}`} winrates={races?.vcr_race_winrates} fill="#805AD5" emptyText="No hay datos de winrates" />
          </>
        )}
      </div>
    </div>
  );
}
