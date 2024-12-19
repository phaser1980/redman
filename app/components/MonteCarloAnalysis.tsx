import React from 'react';

interface MonteCarloProps {
  monteCarlo: {
    bestSeed: number;
    confidence: number;
    matchedSequenceLength: number;
    predictedNext: number[];
    lcgParams: {
      a: number;
      c: number;
      m: number;
    };
  };
  chiSquare: {
    statistic: number;
    pValue: number;
    isRandom: boolean;
  };
  totalSymbols: number;
}

const symbolToChar = ['♥', '♦', '♣', '♠'];

function MonteCarloAnalysis({ monteCarlo, chiSquare, totalSymbols }: MonteCarloProps) {
  return (
    <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm text-gray-400 mb-4">Monte Carlo Analysis</h3>
      
      <div className="space-y-4">
        {/* Seed Detection */}
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Potential RNG Pattern</h4>
          <div className="bg-gray-900 rounded p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pattern Confidence:</span>
              <span className={`font-mono ${monteCarlo.confidence > 0.7 ? 'text-yellow-500' : 'text-green-500'}`}>
                {(monteCarlo.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Matched Length:</span>
              <span className="text-gray-300">{monteCarlo.matchedSequenceLength} symbols</span>
            </div>
          </div>
        </div>

        {/* Predicted Next Symbols */}
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Predicted Next Symbols</h4>
          <div className="flex space-x-2">
            {monteCarlo.predictedNext.map((symbol, index) => (
              <div
                key={index}
                className="w-8 h-8 flex items-center justify-center rounded bg-gray-900 text-white"
                style={{ opacity: 1 - index * 0.15 }}
              >
                {symbolToChar[symbol - 1]}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Confidence decreases left to right
          </div>
        </div>

        {/* Chi-Square Test */}
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Randomness Test</h4>
          <div className="bg-gray-900 rounded p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Chi-Square p-value:</span>
              <span className={`font-mono ${chiSquare.pValue < 0.05 ? 'text-yellow-500' : 'text-green-500'}`}>
                {chiSquare.pValue.toFixed(3)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Assessment: </span>
              <span className={chiSquare.isRandom ? 'text-green-500' : 'text-yellow-500'}>
                {chiSquare.isRandom ? 'Appears Random' : 'Potential Pattern Detected'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Analysis based on {totalSymbols} symbols
        </div>
      </div>
    </div>
  );
}

export default MonteCarloAnalysis;
