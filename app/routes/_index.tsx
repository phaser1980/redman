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
  const [symbolCount, setSymbolCount] = useState<number>(0);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [monteCarloData, setMonteCarloData] = useState<any>(null);
  const [viData, setViData] = useState<any>(null);
  const [ensembleData, setEnsembleData] = useState<any>(null);
  const [hmmData, setHmmData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Create a safe version of selectedSymbols that's always an array
  const safeSymbols = Array.isArray(selectedSymbols) ? selectedSymbols : [];

  // Debugging logs after state initialization
  useEffect(() => {
    console.log("Component Mount/Update - selectedSymbols:", selectedSymbols);
    console.log("Safe Symbols Array:", safeSymbols);
  }, [selectedSymbols]);

  // Fetch symbol count whenever student changes
  useEffect(() => {
    const fetchSymbolCount = async () => {
      if (!selectedStudentId) {
        setSymbolCount(0);
        setMonteCarloData(null);
        setViData(null);
        setEnsembleData(null);
        setHmmData(null);
        return;
      }

      try {
        const [countResponse, monteCarloResponse, viResponse, ensembleResponse, hmmResponse] = await Promise.all([
          fetch(`/api/symbols/count/${selectedStudentId}`),
          fetch(`/api/montecarlo/${selectedStudentId}`),
          fetch(`/api/vi/${selectedStudentId}`),
          fetch(`/api/ensemble/${selectedStudentId}`),
          fetch(`/api/hmm/${selectedStudentId}`)
        ]);

        if (!countResponse.ok) {
          throw new Error('Failed to fetch symbol count');
        }

        const [countData, monteCarloData, viData, ensembleData, hmmData] = await Promise.all([
          countResponse.json(),
          monteCarloResponse.json(),
          viResponse.json(),
          ensembleResponse.json(),
          hmmResponse.json()
        ]);

        setSymbolCount(countData.totalSymbols);
        
        if (monteCarloData && !monteCarloData.error) {
          console.log('Setting Monte Carlo data:', monteCarloData);
          setMonteCarloData(monteCarloData);
        }

        if (viData && !viData.error) {
          console.log('Setting VI data:', viData);
          setViData(viData);
        }

        if (ensembleData && !ensembleData.error) {
          console.log('Setting Ensemble data:', ensembleData);
          setEnsembleData(ensembleData);
        }

        if (hmmData && !hmmData.error) {
          console.log('Setting HMM data:', hmmData);
          setHmmData(hmmData);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchSymbolCount();
  }, [selectedStudentId]);

  const handleStudentChange = async (studentId: number | null) => {
    console.log("handleStudentChange - Start, studentId:", studentId);
    setSelectedStudentId(studentId);
    setSelectedSymbols([]);
    setEntropy(null);
    setPatterns([]);
    setMonteCarloData(null);
    setViData(null);
    setEnsembleData(null);
    setHmmData(null);
    setError(null);

    if (studentId) {
      setIsLoading(true);
      try {
        const [historyResponse, patternsResponse, monteCarloResponse, viResponse, ensembleResponse, hmmResponse] = await Promise.all([
          fetch(`/api/symbols/history/${studentId}`),
          fetch(`/api/patterns/${studentId}`),
          fetch(`/api/montecarlo/${studentId}`),
          fetch(`/api/vi/${studentId}`),
          fetch(`/api/ensemble/${studentId}`),
          fetch(`/api/hmm/${studentId}`)
        ]);

        if (!historyResponse.ok || !patternsResponse.ok) {
          throw new Error("Failed to fetch student data");
        }

        const [history, patterns, monteCarloData, viData, ensembleData, hmmData] = await Promise.all([
          historyResponse.json(),
          patternsResponse.json(),
          monteCarloResponse.json(),
          viResponse.json(),
          ensembleResponse.json(),
          hmmResponse.json()
        ]);

        // Ensure we have arrays before updating state
        const safeHistory = Array.isArray(history) ? history.slice(-5) : [];
        const safePatterns = Array.isArray(patterns) ? patterns : [];

        setSelectedSymbols(safeHistory);
        setPatterns(safePatterns);

        if (monteCarloResponse.ok && monteCarloData && !monteCarloData.error) {
          console.log('Setting Monte Carlo data:', monteCarloData);
          setMonteCarloData(monteCarloData);
        }

        if (viResponse.ok && viData && !viData.error) {
          console.log('Setting VI data:', viData);
          setViData(viData);
        }

        if (ensembleResponse.ok && ensembleData && !ensembleData.error) {
          console.log('Setting Ensemble data:', ensembleData);
          setEnsembleData(ensembleData);
        }

        if (hmmResponse.ok && hmmData && !hmmData.error) {
          console.log('Setting HMM data:', hmmData);
          setHmmData(hmmData);
        }
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

      console.log("Submitting symbol:", { studentId: selectedStudentId, symbolId });

      // Submit symbol and fetch updated data
      const symbolResponse = await fetch("/api/symbols", {
        method: "POST",
        body: formData,
      });

      if (!symbolResponse.ok) {
        throw new Error("Failed to submit symbol");
      }

      const symbolData = await symbolResponse.json();
      console.log("Symbol submission response:", symbolData);

      if (symbolData.error) {
        throw new Error(symbolData.error);
      }

      // Update state with data from the response
      setSelectedSymbols(symbolData.recentSymbols || []);
      setEntropy(symbolData.entropy || 0);
      setSymbolCount((count) => count + 1);
      setMonteCarloData(symbolData.monteCarloData || null);
      setViData(symbolData.viData || null);
      setEnsembleData(symbolData.ensembleData || null);
      setHmmData(symbolData.hmmData || null);
      
      setError(null);
    } catch (err) {
      console.error("handleSymbolClick Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!selectedStudentId) {
      setError("Please select a student first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/symbols/undo/${selectedStudentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to undo symbol');
      }

      const data = await response.json();
      setSelectedSymbols(data.recentSymbols || []);
      setEntropy(data.entropy);
      setSymbolCount(data.totalSymbols);
      setError(null);

      const monteCarloResponse = await fetch(`/api/montecarlo/${selectedStudentId}`);
      const monteCarloData = await monteCarloResponse.json();

      if (monteCarloResponse.ok && monteCarloData && !monteCarloData.error) {
        console.log('Setting Monte Carlo data:', monteCarloData);
        setMonteCarloData(monteCarloData);
      }

      const viResponse = await fetch(`/api/vi/${selectedStudentId}`);
      const viData = await viResponse.json();

      if (viResponse.ok && viData && !viData.error) {
        console.log('Setting VI data:', viData);
        setViData(viData);
      }

      const ensembleResponse = await fetch(`/api/ensemble/${selectedStudentId}`);
      const ensembleData = await ensembleResponse.json();

      if (ensembleResponse.ok && ensembleData && !ensembleData.error) {
        console.log('Setting Ensemble data:', ensembleData);
        setEnsembleData(ensembleData);
      }

      const hmmResponse = await fetch(`/api/hmm/${selectedStudentId}`);
      const hmmData = await hmmResponse.json();

      if (hmmResponse.ok && hmmData && !hmmData.error) {
        console.log('Setting HMM data:', hmmData);
        setHmmData(hmmData);
      }
    } catch (err) {
      console.error('Failed to undo symbol:', err);
      setError(err instanceof Error ? err.message : 'Failed to undo symbol');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL symbols for ALL students? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/symbols/clear', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear symbols');
      }

      // Reset all state
      setSelectedSymbols([]);
      setEntropy(null);
      setSymbolCount(0);
      setError(null);
      setMonteCarloData(null);
      setViData(null);
      setEnsembleData(null);
      setHmmData(null);
    } catch (err) {
      console.error('Failed to clear symbols:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear symbols');
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

        {/* Student Selector and Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <StudentSelector
              onStudentChange={handleStudentChange}
              selectedStudentId={selectedStudentId}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={!selectedStudentId || isLoading || symbolCount === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium
                  ${!selectedStudentId || isLoading || symbolCount === 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  } transition-colors`}
              >
                Undo Last
              </button>
              <button
                onClick={handleClearAll}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {selectedStudentId && (
            <div className="text-center text-gray-400">
              <span className="font-semibold text-yellow-500">{symbolCount}</span> symbols collected
            </div>
          )}
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
                <EntropyDisplay
                  entropy={entropy ?? 0}
                  studentId={selectedStudentId}
                  symbols={safeSymbols}
                  monteCarloData={monteCarloData}
                  viData={viData}
                  ensembleData={ensembleData}
                  hmmData={hmmData}
                />
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
