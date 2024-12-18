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
      return json([]); // No active session means no recent symbols
    }

    // Get the last 5 symbols for this student's active session
    const symbols = await db.symbol_observations.findMany({
      where: {
        session_id: activeSession.session_id,
        student_id: studentId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5,
      select: {
        symbol: true
      }
    });

    // Map the symbols to their values
    const history = symbols.map(s => s.symbol).filter((s): s is number => s !== null);

    return json(history);
  } catch (error) {
    console.error("Failed to fetch symbol history:", error);
    return json({ error: "Failed to fetch symbol history" }, { status: 500 });
  }
};
