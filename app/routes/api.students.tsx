import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

// Predefined list of valid student IDs
const VALID_STUDENT_IDS = [1, 2, 5, 10, 100, 200];

export const loader: LoaderFunction = async () => {
  try {
    // Return predefined list of students
    const students = VALID_STUDENT_IDS.map(id => ({
      student_id: id,
      student_name: `Student ${id}`
    }));
    
    return json(students);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return json({ error: "Failed to fetch students" }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const studentId = Number(formData.get("studentId"));
      const studentName = formData.get("studentName")?.toString() || `Student ${studentId}`;

      if (!VALID_STUDENT_IDS.includes(studentId)) {
        return json({ error: "Invalid student ID" }, { status: 400 });
      }

      // Check if student already exists
      const existingStudent = await db.students.findUnique({
        where: {
          student_id: studentId
        }
      });

      if (existingStudent) {
        return json({ error: "Student ID already exists" }, { status: 400 });
      }

      const newStudent = await db.students.create({
        data: {
          student_id: studentId,
          student_name: studentName
        }
      });

      return json(newStudent);
    } catch (error) {
      console.error("Failed to create student:", error);
      return json({ error: "Failed to create student" }, { status: 500 });
    }
  }
  
  return json({ error: "Method not allowed" }, { status: 405 });
};
