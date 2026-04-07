import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Receipt, Users, Calculator, ChevronRight, Flame, Star } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold text-foreground">SplitPot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Flame className="h-4 w-4" />
            No more awkward bill splitting
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Split the pot,{" "}
            <span className="text-primary">not the friendship.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            Scan your receipt, tag what each person ate, and get an instant fair breakdown. 
            Perfect for any shared bill.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2 px-8 text-base font-semibold">
                Get started free
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/split">
              <Button size="lg" variant="outline" className="gap-2 px-8 text-base font-semibold">
                Try a demo split
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl font-extrabold text-foreground">How it works</h2>
          <p className="mx-auto mb-14 max-w-lg text-center text-muted-foreground">
            Three simple steps to a fair split every time.
          </p>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                icon: Receipt,
                title: "Add your receipt",
                desc: "Enter each item on the receipt with its price.",
              },
              {
                icon: Users,
                title: "Assign people",
                desc: "Tag who used what — shared items split evenly among tagged people.",
              },
              {
                icon: Calculator,
                title: "See the breakdown",
                desc: "Everyone sees exactly what they owe. No arguments.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border bg-card p-8 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">SplitPot</span>
          </div>
          <p>© 2026 SplitPot. Pay only for what you used.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
