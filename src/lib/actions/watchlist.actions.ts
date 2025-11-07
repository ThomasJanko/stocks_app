'use server';

import { Watchlist } from '@/database/models/watchlist.model';
import { connectToDatabase } from '@/database/mongoose';
import { formatChangePercent, formatMarketCapValue, formatPrice } from '@/lib/utils';
import { auth } from '@/lib/better-auth/auth';
import { fetchJSON } from '@/lib/actions/finnhub.actions';
import { headers } from 'next/headers';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_TOKEN = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

type SessionUser = {
  id?: string | null;
  email?: string | null;
};

type PersistentUserIdResult = {
  userId: string;
  email: string;
};

type FinnhubQuoteResponse = {
  c?: number;
  dp?: number;
};

type FinnhubProfileResponse = {
  marketCapitalization?: number;
};

type FinnhubMetricResponse = {
  metric?: {
    peBasicExclExtraTTM?: number;
    peNormalizedAnnual?: number;
  };
};

async function getSessionUser(): Promise<SessionUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? {};
}

async function resolvePersistentUserId(): Promise<PersistentUserIdResult> {
  const sessionUser = await getSessionUser();
  const email = sessionUser.email?.trim();

  if (!email) {
    throw new Error('Unauthorized');
  }

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) throw new Error('MongoDB connection not found');

  const userDoc = await db
    .collection('user')
    .findOne<{ _id?: { toString(): string }; id?: string }>({ email }, { projection: { _id: 1, id: 1 } });

  const sessionId = sessionUser.id?.trim();

  const userId = userDoc?.id?.trim() || userDoc?._id?.toString() || sessionId;

  if (!userId) {
    throw new Error('User account not found');
  }

  return { userId, email };
}

function formatPeRatio(metric?: FinnhubMetricResponse['metric']): string {
  if (!metric) return 'N/A';

  const raw =
    metric.peBasicExclExtraTTM ?? metric.peNormalizedAnnual ?? metric.peBasicExclExtraTTM ?? metric.peNormalizedAnnual;

  if (raw === undefined || raw === null || Number.isNaN(raw)) {
    return 'N/A';
  }

  return raw.toFixed(2);
}

async function fetchMarketData(symbol: string) {
  if (!FINNHUB_TOKEN) {
    return {
      currentPrice: undefined,
      changePercent: undefined,
      priceFormatted: undefined,
      changeFormatted: undefined,
      marketCap: 'N/A',
      peRatio: 'N/A',
    } as const;
  }

  const [quote, profile, metrics] = await Promise.allSettled([
    fetchJSON<FinnhubQuoteResponse>(
      `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_TOKEN}`,
      120,
    ),
    fetchJSON<FinnhubProfileResponse>(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_TOKEN}`,
      3600,
    ),
    fetchJSON<FinnhubMetricResponse>(
      `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_TOKEN}`,
      3600,
    ),
  ]);

  const quoteValue = quote.status === 'fulfilled' ? quote.value : undefined;
  const profileValue = profile.status === 'fulfilled' ? profile.value : undefined;
  const metricsValue = metrics.status === 'fulfilled' ? metrics.value : undefined;

  const currentPrice = quoteValue?.c;
  const changePercent = quoteValue?.dp;
  const marketCap = profileValue?.marketCapitalization;

  return {
    currentPrice,
    changePercent,
    priceFormatted: currentPrice !== undefined ? formatPrice(currentPrice) : undefined,
    changeFormatted: formatChangePercent(changePercent),
    marketCap: marketCap ? formatMarketCapValue(marketCap * 1_000_000) : 'N/A',
    peRatio: formatPeRatio(metricsValue?.metric),
  } as const;
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistSymbols(): Promise<string[]> {
  try {
    const { userId } = await resolvePersistentUserId();
    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((item) => String(item.symbol).toUpperCase());
  } catch (error) {
    console.error('getWatchlistSymbols error:', error);
    return [];
  }
}

export async function isSymbolInWatchlist(symbol: string): Promise<boolean> {
  if (!symbol) return false;

  try {
    const { userId } = await resolvePersistentUserId();
    const existing = await Watchlist.exists({ userId, symbol: symbol.trim().toUpperCase() });
    return Boolean(existing);
  } catch (error) {
    console.error('isSymbolInWatchlist error:', error);
    return false;
  }
}

export async function addToWatchlist(symbol: string, company: string) {
  if (!symbol || !company) {
    throw new Error('Symbol and company are required');
  }

  try {
    const { userId } = await resolvePersistentUserId();

    const normalizedSymbol = symbol.trim().toUpperCase();
    const normalizedCompany = company.trim() || normalizedSymbol;

    await Watchlist.updateOne(
      { userId, symbol: normalizedSymbol },
      {
        $set: { company: normalizedCompany },
        $setOnInsert: { userId, symbol: normalizedSymbol, addedAt: new Date() },
      },
      { upsert: true },
    );

    return { success: true } as const;
  } catch (error) {
    console.error('addToWatchlist error:', error);
    throw new Error('Failed to add to watchlist');
  }
}

export async function removeFromWatchlist(symbol: string) {
  if (!symbol) {
    throw new Error('Symbol is required');
  }

  try {
    const { userId } = await resolvePersistentUserId();
    const normalizedSymbol = symbol.trim().toUpperCase();

    await Watchlist.deleteOne({ userId, symbol: normalizedSymbol });

    return { success: true } as const;
  } catch (error) {
    console.error('removeFromWatchlist error:', error);
    throw new Error('Failed to remove from watchlist');
  }
}

export async function getWatchlistWithData(): Promise<StockWithData[]> {
  try {
    const { userId } = await resolvePersistentUserId();

    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();

    const enriched = await Promise.all(
      items.map(async (item) => {
        const symbol = String(item.symbol).toUpperCase();
        const base: StockWithData = {
          userId,
          symbol,
          company: item.company,
          addedAt: item.addedAt,
          currentPrice: undefined,
          changePercent: undefined,
          priceFormatted: undefined,
          changeFormatted: undefined,
          marketCap: 'N/A',
          peRatio: 'N/A',
        };

        try {
          const marketData = await fetchMarketData(symbol);
          return {
            ...base,
            currentPrice: marketData.currentPrice,
            changePercent: marketData.changePercent,
            priceFormatted: marketData.priceFormatted,
            changeFormatted: marketData.changeFormatted,
            marketCap: marketData.marketCap,
            peRatio: marketData.peRatio,
          } satisfies StockWithData;
        } catch (error) {
          console.error(`Failed to fetch market data for ${symbol}`, error);
          return base;
        }
      }),
    );

    return enriched;
  } catch (error) {
    console.error('getWatchlistWithData error:', error);
    throw new Error('Failed to load watchlist');
  }
}
