import React from 'react';
import { Pattern } from '~/utils/apiClient';

interface PatternDisplayProps {
  patterns: Pattern[];
  symbols: Array<{
    id: number;
    name: string;
    symbol: string;
    color: string;
  }>;
}

export const PatternDisplay: React.FC<PatternDisplayProps> = ({ patterns, symbols }) => {
  // Sort patterns by occurrences (most frequent first)
  const sortedPatterns = [...patterns].sort((a, b) => b.occurrences - a.occurrences);
  
  // Find the most recent pattern (assuming patterns are added chronologically)
  const mostRecentPattern = patterns[patterns.length - 1];
  const mostFrequentPattern = sortedPatterns[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Detected Patterns</h3>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
            <span className="text-gray-400">Most Frequent</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
            <span className="text-gray-400">Recently Found</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedPatterns.map((pattern, index) => {
          const isTopPattern = pattern === mostFrequentPattern;
          const isRecentPattern = pattern === mostRecentPattern;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                isTopPattern
                  ? 'bg-blue-900/30 border-blue-500/50'
                  : isRecentPattern
                  ? 'bg-purple-900/30 border-purple-500/50'
                  : 'bg-gray-700/30 border-gray-600'
              } transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isTopPattern && (
                    <span className="px-2 py-1 text-xs font-medium text-blue-400 bg-blue-900/50 rounded">
                      Most Frequent
                    </span>
                  )}
                  {isRecentPattern && (
                    <span className="px-2 py-1 text-xs font-medium text-purple-400 bg-purple-900/50 rounded">
                      New Pattern
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  Found {pattern.occurrences}×
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {pattern.pattern.map((id, symbolIndex) => {
                    const symbol = symbols.find(s => s.id === id);
                    return (
                      <div
                        key={symbolIndex}
                        className={`w-8 h-8 flex items-center justify-center ${
                          symbolIndex === 0 ? '' : '-ml-1'
                        }`}
                      >
                        <span className={`text-xl ${
                          symbol?.id <= 2 ? 'text-red-400' : 'text-white'
                        }`}>
                          {symbol?.symbol}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {isTopPattern && pattern.occurrences > 3 && (
                  <div className="ml-auto">
                    <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                      Tip: This pattern appears frequently!
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {patterns.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No patterns detected yet. Keep playing to discover patterns!
          </div>
        )}
      </div>
    </div>
  );
};
