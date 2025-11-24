import { createRoot } from "react-dom/client";
import { NotificationProvider } from "@/contexts/NotificationContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <NotificationProvider>
    <App />
  </NotificationProvider>
);
