import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { resetPassword } from '@/lib/session';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messageRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get('token') || '';

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

    if (!token) {
      showMessage('This password reset link is invalid or has expired', 'error');
      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.target);
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    if (!password || !confirmPassword) {
      showMessage('Please fill in all fields.', 'error');
      setIsLoading(false);
      return;
    }

    if (!passwordPattern.test(password)) {
      showMessage('Password requirements not met.', 'error');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword({ token, password });
      showMessage('Password reset successfully. Redirecting to login...', 'success');
      e.target.reset();
      navigate('/login');
    } catch (error) {
      showMessage(error.message || 'Unable to reset password right now.', 'error');
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
              <CardTitle className="text-2xl font-extrabold">Reset your password</CardTitle>
              <CardDescription>
                Choose a new password for your account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New password</Label>
                  <Input
                    id="reset-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={!token}
                  />
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters, with uppercase, lowercase, number, and symbol.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirm new password</Label>
                  <Input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={!token}
                  />
                </div>

                {!token ? (
                  <p className="text-sm font-medium text-destructive">
                    This password reset link is invalid or has expired.
                  </p>
                ) : null}

                <p ref={messageRef} className="text-sm font-medium" />

                <Button type="submit" className="w-full font-semibold" size="lg" disabled={isLoading || !token}>
                  {isLoading ? 'Resetting password...' : 'Reset password'}
                </Button>
              </CardContent>
            </form>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Need to start over?{' '}
                <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
                  Request a new link
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
