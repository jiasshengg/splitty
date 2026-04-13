import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, Menu, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkSession, logoutSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const navButtonClassName =
  'bg-transparent text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground';

const mobileMenuButtonClassName =
  'justify-start bg-transparent px-0 text-sm font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground';

const AppNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const isLoggedIn = await checkSession();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(isLoggedIn);
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutSession();
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold text-foreground">SplitPot</span>
          </Link>

          <div className="ml-auto hidden items-center gap-3 sm:flex sm:gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(navButtonClassName, isActivePath('/') && 'text-foreground')}
            >
              <Link to="/">Home</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(navButtonClassName, isActivePath('/split') && 'text-foreground')}
            >
              <Link to="/split">Split</Link>
            </Button>

            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
                  <Link to="/profile" aria-label="Profile" title="Profile">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className={navButtonClassName} onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className={navButtonClassName}>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className={navButtonClassName}>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto sm:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMobileMenuOpen ? (
          <div id="mobile-nav-menu" className="border-t py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              <Button
                asChild
                variant="ghost"
                className={cn(mobileMenuButtonClassName, isActivePath('/') && 'text-foreground')}
              >
                <Link to="/">Home</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className={cn(mobileMenuButtonClassName, isActivePath('/split') && 'text-foreground')}
              >
                <Link to="/split">Split</Link>
              </Button>

              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(mobileMenuButtonClassName, isActivePath('/profile') && 'text-foreground')}
                  >
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" className={mobileMenuButtonClassName} onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className={mobileMenuButtonClassName}>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild variant="ghost" className={mobileMenuButtonClassName}>
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default AppNavbar; 