import React from 'react';
import { ChartBarIcon, BeakerIcon, CalculatorIcon } from '@heroicons/react/24/outline';

interface ModelPrediction {
  modelName: string;
  nextSymbol: number;
  confidence: number;
  probability: number;
  additionalInfo?: {
    [key: string]: string | number;
  };
}

interface ModelComparisonProps {
  markovPrediction: {
    nextSymbol: number;
    probability: number;
    transitionConfidence: number;
  } | null;
  monteCarloPrediction: {
    nextSymbol: number;
    confidence: number;
    patternLength: number;
  } | null;
  viPrediction: {
    nextSymbol: number;
    probability: number;
    uncertainty: number;
    elbo: number;
  } | null;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({
  markovPrediction,
  monteCarloPrediction,
  viPrediction,
}) => {
  const models: ModelPrediction[] = [
    markovPrediction && {
      modelName: 'Markov Chain',
      nextSymbol: markovPrediction.nextSymbol - 1, // Adjust for 0-based index
      confidence: markovPrediction.transitionConfidence,
      probability: markovPrediction.probability,
      additionalInfo: {
        'Based on': '10 symbol transitions',
      },
    },
    monteCarloPrediction && {
      modelName: 'Monte Carlo',
      nextSymbol: monteCarloPrediction.nextSymbol - 1, // Adjust for 0-based index
      confidence: monteCarloPrediction.confidence,
      probability: monteCarloPrediction.confidence,
      additionalInfo: {
        'Pattern Length': `${monteCarloPrediction.patternLength} symbols`,
      },
    },
    viPrediction && {
      modelName: 'Variational Inference',
      nextSymbol: viPrediction.nextSymbol - 1, // Adjust for 0-based index
      confidence: 1 - viPrediction.uncertainty,
      probability: viPrediction.probability,
      additionalInfo: {
        'ELBO': viPrediction.elbo.toFixed(3),
        'Uncertainty': `±${(viPrediction.uncertainty * 100).toFixed(1)}%`,
      },
    },
  ].filter(Boolean) as ModelPrediction[];

  const getModelIcon = (modelName: string) => {
    switch (modelName) {
      case 'Markov Chain':
        return <ChartBarIcon className="w-5 h-5" />;
      case 'Monte Carlo':
        return <BeakerIcon className="w-5 h-5" />;
      case 'Variational Inference':
        return <CalculatorIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const symbolToCard = (symbol: number) => {
    const suits = ['', '', '', ''];
    return suits[symbol];
  };

  return (
    <div className="w-full">
      <h3 className="text-lg text-gray-300 mb-4">Model Predictions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-900/50 p-4 rounded-lg">
        {models.map((model, idx) => (
          <div
            key={idx}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-gray-400">{getModelIcon(model.modelName)}</span>
              <h4 className="text-gray-300">{model.modelName}</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Next:</span>
                <span className="text-2xl font-mono">
                  {symbolToCard(model.nextSymbol)}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-gray-300 font-mono">
                    {(model.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getConfidenceColor(model.confidence)}`}
                    style={{ width: `${model.confidence * 100}%` }}
                  />
                </div>
              </div>
              {model.additionalInfo && (
                <div className="space-y-1">
                  {Object.entries(model.additionalInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400">{key}:</span>
                      <span className="text-gray-300 font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelComparison;
