import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import OnlineTournamentMatrix from '../components/OnlineTournamentMatrix';
import onlineTournamentService, { OnlineStanding, OnlineMatch, OnlineTournament } from '../services/onlineTournamentService';
import styles from './OnlineTournamentPage.module.css';

const monthTranslations: { [key: string]: string } = {
  'January': 'Enero',
  'February': 'Febrero',
  'March': 'Marzo',
  'April': 'Abril',
  'May': 'Mayo',
  'June': 'Junio',
  'July': 'Julio',
  'August': 'Agosto',
  'September': 'Septiembre',
  'October': 'Octubre',
  'November': 'Noviembre',
  'December': 'Diciembre',
};

// Configure the format variant and display name for each tournament ID
// Edit this to set the correct format for your tournament
const formatConfig: { [key: number]: { name: string; hash: string } } = {
    11: { name: 'Infantería Racial Libre', hash: 'infanteria' },
    13: { name: 'Sellado', hash: 'sellado' },
    //2: { name: 'VCR', hash: 'vcr' },
    //3: { name: 'Commander', hash: 'commander' },
};

const getFormatLink = (tournamentId: number): { name: string; hash: string } => {
  return formatConfig[tournamentId] || { name: '', hash: 'formatosEspeciales' };
};

const OnlineTournamentPage = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<OnlineTournament | null>(null);
  const [standings, setStandings] = useState<OnlineStanding[]>([]);
  const [matches, setMatches] = useState<OnlineMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tournamentId) {
        setError('Tournament ID not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [tournamentData, standingsData, matchesData] = await Promise.all([
          onlineTournamentService.getTournamentInfo(parseInt(tournamentId)),
          onlineTournamentService.getTournamentStandings(parseInt(tournamentId)),
          onlineTournamentService.getTournamentMatches(parseInt(tournamentId)),
        ]);

        if (!tournamentData) {
          setError('Tournament not found');
        } else {
          setTournament(tournamentData);
          setStandings(standingsData);
          setMatches(matchesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Cargando...</div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Torneo no encontrado'}</p>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            ← Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const completedMatches = matches.filter((m) => m.completed);
  const completionPercentage =
    matches.length > 0 ? Math.round((completedMatches.length / matches.length) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Torneo '{tournament.name}'</h1>
          <p className={styles.subtitle}>
            {monthTranslations[tournament.month] || tournament.month} {tournament.year} • 
            {(() => {
              const formatInfo = getFormatLink(tournament.id);
              return (
                <Link to={`/game-formats#${formatInfo.hash}`} style={{ textDecoration: 'none', color: '#2a5f7f', fontWeight: 'bold' }}>
                   {' '} Formato {formatInfo.name}{' '}{tournament.format}
                </Link>
              );
            })()}
          </p>
        </div>
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Jugadores</p>
          <p className={styles.statValue}>{standings.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Partidas</p>
          <p className={styles.statValue}>{matches.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Completadas</p>
          <p className={styles.statValue}>
            {completedMatches.length}/{matches.length}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Progreso</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className={styles.progressText}>{completionPercentage}%</p>
        </div>
      </div>

      <div className={styles.matrixSection}>
        <h2 className={styles.sectionTitle}>Matriz de Resultados Torneo online</h2>
        <p className={styles.sectionDescription}>
          Visualiza los resultados cara a cara entre todos los jugadores. La matriz muestra cada resultado de partida donde los jugadores se interseccionan, con los puntos totales en la última columna.
        </p>
        <OnlineTournamentMatrix standings={standings} matches={matches} />
      </div>

      <div className={styles.standingsSection}>
        <h2 className={styles.sectionTitle}>Tabla de Posiciones</h2>
        <table className={styles.standingsTable}>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Jugador</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.player_id}>
                <td className={styles.positionCell}>
                  {index === 0 && <span className={styles.medal}>🥇</span>}
                  {index === 1 && <span className={styles.medal}>🥈</span>}
                  {index === 2 && <span className={styles.medal}>🥉</span>}
                  {index > 2 && <span>{index + 1}</span>}
                </td>
                <td className={styles.playerCell}>{standing.player_name}</td>
                <td className={styles.winsCell}>{standing.wins}</td>
                <td className={styles.tiesCell}>{standing.ties}</td>
                <td className={styles.lossesCell}>{standing.losses}</td>
                <td className={styles.pointsCell}>
                  <strong>{standing.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnlineTournamentPage;
