import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = params.studentId;
  if (!studentId) {
    return json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    // First verify the student exists
    const student = await db.$queryRaw`
      SELECT id FROM students WHERE id = ${parseInt(studentId)}
    `;

    if (!student || student.length === 0) {
      return json({ error: "Student not found" }, { status: 404 });
    }

    // Get the entropy history for this student
    const entropyHistory = await db.$queryRaw`
      SELECT entropy_value, timestamp, window_size
      FROM entropy_logs
      WHERE student_id = ${parseInt(studentId)}
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    return json(entropyHistory);
  } catch (error) {
    console.error("Failed to fetch entropy history:", error);
    return json({ error: "Failed to fetch entropy history" }, { status: 500 });
  }
};
