import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  UserPlus,
  Receipt,
  DollarSign,
  Users,
  PencilLine,
  Save,
  Camera,
  Loader2,
} from "lucide-react";
import {
  calculateBillSummary,
  formatCurrency,
  RECEIPT_SPLIT_MODES,
} from "@/lib/bills";
import { DISCOUNT_TYPES } from "@/lib/receiptMath";
import { scanReceiptImages } from "@/lib/receiptScanner";
import { createBill } from "@/lib/billApi";
import { checkSession } from "@/lib/session";
import AppNavbar from "@/components/AppNavbar";
import ReceiptCard from "@/components/ReceiptCard";

const memberColors = [
  "bg-primary",
  "bg-sky-500",
  "bg-success",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-indigo-500",
];

const initialMembers = [];
const maxInputLength = 20;
const maxPriceDecimals = 5;
const maxVisibleUiTextLength = 12;

const splitModeOptions = [
  {
    value: RECEIPT_SPLIT_MODES.EQUALLY,
    label: "Equally",
  },
  {
    value: RECEIPT_SPLIT_MODES.BY_ITEMS,
    label: "Based on what was used",
  },
];

const discountTypeOptions = [
  {
    value: DISCOUNT_TYPES.FIXED,
    label: "Fixed amount",
  },
  {
    value: DISCOUNT_TYPES.PERCENTAGE,
    label: "Percentage",
  },
];

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const buildReceiptLabel = (index) => `Receipt ${index + 1}`;

const createMember = (name, index) => ({
  id: createId(),
  name,
  color: memberColors[index % memberColors.length],
});

const createItem = (name, price) => ({
  id: createId(),
  name,
  price,
  assignedTo: [],
});

const createReceipt = (overrides = {}) => ({
  id: createId(),
  label: "",
  items: [],
  discountType: DISCOUNT_TYPES.FIXED,
  discountValue: "",
  gstRate: "",
  serviceChargeAmount: "",
  gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
  ...overrides,
});

const normalizeMemberName = (name) =>
  String(name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const formatMemberName = (name) =>
  String(name)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const limitTextLength = (value, length = maxInputLength) =>
  String(value ?? "").slice(0, length);

const truncateTextForUi = (value, length = maxVisibleUiTextLength) => {
  const text = String(value ?? "").trim();

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}....`;
};

const sanitizePriceInput = (value) => {
  if (value === "") {
    return "";
  }

  const cleanedValue = String(value).replace(/[^\d.]/g, "");
  const firstDotIndex = cleanedValue.indexOf(".");

  let integerPart =
    firstDotIndex === -1 ? cleanedValue : cleanedValue.slice(0, firstDotIndex);
  let decimalPart =
    firstDotIndex === -1
      ? ""
      : cleanedValue.slice(firstDotIndex + 1).replace(/\./g, "");

  decimalPart = decimalPart.slice(0, maxPriceDecimals);

  const maxIntegerLength = decimalPart
    ? Math.max(1, maxInputLength - decimalPart.length - 1)
    : maxInputLength;

  integerPart = integerPart.slice(0, maxIntegerLength);

  if (firstDotIndex !== -1) {
    return `${integerPart || "0"}.${decimalPart}`;
  }

  return integerPart;
};

const getDraftForReceipt = (drafts, receiptId) =>
  drafts[receiptId] || { name: "", price: "" };

const normalizeReceiptForState = (receipt) => ({
  ...receipt,
  discountType:
    receipt.discountType === DISCOUNT_TYPES.PERCENTAGE
      ? DISCOUNT_TYPES.PERCENTAGE
      : DISCOUNT_TYPES.FIXED,
});

const SplitPage = () => {
  const [billName, setBillName] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [receipts, setReceipts] = useState(() => []);
  const [newMemberName, setNewMemberName] = useState("");
  const [itemDrafts, setItemDrafts] = useState({});
  const [openReceiptIds, setOpenReceiptIds] = useState({});
  const [isScanningReceipts, setIsScanningReceipts] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const receiptImageInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSessionState = async () => {
      const signedIn = await checkSession();

      if (!isMounted) {
        return;
      }

      setIsSignedIn(signedIn);
    };

    loadSessionState();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(
    () =>
      calculateBillSummary({
        members,
        receipts,
      }),
    [members, receipts]
  );

  const receiptSummaryById = useMemo(
    () =>
      new Map(summary.receipts.map((receipt) => [receipt.id, receipt])),
    [summary.receipts]
  );

  const handleAddMember = () => {
    const limitedName = limitTextLength(newMemberName);
    const cleanedName = formatMemberName(limitedName);
    const normalizedNewName = normalizeMemberName(limitedName);

    if (!cleanedName) {
      toast.error("Enter a person name first.");
      return;
    }

    const nameExists = members.some(
      (member) => normalizeMemberName(member.name) === normalizedNewName
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
    setReceipts((current) =>
      current.map((receipt) => ({
        ...receipt,
        items: receipt.items.map((item) => ({
          ...item,
          assignedTo: item.assignedTo.filter((id) => id !== memberId),
        })),
      }))
    );
  };

  const handleAddReceipt = () => {
    const nextReceipt = createReceipt();
    setReceipts((current) => [...current, nextReceipt]);
    setOpenReceiptIds((current) => ({
      ...current,
      [nextReceipt.id]: true,
    }));
  };

  const handleRemoveReceipt = (receiptId) => {
    setReceipts((current) =>
      current.filter((receipt) => receipt.id !== receiptId)
    );
    setOpenReceiptIds((current) => {
      const nextState = { ...current };
      delete nextState[receiptId];
      return nextState;
    });
    setItemDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[receiptId];
      return nextDrafts;
    });
  };

  const handleClearReceipts = () => {
    if (receipts.length === 0) {
      toast.error("There are no receipts to clear.");
      return;
    }

    setReceipts([]);
    setItemDrafts({});
    setOpenReceiptIds({});
    toast.success("All receipt details cleared.");
  };

  const handleClearReceiptItems = (receiptId) => {
    const targetReceipt = receipts.find((receipt) => receipt.id === receiptId);

    if (!targetReceipt || targetReceipt.items.length === 0) {
      toast.error("There are no items in this receipt.");
      return;
    }

    setReceipts((current) =>
      current.map((receipt) =>
        receipt.id === receiptId
          ? normalizeReceiptForState({
              ...receipt,
              items: [],
            })
          : receipt
      )
    );
  };

  const updateReceiptDraft = (receiptId, field, value) => {
    setItemDrafts((current) => ({
      ...current,
      [receiptId]: {
        ...getDraftForReceipt(current, receiptId),
        [field]: value,
      },
    }));
  };

  const updateReceipt = (receiptId, updater) => {
    setReceipts((current) =>
      current.map((receipt) =>
        receipt.id === receiptId
          ? normalizeReceiptForState(updater(receipt))
          : receipt
      )
    );
  };

  const handleReceiptFieldChange = (receiptId, field, value) => {
    updateReceipt(receiptId, (receipt) => {
      if (
        field === "gstRate" ||
        field === "serviceChargeAmount" ||
        field === "discountValue"
      ) {
        return {
          ...receipt,
          [field]: sanitizePriceInput(value),
        };
      }

      return {
        ...receipt,
        [field]: limitTextLength(value),
      };
    });
  };

  const handleSplitModeChange = (receiptId, field, value) => {
    updateReceipt(receiptId, (receipt) => ({
      ...receipt,
      [field]: value,
    }));
  };

  const handleAddItem = (receiptId) => {
    const draft = getDraftForReceipt(itemDrafts, receiptId);
    const trimmedName = limitTextLength(draft.name).trim();
    const parsedPrice = Number(sanitizePriceInput(draft.price) || 0);

    if (!trimmedName) {
      toast.error("Enter an item name first.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Enter a valid item price.");
      return;
    }

    updateReceipt(receiptId, (receipt) => ({
      ...receipt,
      items: [...receipt.items, createItem(trimmedName, parsedPrice)],
    }));

    setItemDrafts((current) => ({
      ...current,
      [receiptId]: { name: "", price: "" },
    }));
  };

  const handleRemoveItem = (receiptId, itemId) => {
    updateReceipt(receiptId, (receipt) => ({
      ...receipt,
      items: receipt.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleItemFieldChange = (receiptId, itemId, field, value) => {
    updateReceipt(receiptId, (receipt) => ({
      ...receipt,
      items: receipt.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (field === "price") {
          return {
            ...item,
            price: Number(sanitizePriceInput(value) || 0),
          };
        }

        return {
          ...item,
          [field]: limitTextLength(value),
        };
      }),
    }));
  };

  const toggleAssignment = (receiptId, itemId, memberId) => {
    updateReceipt(receiptId, (receipt) => ({
      ...receipt,
      items: receipt.items.map((item) => {
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
    }));
  };

  const handleReceiptImageButtonClick = () => {
    receiptImageInputRef.current?.click();
  };

  const handleReceiptImageChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setIsScanningReceipts(true);

    try {
      const {
        receipts: scannedReceipts,
        scannedImages,
        extractedCount,
      } = await scanReceiptImages(files);

      if (scannedReceipts.length === 0) {
        toast.error("No receipt items were detected. Try a clearer photo.");
        return;
      }

      const importedReceipts = scannedReceipts.map((receipt, index) =>
        normalizeReceiptForState(
          createReceipt({
          label: limitTextLength(
            String(receipt.label || buildReceiptLabel(receipts.length + index))
          ),
          items: (Array.isArray(receipt.items) ? receipt.items : []).map(
            (item) =>
              createItem(
                limitTextLength(String(item.name || "")),
                Number(sanitizePriceInput(String(item.price || 0)) || 0)
              )
          ),
          discountType:
            receipt.discountType === DISCOUNT_TYPES.PERCENTAGE
              ? DISCOUNT_TYPES.PERCENTAGE
              : DISCOUNT_TYPES.FIXED,
          discountValue: sanitizePriceInput(
            String(receipt.discountValue ?? receipt.discount_value ?? "")
          ),
          gstRate: sanitizePriceInput(String(receipt.gstRate || "")),
          serviceChargeAmount: sanitizePriceInput(
            String(receipt.serviceChargeAmount ?? receipt.serviceCharge ?? "")
          ),
          gstSplitMode:
            receipt.gstSplitMode === RECEIPT_SPLIT_MODES.BY_ITEMS
              ? RECEIPT_SPLIT_MODES.BY_ITEMS
              : RECEIPT_SPLIT_MODES.EQUALLY,
          })
        )
      );

      setReceipts((current) => [...current, ...importedReceipts]);
      setOpenReceiptIds((current) => ({
        ...current,
        ...Object.fromEntries(
          importedReceipts.map((receipt) => [receipt.id, true])
        ),
      }));

      toast.success(
        `Added ${extractedCount} item${
          extractedCount === 1 ? "" : "s"
        } across ${scannedImages} receipt photo${
          scannedImages === 1 ? "" : "s"
        }.`
      );
    } catch (error) {
      toast.error(
        error.message || "Unable to scan the selected receipt photos."
      );
    } finally {
      setIsScanningReceipts(false);
      event.target.value = "";
    }
  };

  const handleSaveBill = async () => {
    if (!isSignedIn) {
      toast.error("You can only save bills after logging in.");
      return;
    }

    const trimmedBillName = billName.trim();

    if (!trimmedBillName) {
      toast.error("Please name the bill before saving.");
      return;
    }

    if (members.length === 0) {
      toast.error("Add at least one person.");
      return;
    }

    if (summary.itemCount === 0) {
      toast.error("Add at least one item.");
      return;
    }

    setIsSavingBill(true);

    try {
      await createBill({
        billName: trimmedBillName,
        members,
        receipts,
        summary,
      });

      toast.success("Bill saved to your history.");
    } catch (error) {
      toast.error(error.message || "Unable to save this bill right now.");
    } finally {
      setIsSavingBill(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            Split a Bill
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Add one or more receipts, assign items, and keep discount, GST,
            and service charge tied to the right receipt.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
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
                    onChange={(event) =>
                      setBillName(limitTextLength(event.target.value))
                    }
                    maxLength={maxInputLength}
                    placeholder="e.g. Bangkok Trip"
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
                    onChange={(event) =>
                      setNewMemberName(limitTextLength(event.target.value))
                    }
                    maxLength={maxInputLength}
                    placeholder="Add a person"
                    className="sm:w-48"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleAddMember}
                  >
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
                      className="max-w-full gap-1.5 px-3 py-1.5 text-sm font-medium"
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${member.color}`}
                      />
                      <span
                        className="max-w-[100px] truncate"
                        title={member.name}
                      >
                        {truncateTextForUi(member.name)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="ml-1 shrink-0 text-muted-foreground transition-colors hover:text-destructive"
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
              <CardHeader className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-bold">
                      Receipts
                    </CardTitle>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleReceiptImageButtonClick}
                      disabled={isScanningReceipts}
                      aria-label="Upload or take receipt photos"
                      title="Upload or take receipt photos"
                    >
                      {isScanningReceipts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleAddReceipt}
                    >
                      <Plus className="h-4 w-4" />
                      Add receipt
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleClearReceipts}
                      disabled={isScanningReceipts}
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </div>

                <input
                  ref={receiptImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleReceiptImageChange}
                />

                <p className="text-xs text-muted-foreground">
                  Upload one or more receipt photos to create separate receipt
                  sections automatically. Manual item entry still works under
                  any receipt.
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {receipts.map((receipt, index) => {
                  const receiptSummary =
                    receiptSummaryById.get(receipt.id) || receipt;
                  const itemDraft = getDraftForReceipt(itemDrafts, receipt.id);

                  return (
                    <ReceiptCard
                      key={receipt.id}
                      index={index}
                      receipt={receipt}
                      receiptSummary={receiptSummary}
                      itemDraft={itemDraft}
                      members={members}
                      isOpen={openReceiptIds[receipt.id] ?? true}
                      discountTypeOptions={discountTypeOptions}
                      splitModeOptions={splitModeOptions}
                      maxInputLength={maxInputLength}
                      buildReceiptLabel={buildReceiptLabel}
                      truncateTextForUi={truncateTextForUi}
                      onOpenChange={(open) =>
                        setOpenReceiptIds((current) => ({
                          ...current,
                          [receipt.id]: open,
                        }))
                      }
                      onReceiptFieldChange={handleReceiptFieldChange}
                      onSplitModeChange={handleSplitModeChange}
                      onDraftChange={(receiptId, field, value) =>
                        updateReceiptDraft(
                          receiptId,
                          field,
                          field === "price"
                            ? sanitizePriceInput(value)
                            : limitTextLength(value)
                        )
                      }
                      onAddItem={handleAddItem}
                      onRemoveItem={handleRemoveItem}
                      onToggleAssignment={toggleAssignment}
                      onClearReceiptItems={handleClearReceiptItems}
                      onRemoveReceipt={() => handleRemoveReceipt(receipt.id)}
                      onItemFieldChange={handleItemFieldChange}
                    />
                  );
                })}

                {receipts.length === 0 && (
                  <div className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
                    No receipts added yet. Add one manually or scan receipt photos.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 border shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Bill name
                  </p>
                  <p
                    className="mt-1 truncate text-base font-semibold text-foreground"
                    title={billName.trim() || "Untitled"}
                  >
                    {truncateTextForUi(billName.trim() || "Untitled")}
                  </p>
                </div>

                {summary.members.length > 0 ? (
                  <div className="space-y-3">
                    {summary.members.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-lg border px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${member.color}`}
                            />
                            <span
                              className="truncate text-sm font-medium text-foreground"
                              title={member.name}
                            >
                              {truncateTextForUi(member.name)}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-foreground">
                            {formatCurrency(member.total)}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="block">Items</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(member.itemSubtotal)}
                            </span>
                          </div>
                          <div>
                            <span className="block">Discount</span>
                            <span className="font-semibold text-foreground">
                              -{formatCurrency(member.discountShare)}
                            </span>
                          </div>
                          <div>
                            <span className="block">GST</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(member.gstShare)}
                            </span>
                          </div>
                          <div>
                            <span className="block">Service</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(member.serviceChargeShare)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    Add people to see each participant&apos;s share.
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Receipts</span>
                    <span className="font-semibold text-foreground">
                      {summary.receiptCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Items</span>
                    <span className="font-semibold text-foreground">
                      {summary.itemCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(summary.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="font-semibold text-foreground">
                      -{formatCurrency(summary.discountAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Discounted subtotal</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(summary.discountedSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>GST</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(summary.gstTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Service charge</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(summary.serviceChargeTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Total bill</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(summary.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Unassigned amount</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(summary.unassignedTotal)}
                    </span>
                  </div>
                </div>

                <Separator />

                {isSignedIn ? (
                  <Button onClick={handleSaveBill} className="w-full gap-2" disabled={isSavingBill}>
                    <Save className="h-4 w-4" />
                    {isSavingBill ? "Saving..." : "Save bill"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPage;
