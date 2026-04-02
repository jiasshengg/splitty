import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Flame,
  ArrowLeft,
  Plus,
  Trash2,
  UserPlus,
  Receipt,
  DollarSign,
  Users,
} from "lucide-react";

const initialMembers = [
  { id: 1, name: "You", color: "bg-primary" },
  { id: 2, name: "Alice", color: "bg-accent" },
  { id: 3, name: "Bob", color: "bg-success" },
];

const initialItems = [
  { id: 1, name: "Beef slices", price: 18.0, assignedTo: [1, 2] },
  { id: 2, name: "Pork belly", price: 14.5, assignedTo: [2, 3] },
  { id: 3, name: "Shrimp paste", price: 8.0, assignedTo: [1] },
  { id: 4, name: "Mushroom platter", price: 12.0, assignedTo: [1, 2, 3] },
  { id: 5, name: "Noodles", price: 5.0, assignedTo: [3] },
  { id: 6, name: "Drinks (shared)", price: 15.0, assignedTo: [1, 2, 3] },
];

const SplitPage = () => {
  const [members] = useState(initialMembers);
  const [items] = useState(initialItems);

  const getTotal = () => items.reduce((sum, item) => sum + item.price, 0);

  const getPersonTotal = (memberId) => {
    return items.reduce((sum, item) => {
      if (item.assignedTo.includes(memberId)) {
        return sum + item.price / item.assignedTo.length;
      }
      return sum;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold text-foreground">SplitPot</span>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="sm">Profile</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Split a Receipt</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Add items, assign diners, and see who owes what.</p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Left: Items + Members */}
          <div className="space-y-6 lg:col-span-2">
            {/* Members */}
            <Card className="border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Users className="h-5 w-5 text-primary" />
                  Diners
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add person</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <Badge
                      key={m.id}
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-sm font-medium"
                    >
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${m.color}`} />
                      {m.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Receipt items */}
            <Card className="border shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Receipt className="h-5 w-5 text-primary" />
                  Receipt Items
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add item</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Header row - hidden on mobile */}
                <div className="hidden sm:grid grid-cols-12 gap-2 border-b bg-muted/40 px-6 py-2.5 text-xs font-semibold uppercase text-muted-foreground">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-5">Assigned to</div>
                  <div className="col-span-1" />
                </div>

                {items.map((item, i) => (
                  <div key={item.id}>
                    {i > 0 && <Separator />}
                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-12 items-center gap-2 px-6 py-3 transition-colors hover:bg-muted/30">
                      <div className="col-span-4">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-5 flex flex-wrap gap-1.5">
                        {members.map((m) => (
                          <label
                            key={m.id}
                            className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                          >
                            <Checkbox
                              checked={item.assignedTo.includes(m.id)}
                              className="h-3.5 w-3.5"
                            />
                            <span>{m.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Mobile layout */}
                    <div className="sm:hidden px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">${item.price.toFixed(2)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {members.map((m) => (
                          <label
                            key={m.id}
                            className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                          >
                            <Checkbox
                              checked={item.assignedTo.includes(m.id)}
                              className="h-3.5 w-3.5"
                            />
                            <span>{m.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add item row */}
                <Separator />
                <div className="px-4 sm:px-6 py-3">
                  <Button variant="ghost" className="w-full gap-2 border border-dashed text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" />
                    Add another item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            <Card className="lg:sticky lg:top-24 border shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Split Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.map((m) => {
                  const total = getPersonTotal(m.id);
                  const pct = (total / getTotal()) * 100;
                  return (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${m.color}`} />
                          <span className="text-sm font-semibold text-foreground">{m.name}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${m.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Receipt total</span>
                  <span className="text-lg font-extrabold text-foreground">
                    ${getTotal().toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label htmlFor="tax" className="text-muted-foreground">Tax %</Label>
                    <Input
                      id="tax"
                      defaultValue="8"
                      className="h-8 w-20 text-right text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Label htmlFor="tip" className="text-muted-foreground">Tip %</Label>
                    <Input
                      id="tip"
                      defaultValue="15"
                      className="h-8 w-20 text-right text-sm"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <Button className="w-full font-semibold" size="lg">
                  Finalize Split
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPage;
