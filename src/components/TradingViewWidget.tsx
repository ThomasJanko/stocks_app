'use client';

import UseTradingViewWidget from '@/hooks/useTradingViewWidget';
// TradingViewWidget.jsx
import { memo } from 'react';

interface TradingViewWidgetProps {
  title?: string;
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
}

export const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
  const container = UseTradingViewWidget(scriptUrl, config, height);

  return (
    <div className="w-full">
      {title && <h3 className="mb-5 text-2xl font-semibold text-gray-100">{title}</h3>}
      <div className={`tradingview-widget-container ${className}`} ref={container}>
        <div className="tradingview-widget-container__widget" style={{ height, width: '100%' }}></div>
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
