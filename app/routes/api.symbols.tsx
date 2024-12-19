import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateSymbol, validateStudentId } from "~/utils/validation";

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
          last_five_symbols: []
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

    console.log("Created symbol observation:", observation);

    // Get all recent symbols for entropy calculation
    const recentSymbols = await db.symbol_observations.findMany({
      where: {
        session_id: session.session_id
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5,
      select: {
        symbol: true
      }
    });

    console.log("Recent symbols:", recentSymbols);

    // Calculate entropy
    const symbols = recentSymbols.map(s => s.symbol);
    const uniqueSymbols = new Set(symbols);
    const entropy = (uniqueSymbols.size / symbols.length) * 100;

    console.log("Entropy calculation:", {
      symbols,
      uniqueCount: uniqueSymbols.size,
      total: symbols.length,
      entropy
    });

    // Update the session
    await db.sessions.update({
      where: {
        session_id: session.session_id
      },
      data: {
        last_five_symbols: symbols
      }
    });

    // Get total symbol count
    const countResult = await db.$queryRaw`
      SELECT COUNT(*) as total_symbols
      FROM symbol_observations
      WHERE student_id = ${studentId}
    `;

    const totalSymbols = Number(countResult[0]?.total_symbols || 0);
    console.log("Updated total symbols:", totalSymbols);

    return json({ 
      success: true, 
      observation,
      session,
      entropy,
      recentSymbols: symbols,
      totalSymbols
    });
  } catch (error) {
    console.error("Failed to process symbol:", error);
    return json({ error: "Failed to process symbol" }, { status: 500 });
  }
};
