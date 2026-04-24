import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/bills";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

const ReceiptCard = ({
  index,
  receipt,
  receiptSummary,
  itemDraft,
  members,
  isOpen,
  discountTypeOptions,
  splitModeOptions,
  maxInputLength,
  buildReceiptLabel,
  truncateTextForUi,
  onOpenChange,
  onReceiptFieldChange,
  onSplitModeChange,
  onDraftChange,
  onAddItem,
  onRemoveItem,
  onToggleAssignment,
  onClearReceiptItems,
  onRemoveReceipt,
  onItemFieldChange,
}) => {
  const receiptTitle = receipt.label.trim() || buildReceiptLabel(index);
  const involvedCount = receiptSummary.involvedMemberIds?.length || 0;
  const itemCount = receipt.items.length;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="overflow-hidden rounded-xl border"
    >
      <div className="bg-card">
        <div className="border-b bg-muted/20 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <p
                  className="truncate text-sm font-semibold text-foreground sm:text-base"
                  title={receiptTitle}
                >
                  {receiptTitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="text-foreground">
                  Total {formatCurrency(receiptSummary.total)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={onRemoveReceipt}
                aria-label={`Remove ${receiptTitle}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${receiptTitle}`}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3">
              <div className="w-full space-y-2">
                <Label htmlFor={`receipt-label-${receipt.id}`}>Receipt Label</Label>
                <Input
                  id={`receipt-label-${receipt.id}`}
                  value={receipt.label}
                  onChange={(event) =>
                    onReceiptFieldChange(receipt.id, "label", event.target.value)
                  }
                  maxLength={maxInputLength}
                  placeholder={receiptTitle}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <Select
                  value={receipt.discountType}
                  onValueChange={(value) =>
                    onReceiptFieldChange(receipt.id, "discountType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`receipt-discount-${receipt.id}`}>
                  {receipt.discountType === "percentage"
                    ? "Discount %"
                    : "Discount amount"}
                </Label>
                <Input
                  id={`receipt-discount-${receipt.id}`}
                  type="text"
                  inputMode="decimal"
                  value={receipt.discountValue}
                  onChange={(event) =>
                    onReceiptFieldChange(
                      receipt.id,
                      "discountValue",
                      event.target.value
                    )
                  }
                  maxLength={maxInputLength}
                  placeholder={
                    receipt.discountType === "percentage" ? "0" : "0.00"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`receipt-gst-rate-${receipt.id}`}>GST %</Label>
                <Input
                  id={`receipt-gst-rate-${receipt.id}`}
                  type="text"
                  inputMode="decimal"
                  value={receipt.gstRate}
                  onChange={(event) =>
                    onReceiptFieldChange(
                      receipt.id,
                      "gstRate",
                      event.target.value
                    )
                  }
                  maxLength={maxInputLength}
                  placeholder="9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`receipt-service-charge-${receipt.id}`}>
                  Service Charge
                </Label>
                <Input
                  id={`receipt-service-charge-${receipt.id}`}
                  type="text"
                  inputMode="decimal"
                  value={receipt.serviceChargeAmount}
                  onChange={(event) =>
                    onReceiptFieldChange(
                      receipt.id,
                      "serviceChargeAmount",
                      event.target.value
                    )
                  }
                  maxLength={maxInputLength}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>How GST will be split</Label>
                <Select
                  value={receipt.gstSplitMode}
                  onValueChange={(value) =>
                    onSplitModeChange(receipt.id, "gstSplitMode", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {splitModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <br></br>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
              <Input
                value={itemDraft.name}
                onChange={(event) =>
                  onDraftChange(
                    receipt.id,
                    "name",
                    event.target.value
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
                  onDraftChange(
                    receipt.id,
                    "price",
                    event.target.value
                  )
                }
                maxLength={maxInputLength}
                placeholder="Price"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => onAddItem(receipt.id)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            </div>
          </div>

          <div className="border-t bg-background">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Items</p>
                <Badge variant="secondary" className="text-xs">
                  {itemCount}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onClearReceiptItems(receipt.id)}
                disabled={receipt.items.length === 0}
              >
                Clear items
              </Button>
            </div>

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
              <div
                className={
                  receipt.items.length > 6
                    ? "max-h-[32rem] overflow-y-auto"
                    : ""
                }
              >
                {receipt.items.map((item, itemIndex) => (
                  <div key={item.id}>
                    {itemIndex > 0 && <Separator />}

                    <div className="hidden grid-cols-12 items-center gap-2 px-5 py-3 transition-colors hover:bg-muted/30 sm:grid">
                      <div className="col-span-4">
                        <Input
                          value={item.name}
                          onChange={(event) =>
                            onItemFieldChange(
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
                            onItemFieldChange(
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
                              checked={item.assignedTo.includes(member.id)}
                              onCheckedChange={() =>
                                onToggleAssignment(receipt.id, item.id, member.id)
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
                          onClick={() => onRemoveItem(receipt.id, item.id)}
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
                            onItemFieldChange(
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
                            onItemFieldChange(
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
                            onClick={() => onRemoveItem(receipt.id, item.id)}
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
                              checked={item.assignedTo.includes(member.id)}
                              onCheckedChange={() =>
                                onToggleAssignment(receipt.id, item.id, member.id)
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
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default ReceiptCard;
