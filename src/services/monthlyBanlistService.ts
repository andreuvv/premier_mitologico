import { supabase } from '../config/supabase';
import { BanListData, BanListFormat, BanListCard } from '../types/banlist';

interface MonthlyBanlistRow {
  id: number;
  format: BanListFormat;
  year: number;
  month: number;
  banned_cards: BanListCard[];
  limited_x1_cards: BanListCard[];
  limited_x2_cards: BanListCard[];
  created_at: string;
  updated_at: string;
}

export interface MonthlyBanlistSnapshot {
  format: BanListFormat;
  year: number;
  month: number;
  data: BanListData;
}

const toBanListData = (row: MonthlyBanlistRow): BanListData => ({
  format: row.format,
  lastUpdated: `${row.year}-${String(row.month).padStart(2, '0')}-01`,
  banned: row.banned_cards ?? [],
  limitedX1: row.limited_x1_cards ?? [],
  limitedX2: row.limited_x2_cards ?? [],
});

export const getLatestMonthlyBanlist = async (format: BanListFormat): Promise<BanListData | null> => {
  const { data, error } = await supabase
    .from('monthly_banlists')
    .select('*')
    .eq('format', format)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error loading monthly banlist:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return toBanListData(data as MonthlyBanlistRow);
};

export const getLatestTwoMonthlyBanlists = async (
  format: BanListFormat
): Promise<MonthlyBanlistSnapshot[]> => {
  const { data, error } = await supabase
    .from('monthly_banlists')
    .select('*')
    .eq('format', format)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(2);

  if (error) {
    console.error('Error loading latest two monthly banlists:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as MonthlyBanlistRow[]).map(row => ({
    format: row.format,
    year: row.year,
    month: row.month,
    data: toBanListData(row),
  }));
};

export const getMonthlyBanlistByMonth = async (
  format: BanListFormat,
  year: number,
  month: number
): Promise<BanListData | null> => {
  const { data, error } = await supabase
    .from('monthly_banlists')
    .select('*')
    .eq('format', format)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (error) {
    console.error('Error loading monthly banlist by month:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return toBanListData(data as MonthlyBanlistRow);
};

export const upsertMonthlyBanlist = async (
  format: BanListFormat,
  year: number,
  month: number,
  data: BanListData
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('monthly_banlists')
    .upsert(
      {
        format,
        year,
        month,
        banned_cards: data.banned,
        limited_x1_cards: data.limitedX1,
        limited_x2_cards: data.limitedX2,
        updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      },
      { onConflict: 'format,year,month' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const isCurrentUserBanlistAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('premier_player_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading profile admin status:', error);
    return false;
  }

  return data?.premier_player_id === 1;
};
