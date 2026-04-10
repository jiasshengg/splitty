import { useRef } from 'react';
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

const RegisterPage = () => {
  const messageRef = useRef(null);

  const showMessage = (text, type = 'error') => {
    if (!messageRef.current) return;

    messageRef.current.textContent = text;
    messageRef.current.className =
      type === 'error'
        ? 'text-sm font-medium text-destructive'
        : 'text-sm font-medium text-green-600';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const firstName = formData.get('firstName')?.toString().trim();
    const lastName = formData.get('lastName')?.toString().trim();
    const username = formData.get('username')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      showMessage('Please fill in all fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return;
    }

    showMessage('Registration form submitted successfully.', 'success');

    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AppNavbar />

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-extrabold">Create your account</CardTitle>
              <CardDescription>Start splitting bills fairly</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" name="firstName" placeholder="John" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" placeholder="johndoe" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <p ref={messageRef} className="text-sm font-medium" />

                <Button type="submit" className="w-full font-semibold" size="lg">
                  Sign up
                </Button>
              </CardContent>
            </form>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
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

export default RegisterPage;