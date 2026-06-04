import { useState, useEffect } from 'react';
import { BanListData, BanListFormat } from '../types/banlist';
import { getLatestMonthlyBanlist } from '../services/monthlyBanlistService';

type DeckFormat = 'pb' | 'fx';
type DeckSubformat = 'pb-edicion' | 'pb-libre' | 'fx-vcr' | 'fx-libre';

function toBanListFormat(format: DeckFormat, subformat: DeckSubformat): BanListFormat {
  if (format === 'pb') {
    return subformat === 'pb-edicion'
      ? BanListFormat.PRIMER_BLOQUE_EDICION
      : BanListFormat.PRIMER_BLOQUE_LIBRE;
  } else {
    return subformat === 'fx-vcr'
      ? BanListFormat.BLOQUE_FURIA_RAGNAROK
      : BanListFormat.BLOQUE_FURIA_LIBRE;
  }
}

export function useBanlist(format: DeckFormat, subformat: DeckSubformat) {
  const [banlist, setBanlist] = useState<BanListData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const blFormat = toBanListFormat(format, subformat);
    getLatestMonthlyBanlist(blFormat)
      .then((data) => {
        setBanlist(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [format, subformat]);

  return { banlist, loading };
}
