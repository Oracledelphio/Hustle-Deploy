import serverless from "serverless-http";
import app from "./app.js";

// Wrap the Express app. 
// Depending on how Netlify invokes it, it may include the full path or just the redirected path.
export const handler = serverless(app);
