import { useEffect, useMemo, useState } from "react";
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
  Receipt,
  Calendar,
  Settings,
  DollarSign,
} from "lucide-react";
import {
  calculateBillSummary,
  formatBillDate,
  formatCurrency,
  getStoredBills,
} from "@/lib/bills";
import AppNavbar from "@/components/AppNavbar";
import { getAccountDisplayName, getAccountInitials } from "@/lib/account";
import { getCurrentUserDetails } from "@/lib/session";

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

  const summary = calculateBillSummary(bill);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">{bill.billName}</h3>
          <p className="text-sm text-muted-foreground">
            {formatBillDate(bill.createdAt)} · {bill.peopleCount} people · {summary.receiptCount} receipt{summary.receiptCount === 1 ? "" : "s"} · Total {formatCurrency(summary.total)}
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
          {summary.members.map((member) => (
            <div key={member.id} className="rounded-lg bg-muted/40 px-3 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{member.name}</span>
                <span className="font-semibold text-foreground">{formatCurrency(member.total)}</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block">Items</span>
                  <span className="font-semibold text-foreground">{formatCurrency(member.itemSubtotal)}</span>
                </div>
                <div>
                  <span className="block">Discount</span>
                  <span className="font-semibold text-foreground">-{formatCurrency(member.discountShare)}</span>
                </div>
                <div>
                  <span className="block">GST</span>
                  <span className="font-semibold text-foreground">{formatCurrency(member.gstShare)}</span>
                </div>
                <div>
                  <span className="block">Service</span>
                  <span className="font-semibold text-foreground">{formatCurrency(member.serviceChargeShare)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Bill totals</p>
          {[
            { label: "Subtotal", value: summary.subtotal },
            { label: "Discount", value: -summary.discountAmount },
            { label: "Discounted subtotal", value: summary.discountedSubtotal },
            { label: "GST", value: summary.gstTotal },
            { label: "Service charge", value: summary.serviceChargeTotal },
            { label: "Unassigned", value: summary.unassignedTotal },
            { label: "Final total", value: summary.total },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span>{row.label}</span>
              <span className="font-semibold text-foreground">{formatCurrency(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Receipts</p>
        {summary.receipts.map((receipt) => (
          <div key={receipt.id} className="rounded-xl border">
            <div className="border-b bg-muted/30 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{receipt.label}</p>
                  <p className="text-xs text-muted-foreground">
                    GST split: {receipt.gstSplitMode === "byItems" ? "Based on what they ate" : "Equally"} · Service split: Equally
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-right">
                  <span>Subtotal {formatCurrency(receipt.subtotal)}</span>
                  <span>Discount -{formatCurrency(receipt.discountAmount)}</span>
                  <span>Net {formatCurrency(receipt.discountedSubtotal)}</span>
                  <span>GST % {Number(receipt.gstRate || 0).toFixed(2)}</span>
                  <span>GST {formatCurrency(receipt.gstAmount)}</span>
                  <span>Service {formatCurrency(receipt.serviceChargeAmount)}</span>
                  <span>Total {formatCurrency(receipt.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 px-4 py-3">
              {receipt.items.map((item) => {
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

              {receipt.items.length === 0 && (
                <div className="rounded-lg bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                  No items in this receipt.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [account, setAccount] = useState(null);
  const history = useMemo(() => getStoredBills(), []);
  const displayName = getAccountDisplayName(account) || "Your account";

  useEffect(() => {
    let isMounted = true;

    const loadUserDetails = async () => {
      const user = await getCurrentUserDetails();

      if (!isMounted) {
        return;
      }

      setAccount(user);
    };

    loadUserDetails();

    return () => {
      isMounted = false;
    };
  }, []);

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
        <Card className="mb-6 border shadow-lg sm:mb-8">
          <CardContent className="relative px-6 py-6 sm:px-8 sm:py-7">
            <div className="absolute right-4 top-4 sm:right-6 sm:top-5">
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>

            <div className="flex min-h-[72px] items-center gap-4 pr-20 sm:min-h-[80px] sm:gap-5 sm:pr-28">
              <Avatar className="h-16 w-16 shrink-0 border-4 border-background shadow-md sm:h-20 sm:w-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground sm:text-xl">
                  {getAccountInitials(account)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <h1 className="truncate text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                  {displayName}
                </h1>
                {account?.username ? (
                  <p className="truncate pt-1 text-sm text-muted-foreground">@{account.username}</p>
                ) : (
                  <p className="truncate pt-1 text-sm text-muted-foreground">
                    Sign in to see your current session details.
                  </p>
                )}
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
