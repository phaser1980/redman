import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const action: ActionFunction = async ({ params, request }) => {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const studentId = params.studentId;
  if (!studentId) {
    return json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    // Get the most recent symbol observation
    const latestSymbol = await db.$queryRaw`
      DELETE FROM symbol_observations
      WHERE observation_id = (
        SELECT observation_id
        FROM symbol_observations
        WHERE student_id = ${parseInt(studentId)}
        ORDER BY timestamp DESC
        LIMIT 1
      )
      RETURNING *
    `;

    if (!latestSymbol || latestSymbol.length === 0) {
      return json({ error: "No symbols to undo" }, { status: 404 });
    }

    // Get the updated list of recent symbols
    const recentSymbols = await db.$queryRaw`
      SELECT symbol
      FROM symbol_observations
      WHERE student_id = ${parseInt(studentId)}
      ORDER BY timestamp DESC
      LIMIT 5
    `;

    // Calculate new entropy
    const symbols = recentSymbols.map((s: any) => s.symbol);
    const uniqueSymbols = new Set(symbols);
    const entropy = symbols.length > 0 ? (uniqueSymbols.size / symbols.length) * 100 : 0;

    // Get updated total count
    const countResult = await db.$queryRaw`
      SELECT COUNT(*) as total_symbols
      FROM symbol_observations
      WHERE student_id = ${parseInt(studentId)}
    `;

    const totalSymbols = Number(countResult[0]?.total_symbols || 0);

    return json({
      success: true,
      recentSymbols: symbols,
      entropy,
      totalSymbols
    });
  } catch (error) {
    console.error("Failed to undo symbol:", error);
    return json({ error: "Failed to undo symbol" }, { status: 500 });
  }
};
