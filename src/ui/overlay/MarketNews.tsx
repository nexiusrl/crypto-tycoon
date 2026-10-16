import React, { useState } from 'react';
import { useMarketStore } from '../../store/marketStore';
import type { NewsItem } from '../../types/market';

const getSentimentColor = (sentiment: number): string => {
  if (sentiment >= 0.4) return 'text-emerald-400';
  if (sentiment >= 0.1) return 'text-emerald-300';
  if (sentiment <= -0.4) return 'text-red-400';
  if (sentiment <= -0.1) return 'text-red-300';
  return 'text-slate-400';
};

const getSentimentIcon = (sentiment: number): string => {
  if (sentiment >= 0.4) return '🚀';
  if (sentiment >= 0.1) return '📈';
  if (sentiment <= -0.4) return '💥';
  if (sentiment <= -0.1) return '📉';
  return '➖';
};

const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NewsCard: React.FC<{ news: NewsItem; isExpanded: boolean; onToggle: () => void }> = ({
  news,
  isExpanded,
  onToggle,
}) => {
  return (
    <div
      onClick={onToggle}
      className="bg-slate-800 rounded-lg p-3 cursor-pointer hover:bg-slate-750 transition-colors border border-slate-700/50"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{getSentimentIcon(news.sentiment)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${getSentimentColor(news.sentiment)}`}>
              {news.sentiment > 0 ? 'Bullish' : news.sentiment < 0 ? 'Bearish' : 'Neutral'}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">{formatTimeAgo(news.timestamp)}</span>
            {news.coinId && (
              <>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-blue-400 uppercase">{news.coinId}</span>
              </>
            )}
          </div>
          <h4 className="text-white text-sm font-medium leading-snug">{news.headline}</h4>
          {isExpanded && (
            <div className="mt-2 text-xs text-slate-400 space-y-1">
              <p>Sentiment Score: {(news.sentiment * 100).toFixed(0)}%</p>
              <p>Duration: {news.duration} hours</p>
              <p>This news may affect market prices for the specified duration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MarketNews: React.FC = () => {
  const activeNews = useMarketStore((state) => state.activeNews);
  const newsHistory = useMarketStore((state) => state.newsHistory);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active'>('active');

  const displayNews = filter === 'active' ? activeNews : newsHistory;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filter === 'active' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Active ({activeNews.length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          History ({newsHistory.length})
        </button>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {displayNews.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No news items to display.</p>
        ) : (
          displayNews
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((news) => (
              <NewsCard
                key={news.id}
                news={news}
                isExpanded={expandedId === news.id}
                onToggle={() => setExpandedId(expandedId === news.id ? null : news.id)}
              />
            ))
        )}
      </div>
    </div>
  );
};
