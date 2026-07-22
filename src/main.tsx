import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {
  RootErrorBoundary,
  StartupError,
} from "./components/StartupErrorBoundary.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Application root element is missing.");

const root = createRoot(rootElement);
if (!import.meta.env.VITE_CONVEX_URL?.trim()) {
  root.render(
    <StartupError
      title="Configuration error"
      message="Application configuration error: VITE_CONVEX_URL is missing."
    />,
  );
} else {
  root.render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>,
  );
}
