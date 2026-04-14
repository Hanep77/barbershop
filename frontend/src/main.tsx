import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { getCsrf } from "./services/auth.ts";
import "./styles/index.css";

getCsrf().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
})

