import styles from './FormatSummaryRow.module.css';
import { BanListFormat } from '../types/banlist';
import { FormatSummary } from '../data/banlistSummary';

type Props = {
  summaries: Record<BanListFormat, FormatSummary[]>;
};

const formatLabels: Record<BanListFormat, string> = {
  [BanListFormat.PRIMER_BLOQUE_LIBRE]: 'PB Racial Libre',
  [BanListFormat.PRIMER_BLOQUE_EDICION]: 'PB Racial Edición',
  [BanListFormat.BLOQUE_FURIA_LIBRE]: 'BF Racial Libre',
  [BanListFormat.BLOQUE_FURIA_LIMITED]: 'BF Limitado',
};

export default function FormatSummaryRow({ summaries }: Props) {
  return (
    <div className={styles.row}>
      {Object.keys(summaries).map((k) => {
        const key = k as BanListFormat;
        const items = summaries[key];
        return (
          <div key={k} className={styles.card}>
            <h4 className={styles.title}>{formatLabels[key]}</h4>
            {items.length === 0 ? (
              <p className={styles.noChanges}>Sin cambios</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Carta</th>
                    <th>Antes</th>
                    <th>Ahora</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.card}</td>
                      <td>{item.pastMonth}</td>
                      <td>{item.currentMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
