import React from 'react';

interface MarkovAnalysisProps {
  transitionMatrix: number[][];
  prediction: {
    nextSymbol: number;
    probability: number;
  };
  symbolCounts: number[];
}

const symbolToChar = ['♥', '♦', '♣', '♠'];

function MarkovAnalysis({ transitionMatrix, prediction, symbolCounts }: MarkovAnalysisProps) {
  const totalSymbols = symbolCounts.reduce((a, b) => a + b, 0);
  
  return (
    <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm text-gray-400 mb-4">Markov Chain Analysis</h3>
      
      <div className="grid grid-cols-5 gap-2 text-xs">
        <div className="col-span-1"></div>
        {symbolToChar.map((symbol, i) => (
          <div key={`header-${i}`} className="text-center text-gray-400">
            {symbol}
          </div>
        ))}
        
        {transitionMatrix.map((row, i) => (
          <React.Fragment key={`row-${i}`}>
            <div className="text-gray-400">{symbolToChar[i]}</div>
            {row.map((prob, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="text-center p-1 rounded"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${prob})`,
                  color: prob > 0.5 ? 'white' : 'rgb(156, 163, 175)'
                }}
              >
                {(prob * 100).toFixed(0)}%
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 text-sm">
        <span className="text-gray-400">Most likely next symbol: </span>
        <span className="text-white font-bold">{symbolToChar[prediction.nextSymbol - 1]}</span>
        <span className="text-gray-400 ml-2">
          ({(prediction.probability * 100).toFixed(1)}% probability)
        </span>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Based on {totalSymbols} symbol transitions
      </div>
    </div>
  );
}

export default MarkovAnalysis;
