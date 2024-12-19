import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateStudentId } from "~/utils/validation";

interface MarkovAnalysis {
  transitionMatrix: number[][];
  prediction: {
    nextSymbol: number;
    probability: number;
  };
  symbolCounts: number[];
}

function calculateMarkovChain(symbols: number[]): MarkovAnalysis {
  // Initialize 4x4 matrix with zeros
  const matrix = Array(4).fill(0).map(() => Array(4).fill(0));
  const symbolCounts = Array(4).fill(0);
  
  // Count transitions
  for (let i = 0; i < symbols.length - 1; i++) {
    const current = symbols[i] - 1;  // Convert to 0-based index
    const next = symbols[i + 1] - 1;
    matrix[current][next]++;
    symbolCounts[current]++;
  }
  
  // Convert to probabilities
  const transitionMatrix = matrix.map((row, i) => 
    row.map(count => symbolCounts[i] > 0 ? count / symbolCounts[i] : 0)
  );

  // Calculate next symbol prediction
  const lastSymbol = symbols[symbols.length - 1] - 1;
  const probabilities = transitionMatrix[lastSymbol];
  const maxProbability = Math.max(...probabilities);
  const predictedSymbol = probabilities.indexOf(maxProbability) + 1;

  return {
    transitionMatrix,
    prediction: {
      nextSymbol: predictedSymbol,
      probability: maxProbability
    },
    symbolCounts
  };
}

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = Number(params.studentId);
  if (!validateStudentId(studentId)) {
    return json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    // Get all symbols for this student
    const symbols = await db.$queryRaw`
      SELECT symbol
      FROM symbol_observations
      WHERE student_id = ${studentId}
      ORDER BY timestamp ASC
    `;

    if (!symbols || !Array.isArray(symbols)) {
      return json({ 
        error: "No symbols found",
        markovAnalysis: null
      });
    }

    // Convert raw symbols to array of numbers
    const symbolArray = symbols.map((s: any) => s.symbol);
    
    if (symbolArray.length < 2) {
      return json({
        error: "Need at least 2 symbols for Markov analysis",
        markovAnalysis: null
      });
    }

    const markovAnalysis = calculateMarkovChain(symbolArray);

    return json({
      error: null,
      markovAnalysis,
      totalSymbols: symbolArray.length
    });

  } catch (error) {
    console.error("Failed to calculate Markov chain:", error);
    return json({ 
      error: "Failed to calculate Markov chain",
      markovAnalysis: null
    }, { status: 500 });
  }
};
