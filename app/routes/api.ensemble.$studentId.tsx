import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = Number(params.studentId);

  if (isNaN(studentId)) {
    return json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    // Get predictions from all models
    const [markovResponse, monteCarloResponse, viResponse] = await Promise.all([
      fetch(`http://localhost:3000/api/markov/${studentId}`),
      fetch(`http://localhost:3000/api/montecarlo/${studentId}`),
      fetch(`http://localhost:3000/api/vi/${studentId}`)
    ]);

    const [markovData, monteCarloData, viData] = await Promise.all([
      markovResponse.json(),
      monteCarloResponse.json(),
      viResponse.json()
    ]);

    // Define model weights
    const weights = {
      markov: 0.3,
      monte_carlo: 0.3,
      variational: 0.4
    };

    // Extract predictions and confidences
    const predictions = {
      markov: markovData?.prediction?.nextSymbol && markovData?.prediction?.confidence ? {
        nextSymbol: markovData.prediction.nextSymbol,
        confidence: markovData.prediction.confidence
      } : {
        nextSymbol: Math.floor(Math.random() * 4) + 1,
        confidence: 25
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
    };

    return json({
      weights,
      predictions
    });

  } catch (error) {
    console.error("Ensemble Analysis Error:", error);
    return json(
      { error: "Failed to perform ensemble analysis" },
      { status: 500 }
    );
  }
};
