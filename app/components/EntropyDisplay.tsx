import React, { useEffect, useState } from 'react';
import MarkovAnalysis from './MarkovAnalysis';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

interface EntropyHistoryItem {
  window_start: number;
  window_end: number;
  entropy_value: number;
  window_size: number;
}

interface MarkovData {
  transitionMatrix: number[][];
  prediction: {
    nextSymbol: number;
    probability: number;
  };
  symbolCounts: number[];
}

interface EntropyDisplayProps {
  entropy: number;
  studentId: number | null;
  symbols: number[];
  monteCarloData: any | null;
  viData: any | null;
}

function EntropyDisplay({ entropy = 0, studentId, symbols, monteCarloData, viData }: EntropyDisplayProps) {
  const [historicalEntropy, setHistoricalEntropy] = useState<EntropyHistoryItem[]>([]);
  const [markovData, setMarkovData] = useState<MarkovData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<string>("stable");
  
  // Collapsible section states
  const [isMarkovExpanded, setIsMarkovExpanded] = useState(true);
  const [isMonteCarloExpanded, setIsMonteCarloExpanded] = useState(true);
  const [isViExpanded, setIsViExpanded] = useState(true);

  // Ensure entropy is between 0 and 100
  const normalizedEntropy = Math.min(100, Math.max(0, entropy));

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId || symbols.length === 0) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch entropy and Markov analyses
        const [entropyResponse, markovResponse] = await Promise.all([
          fetch(`/api/entropy/${studentId}`),
          fetch(`/api/markov/${studentId}`)
        ]);

        // Handle entropy response
        if (entropyResponse.ok) {
          const entropyData = await entropyResponse.json();
          setHistoricalEntropy(entropyData.historical_data || []);
          setTrend(entropyData.trend || "stable");
        }

        // Handle Markov response
        if (markovResponse.ok) {
          const markovData = await markovResponse.json();
          if (!markovData.error) {
            setMarkovData(markovData.markovAnalysis);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load analysis data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId, symbols]);

  function getEntropyColor(entropy: number): string {
    if (entropy > 90) return 'text-green-500';
    if (entropy > 70) return 'text-green-400';
    if (entropy > 50) return 'text-yellow-500';
    if (entropy > 30) return 'text-yellow-400';
    return 'text-red-500';
  }

  function getEntropyMessage(entropy: number): JSX.Element {
    if (entropy > 90) {
      return <span className="text-green-500">Excellent randomness - Keep it up!</span>;
    }
    if (entropy > 70) {
      return <span className="text-green-400">High randomness - Great job!</span>;
    }
    if (entropy > 50) {
      return <span className="text-yellow-500">Moderate randomness - Getting better!</span>;
    }
    if (entropy > 30) {
      return <span className="text-yellow-400">Low randomness - Try to be more random!</span>;
    }
    return <span className="text-red-500">Very predictable - Mix it up more!</span>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="space-y-4">
        {/* Entropy Display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Current Entropy:</span>
            <span className={`text-2xl font-mono ${getEntropyColor(normalizedEntropy)}`}>
              {normalizedEntropy.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full ${getEntropyColor(normalizedEntropy)}`}
              style={{ width: `${normalizedEntropy}%` }}
            />
          </div>
          <div className="mt-2 text-sm">
            {getEntropyMessage(normalizedEntropy)}
          </div>
        </div>

        {/* Markov Analysis Section */}
        {markovData && (
          <div className="mt-6 bg-gray-900 rounded-lg overflow-hidden">
            <button 
              onClick={() => setIsMarkovExpanded(!isMarkovExpanded)}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-sm text-gray-400">Markov Chain Analysis</h3>
              {isMarkovExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {isMarkovExpanded && (
              <div className="p-4 pt-0">
                <MarkovAnalysis 
                  transitionMatrix={markovData.transitionMatrix}
                  prediction={markovData.prediction}
                  symbolCounts={markovData.symbolCounts}
                />
              </div>
            )}
          </div>
        )}

        {/* Monte Carlo Analysis Section */}
        {monteCarloData && monteCarloData.analysis && (
          <div className="mt-6 bg-gray-900 rounded-lg overflow-hidden">
            <button 
              onClick={() => setIsMonteCarloExpanded(!isMonteCarloExpanded)}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-sm text-gray-400">Monte Carlo Analysis</h3>
              {isMonteCarloExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {isMonteCarloExpanded && (
              <div className="p-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Pattern Detection</h4>
                    <div className="bg-gray-800 rounded p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Confidence:</span>
                        <span className={`font-mono ${monteCarloData.analysis.monteCarlo.confidence > 0.7 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {(monteCarloData.analysis.monteCarlo.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pattern Length:</span>
                        <span className="text-gray-300">{monteCarloData.analysis.monteCarlo.matchedSequenceLength} symbols</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Randomness Test</h4>
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Chi-Square p-value:</span>
                        <span className={`font-mono ${monteCarloData.analysis.chiSquare.pValue < 0.05 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {monteCarloData.analysis.chiSquare.pValue.toFixed(3)}
                        </span>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="text-gray-400">Assessment: </span>
                        <span className={monteCarloData.analysis.chiSquare.isRandom ? 'text-green-500' : 'text-yellow-500'}>
                          {monteCarloData.analysis.chiSquare.isRandom ? 'Appears Random' : 'Potential Pattern Detected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Analysis based on {monteCarloData.analysis.totalSymbols} symbols
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variational Inference Analysis Section */}
        {viData && viData.analysis && (
          <div className="mt-6 bg-gray-900 rounded-lg overflow-hidden">
            <button 
              onClick={() => setIsViExpanded(!isViExpanded)}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-sm text-gray-400">Variational Inference Analysis</h3>
              {isViExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {isViExpanded && (
              <div className="p-4 pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Symbol Probabilities</h4>
                    <div className="bg-gray-800 rounded p-3 space-y-2">
                      {viData.analysis.vi.posterior.symbolProbabilities.map((prob, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-400">Symbol {idx + 1}:</span>
                          <span className="font-mono text-blue-400">
                            {(prob * 100).toFixed(1)}% ±{(viData.analysis.vi.posterior.uncertainty[idx] * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Convergence</h4>
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">ELBO:</span>
                        <span className="font-mono text-blue-400">
                          {viData.analysis.vi.elbo.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-400">Iterations:</span>
                        <span className="font-mono text-blue-400">
                          {viData.analysis.vi.iterations}
                        </span>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="text-gray-400">Status: </span>
                        <span className={viData.analysis.vi.convergence ? 'text-green-500' : 'text-yellow-500'}>
                          {viData.analysis.vi.convergence ? 'Converged' : 'Maximum Iterations Reached'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Analysis based on {viData.analysis.totalSymbols} symbols
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}

export default EntropyDisplay;
