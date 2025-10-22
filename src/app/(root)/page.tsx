import TradingViewWidget from '@/components/TradingViewWidget';
import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from '@/lib/constants';

const Home = () => {
  const scripturl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  return (
    <div className="home-wrapper flex min-h-screen">
      <section className="home-section grid w-full gap-8">
        <div className="md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Market Overview"
            scriptUrl={`${scripturl}market-overview.js`}
            config={MARKET_OVERVIEW_WIDGET_CONFIG}
            className="custom-chart"
            height={600}
          />
        </div>
        <div className="md:col-span-1 xl:col-span-2">
          <TradingViewWidget
            title="Stock heatmap"
            scriptUrl={`${scripturl}stock-heatmap.js`}
            config={HEATMAP_WIDGET_CONFIG}
            height={600}
          />
        </div>
      </section>
      <section className="home-section grid w-full gap-8">
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            scriptUrl={`${scripturl}timeline.js`}
            config={TOP_STORIES_WIDGET_CONFIG}
            className="custom-chart"
            height={600}
          />
        </div>
        <div className="h-full md:col-span-1 xl:col-span-2">
          <TradingViewWidget
            title="Symbol info"
            scriptUrl={`${scripturl}market-quotes.js`}
            config={MARKET_DATA_WIDGET_CONFIG}
            height={600}
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
