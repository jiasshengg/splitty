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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>
              <Button className="w-full font-semibold" size="lg">
                Sign up
              </Button>
            </CardContent>
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