import { useState } from 'react';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

// Sample news data
const NEWS_ITEMS = [
  {
    id: 1,
    title: 'New Trading District Opens',
    content: 'A new trading district has opened in the northern part of the city...',
    type: 'economy',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    title: 'Bank Interest Rates Changed',
    content: 'The central bank has announced new interest rates affecting all agents...',
    type: 'finance',
    timestamp: '4 hours ago'
  },
  {
    id: 3,
    title: 'Stadium Hosting Major Event',
    content: 'The city stadium will be hosting a major event next week...',
    type: 'event',
    timestamp: '6 hours ago'
  }
];

export default function News() {
  const [selectedType, setSelectedType] = useState('all');

  const filteredNews = selectedType === 'all' 
    ? NEWS_ITEMS 
    : NEWS_ITEMS.filter(item => item.type === selectedType);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-normal mb-8">News Feed</h1>

      {/* News Filters */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg border ${
            selectedType === 'all' 
              ? 'border-black bg-black text-white' 
              : 'border-zinc-200 hover:border-zinc-300'
          }`}
        >
          All News
        </button>
        {['economy', 'finance', 'event'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg border ${
              selectedType === type
                ? 'border-black bg-black text-white'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((news) => (
          <div key={news.id} className="border border-zinc-200 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-medium">{news.title}</h2>
              <span className="text-sm text-zinc-500">{news.timestamp}</span>
            </div>
            <p className="text-zinc-600 mb-4">{news.content}</p>
            <div className="flex items-center gap-4">
              <span className="text-xs px-3 py-1 bg-zinc-100 rounded-full">
                {news.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}