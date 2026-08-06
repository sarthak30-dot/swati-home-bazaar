import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Swati Enterprises" },
      {
        name: "description",
        content: "Sign in to track orders, save addresses and build your wishlist at Swati Enterprises.",
      },
      { property: "og:title", content: "Sign in — Swati Enterprises" },
      { property: "og:description", content: "Access your orders, addresses and wishlist." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().max(100).optional(),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/account", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName: fullName || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/account" });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="font-display text-2xl font-bold">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track orders, save addresses and keep a wishlist.
      </p>

      {sent ? (
        <div className="mt-6 rounded-2xl border border-border bg-gold-tint p-5 text-sm">
          We&apos;ve emailed a confirmation link to <strong>{email}</strong>. Click it to activate
          your account, then come back and sign in.
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={google}
            className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted"
          >
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-sm text-muted-foreground hover:text-gold"
          >
            {mode === "signin"
              ? "New to Swati Enterprises? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </>
      )}

      <Link to="/shop" className="mt-8 text-sm text-muted-foreground hover:text-gold">
        Continue shopping without signing in
      </Link>
    </div>
  );
}
