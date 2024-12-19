import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModelPrediction {
  nextSymbol: number;
  confidence: number;
}

interface EnsembleData {
  weights: Record<string, number>;
  predictions: Record<string, ModelPrediction>;
}

interface EnsembleDisplayProps {
  ensembleData: EnsembleData;
}

const modelColors = {
  markov: 'rgba(255, 99, 132, 0.8)',
  monte_carlo: 'rgba(54, 162, 235, 0.8)',
  hmm: 'rgba(75, 192, 192, 0.8)',
  variational: 'rgba(153, 102, 255, 0.8)'
};

export default function EnsembleDisplay({ ensembleData }: EnsembleDisplayProps) {
  const chartData = {
    labels: Object.keys(ensembleData.weights).map(name => 
      name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ),
    datasets: [
      {
        label: 'Model Weights',
        data: Object.values(ensembleData.weights).map(w => w * 100),
        backgroundColor: Object.keys(ensembleData.weights).map(name => modelColors[name as keyof typeof modelColors]),
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Model Contribution Weights',
        color: 'rgb(156, 163, 175)',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number) => `${value}%`,
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        }
      },
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Ensemble Model Analysis</h3>
      
      <div className="h-64 mb-6">
        <Bar data={chartData} options={options} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ensembleData.predictions).map(([name, pred]) => (
          <div 
            key={name}
            className="bg-gray-700 rounded-lg p-4"
            style={{ borderLeft: `4px solid ${modelColors[name as keyof typeof modelColors]}` }}
          >
            <h4 className="text-gray-200 font-medium mb-2">
              {name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Next Symbol:</span>
              <span className="text-gray-200">Symbol {pred.nextSymbol}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Confidence:</span>
              <span 
                className={`font-medium ${
                  pred.confidence > 75 ? 'text-green-400' :
                  pred.confidence > 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}
              >
                {pred.confidence.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
