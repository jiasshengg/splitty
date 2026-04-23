import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AppNavbar from '@/components/AppNavbar';

const LoginPage = () => {
  const messageRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = (text, type = 'error') => {
    if (!messageRef.current) return;

    messageRef.current.textContent = text;
    messageRef.current.className =
      type === 'error'
        ? 'text-sm font-medium text-destructive'
        : 'text-sm font-medium text-green-600';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);

    const email = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      showMessage('Please fill in all fields.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      // simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      e.target.reset();
    } catch (error) {
      showMessage('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AppNavbar />

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-extrabold">Welcome back</CardTitle>
              <CardDescription>Log in to manage your splits</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <p ref={messageRef} className="text-sm font-medium" />

                <Button type="submit" className="w-full font-semibold" size="lg" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Log in'}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;