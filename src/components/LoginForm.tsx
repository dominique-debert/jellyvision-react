import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { authenticateByName } from "@/lib/jellyfin/client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [serverUrl, setServerUrl] = useState("http://192.168.1.100:8096");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: login, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      setError(null);
      const result = await authenticateByName(serverUrl, username, password);
      if (result.success && result.data) {
        const { AccessToken, User } = result.data;
        if (AccessToken && User?.Id && User?.Name) {
          const actualServerUrl = result.serverUrl || serverUrl;
          setAuth(actualServerUrl, AccessToken, User.Id, User.Name);
          navigate("/");
        } else {
          throw new Error("Invalid server response");
        }
      } else {
        throw new Error(result.error || "Login failed");
      }
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "An error occurred");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to Jellyfin</CardTitle>
        <CardDescription>
          Enter your credentials to access your media library
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="server" className="text-sm font-medium">
              Server URL
            </label>
            <Input
              id="server"
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.100:8096"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
