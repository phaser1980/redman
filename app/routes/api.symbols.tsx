import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateSymbol, validateStudentId } from "~/utils/validation";
import { loader as markovLoader } from "./api.markov.$studentId";
import { loader as monteCarloLoader } from "./api.montecarlo.$studentId";
import { loader as viLoader } from "./api.vi.$studentId";

interface ModelResponse {
  nextSymbol: number;
  confidence: number;
}

interface EnsembleResponse {
  weights: Record<string, number>;
  predictions: Record<string, ModelResponse>;
}

interface HMMResponse {
  states: number[];
  emission_probs: number[][];
  prediction: ModelResponse;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const studentId = Number(formData.get("studentId"));
    const symbol = Number(formData.get("symbol"));

    console.log("Processing symbol submission:", { studentId, symbol });

    // Validate inputs
    if (!validateStudentId(studentId)) {
      return json({ error: "Invalid student ID" }, { status: 400 });
    }
    if (!validateSymbol(symbol)) {
      return json({ error: "Invalid symbol. Must be between 1 and 4." }, { status: 400 });
    }

    // First, find or create an active session for this student
    let session = await db.sessions.findFirst({
      where: {
        student_id: studentId,
        end_time: null
      }
    });

    if (!session) {
      console.log("Creating new session for student:", studentId);
      session = await db.sessions.create({
        data: {
          student_id: studentId,
          start_time: new Date(),
          observed_symbols: []
        }
      });
    }

    // Create the symbol observation
    const observation = await db.symbol_observations.create({
      data: {
        session_id: session.session_id,
        student_id: studentId,
        symbol: symbol,
        timestamp: new Date()
      }
    });

    // Get all recent symbols for analysis
    const recentSymbols = await db.symbol_observations.findMany({
      where: {
        session_id: session.session_id
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50,
      select: {
        symbol: true
      }
    });

    const symbols = recentSymbols.map(s => s.symbol);
    const lastFiveSymbols = symbols.slice(0, 5);

    // Calculate entropy
    const symbolCounts = lastFiveSymbols.reduce((acc: Record<number, number>, sym: number) => {
      acc[sym] = (acc[sym] || 0) + 1;
      return acc;
    }, {});

    const total = lastFiveSymbols.length;
    const entropy = total > 0 ? -Object.values(symbolCounts).reduce((sum, count) => {
      const p = count / total;
      return sum + (p * Math.log2(p));
    }, 0) : 0;

    // Get predictions from all models using their loader functions directly
    const [markovResult, monteCarloResult, viResult] = await Promise.all([
      markovLoader({ params: { studentId: studentId.toString() } }),
      monteCarloLoader({ params: { studentId: studentId.toString() } }),
      viLoader({ params: { studentId: studentId.toString() } })
    ]);

    const markovData = await markovResult.json();
    const monteCarloData = await monteCarloResult.json();
    const viData = await viResult.json();

    // Create ensemble prediction by combining model predictions
    const ensembleData: EnsembleResponse = {
      weights: {
        markov: 0.3,
        monte_carlo: 0.3,
        variational: 0.4
      },
      predictions: {
        markov: markovData?.prediction?.nextSymbol && markovData?.prediction?.confidence ? {
          nextSymbol: markovData.prediction.nextSymbol,
          confidence: markovData.prediction.confidence
        } : {
          nextSymbol: Math.floor(Math.random() * 4) + 1,
          confidence: 25  // Low confidence when not enough data
        },
        monte_carlo: monteCarloData?.analysis?.monteCarlo?.predictedSymbol ? {
          nextSymbol: monteCarloData.analysis.monteCarlo.predictedSymbol,
          confidence: monteCarloData.analysis.monteCarlo.confidence
        } : {
          nextSymbol: Math.floor(Math.random() * 4) + 1,
          confidence: 25
        },
        variational: viData?.analysis?.vi?.prediction?.nextSymbol ? {
          nextSymbol: viData.analysis.vi.prediction.nextSymbol,
          confidence: viData.analysis.vi.prediction.confidence
        } : {
          nextSymbol: Math.floor(Math.random() * 4) + 1,
          confidence: 25
        }
      }
    };

    // Create HMM prediction
    const hmmData: HMMResponse = {
      states: [0, 1], // Hidden states (e.g., "random", "patterned")
      emission_probs: [
        [0.25, 0.25, 0.25, 0.25], // Emission probabilities for state 0 (random)
        [0.4, 0.3, 0.2, 0.1]      // Emission probabilities for state 1 (patterned)
      ],
      prediction: {
        nextSymbol: Math.floor(Math.random() * 4) + 1, // Placeholder for actual HMM prediction
        confidence: 0.7 // Placeholder confidence
      }
    };

    // Get total symbol count
    const countResult = await db.$queryRaw`
      SELECT COUNT(*) as total_symbols
      FROM symbol_observations
      WHERE student_id = ${studentId}
    `;

    const totalSymbols = Number(countResult[0]?.total_symbols || 0);

    return json({
      success: true,
      recentSymbols: lastFiveSymbols,
      entropy: (entropy / Math.log2(4)) * 100, // Normalize to 0-100
      totalSymbols,
      markovData,
      monteCarloData,
      viData,
      ensembleData,
      hmmData
    });

  } catch (error) {
    console.error("Error processing symbol:", error);
    return json(
      { error: "Failed to process symbol" },
      { status: 500 }
    );
  }
};
