'use client';

import WatchListButton from '@/components/WatchListButton';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from '@/components/ui/command';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getWatchlistSymbols } from '@/lib/actions/watchlist.actions';
import { Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useDebounce } from '../hooks/useDebounce';

const mapStocksWithWatchlist = (
  stocks: StockWithWatchlistStatus[] = [],
  watchlistSymbols: string[] = [],
): StockWithWatchlistStatus[] => {
  const symbolSet = new Set(watchlistSymbols.map((sym) => sym.toUpperCase()));
  return stocks.map((stock) => ({
    ...stock,
    isInWatchlist: symbolSet.has(stock.symbol.toUpperCase()),
  }));
};

export default function SearchCommand(props: Readonly<SearchCommandProps>) {
  const { renderAs = 'button', label = 'Add stock', initialStocks = [], onWatchlistChange } = props;
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [rawStocks, setRawStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const stocks = useMemo(() => mapStocksWithWatchlist(rawStocks, watchlistSymbols), [rawStocks, watchlistSymbols]);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = useMemo(() => (isSearchMode ? stocks : stocks.slice(0, 10)), [isSearchMode, stocks]);

  useEffect(() => {
    const target =
      typeof globalThis !== 'undefined' && 'addEventListener' in globalThis
        ? (globalThis as unknown as Window)
        : undefined;

    if (!target) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };

    target.addEventListener('keydown', onKeyDown);
    return () => target.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!isSearchMode) {
      setRawStocks(initialStocks);
      return;
    }

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setRawStocks(results);
    } catch {
      setRawStocks([]);
    } finally {
      setLoading(false);
    }
  }, [initialStocks, isSearchMode, searchTerm]);

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const symbols = await getWatchlistSymbols();
        if (isMounted) {
          setWatchlistSymbols(symbols);
        }
      } catch (error) {
        console.error('Failed to load watchlist symbols', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSearchMode) {
      setRawStocks(initialStocks);
    }
  }, [initialStocks, isSearchMode]);

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    setWatchlistSymbols((prev) => {
      const set = new Set(prev.map((sym) => sym.toUpperCase()));
      const normalizedSymbol = symbol.toUpperCase();
      if (isAdded) {
        set.add(normalizedSymbol);
      } else {
        set.delete(normalizedSymbol);
      }
      return Array.from(set.values());
    });

    onWatchlistChange?.(symbol, isAdded);
  };

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm('');
    setRawStocks(initialStocks);
  };

  let listContent: ReactNode;

  if (loading) {
    listContent = <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>;
  } else if (displayStocks.length === 0) {
    listContent = (
      <div className="search-list-indicator">{isSearchMode ? 'No results found' : 'No stocks available'}</div>
    );
  } else {
    listContent = (
      <ul>
        <li className="search-count">
          {isSearchMode ? 'Search results' : 'Popular stocks'}
          {` `}({displayStocks.length})
        </li>
        {displayStocks.map((stock) => (
          <li key={stock.symbol} className="search-item">
            <div className="search-item-link flex items-center gap-3">
              <Link
                href={`/stocks/${stock.symbol}`}
                onClick={handleSelectStock}
                className="flex flex-1 items-center gap-3"
              >
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <div className="search-item-name">{stock.name}</div>
                  <div className="text-sm text-gray-500">
                    {stock.symbol} | {stock.exchange} | {stock.type}
                  </div>
                </div>
              </Link>
              <WatchListButton
                symbol={stock.symbol}
                company={stock.name}
                isInWatchlist={stock.isInWatchlist}
                type="icon"
                onWatchlistChange={handleWatchlistChange}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {renderAs === 'text' ? (
        <button type="button" onClick={() => setOpen(true)} className="search-text bg-transparent p-0 text-left">
          {label}
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">{listContent}</CommandList>
      </CommandDialog>
    </>
  );
}
