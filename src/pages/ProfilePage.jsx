import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flame, ArrowLeft, Receipt, Users, Calendar, ChevronRight, LogOut, Settings, DollarSign } from "lucide-react";

const mockHistory = [
  { id: 1, restaurant: "Haidilao Hotpot", date: "Mar 28, 2026", total: "$124.50", people: 4, yourShare: "$28.80", status: "settled" },
  { id: 2, restaurant: "Korean BBQ House", date: "Mar 22, 2026", total: "$89.00", people: 3, yourShare: "$32.50", status: "settled" },
  { id: 3, restaurant: "Sichuan Paradise", date: "Mar 15, 2026", total: "$156.20", people: 5, yourShare: "$25.40", status: "pending" },
  { id: 4, restaurant: "Shabu-Shabu Zen", date: "Mar 8, 2026", total: "$72.00", people: 2, yourShare: "$38.00", status: "settled" },
  { id: 5, restaurant: "Mongolian Grill", date: "Feb 28, 2026", total: "$98.75", people: 4, yourShare: "$22.15", status: "settled" },
];

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold text-foreground">SplitPot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Link to="/split">
              <Button size="sm" className="gap-1.5 font-semibold">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">New Split</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Profile header */}
        <Card className="mb-6 sm:mb-8 overflow-hidden border shadow-lg">
          <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/80 to-accent/60" />
          <CardContent className="relative pb-6 pt-0">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-10 h-16 w-16 sm:h-20 sm:w-20 border-4 border-card shadow-md">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-lg sm:text-xl font-bold text-primary-foreground">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">John Doe</h1>
                <p className="text-sm text-muted-foreground">johndoe@email.com</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Link to="/settings" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none gap-1.5 text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          {[
            { label: "Total splits", value: "23", icon: Receipt },
            { label: "Total spent", value: "$642.30", icon: DollarSign },
            { label: "Friends", value: "12", icon: Users },
            { label: "This month", value: "$86.70", icon: Calendar },
          ].map((stat, i) => (
            <Card key={i} className="border">
              <CardContent className="flex flex-col items-center p-3 sm:p-4 text-center">
                <stat.icon className="mb-1.5 sm:mb-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-lg sm:text-2xl font-extrabold text-foreground">{stat.value}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Receipt history */}
        <Card className="border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-bold">Receipt History</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              View all
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {mockHistory.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm sm:text-base font-semibold text-foreground">{item.restaurant}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>{item.people}p</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">Total {item.total}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-foreground">{item.yourShare}</p>
                      <Badge
                        variant={item.status === "settled" ? "secondary" : "destructive"}
                        className={`text-[10px] sm:text-xs ${item.status === "settled" ? "bg-success/15 text-success" : ""}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
