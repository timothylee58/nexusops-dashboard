import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { postPayment } from "@/lib/api.ts";
import { isOfflineFeed } from "@/lib/env.ts";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { formatAmount } from "@/lib/format.ts";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  currency: z.enum(["MYR", "SGD", "USD", "HKD", "JPY"]),
  corridor_id: z.enum(["MY-SG", "SG-HK", "HK-JP", "MY-JP", "SG-JP"]),
  category: z.enum(["Payroll", "Vendor", "Treasury", "FX hedge", "Remittance"]),
});

type Values = z.infer<typeof schema>;

const defaults: Values = {
  amount: 5000,
  currency: "SGD",
  corridor_id: "MY-SG",
  category: "Payroll",
};

export function SendPaymentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  async function confirm() {
    const values = form.getValues();
    if (isOfflineFeed) {
      toast.message("Offline feed — mocked submission only", {
        description: `Would send ${values.amount} ${values.currency}`,
      });
      onClose();
      setStep(0);
      form.reset(defaults);
      return;
    }
    const key = crypto.randomUUID();
    setSubmitting(true);
    toast.loading("Submitting payout…");
    try {
      await postPayment(
        {
          amount: values.amount,
          currency: values.currency,
          corridor_id: values.corridor_id,
          category: values.category,
        },
        key
      );
      toast.dismiss();
      toast.success("Payment queued", { description: "Idempotent key accepted · Mock gateway" });
      await qc.invalidateQueries({ queryKey: ["transactions"], exact: false });
      await qc.invalidateQueries({ queryKey: ["ledger"] });
      onClose();
      setStep(0);
      form.reset(defaults);
    } catch (e) {
      toast.dismiss();
      toast.error((e as Error).message ?? "Submission failed");
      await qc.invalidateQueries({ queryKey: ["transactions"], exact: false });
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (step === 0)
      form
        .trigger(["amount", "currency", "corridor_id", "category"])
        .then((ok) => ok && setStep(1))
        .catch(() => {});
    else if (step === 1) setStep(2);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  const vals = form.watch();

  const feeMock = +(vals.amount * 0.0008).toFixed(2);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setStep(0);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send cross-border payment</DialogTitle>
        </DialogHeader>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex gap-2">
          {[0, 1, 2].map((s) => (
            <span
              key={s}
              className={s === step ? "text-primary font-bold" : s < step ? "text-emerald-500" : "text-muted-foreground"}
            >
              {s === 0 ? "Amount" : s === 1 ? "Review" : "Confirm"}
            </span>
          ))}
        </div>

        <Form {...form}>
          {step === 0 && (
            <div className="space-y-4 py-1">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Currency">
                          <SelectValue placeholder="Pick currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MYR">MYR</SelectItem>
                        <SelectItem value="SGD">SGD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="HKD">HKD</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="corridor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corridor</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Corridor">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MY-SG">MY ↔ SG</SelectItem>
                        <SelectItem value="SG-HK">SG ↔ HK</SelectItem>
                        <SelectItem value="HK-JP">HK ↔ JP</SelectItem>
                        <SelectItem value="MY-JP">MY ↔ JP</SelectItem>
                        <SelectItem value="SG-JP">SG ↔ JP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spend category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Payroll">Payroll</SelectItem>
                        <SelectItem value="Vendor">Vendor</SelectItem>
                        <SelectItem value="Treasury">Treasury</SelectItem>
                        <SelectItem value="FX hedge">FX hedge</SelectItem>
                        <SelectItem value="Remittance">Remittance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 text-sm py-2">
              <p className="text-muted-foreground text-xs font-mono">Review payout details · Mock FX ref only</p>
              <Separator />
              <Row k="Corridor">{vals.corridor_id}</Row>
              <Row k="Category">{vals.category}</Row>
              <Row k="Debit">
                <span className="font-semibold text-primary">{formatAmount(vals.amount)}</span>
                &nbsp;<span className="text-muted-foreground">{vals.currency}</span>
              </Row>
              <Row k="Mock rail fee">{formatAmount(feeMock)}</Row>
              <Row k="Idempotency">{submitting ? "…" : "UUID generated on confirm"}</Row>
            </div>
          )}

          {step === 2 && (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm font-medium">
                Submit with <span className="font-mono text-primary">{formatAmount(vals.amount)}</span>{" "}
                {vals.currency}?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed px-6">
                The mock gateway honours <code className="text-[10px] bg-muted px-1 rounded">Idempotency-Key</code>.
                Repeated keys with the same body replay the recorded response · P95 &lt; 300ms target.
              </p>
            </div>
          )}
        </Form>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full justify-between gap-2">
            {step > 0 ? (
              <Button variant="outline" type="button" onClick={back} disabled={submitting}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="button" disabled={submitting} onClick={confirm}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Confirm payout"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-b-0 text-xs font-mono">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  );
}
