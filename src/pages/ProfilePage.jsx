import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Settings,
  DollarSign,
} from "lucide-react";
import {
  calculateMemberTotals,
  formatBillDate,
  formatCurrency,
  getStoredBills,
} from "@/lib/bills";
import AppNavbar from "@/components/AppNavbar";
import { getAccountDisplayName, getAccountInitials, getStoredAccount } from "@/lib/account";

const ReceiptHistoryRow = ({ bill, onViewDetails, showSeparator = false }) => (
  <div>
    {showSeparator && <Separator />}
    <button
      type="button"
      onClick={() => onViewDetails(bill)}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:gap-4 sm:px-6 sm:py-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
        <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground sm:text-base">{bill.billName}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground sm:gap-2 sm:text-xs">
          <span>{formatBillDate(bill.createdAt)}</span>
          <span>·</span>
          <span>{bill.peopleCount} people</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Total {formatCurrency(bill.total)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-foreground sm:text-base">{formatCurrency(bill.total)}</p>
          <Badge
            variant={bill.status === "Settled" ? "secondary" : "destructive"}
            className={`text-[10px] sm:text-xs ${bill.status === "Settled" ? "bg-success/15 text-success" : ""}`}
          >
            {bill.status}
          </Badge>
        </div>
        <span className="flex min-w-[2rem] items-center justify-center px-1 py-1 text-sm leading-none text-muted-foreground sm:text-xl">
          &gt;
        </span>
      </div>
    </button>
  </div>
);

const ReceiptDetails = ({ bill }) => {
  if (!bill) {
    return null;
  }

  const breakdown = calculateMemberTotals(bill.items, bill.members);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">{bill.billName}</h3>
          <p className="text-sm text-muted-foreground">
            {formatBillDate(bill.createdAt)} · {bill.peopleCount} people · Total {formatCurrency(bill.total)}
          </p>
        </div>
        <Badge
          variant={bill.status === "Settled" ? "secondary" : "destructive"}
          className={bill.status === "Settled" ? "bg-success/15 text-success" : ""}
        >
          {bill.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">People breakdown</p>
          {breakdown.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span>{member.name}</span>
              <span className="font-semibold text-foreground">{formatCurrency(member.total)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Items</p>
          {bill.items.map((item) => {
            const assignedNames = bill.members
              .filter((member) => item.assignedTo.includes(member.id))
              .map((member) => member.name)
              .join(", ");

            return (
              <div key={item.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(item.price)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {assignedNames || "Not assigned to anyone"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const history = useMemo(() => getStoredBills(), []);
  const account = useMemo(() => getStoredAccount(), []);

  const totalSpent = useMemo(
    () => history.reduce((sum, bill) => sum + Number(bill.total || 0), 0),
    [history],
  );

  const monthSpent = useMemo(() => {
    const now = new Date();

    return history.reduce((sum, bill) => {
      const billDate = new Date(bill.createdAt);
      const isSameMonth =
        billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();

      return isSameMonth ? sum + Number(bill.total || 0) : sum;
    }, 0);
  }, [history]);

  const recentHistory = history.slice(0, 4);

  const handleViewDetails = (bill) => {
    setSelectedBill(bill);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="mb-6 overflow-hidden border shadow-lg sm:mb-8">
          <div className="h-20 bg-gradient-to-r from-primary/80 to-accent/60 sm:h-24" />
          <CardContent className="relative pb-6 pt-0">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-10 h-16 w-16 border-4 border-card shadow-md sm:h-20 sm:w-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground sm:text-xl">
                  {getAccountInitials(account)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">{getAccountDisplayName(account)}</h1>
                <p className="text-sm text-muted-foreground">@{account.username}</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <Link to="/settings" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
          {[
            { label: "Total splits", value: String(history.length), icon: Receipt },
            { label: "Total spent", value: formatCurrency(totalSpent), icon: DollarSign },
            { label: "This month", value: formatCurrency(monthSpent), icon: Calendar },
          ].map((stat, index) => (
            <Card key={index} className="border">
              <CardContent className="flex flex-col items-center p-3 text-center sm:p-4">
                <stat.icon className="mb-1.5 h-4 w-4 text-primary sm:mb-2 sm:h-5 sm:w-5" />
                <span className="text-lg font-extrabold text-foreground sm:text-2xl">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold sm:text-lg">Receipt History</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full border border-border bg-transparent px-3 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => setIsHistoryOpen(true)}
            >
              View More
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentHistory.length > 0 ? (
              recentHistory.map((bill, index) => (
                <ReceiptHistoryRow
                  key={bill.id}
                  bill={bill}
                  onViewDetails={handleViewDetails}
                  showSeparator={index > 0}
                />
              ))
            ) : (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No receipts saved yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Previous bills</DialogTitle>
            <DialogDescription>
              Scroll through your receipt history, then open any receipt to see the full breakdown.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="p-0">
              {history.length > 0 ? (
                history.map((bill, index) => (
                  <ReceiptHistoryRow
                    key={bill.id}
                    bill={bill}
                    onViewDetails={handleViewDetails}
                    showSeparator={index > 0}
                  />
                ))
              ) : (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No receipts saved yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedBill)} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Receipt details</DialogTitle>
            <DialogDescription>
              Review the people breakdown and item assignments for this receipt.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] px-6 py-5">
            <ReceiptDetails bill={selectedBill} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;