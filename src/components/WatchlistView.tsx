'use client';

import SearchCommand from '@/components/SearchCommand';
import WatchListButton from '@/components/WatchListButton';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import { formatChangePercent, formatPrice, getChangeColorClass } from '@/lib/utils';
import { Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const FALLBACK_VALUE = '—';

const WatchlistView = ({
  initialWatchlist,
  initialStocks,
}: {
  initialWatchlist: StockWithData[];
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const [items, setItems] = useState<StockWithData[]>(initialWatchlist);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setItems(initialWatchlist);
  }, [initialWatchlist]);

  const refreshWatchlist = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await getWatchlistWithData();
      setItems(data);
    } catch (error) {
      console.error('Failed to refresh watchlist', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleWatchlistChange = useCallback(
    (symbol: string, isAdded: boolean) => {
      if (isAdded) {
        void refreshWatchlist();
        return;
      }

      setItems((prev) => prev.filter((item) => item.symbol !== symbol));
    },
    [refreshWatchlist],
  );

  if (items.length === 0) {
    return (
      <section className="watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h2 className="empty-title">You haven&apos;t added any stocks yet</h2>
          <p className="empty-description">
            Track the companies you care about. Use the search to add stocks to your personal watchlist and stay in the
            loop.
          </p>
          <SearchCommand
            renderAs="button"
            label="Search stocks"
            initialStocks={initialStocks}
            onWatchlistChange={handleWatchlistChange}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="watchlist-title">My Watchlist</h1>
          {isRefreshing ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" /> : null}
        </div>
        <SearchCommand
          renderAs="button"
          label="Add stock"
          initialStocks={initialStocks}
          onWatchlistChange={handleWatchlistChange}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="watchlist-table">
          <thead>
            <tr className="table-header-row">
              {WATCHLIST_TABLE_HEADER.map((header) => (
                <th
                  key={header}
                  className="table-cell px-4 py-3 text-left text-sm font-semibold tracking-wide uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const price =
                item.priceFormatted ?? (item.currentPrice ? formatPrice(item.currentPrice) : FALLBACK_VALUE);
              const changeValue = item.changeFormatted ?? (formatChangePercent(item.changePercent) || FALLBACK_VALUE);
              const changeClass = getChangeColorClass(item.changePercent);

              return (
                <tr key={item.symbol} className="table-row">
                  <td className="table-cell px-4 py-4">
                    <Link href={`/stocks/${item.symbol}`} className="hover:text-yellow-500">
                      {item.company}
                    </Link>
                  </td>
                  <td className="table-cell px-4 py-4 text-gray-300">{item.symbol}</td>
                  <td className="table-cell px-4 py-4">{price}</td>
                  <td className={`table-cell px-4 py-4 ${changeClass}`}>{changeValue}</td>
                  <td className="table-cell px-4 py-4">{item.marketCap ?? 'N/A'}</td>
                  <td className="table-cell px-4 py-4">{item.peRatio ?? 'N/A'}</td>
                  <td className="table-cell px-4 py-4">
                    <button type="button" className="add-alert" disabled>
                      Coming soon
                    </button>
                  </td>
                  <td className="table-cell px-4 py-4">
                    <WatchListButton
                      symbol={item.symbol}
                      company={item.company}
                      isInWatchlist
                      showTrashIcon
                      onWatchlistChange={handleWatchlistChange}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchlistView;
