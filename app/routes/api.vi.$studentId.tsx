import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateStudentId } from "~/utils/validation";
import { runVariationalInference } from "~/utils/variationalInference";

export const loader: LoaderFunction = async ({ params }) => {
    console.log('VI API called for student:', params.studentId);
    
    const studentId = Number(params.studentId);
    if (!validateStudentId(studentId)) {
        console.log('Invalid student ID:', studentId);
        return json({ error: "Invalid student ID" }, { status: 400 });
    }

    try {
        console.log('Fetching symbols for VI analysis...');
        // Get all symbols for this student
        const symbols = await db.$queryRaw`
            SELECT symbol, timestamp
            FROM symbol_observations
            WHERE student_id = ${studentId}
            ORDER BY timestamp ASC
        `;

        if (!symbols || !Array.isArray(symbols)) {
            console.log('No symbols found for VI analysis');
            return json({ 
                error: "No symbols found",
                analysis: null
            });
        }

        // Convert raw symbols to array of numbers
        const symbolArray = symbols.map((s: any) => s.symbol);
        console.log('Retrieved symbols for VI:', symbolArray.length);
        
        if (symbolArray.length < 10) {
            console.log('Not enough symbols for VI analysis');
            return json({
                error: "Need at least 10 symbols for VI analysis",
                analysis: null
            });
        }

        // Run Variational Inference
        console.log('Running VI analysis...');
        const viResult = runVariationalInference(symbolArray);
        console.log('VI analysis result:', viResult);

        return json({
            error: null,
            analysis: {
                vi: viResult,
                totalSymbols: symbolArray.length
            }
        });

    } catch (error) {
        console.error("Failed to run VI analysis:", error);
        return json({ 
            error: "Failed to run VI analysis",
            analysis: null
        }, { status: 500 });
    }
};
