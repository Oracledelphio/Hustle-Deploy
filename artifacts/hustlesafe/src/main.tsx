import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react"; // Add this import
import App from "./App";
import "./index.css";

// Set the base URL for all API requests to point to your Express server
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);
