import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateStudentId } from "~/utils/validation";

function calculateWindowEntropy(symbols: number[]): number {
  if (!symbols.length) return 0;

  // Count frequency of each symbol
  const counts = new Map<number, number>();
  for (const symbol of symbols) {
    counts.set(symbol, (counts.get(symbol) || 0) + 1);
  }

  // Calculate probabilities and entropy
  let entropy = 0;
  const n = symbols.length;
  
  // Calculate Shannon entropy with more precision
  for (const count of counts.values()) {
    const probability = count / n;
    if (probability > 0) { // Avoid log(0)
      entropy -= probability * Math.log2(probability);
    }
  }

  // Maximum entropy for 4 symbols is log2(4) = 2
  const maxEntropy = Math.log2(4);
  
  // Convert to percentage with 1 decimal place precision
  const percentage = (entropy / maxEntropy) * 100;
  return Math.round(percentage * 10) / 10;
}

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = Number(params.studentId);
  if (!validateStudentId(studentId)) {
    return json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    console.log('Processing entropy request for student:', studentId);
    
    // Get all symbols for this student
    const symbols = await db.$queryRaw`
      SELECT symbol, timestamp
      FROM symbol_observations
      WHERE student_id = ${studentId}
      ORDER BY timestamp DESC
    `;

    if (!symbols || !Array.isArray(symbols)) {
      console.log('No symbols found for student:', studentId);
      return json({ 
        entropy_value: 0,
        trend: "stable",
        historical_data: []
      });
    }

    // Convert raw symbols to array of numbers
    const symbolArray = symbols.map((s: any) => s.symbol);
    console.log('Retrieved symbols:', symbolArray.length);

    // Calculate current entropy (last 5 symbols)
    const currentWindow = symbolArray.slice(0, 5);
    const currentEntropy = calculateWindowEntropy(currentWindow);
    console.log('Current window entropy:', currentEntropy);

    // Calculate previous entropy (previous 5 symbols)
    const previousWindow = symbolArray.slice(5, 10);
    const previousEntropy = previousWindow.length > 0 
      ? calculateWindowEntropy(previousWindow)
      : currentEntropy;

    // Determine trend
    let trend = "stable";
    if (currentEntropy > previousEntropy + 5) {
      trend = "increasing";
    } else if (currentEntropy < previousEntropy - 5) {
      trend = "decreasing";
    }

    // Calculate historical data in sliding windows
    const historical_data = [];
    const windowSize = 5;
    
    // Use sliding window for historical data
    for (let i = 0; i < symbolArray.length - windowSize + 1; i++) {
      const window = symbolArray.slice(i, i + windowSize);
      if (window.length === windowSize) {
        historical_data.push({
          window_start: i,
          window_end: i + windowSize,
          entropy_value: calculateWindowEntropy(window),
          window_size: windowSize,
          symbols: window // Include symbols for debugging
        });
      }
    }

    console.log('Generated historical data points:', historical_data.length);

    const response = {
      entropy_value: currentEntropy,
      trend,
      historical_data: historical_data.reverse() // Most recent first
    };

    console.log('Sending response:', response);
    return json(response);

  } catch (error) {
    console.error("Failed to calculate entropy:", error);
    return json({ error: "Failed to calculate entropy" }, { status: 500 });
  }
};
