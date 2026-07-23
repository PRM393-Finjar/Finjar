import { useMemo, useState } from "react";
import { CheckCircle2, Landmark, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useFinancialAccounts, useSePayConnectionStatus } from "../hooks/useFinancialAccounts";
import { useConnectSePayFinancialAccount } from "../hooks/useFinancialAccountMutations";
import type { ConnectSePayFinancialAccountPayload } from "../types";

const BANK_OPTIONS: Array<{
  code: ConnectSePayFinancialAccountPayload["bankCode"];
  name: string;
}> = [
  { code: "VCB", name: "Vietcombank" },
  { code: "MB", name: "MB Bank" },
  { code: "TCB", name: "Techcombank" },
];

function formatCurrency(amount: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

export function BankAccountsSettingsPage() {
  const { data: accounts = [], isLoading } = useFinancialAccounts();
  const { data: status } = useSePayConnectionStatus();
  const { mutateAsync: connectSePay, isPending } =
    useConnectSePayFinancialAccount();

  const [bankCode, setBankCode] =
    useState<ConnectSePayFinancialAccountPayload["bankCode"]>("VCB");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const sePayAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.connectionMode === "LinkedApi" &&
          account.providerName?.toLowerCase() === "sepay",
      ),
    [accounts],
  );

  const handleConnect = async () => {
    try {
      await connectSePay({
        providerCode: "SEPAY",
        bankCode,
        accountNumber,
        accountName,
      });
      setAccountNumber("");
      setAccountName("");
      toast.success("SePay account connected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Cannot connect SePay",
      );
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase text-neutral-500">
            Settings
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Bank Accounts
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm font-bold shadow-[3px_3px_0_0_#0a0a0a]">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          {status?.connected ? "Connected" : "Not connected"}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {isLoading ? (
            <Card className="brutal-card border-0 shadow-none">
              <CardContent className="p-6 text-sm text-neutral-600">
                Loading bank accounts...
              </CardContent>
            </Card>
          ) : sePayAccounts.length === 0 ? (
            <Card className="brutal-card border-0 shadow-none">
              <CardContent className="p-6 text-sm text-neutral-600">
                No SePay bank account connected.
              </CardContent>
            </Card>
          ) : (
            sePayAccounts.map((account) => (
              <Card
                key={account.id}
                className="brutal-card border-0 shadow-none"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-[#0a0a0a] bg-[#a8e087]">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <p className="font-mono text-sm text-neutral-600">
                          {account.maskedAccountNumber ?? "-"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md border-2 border-[#0a0a0a] bg-[#a8e087]/30 px-3 py-1 text-xs font-extrabold">
                      Connected
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-bold text-neutral-500">Provider</dt>
                      <dd className="mt-1 font-semibold">SePay</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-neutral-500">Status</dt>
                      <dd className="mt-1 font-semibold">
                        {account.syncStatus || status?.syncStatus || "Active"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-neutral-500">Balance</dt>
                      <dd className="mt-1 text-xl font-extrabold">
                        {formatCurrency(account.currentBalance, account.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-neutral-500">Last sync</dt>
                      <dd className="mt-1 font-semibold">
                        {formatDate(account.lastSync ?? status?.lastSync ?? null)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="brutal-card border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5" />
              Connect SePay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sepay-bank">Bank</Label>
              <Select
                value={bankCode}
                onValueChange={(value) =>
                  setBankCode(
                    value as ConnectSePayFinancialAccountPayload["bankCode"],
                  )
                }
              >
                <SelectTrigger id="sepay-bank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANK_OPTIONS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sepay-account-number">Account Number</Label>
              <Input
                id="sepay-account-number"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sepay-account-name">Account Name</Label>
              <Input
                id="sepay-account-name"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
              />
            </div>

            <Button
              type="button"
              className="brutal-btn-primary w-full cursor-pointer"
              disabled={isPending || !accountNumber.trim() || !accountName.trim()}
              onClick={() => void handleConnect()}
            >
              {isPending ? "Connecting..." : "Connect SePay"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
