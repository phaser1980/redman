import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateStudentId } from "~/utils/validation";
import { findPotentialSeed, chiSquareTest } from "~/utils/monteCarlo";

export const loader: LoaderFunction = async ({ params }) => {
  console.log('Monte Carlo API called for student:', params.studentId);
  
  const studentId = Number(params.studentId);
  if (!validateStudentId(studentId)) {
    console.log('Invalid student ID:', studentId);
    return json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    console.log('Fetching symbols for Monte Carlo analysis...');
    // Get all symbols for this student
    const symbols = await db.$queryRaw`
      SELECT symbol, timestamp
      FROM symbol_observations
      WHERE student_id = ${studentId}
      ORDER BY timestamp ASC
    `;

    if (!symbols || !Array.isArray(symbols)) {
      console.log('No symbols found for Monte Carlo analysis');
      return json({ 
        error: "No symbols found",
        analysis: null
      });
    }

    // Convert raw symbols to array of numbers
    const symbolArray = symbols.map((s: any) => s.symbol);
    console.log('Retrieved symbols for Monte Carlo:', symbolArray.length);
    
    if (symbolArray.length < 10) {
      console.log('Not enough symbols for Monte Carlo analysis');
      return json({
        error: "Need at least 10 symbols for Monte Carlo analysis",
        analysis: null
      });
    }

    // Run Monte Carlo simulation to find potential RNG seed
    console.log('Running Monte Carlo simulation...');
    const monteCarloResult = findPotentialSeed(symbolArray);
    console.log('Monte Carlo result:', monteCarloResult);

    // Run chi-square test for randomness
    console.log('Running chi-square test...');
    const randomnessTest = chiSquareTest(symbolArray);
    console.log('Chi-square test result:', randomnessTest);

    const response = {
      error: null,
      analysis: {
        monteCarlo: monteCarloResult,
        chiSquare: randomnessTest,
        totalSymbols: symbolArray.length
      }
    };
    
    console.log('Sending Monte Carlo response:', response);
    return json(response);

  } catch (error) {
    console.error("Failed to run Monte Carlo analysis:", error);
    return json({ 
      error: "Failed to run Monte Carlo analysis",
      analysis: null
    }, { status: 500 });
  }
};
