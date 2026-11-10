import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import useAuthStore from "./store/authStore.ts";
import "./styles/index.css";

// Validate any persisted session before rendering. This also refreshes the
// user (including barbershop membership) from the identity service.
useAuthStore
  .getState()
  .init()
  .finally(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  });
