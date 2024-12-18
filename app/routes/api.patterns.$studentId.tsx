import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { validateStudentId } from "~/utils/validation";

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = Number(params.studentId);
  if (!validateStudentId(studentId)) {
    return json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    // First verify the student exists
    const student = await db.students.findUnique({
      where: {
        student_id: studentId
      }
    });

    if (!student) {
      return json({ error: "Student not found" }, { status: 404 });
    }

    // Get active session for this student
    const activeSession = await db.sessions.findFirst({
      where: {
        student_id: studentId,
        end_time: null
      }
    });

    if (!activeSession) {
      return json({ patterns: [] }); // No active session means no patterns
    }

    // Get the symbol observations for pattern analysis
    const observations = await db.symbol_observations.findMany({
      where: {
        session_id: activeSession.session_id,
        student_id: studentId
      },
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        symbol: true
      }
    });

    // Convert observations to patterns (looking for sequences of 2-4 symbols)
    const symbols = observations.map(o => o.symbol).filter((s): s is number => s !== null);
    const patterns: { pattern: number[], occurrences: number }[] = [];

    // Look for patterns of length 2-4
    for (let length = 2; length <= 4; length++) {
      for (let i = 0; i <= symbols.length - length; i++) {
        const pattern = symbols.slice(i, i + length);
        const patternStr = pattern.join(',');
        
        // Count occurrences of this pattern
        let occurrences = 0;
        for (let j = 0; j <= symbols.length - length; j++) {
          const testPattern = symbols.slice(j, j + length).join(',');
          if (testPattern === patternStr) {
            occurrences++;
          }
        }

        // Only include patterns that occur more than once
        if (occurrences > 1) {
          const existingPattern = patterns.find(p => p.pattern.join(',') === patternStr);
          if (!existingPattern) {
            patterns.push({
              pattern,
              occurrences
            });
          }
        }
      }
    }

    // Sort patterns by occurrences (most frequent first)
    patterns.sort((a, b) => b.occurrences - a.occurrences);

    return json({ patterns: patterns.slice(0, 5) }); // Return top 5 patterns
  } catch (error) {
    console.error("Failed to fetch patterns:", error);
    return json({ error: "Failed to fetch patterns" }, { status: 500 });
  }
};
