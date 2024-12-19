import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const studentId = params.studentId;
  if (!studentId) {
    return json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    // Get total symbol count for this student
    const result = await db.$queryRaw`
      SELECT COUNT(*) as total_symbols
      FROM symbol_observations
      WHERE student_id = ${parseInt(studentId)}
    `;

    const totalSymbols = Number(result[0]?.total_symbols || 0);
    console.log("Symbol count for student", studentId, ":", totalSymbols);

    return json({ totalSymbols });
  } catch (error) {
    console.error("Failed to fetch symbol count:", error);
    return json({ error: "Failed to fetch symbol count" }, { status: 500 });
  }
};
