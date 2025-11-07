import WatchlistView from '@/components/WatchlistView';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';

const WatchListPage = async () => {
  const [watchlist, popularStocks] = await Promise.all([getWatchlistWithData(), searchStocks()]);

  const watchlistSymbols = new Set(watchlist.map((item) => item.symbol.toUpperCase()));
  const initialStocks = (popularStocks ?? []).map((stock) => ({
    ...stock,
    isInWatchlist: watchlistSymbols.has(stock.symbol.toUpperCase()),
  }));

  return (
    <div className="watchlist-container">
      <section className="watchlist">
        <WatchlistView initialWatchlist={watchlist} initialStocks={initialStocks} />
      </section>
    </div>
  );
};

export default WatchListPage;
