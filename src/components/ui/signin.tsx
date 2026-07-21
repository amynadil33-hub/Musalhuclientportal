import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, LogIn, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

type AuthFlow = "signIn" | "signUp";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^.*Uncaught Error:\s*/s, "").trim();
    if (message.includes("InvalidSecret")) {
      return "The email or password is incorrect.";
    }
    if (message.includes("AccountAlreadyExists")) {
      return "An account already exists for this email.";
    }
    return message || "Authentication failed.";
  }
  return "Authentication failed.";
}

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<AuthFlow>("signIn");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allowSignUp =
    import.meta.env.DEV || import.meta.env.VITE_ALLOW_SIGN_UP === "true";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      await signIn("password", formData);
      toast.success(flow === "signIn" ? "Welcome back" : "Account created");
    } catch (error) {
      toast.error(
        flow === "signIn" ? "Could not sign in" : "Could not sign up",
        {
          description: getErrorMessage(error),
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <input name="flow" type="hidden" value={flow} />

      <div className="space-y-2">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={flow === "signIn" ? "current-password" : "new-password"}
          minLength={8}
          placeholder="At least 8 characters"
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : flow === "signIn" ? (
          <LogIn className="size-4" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {isSubmitting
          ? flow === "signIn"
            ? "Signing in..."
            : "Creating account..."
          : flow === "signIn"
            ? "Sign in"
            : "Create account"}
      </Button>

      {allowSignUp && (
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          disabled={isSubmitting}
        >
          {flow === "signIn"
            ? "First time here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      )}
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      toast.error("Could not sign out", {
        description: getErrorMessage(error),
      });
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
