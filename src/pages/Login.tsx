import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { role } = useParams<{ role: "admin" | "entry" }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (role !== "admin" && role !== "entry") {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password, role);
    if (success) {
      navigate(`/dashboard/${role}`);
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] space-y-8"
      >
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <header className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">
            Logging in as <span className="capitalize font-medium text-foreground">{role}</span>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={role}
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base">
            Sign in to Dashboard
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Demo: use <span className="font-medium text-foreground">{role}</span> / <span className="font-medium text-foreground">{role}</span>
        </p>
      </motion.div>
    </div>
  );
}
