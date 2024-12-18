import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import EntropyDisplay from "~/components/EntropyDisplay";
import PatternDisplay from "~/components/PatternDisplay";
import StudentSelector from "~/components/StudentSelector";

const SYMBOLS = [
  { id: 1, name: "Hearts", symbol: "♥", color: "text-red-500" },
  { id: 2, name: "Diamonds", symbol: "♦", color: "text-red-500" },
  { id: 3, name: "Clubs", symbol: "♣", color: "text-white" },
  { id: 4, name: "Spades", symbol: "♠", color: "text-white" },
];

export default function Index() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedSymbols, setSelectedSymbols] = useState<number[]>([]);
  const [entropy, setEntropy] = useState<number | null>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Create a safe version of selectedSymbols that's always an array
  const safeSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];

  // Debugging logs after state initialization
  useEffect(() => {
    console.log("Component Mount/Update - selectedSymbols:", selectedSymbols);
    console.log("Safe Symbols Array:", safeSymbols);
  }, [selectedSymbols]);

  const handleStudentChange = async (studentId: number | null) => {
    console.log("handleStudentChange - Start, studentId:", studentId);
    setSelectedStudentId(studentId);
    setSelectedSymbols([]); // Reset symbols immediately
    setEntropy(null);
    setPatterns([]);
    setError(null);

    if (studentId) {
      setIsLoading(true);
      try {
        const [historyResponse, patternsResponse] = await Promise.all([
          fetch(`/api/symbols/history/${studentId}`),
          fetch(`/api/patterns/${studentId}`),
        ]);

        if (!historyResponse.ok || !patternsResponse.ok) {
          throw new Error("Failed to fetch student data");
        }

        const history = await historyResponse.json();
        const patterns = await patternsResponse.json();

        // Ensure we have arrays before updating state
        const safeHistory = Array.isArray(history) ? history.slice(-5) : [];
        const safePatterns = Array.isArray(patterns) ? patterns : [];

        setSelectedSymbols(safeHistory);
        setPatterns(safePatterns);
      } catch (err) {
        console.error("handleStudentChange Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load student data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSymbolClick = async (symbolId: number) => {
    if (!selectedStudentId) {
      setError("Please select a student first");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("studentId", selectedStudentId.toString());
      formData.append("symbol", symbolId.toString());

      const response = await fetch("/api/symbols", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to record symbol");
      }

      const data = await response.json();

      // Create new symbols array with defensive check
      const currentSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];
      const newSymbols = [...currentSymbols, symbolId].slice(-5);

      setSelectedSymbols(newSymbols);
      setEntropy(data.entropy);
      setPatterns(Array.isArray(data.patterns) ? data.patterns : []);
      setError(null);
    } catch (err) {
      console.error("handleSymbolClick Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
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

        {/* Student Selector */}
        <div className="mb-8">
          <StudentSelector
            onStudentChange={handleStudentChange}
            selectedStudentId={selectedStudentId}
          />
          {error && (
            <div className="mt-2 text-red-500 text-sm">{error}</div>
          )}
        </div>

        {/* Symbol Selection */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            {selectedStudentId ? "Select Symbol" : "Select a student to begin"}
          </h2>
          <div className="flex justify-center gap-8">
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => handleSymbolClick(symbol.id)}
                disabled={!selectedStudentId || isLoading}
                className={`w-24 h-24 text-5xl ${symbol.color} 
                  ${
                    !selectedStudentId || isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-700 transform hover:scale-110"
                  }
                  bg-gray-800 rounded-xl transition-all
                  flex items-center justify-center border border-gray-700
                  hover:border-gray-500 focus:outline-none focus:ring-2 
                  focus:ring-purple-500 focus:border-transparent
                  shadow-lg hover:shadow-xl`}
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
            {!selectedStudentId ? (
              <p className="text-gray-500 italic">Select a student to begin...</p>
            ) : isLoading ? (
              <p className="text-gray-500 italic">Loading...</p>
            ) : safeSymbols.length === 0 ? (
              <p className="text-gray-500 italic">No symbols selected yet...</p>
            ) : (
              safeSymbols.map((id, index) => {
                const symbol = SYMBOLS.find((s) => s.id === id);
                return symbol ? (
                  <div
                    key={index}
                    className={`w-12 h-12 ${symbol.color} bg-gray-800 rounded-lg
                      flex items-center justify-center text-2xl border border-gray-700`}
                  >
                    {symbol.symbol}
                  </div>
                ) : null;
              })
            )}
          </div>
        </div>

        {/* Entropy & Patterns */}
        {selectedStudentId && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {entropy !== null && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Randomness Level</h2>
                <EntropyDisplay entropy={entropy} studentId={selectedStudentId} />
              </div>
            )}
            {patterns.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Detected Patterns</h2>
                <PatternDisplay patterns={patterns} studentId={selectedStudentId} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
