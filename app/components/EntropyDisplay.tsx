import React, { useEffect, useState } from 'react';

interface EntropyDisplayProps {
  entropy: number | null;
  studentId: number;
}

function EntropyDisplay({ entropy = 0, studentId }: EntropyDisplayProps) {
  const [historicalEntropy, setHistoricalEntropy] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalEntropy = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/entropy/history/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setHistoricalEntropy(Array.isArray(data.history) ? data.history : []);
        } else {
          throw new Error('Failed to fetch entropy history');
        }
      } catch (error) {
        console.error('Failed to fetch entropy history:', error);
        setError('Failed to load entropy history');
        setHistoricalEntropy([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalEntropy();
  }, [studentId]);

  const getEntropyColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEntropyMessage = (value: number) => {
    if (value >= 80) return 'High randomness - Great job!';
    if (value >= 60) return 'Moderate randomness - Keep improving!';
    return 'Low randomness - Try to be more random!';
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">Loading entropy data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Ensure entropy is a number
  const safeEntropy = typeof entropy === 'number' ? entropy : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Current Entropy:</span>
          <span className={`text-2xl font-bold ${getEntropyColor(safeEntropy)}`}>
            {safeEntropy.toFixed(1)}%
          </span>
        </div>
        
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getEntropyColor(safeEntropy)} transition-all duration-500`}
            style={{ width: `${safeEntropy}%` }}
          />
        </div>
        
        <p className={`text-sm ${getEntropyColor(safeEntropy)}`}>
          {getEntropyMessage(safeEntropy)}
        </p>

        {historicalEntropy.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-2">Historical Entropy</h3>
            <div className="flex space-x-1">
              {historicalEntropy.map((value, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full ${getEntropyColor(value)}`}
                  style={{ opacity: 0.3 + (index / historicalEntropy.length) * 0.7 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EntropyDisplay;
