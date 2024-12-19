import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Delete all symbol observations
    await db.$executeRaw`TRUNCATE TABLE symbol_observations RESTART IDENTITY`;
    
    console.log("All symbols cleared successfully");
    
    return json({ 
      success: true,
      message: "All symbols cleared successfully" 
    });
  } catch (error) {
    console.error("Failed to clear symbols:", error);
    return json({ error: "Failed to clear symbols" }, { status: 500 });
  }
};
