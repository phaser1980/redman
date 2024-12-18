import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = params.studentId;
  if (!studentId) {
    return json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    // Get the last 50 symbols for this student
    const observations = await db.$queryRaw`
      SELECT symbol, timestamp
      FROM symbol_observations
      WHERE student_id = ${parseInt(studentId)}
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    if (!observations || observations.length === 0) {
      return json({ history: [] });
    }

    // Calculate entropy for windows of 5 symbols
    const windowSize = 5;
    const history = [];
    
    // Process symbols in reverse chronological order
    const symbols = observations.reverse();

    // Calculate entropy for each window
    for (let i = windowSize; i <= symbols.length; i += windowSize) {
      const window = symbols.slice(i - windowSize, i).map(obs => obs.symbol);
      const uniqueSymbols = new Set(window);
      const entropy = (uniqueSymbols.size / windowSize) * 100;
      history.push({
        entropy_value: entropy,
        timestamp: symbols[i - 1].timestamp,
        window_size: windowSize
      });
    }

    return json({ history });
  } catch (error) {
    console.error("Failed to fetch entropy history:", error);
    return json({ error: "Failed to fetch entropy history" }, { status: 500 });
  }
};
