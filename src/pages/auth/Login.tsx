import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log("Attempting to sign in...");
      const authResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("Sign-in response:", authResponse);

      if (authResponse.error || !authResponse.data.user) {
        console.error("Sign-in failed or no user data returned.");
        setError(authResponse.error?.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Sign-in successful. Fetching profile for user:", authResponse.data.user.id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authResponse.data.user.id)
        .single();
      console.log("Profile fetch response:", { profileData, profileError });

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError("Could not fetch user profile. Please try again.");
        setLoading(false);
        return;
      }

      if (profileData?.role === "admin") {
        console.log("Admin user detected. Navigating to /admin");
        navigate("/admin");
      } else {
        console.log("Regular user detected. Navigating to /");
        navigate("/");
      }
    } catch (error: any) {
      console.error("An unexpected error occurred:", error);
      setError(error.message);
      setLoading(false);
    }
    // The finally block is removed as loading is now handled in all code paths.
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) {
        setError(error.message);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <Button variant="outline" className="w-full mt-6 h-12 text-lg" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
          <p className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
