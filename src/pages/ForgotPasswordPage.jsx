import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
import { requestPasswordReset } from '@/lib/session';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
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

    if (!email) {
      showMessage('Please enter your email.', 'error');
      setIsLoading(false);
      return;
    }

    if (!emailPattern.test(email)) {
      showMessage('Please enter a valid email', 'error');
      setIsLoading(false);
      return;
    }

    try {
      await requestPasswordReset({ email });

      showMessage(
        'If an account exists for that email, a password reset link has been sent.',
        'success',
      );
      e.target.reset();
    } catch (error) {
      showMessage(error.message || 'Unable to start password reset right now.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AppNavbar />

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <Card className="border shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-extrabold">Forgot password</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll help you reset your password.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <p ref={messageRef} className="text-sm font-medium" />

                <Button type="submit" className="w-full font-semibold" size="lg" disabled={isLoading}>
                  {isLoading ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
