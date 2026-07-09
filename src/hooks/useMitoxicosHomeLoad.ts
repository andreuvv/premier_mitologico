import { useEffect, useState } from 'react';
import { PublicDeck, useUserDecks } from './useUserDecks';
import { tournamentAPI, GlobalStanding } from '../services/tournamentAPI';
import onlineTournamentService, { OnlineTournament } from '../services/onlineTournamentService';
import { fetchAllBlogPosts } from '../services/blogService';
import { BlogPost } from '../types';
import { FORMAT_BANNER_IMAGES } from '../config/loadingAssets';
import { preloadImages } from '../utils/preloadImages';

const BANNER_WEIGHT = 40;
const DATA_WEIGHT = 60;
const DATA_TASK_COUNT = 4;
const LOAD_TIMEOUT_MS = 8000;

export function useMitoxicosHomeLoad() {
  const { loadAllDecks } = useUserDecks();
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [globalStandings, setGlobalStandings] = useState<GlobalStanding[]>([]);
  const [tournament, setTournament] = useState<OnlineTournament | null>(null);
  const [latestPb, setLatestPb] = useState<PublicDeck | null>(null);
  const [latestFx, setLatestFx] = useState<PublicDeck | null>(null);
  const [latestPost, setLatestPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    let finished = false;

    const taskProgress = { banner: 0, data: 0 };

    const updateProgress = () => {
      if (cancelled) return;
      const total =
        (taskProgress.banner / 100) * BANNER_WEIGHT +
        (taskProgress.data / 100) * DATA_WEIGHT;
      setProgress(Math.round(total));
    };

    const finish = (
      standings: GlobalStanding[],
      activeTournament: OnlineTournament | null,
      pb: PublicDeck | null,
      fx: PublicDeck | null,
      post: BlogPost | null,
    ) => {
      if (cancelled || finished) return;
      finished = true;
      setGlobalStandings(standings);
      setTournament(activeTournament);
      setLatestPb(pb);
      setLatestFx(fx);
      setLatestPost(post);
      setProgress(100);
      setIsReady(true);
    };

    const timeoutId = window.setTimeout(() => {
      finish([], null, null, null, null);
    }, LOAD_TIMEOUT_MS);

    let bannerDone = false;
    let dataDone = false;
    let dataResult = {
      standings: [] as GlobalStanding[],
      tournament: null as OnlineTournament | null,
      pb: null as PublicDeck | null,
      fx: null as PublicDeck | null,
      post: null as BlogPost | null,
    };

    const tryFinish = () => {
      if (!bannerDone || !dataDone) return;
      window.clearTimeout(timeoutId);
      finish(
        dataResult.standings,
        dataResult.tournament,
        dataResult.pb,
        dataResult.fx,
        dataResult.post,
      );
    };

    let completedDataTasks = 0;

    const trackDataTask = <T,>(promise: Promise<T>): Promise<T> => {
      return promise.finally(() => {
        if (cancelled) return;
        completedDataTasks += 1;
        taskProgress.data = Math.round((completedDataTasks / DATA_TASK_COUNT) * 100);
        updateProgress();
      });
    };

    preloadImages(FORMAT_BANNER_IMAGES, (loaded, total) => {
      taskProgress.banner = Math.round((loaded / total) * 100);
      updateProgress();
    }).then(() => {
      taskProgress.banner = 100;
      updateProgress();
      bannerDone = true;
      tryFinish();
    });

    Promise.all([
      trackDataTask(
        tournamentAPI.getGlobalStandings().catch((err) => {
          console.error('Error loading global standings:', err);
          return [] as GlobalStanding[];
        }),
      ),
      trackDataTask(
        onlineTournamentService.getActiveTournaments().catch((err) => {
          console.error('Error loading online tournaments:', err);
          return [] as OnlineTournament[];
        }),
      ),
      trackDataTask(
        fetchAllBlogPosts().catch((err) => {
          console.error('Error loading latest blog post:', err);
          return [] as BlogPost[];
        }),
      ),
      trackDataTask(
        loadAllDecks().catch((err) => {
          console.error('Error loading latest decks:', err);
          return [] as PublicDeck[];
        }),
      ),
    ]).then(([standings, tournaments, posts, allDecks]) => {
      const publicDecks = allDecks.filter((d) => d.is_public);
      const byCreatedDesc = [...publicDecks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      dataResult = {
        standings,
        tournament: tournaments.length > 0 ? tournaments[0] : null,
        pb: byCreatedDesc.find((d) => d.format === 'pb') ?? null,
        fx: byCreatedDesc.find((d) => d.format === 'fx') ?? null,
        post: posts.length > 0 ? posts[0] : null,
      };
    }).finally(() => {
      taskProgress.data = 100;
      updateProgress();
      dataDone = true;
      tryFinish();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadAllDecks]);

  return {
    isReady,
    progress,
    globalStandings,
    tournament,
    latestPb,
    latestFx,
    latestPost,
  };
}
