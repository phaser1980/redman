import React from 'react';

interface EntropyDisplayProps {
  entropy: number;
}

export const EntropyDisplay: React.FC<EntropyDisplayProps> = ({ entropy }) => {
  if (entropy === undefined || entropy === null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Randomness Level</h3>
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
        <div className="h-4 bg-gray-700 rounded-full"></div>
      </div>
    );
  }

  const getEntropyColor = (value: number) => {
    if (value < 30) return 'from-green-500 to-green-600';
    if (value < 70) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getEntropyMessage = (value: number) => {
    if (value < 30) return 'Highly Predictable';
    if (value < 70) return 'Moderately Random';
    return 'Highly Random';
  };

  const getEntropyDescription = (value: number) => {
    if (value < 30) {
      return 'Your inputs show clear patterns. Try mixing up your choices more!';
    }
    if (value < 70) {
      return 'Good variety in your choices, but there might still be some patterns.';
    }
    return 'Your inputs are very unpredictable - keep it up!';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {entropy.toFixed(1)}%
          </span>
          <span className="text-sm font-medium text-white">
            {getEntropyMessage(entropy)}
          </span>
        </div>
      </div>

      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getEntropyColor(entropy)} transition-all duration-500 ease-out`}
          style={{ width: `${entropy}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer"></div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-400">
          {getEntropyDescription(entropy)}
        </p>
        <p className="text-xs text-gray-500">
          Tip: Mix up your choices and avoid repeating patterns to increase randomness!
        </p>
      </div>
    </div>
  );
};
