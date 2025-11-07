'use client';

import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';

const WatchListButton = (props: Readonly<WatchlistButtonProps>) => {
  const { symbol, company, isInWatchlist, showTrashIcon = false, type: variant = 'button', onWatchlistChange } = props;
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAdded(!!isInWatchlist);
  }, [isInWatchlist]);

  const label = useMemo(() => {
    if (variant === 'icon') return '';
    if (isPending) return added ? 'Removing…' : 'Adding…';
    return added ? 'Remove from Watchlist' : 'Add to Watchlist';
  }, [added, isPending, variant]);

  const handleClick = () => {
    if (isPending) return;

    const next = !added;

    startTransition(async () => {
      try {
        if (next) {
          await addToWatchlist(symbol, company);
        } else {
          await removeFromWatchlist(symbol);
        }

        setAdded(next);
        onWatchlistChange?.(symbol, next);
      } catch (error) {
        console.error('Failed to update watchlist', error);
      }
    });
  };

  const renderIconButton = () => {
    const icon = isPending ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : (
      <Star className="h-5 w-5" strokeWidth={1.5} stroke="#FACC15" fill={added ? '#FACC15' : 'none'} />
    );

    return (
      <button
        type="button"
        disabled={isPending}
        aria-pressed={added}
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? 'watchlist-icon-added' : ''}`}
        onClick={handleClick}
      >
        {icon}
      </button>
    );
  };

  const renderStandardButton = () => {
    let leadingIcon: ReactNode = null;

    if (isPending) {
      leadingIcon = <Loader2 className="mr-2 h-5 w-5 animate-spin" />;
    } else if (showTrashIcon && added) {
      leadingIcon = <Trash2 className="mr-2 h-5 w-5" />;
    }

    return (
      <button
        type="button"
        className={`watchlist-btn ${added ? 'watchlist-remove' : ''}`}
        onClick={handleClick}
        disabled={isPending}
      >
        {leadingIcon}
        <span>{label}</span>
      </button>
    );
  };

  return variant === 'icon' ? renderIconButton() : renderStandardButton();
};

export default WatchListButton;
