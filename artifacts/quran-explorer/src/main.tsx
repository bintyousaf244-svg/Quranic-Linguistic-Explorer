import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Connect frontend to Render backend
setBaseUrl("https://quranic-linguistic-explorer.onrender.com");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);