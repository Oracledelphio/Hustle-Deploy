import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

let dbConnectionString = process.env.DATABASE_URL;

// Fallback: manually parse the root env file if the variable isn't injected
if (!dbConnectionString) {
  try {
    const rootEnvPath = path.resolve(process.cwd(), "../../.env");
    const rawEnvFile = fs.readFileSync(rootEnvPath, "utf8");

    const targetLine = rawEnvFile.split("\n").find(textLine => textLine.startsWith("DATABASE_URL="));
    if (targetLine) {
      dbConnectionString = targetLine.split("=")[1].trim().replace(/['"]/g, "");
    }
  } catch (error) {
    // We will handle the missing string error below
  }
}

if (!dbConnectionString) {
  throw new Error("Missing DATABASE_URL. Please verify your root env file is properly configured.");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbConnectionString,
  },
});