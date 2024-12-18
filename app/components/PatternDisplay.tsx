import { useEffect, useState } from 'react';

interface Pattern {
  pattern: string[];
  occurrences: number;
  probability: number;
}

interface PatternDisplayProps {
  patterns: Pattern[];
  studentId: number;
}

function PatternDisplay({ patterns, studentId }: PatternDisplayProps) {
  const [historicalPatterns, setHistoricalPatterns] = useState<Pattern[]>([]);

  useEffect(() => {
    // Fetch historical pattern data for this student
    const fetchHistoricalPatterns = async () => {
      try {
        const response = await fetch(`/api/patterns/history/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setHistoricalPatterns(data.patterns);
        }
      } catch (error) {
        console.error('Failed to fetch pattern history:', error);
      }
    };

    fetchHistoricalPatterns();
  }, [studentId]);

  const SYMBOLS = {
    '1': { symbol: '♥', color: 'text-red-500' },
    '2': { symbol: '♦', color: 'text-red-500' },
    '3': { symbol: '♣', color: 'text-white' },
    '4': { symbol: '♠', color: 'text-white' },
  };

  const renderSymbol = (symbolId: string) => {
    const symbol = SYMBOLS[symbolId];
    return (
      <span className={`${symbol.color}`}>
        {symbol.symbol}
      </span>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="space-y-6">
        {/* Current Patterns */}
        <div>
          <h3 className="text-sm text-gray-400 mb-4">Current Patterns</h3>
          {patterns.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No patterns detected yet</p>
          ) : (
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <div
                  key={index}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-xl">
                      {pattern.pattern.map((symbol, idx) => (
                        <span key={idx}>{renderSymbol(symbol)}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      {(pattern.probability * 100).toFixed(1)}% likely
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Occurred {pattern.occurrences} times
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historical Patterns */}
        {historicalPatterns.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 mb-4">Historical Patterns</h3>
            <div className="space-y-3">
              {historicalPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="bg-gray-700/30 rounded p-2 border border-gray-600/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm">
                      {pattern.pattern.map((symbol, idx) => (
                        <span key={idx}>{renderSymbol(symbol)}</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {pattern.occurrences} times
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Tip: Try to avoid repeating sequences to make your inputs less predictable
        </div>
      </div>
    </div>
  );
}

export default PatternDisplay;
