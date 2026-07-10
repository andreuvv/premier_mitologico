import { useEffect, useState } from 'react';
import { BanListCard, BanListData, BanListFormat } from '../types/banlist';
import { getLatestTwoMonthlyBanlists, MonthlyBanlistSnapshot } from '../services/monthlyBanlistService';
import { banlistSummaries, lastUpdateMonth } from '../data/banlistSummary';
import { ChangeType, FormatSummary } from '../data/banlistSummary';
import {
  FORMAT_BANNER_IMAGES,
  MITOXICOS_LOADER_IMAGES,
} from '../config/loadingAssets';
import { preloadImages } from '../utils/preloadImages';

const LOADER_WEIGHT = 10;
const BANNER_WEIGHT = 50;
const BANLIST_WEIGHT = 40;
const LOAD_TIMEOUT_MS = 8000;

type RestrictionStatus = 'banned' | 'limitedX1' | 'limitedX2';

const getRestrictionLabel = (status?: RestrictionStatus): string => {
  if (!status) return 'Liberada';
  if (status === 'banned') return 'Baneada';
  if (status === 'limitedX1') return 'Limitada x1';
  return 'Limitada x2';
};

const getStatusRank = (status?: RestrictionStatus): number => {
  if (!status) return 0;
  if (status === 'limitedX2') return 1;
  if (status === 'limitedX1') return 2;
  return 3;
};

const buildStatusMap = (banlist: BanListData): Map<string, { status: RestrictionStatus; card: BanListCard }> => {
  const map = new Map<string, { status: RestrictionStatus; card: BanListCard }>();

  banlist.banned.forEach((card) => {
    map.set(card.name.toLowerCase(), { status: 'banned', card });
  });
  banlist.limitedX1.forEach((card) => {
    map.set(card.name.toLowerCase(), { status: 'limitedX1', card });
  });
  banlist.limitedX2.forEach((card) => {
    map.set(card.name.toLowerCase(), { status: 'limitedX2', card });
  });

  return map;
};

const compareBanlistChanges = (previous: BanListData, current: BanListData): FormatSummary[] => {
  const previousMap = buildStatusMap(previous);
  const currentMap = buildStatusMap(current);
  const allNames = new Set<string>([...previousMap.keys(), ...currentMap.keys()]);

  const changes: FormatSummary[] = [];

  allNames.forEach((nameKey) => {
    const prevEntry = previousMap.get(nameKey);
    const currEntry = currentMap.get(nameKey);

    if (prevEntry?.status === currEntry?.status) {
      return;
    }

    let changeType: ChangeType;

    if (!currEntry) {
      changeType = 'positive';
    } else if (currEntry.status === 'banned') {
      changeType = 'negative';
    } else if (!prevEntry && currEntry.status === 'limitedX2') {
      changeType = 'neutral';
    } else if (!prevEntry && currEntry.status === 'limitedX1') {
      changeType = 'negativeSoft';
    } else {
      const prevRank = getStatusRank(prevEntry?.status);
      const currRank = getStatusRank(currEntry.status);
      const diff = currRank - prevRank;

      if (diff > 0) {
        changeType = diff > 1 ? 'negative' : 'negativeSoft';
      } else if (diff < 0) {
        changeType = Math.abs(diff) > 1 ? 'positive' : 'positiveSoft';
      } else {
        changeType = 'neutral';
      }
    }

    const banListCard = currEntry?.card ?? prevEntry?.card;

    changes.push({
      card: banListCard?.name ?? nameKey,
      pastMonth: getRestrictionLabel(prevEntry?.status),
      currentMonth: getRestrictionLabel(currEntry?.status),
      changeType,
      imageUrl: currEntry?.card.imageUrl || prevEntry?.card.imageUrl,
      cardId: banListCard?.id,
    });
  });

  changes.sort((a, b) => a.card.localeCompare(b.card, 'es'));
  return changes;
};

const formatDateFromYearMonth = (year: number, month: number): string => {
  const safeLocalDate = new Date(year, month - 1, 15);
  return safeLocalDate
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());
};

const fetchBanlistSummaries = async (): Promise<{
  summaries: Record<BanListFormat, FormatSummary[]>;
  summaryMonth: string;
}> => {
  const formats = Object.values(BanListFormat);

  const results = await Promise.all(
    formats.map(async (format) => {
      const snapshots = await getLatestTwoMonthlyBanlists(format);
      return { format, snapshots };
    }),
  );

  const nextSummaries: Record<BanListFormat, FormatSummary[]> = {
    [BanListFormat.PRIMER_BLOQUE_LIBRE]: banlistSummaries[BanListFormat.PRIMER_BLOQUE_LIBRE],
    [BanListFormat.PRIMER_BLOQUE_EDICION]: banlistSummaries[BanListFormat.PRIMER_BLOQUE_EDICION],
    [BanListFormat.BLOQUE_FURIA_LIBRE]: banlistSummaries[BanListFormat.BLOQUE_FURIA_LIBRE],
    [BanListFormat.BLOQUE_FURIA_RAGNAROK]: banlistSummaries[BanListFormat.BLOQUE_FURIA_RAGNAROK],
  };

  const latestByFormat = new Map<BanListFormat, MonthlyBanlistSnapshot>();

  results.forEach(({ format, snapshots }) => {
    if (snapshots.length > 0) {
      latestByFormat.set(format, snapshots[0]);
    }

    if (snapshots.length < 2) {
      return;
    }

    nextSummaries[format] = compareBanlistChanges(snapshots[1].data, snapshots[0].data);
  });

  const defaultLatest = latestByFormat.get(BanListFormat.PRIMER_BLOQUE_LIBRE);
  const summaryMonth = defaultLatest
    ? formatDateFromYearMonth(defaultLatest.year, defaultLatest.month)
    : lastUpdateMonth;

  return { summaries: nextSummaries, summaryMonth };
};

export function useHomePageLoad() {
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summaries, setSummaries] = useState<Record<BanListFormat, FormatSummary[]>>(banlistSummaries);
  const [summaryMonth, setSummaryMonth] = useState<string>(lastUpdateMonth);

  useEffect(() => {
    let cancelled = false;
    let finished = false;

    const taskProgress = {
      loader: 0,
      banner: 0,
      banlist: 0,
    };

    const updateProgress = () => {
      if (cancelled) return;
      const total =
        (taskProgress.loader / 100) * LOADER_WEIGHT +
        (taskProgress.banner / 100) * BANNER_WEIGHT +
        (taskProgress.banlist / 100) * BANLIST_WEIGHT;
      setProgress(Math.round(total));
    };

    const finish = (
      nextSummaries: Record<BanListFormat, FormatSummary[]>,
      nextSummaryMonth: string,
    ) => {
      if (cancelled || finished) return;
      finished = true;
      setSummaries(nextSummaries);
      setSummaryMonth(nextSummaryMonth);
      setProgress(100);
      setIsReady(true);
    };

    const timeoutId = window.setTimeout(() => {
      finish(banlistSummaries, lastUpdateMonth);
    }, LOAD_TIMEOUT_MS);

    let loaderDone = false;
    let bannerDone = false;
    let banlistDone = false;
    let banlistResult = {
      summaries: banlistSummaries as Record<BanListFormat, FormatSummary[]>,
      summaryMonth: lastUpdateMonth,
    };

    const tryFinish = () => {
      if (!loaderDone || !bannerDone || !banlistDone) return;
      window.clearTimeout(timeoutId);
      finish(banlistResult.summaries, banlistResult.summaryMonth);
    };

    preloadImages(MITOXICOS_LOADER_IMAGES, (loaded, total) => {
      taskProgress.loader = Math.round((loaded / total) * 100);
      updateProgress();
    }).then(() => {
      taskProgress.loader = 100;
      updateProgress();
      loaderDone = true;
      tryFinish();
    });

    preloadImages(FORMAT_BANNER_IMAGES, (loaded, total) => {
      taskProgress.banner = Math.round((loaded / total) * 100);
      updateProgress();
    }).then(() => {
      taskProgress.banner = 100;
      updateProgress();
      bannerDone = true;
      tryFinish();
    });

    fetchBanlistSummaries()
      .then((result) => {
        banlistResult = result;
      })
      .catch((err) => {
        console.error('Error loading dynamic banlist summaries for Home:', err);
        banlistResult = {
          summaries: banlistSummaries,
          summaryMonth: lastUpdateMonth,
        };
      })
      .finally(() => {
        taskProgress.banlist = 100;
        updateProgress();
        banlistDone = true;
        tryFinish();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return { isReady, progress, summaries, summaryMonth };
}
