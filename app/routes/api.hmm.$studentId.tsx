import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = Number(params.studentId);

  if (isNaN(studentId)) {
    return json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    // Get recent symbols for this student
    const recentSymbols = await db.symbol_observations.findMany({
      where: {
        student_id: studentId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20,
      select: {
        symbol: true
      }
    });

    // If not enough data, return a basic response
    if (recentSymbols.length < 5) {
      return json({
        states: [0, 1],
        emission_probs: [
          [0.25, 0.25, 0.25, 0.25],
          [0.25, 0.25, 0.25, 0.25]
        ],
        prediction: {
          nextSymbol: Math.floor(Math.random() * 4) + 1,
          confidence: 25
        }
      });
    }

    const symbols = recentSymbols.map(s => s.symbol - 1); // Convert to 0-based index

    // Simple HMM implementation
    // State 0: Random behavior
    // State 1: Pattern-following behavior
    const states = [0, 1];
    
    // Calculate symbol frequencies for pattern detection
    const frequencies = Array(4).fill(0);
    symbols.forEach(s => frequencies[s]++);
    const total = symbols.length;
    
    // Check if there's a dominant pattern
    const maxFreq = Math.max(...frequencies);
    const patternStrength = maxFreq / total;
    
    // Emission probabilities
    const emission_probs = [
      // Random state: equal probabilities
      [0.25, 0.25, 0.25, 0.25],
      // Pattern state: biased towards observed frequencies
      frequencies.map(f => 0.1 + (0.9 * f / total))
    ];

    // Make prediction based on recent pattern
    const lastSymbol = symbols[0];
    const predictedSymbol = frequencies.indexOf(maxFreq);
    const confidence = patternStrength > 0.4 ? 
      Math.min(100, patternStrength * 100) : 
      25;

    return json({
      states,
      emission_probs,
      prediction: {
        nextSymbol: predictedSymbol + 1, // Convert back to 1-based index
        confidence
      }
    });

  } catch (error) {
    console.error("HMM Analysis Error:", error);
    return json(
      { error: "Failed to perform HMM analysis" },
      { status: 500 }
    );
  }
};
