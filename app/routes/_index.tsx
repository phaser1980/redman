import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { EntropyDisplay } from "~/components/EntropyDisplay";
import { PatternDisplay } from "~/components/PatternDisplay";

const SYMBOLS = [
  { id: 1, name: "Hearts", symbol: "♥", color: "text-red-500" },
  { id: 2, name: "Diamonds", symbol: "♦", color: "text-red-500" },
  { id: 3, name: "Clubs", symbol: "♣", color: "text-white" },
  { id: 4, name: "Spades", symbol: "♠", color: "text-white" },
];

export default function Index() {
  const [selectedSymbols, setSelectedSymbols] = useState<number[]>([]);
  const [entropy, setEntropy] = useState(0);
  const [patterns, setPatterns] = useState([]);

  // Mock predictions for now
  const predictions = [
    { model: "Pattern Matcher", prediction: "♥", confidence: 85 },
    { model: "Sequence Predictor", prediction: "♣", confidence: 72 },
  ];

  const handleSymbolClick = (symbolId: number) => {
    const newSymbols = [...selectedSymbols, symbolId].slice(-5);
    setSelectedSymbols(newSymbols);
    
    // Mock entropy calculation - replace with actual API call
    setEntropy(Math.min(Math.random() * 100, 100));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
            RNG Prediction Challenge
          </h1>
          <p className="text-gray-400 text-lg">
            Can you predict the next symbol? Test our AI models!
          </p>
        </div>

        {/* Symbol Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Symbol</h2>
          <div className="flex justify-center gap-4">
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => handleSymbolClick(symbol.id)}
                className={`w-16 h-16 text-3xl ${symbol.color} bg-gray-800 rounded-lg 
                  hover:bg-gray-700 transform hover:scale-110 transition-all
                  flex items-center justify-center border border-gray-700
                  hover:border-gray-500 focus:outline-none focus:ring-2 
                  focus:ring-purple-500 focus:border-transparent`}
              >
                {symbol.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Last 5 Symbols */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Last 5 Symbols</h2>
          <div className="flex justify-center gap-3">
            {selectedSymbols.length === 0 ? (
              <p className="text-gray-500 italic">Start by selecting symbols above...</p>
            ) : (
              selectedSymbols.map((id, index) => {
                const symbol = SYMBOLS.find(s => s.id === id);
                return (
                  <div
                    key={index}
                    className={`w-12 h-12 ${symbol?.color} bg-gray-800 rounded-lg
                      flex items-center justify-center text-2xl border border-gray-700`}
                  >
                    {symbol?.symbol}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Predictions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Model Predictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700
                  hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-300">{prediction.model}</h3>
                  <span className="text-sm text-gray-500">
                    {prediction.confidence}% confident
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{prediction.prediction}</div>
                  <div className="h-2 flex-grow bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Entropy & Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Randomness Level</h2>
            <EntropyDisplay entropy={entropy} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Detected Patterns</h2>
            <PatternDisplay 
              patterns={patterns} 
              symbols={SYMBOLS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
