import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

let convexClient: ConvexReactClient | undefined;

function getConvexClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
  if (!convexUrl) {
    throw new Error(
      "Application configuration error: VITE_CONVEX_URL is missing.",
    );
  }
  convexClient ??= new ConvexReactClient(convexUrl);
  return convexClient;
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider client={getConvexClient()}>
      {children}
    </ConvexAuthProvider>
  );
}
