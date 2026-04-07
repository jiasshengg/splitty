import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Flame className="h-8 w-8 text-primary" />
            <span className="text-2xl font-extrabold text-foreground">SplitPot</span>
          </Link>
        </div>

        <Card className="border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-extrabold">Welcome back</CardTitle>
            <CardDescription>Log in to manage your splits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full font-semibold" size="lg">
              Log in
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account? {" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
