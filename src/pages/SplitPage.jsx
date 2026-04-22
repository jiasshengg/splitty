import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  saveBillToHistory,
} from "@/lib/bills";
import { scanReceiptImages } from "@/lib/receiptScanner";
import AppNavbar from "@/components/AppNavbar";

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

const createReceipt = (index, overrides = {}) => ({
  id: createId(),
  label: buildReceiptLabel(index),
  items: [],
  gst: 0,
  serviceCharge: 0,
  gstSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
  serviceChargeSplitMode: RECEIPT_SPLIT_MODES.EQUALLY,
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

const isReceiptEmpty = (receipt) =>
  receipt.items.length === 0 &&
  Number(receipt.gst || 0) === 0 &&
  Number(receipt.serviceCharge || 0) === 0;

const SplitPage = () => {
  const [billName, setBillName] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [receipts, setReceipts] = useState(() => [createReceipt(0)]);
  const [newMemberName, setNewMemberName] = useState("");
  const [itemDrafts, setItemDrafts] = useState({});
  const [isScanningReceipts, setIsScanningReceipts] = useState(false);
  const receiptImageInputRef = useRef(null);

  const summary = useMemo(
    () => calculateBillSummary({ members, receipts }),
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
    setReceipts((current) => [...current, createReceipt(current.length)]);
  };

  const handleRemoveReceipt = (receiptId) => {
    if (receipts.length === 1) {
      toast.error("Keep at least one receipt in the bill.");
      return;
    }

    setReceipts((current) =>
      current.filter((receipt) => receipt.id !== receiptId)
    );
    setItemDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[receiptId];
      return nextDrafts;
    });
  };

  const handleClearReceipts = () => {
    const hasAnyData = receipts.some(
      (receipt) =>
        receipt.items.length > 0 ||
        Number(receipt.gst || 0) > 0 ||
        Number(receipt.serviceCharge || 0) > 0
    );

    if (!hasAnyData) {
      toast.error("There are no receipt details to clear.");
      return;
    }

    setReceipts([createReceipt(0)]);
    setItemDrafts({});
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
          ? {
              ...receipt,
              items: [],
            }
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
        receipt.id === receiptId ? updater(receipt) : receipt
      )
    );
  };

  const handleReceiptFieldChange = (receiptId, field, value) => {
    updateReceipt(receiptId, (receipt) => {
      if (field === "gst" || field === "serviceCharge") {
        return {
          ...receipt,
          [field]: Number(sanitizePriceInput(value) || 0),
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

      setReceipts((current) => {
        const importedReceipts = scannedReceipts.map((receipt, index) =>
          createReceipt(current.length + index, {
            label: limitTextLength(
              String(receipt.label || buildReceiptLabel(current.length + index))
            ),
            items: (Array.isArray(receipt.items) ? receipt.items : []).map(
              (item) =>
                createItem(
                  limitTextLength(String(item.name || "")),
                  Number(sanitizePriceInput(String(item.price || 0)) || 0)
                )
            ),
            gst: Number(sanitizePriceInput(String(receipt.gst || 0)) || 0),
            serviceCharge: Number(
              sanitizePriceInput(String(receipt.serviceCharge || 0)) || 0
            ),
            gstSplitMode:
              receipt.gstSplitMode === RECEIPT_SPLIT_MODES.BY_ITEMS
                ? RECEIPT_SPLIT_MODES.BY_ITEMS
                : RECEIPT_SPLIT_MODES.EQUALLY,
            serviceChargeSplitMode:
              receipt.serviceChargeSplitMode === RECEIPT_SPLIT_MODES.BY_ITEMS
                ? RECEIPT_SPLIT_MODES.BY_ITEMS
                : RECEIPT_SPLIT_MODES.EQUALLY,
          })
        );

        if (
          current.length === 1 &&
          isReceiptEmpty(current[0]) &&
          current[0].label === buildReceiptLabel(0)
        ) {
          return importedReceipts;
        }

        return [...current, ...importedReceipts];
      });

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

    if (summary.itemCount === 0) {
      toast.error("Add at least one item.");
      return;
    }

    saveBillToHistory({
      billName: trimmedBillName,
      members,
      receipts,
    });

    toast.success("Bill saved to your history.");
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
            Add one or more receipts, assign items, and keep GST and service
            charge tied to the right receipt.
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
                    placeholder="e.g. Seoul Garden"
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
                      Clear all
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
                    <div
                      key={receipt.id}
                      className="overflow-hidden rounded-xl border"
                    >
                      <div className="space-y-4 bg-card px-4 py-4 sm:px-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div className="w-full max-w-sm space-y-2">
                            <Label htmlFor={`receipt-label-${receipt.id}`}>
                              Receipt label
                            </Label>
                            <Input
                              id={`receipt-label-${receipt.id}`}
                              value={receipt.label}
                              onChange={(event) =>
                                handleReceiptFieldChange(
                                  receipt.id,
                                  "label",
                                  event.target.value
                                )
                              }
                              maxLength={maxInputLength}
                              placeholder={buildReceiptLabel(index)}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleClearReceiptItems(receipt.id)}
                              disabled={receipt.items.length === 0}
                            >
                              Clear items
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveReceipt(receipt.id)}
                              disabled={receipts.length === 1}
                              aria-label={`Remove ${receipt.label || `receipt ${index + 1}`}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="space-y-2">
                            <Label htmlFor={`receipt-gst-${receipt.id}`}>
                              GST
                            </Label>
                            <Input
                              id={`receipt-gst-${receipt.id}`}
                              type="text"
                              inputMode="decimal"
                              value={receipt.gst}
                              onChange={(event) =>
                                handleReceiptFieldChange(
                                  receipt.id,
                                  "gst",
                                  event.target.value
                                )
                              }
                              maxLength={maxInputLength}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor={`receipt-service-charge-${receipt.id}`}
                            >
                              Service charge
                            </Label>
                            <Input
                              id={`receipt-service-charge-${receipt.id}`}
                              type="text"
                              inputMode="decimal"
                              value={receipt.serviceCharge}
                              onChange={(event) =>
                                handleReceiptFieldChange(
                                  receipt.id,
                                  "serviceCharge",
                                  event.target.value
                                )
                              }
                              maxLength={maxInputLength}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>GST split mode</Label>
                            <Select
                              value={receipt.gstSplitMode}
                              onValueChange={(value) =>
                                handleSplitModeChange(
                                  receipt.id,
                                  "gstSplitMode",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {splitModeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Service charge split mode</Label>
                            <Select
                              value={receipt.serviceChargeSplitMode}
                              onValueChange={(value) =>
                                handleSplitModeChange(
                                  receipt.id,
                                  "serviceChargeSplitMode",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {splitModeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {[
                            {
                              label: "Subtotal",
                              value: formatCurrency(receiptSummary.subtotal),
                            },
                            {
                              label: "GST",
                              value: formatCurrency(receiptSummary.gst),
                            },
                            {
                              label: "Service charge",
                              value: formatCurrency(
                                receiptSummary.serviceCharge
                              ),
                            },
                            {
                              label: "Total",
                              value: formatCurrency(receiptSummary.total),
                            },
                          ].map((stat) => (
                            <div
                              key={`${receipt.id}-${stat.label}`}
                              className="rounded-lg border bg-muted/30 px-3 py-2.5"
                            >
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                {stat.label}
                              </p>
                              <p className="mt-1 text-sm font-bold text-foreground">
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {receiptSummary.unassignedTotal > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Unassigned in this receipt:{" "}
                            <span className="font-semibold text-foreground">
                              {formatCurrency(receiptSummary.unassignedTotal)}
                            </span>
                          </p>
                        )}

                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                          <Input
                            value={itemDraft.name}
                            onChange={(event) =>
                              updateReceiptDraft(
                                receipt.id,
                                "name",
                                limitTextLength(event.target.value)
                              )
                            }
                            maxLength={maxInputLength}
                            placeholder="Add item"
                          />
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={itemDraft.price}
                            onChange={(event) =>
                              updateReceiptDraft(
                                receipt.id,
                                "price",
                                sanitizePriceInput(event.target.value)
                              )
                            }
                            maxLength={maxInputLength}
                            placeholder="Price"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => handleAddItem(receipt.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add item
                          </Button>
                        </div>
                      </div>

                      <div className="border-t bg-background">
                        <div className="hidden grid-cols-12 gap-2 border-b bg-muted/40 px-5 py-2.5 text-xs font-semibold uppercase text-muted-foreground sm:grid">
                          <div className="col-span-4">Item</div>
                          <div className="col-span-2 text-center">Price</div>
                          <div className="col-span-5">Assigned to</div>
                          <div className="col-span-1" />
                        </div>

                        {receipt.items.length === 0 ? (
                          <div className="px-5 py-6 text-sm text-muted-foreground">
                            No items yet for this receipt.
                          </div>
                        ) : (
                          receipt.items.map((item, itemIndex) => (
                            <div key={item.id}>
                              {itemIndex > 0 && <Separator />}

                              <div className="hidden grid-cols-12 items-center gap-2 px-5 py-3 transition-colors hover:bg-muted/30 sm:grid">
                                <div className="col-span-4">
                                  <Input
                                    value={item.name}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        receipt.id,
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    maxLength={maxInputLength}
                                    className="h-9"
                                  />
                                </div>

                                <div className="col-span-2 text-right">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={item.price}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        receipt.id,
                                        item.id,
                                        "price",
                                        event.target.value
                                      )
                                    }
                                    maxLength={maxInputLength}
                                    className="h-9 text-right"
                                  />
                                </div>

                                <div className="col-span-5 flex flex-wrap gap-1.5">
                                  {members.map((member) => (
                                    <label
                                      key={member.id}
                                      className="flex max-w-full cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                                    >
                                      <Checkbox
                                        checked={item.assignedTo.includes(
                                          member.id
                                        )}
                                        onCheckedChange={() =>
                                          toggleAssignment(
                                            receipt.id,
                                            item.id,
                                            member.id
                                          )
                                        }
                                        className="h-3.5 w-3.5 shrink-0"
                                      />
                                      <span
                                        className="max-w-[72px] truncate"
                                        title={member.name}
                                      >
                                        {truncateTextForUi(member.name)}
                                      </span>
                                    </label>
                                  ))}
                                </div>

                                <div className="col-span-1 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      handleRemoveItem(receipt.id, item.id)
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3 px-5 py-3 sm:hidden">
                                <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
                                  <Input
                                    value={item.name}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        receipt.id,
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Item name"
                                    maxLength={maxInputLength}
                                    className="col-span-2"
                                  />
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={item.price}
                                    onChange={(event) =>
                                      handleItemFieldChange(
                                        receipt.id,
                                        item.id,
                                        "price",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Price"
                                    maxLength={maxInputLength}
                                  />
                                  <div className="flex items-center justify-end">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        handleRemoveItem(receipt.id, item.id)
                                      }
                                      aria-label={`Remove ${item.name || "item"}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {members.map((member) => (
                                    <label
                                      key={member.id}
                                      className="flex max-w-full cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                                    >
                                      <Checkbox
                                        checked={item.assignedTo.includes(
                                          member.id
                                        )}
                                        onCheckedChange={() =>
                                          toggleAssignment(
                                            receipt.id,
                                            item.id,
                                            member.id
                                          )
                                        }
                                        className="h-3.5 w-3.5 shrink-0"
                                      />
                                      <span
                                        className="max-w-[72px] truncate"
                                        title={member.name}
                                      >
                                        {truncateTextForUi(member.name)}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
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

                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="block">Items</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(member.itemSubtotal)}
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
