import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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
  PencilLine,
  Save,
} from "lucide-react";
import { calculateMemberTotals, calculateUnassignedTotal, formatCurrency, saveBillToHistory } from "@/lib/bills";

const memberColors = ["bg-primary", "bg-accent", "bg-success", "bg-orange-500", "bg-violet-500", "bg-pink-500"];

const initialMembers = [];

const initialItems = [];

const createMember = (name, index) => ({
  id: Date.now() + index,
  name,
  color: memberColors[index % memberColors.length],
});

const createItem = (name, price) => ({
  id: Date.now(),
  name,
  price,
  assignedTo: [],
});

const normalizeMemberName = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();

const formatMemberName = (name) =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const SplitPage = () => {
  const [billName, setBillName] = useState("Korean BBQ Night");
  const [members, setMembers] = useState(initialMembers);
  const [items, setItems] = useState(initialItems);
  const [newMemberName, setNewMemberName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const totalsByMember = useMemo(() => calculateMemberTotals(items, members), [items, members]);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0), 0), [items]);
  const unassignedTotal = useMemo(() => calculateUnassignedTotal(items), [items]);

  const handleAddMember = () => {
    const cleanedName = formatMemberName(newMemberName);
    const normalizedNewName = normalizeMemberName(newMemberName);

    if (!cleanedName) {
      toast.error("Enter a person name first.");
      return;
    }

    const nameExists = members.some(
      (member) => normalizeMemberName(member.name) === normalizedNewName,
    );

    if (nameExists) {
      toast.error("That person has already been added.");
      return;
    }

    const nextMember = createMember(cleanedName, members.length);
    setMembers((current) => [...current, nextMember]);
    setNewMemberName("");
  };

  const handleRemoveMember = (memberId) => {
    setMembers((current) => current.filter((member) => member.id !== memberId));
    setItems((current) =>
      current.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((id) => id !== memberId),
      })),
    );
  };

  const handleAddItem = () => {
    const trimmedName = newItemName.trim();
    const parsedPrice = Number(newItemPrice);

    if (!trimmedName) {
      toast.error("Enter an item name first.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Enter a valid item price.");
      return;
    }

    setItems((current) => [...current, createItem(trimmedName, parsedPrice)]);
    setNewItemName("");
    setNewItemPrice("");
  };

  const handleRemoveItem = (itemId) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleItemFieldChange = (itemId, field, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          [field]: field === "price" ? Number(value || 0) : value,
        };
      }),
    );
  };

  const toggleAssignment = (itemId, memberId) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const hasMember = item.assignedTo.includes(memberId);

        return {
          ...item,
          assignedTo: hasMember
            ? item.assignedTo.filter((id) => id !== memberId)
            : [...item.assignedTo, memberId],
        };
      }),
    );
  };

  const handleSaveBill = () => {
    const trimmedBillName = billName.trim();

    if (!trimmedBillName) {
      toast.error("Please name the bill before saving.");
      return;
    }

    if (members.length === 0) {
      toast.error("Add at least one person.");
      return;
    }

    if (items.length === 0) {
      toast.error("Add at least one item.");
      return;
    }

    saveBillToHistory({
      billName: trimmedBillName,
      members,
      items,
    });

    toast.success("Bill saved to your history.");
  };

  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Split a Receipt</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Name the bill, add items, assign people, and see who owes what.</p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <PencilLine className="h-5 w-5 text-primary" />
                  Bill Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bill-name">Bill name</Label>
                  <Input
                    id="bill-name"
                    value={billName}
                    onChange={(event) => setBillName(event.target.value)}
                    placeholder="e.g. Seoul Garden dinner"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-md">
              <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Users className="h-5 w-5 text-primary" />
                  People
                </CardTitle>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Input
                    value={newMemberName}
                    onChange={(event) => setNewMemberName(event.target.value)}
                    placeholder="Add a person"
                    className="sm:w-48"
                  />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleAddMember}>
                    <UserPlus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-sm font-medium"
                    >
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${member.color}`} />
                      {member.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="ml-1 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remove ${member.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-md">
              <CardHeader className="flex flex-col gap-3 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold">Receipt Items</CardTitle>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                  <Input
                    value={newItemName}
                    onChange={(event) => setNewItemName(event.target.value)}
                    placeholder="Add item"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(event) => setNewItemPrice(event.target.value)}
                    placeholder="Price"
                  />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleAddItem}>
                    <Plus className="h-3.5 w-3.5" />
                    Add item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden grid-cols-12 gap-2 border-b bg-muted/40 px-6 py-2.5 text-xs font-semibold uppercase text-muted-foreground sm:grid">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-5">Assigned to</div>
                  <div className="col-span-1" />
                </div>

                {items.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator />}

                    <div className="hidden grid-cols-12 items-center gap-2 px-6 py-3 transition-colors hover:bg-muted/30 sm:grid">
                      <div className="col-span-4">
                        <Input
                          value={item.name}
                          onChange={(event) => handleItemFieldChange(item.id, "name", event.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(event) => handleItemFieldChange(item.id, "price", event.target.value)}
                          className="h-9 text-right"
                        />
                      </div>
                      <div className="col-span-5 flex flex-wrap gap-1.5">
                        {members.map((member) => (
                          <label
                            key={member.id}
                            className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                          >
                            <Checkbox
                              checked={item.assignedTo.includes(member.id)}
                              onCheckedChange={() => toggleAssignment(item.id, member.id)}
                              className="h-3.5 w-3.5"
                            />
                            <span>{member.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-3 sm:hidden">
                      <div className="grid gap-2">
                        <Input
                          value={item.name}
                          onChange={(event) => handleItemFieldChange(item.id, "name", event.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(event) => handleItemFieldChange(item.id, "price", event.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {members.map((member) => (
                          <label
                            key={member.id}
                            className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                          >
                            <Checkbox
                              checked={item.assignedTo.includes(member.id)}
                              onCheckedChange={() => toggleAssignment(item.id, member.id)}
                              className="h-3.5 w-3.5"
                            />
                            <span>{member.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 border shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill name</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{billName.trim() || "Untitled bill"}</p>
                </div>

                <div className="space-y-3">
                  {totalsByMember.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${member.color}`} />
                        <span className="text-sm font-medium text-foreground">{member.name}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(member.total)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Total bill</span>
                    <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>People</span>
                    <span className="font-semibold text-foreground">{members.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Items</span>
                    <span className="font-semibold text-foreground">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Unassigned amount</span>
                    <span className="font-semibold text-foreground">{formatCurrency(unassignedTotal)}</span>
                  </div>
                </div>

                <Separator />

                <Button onClick={handleSaveBill} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save bill
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
