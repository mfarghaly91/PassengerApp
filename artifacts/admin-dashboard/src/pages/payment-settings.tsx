import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Settings2,
  Zap,
  ArrowRight,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PaymentSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [cashEnabled, setCashEnabled] = useState(true);
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [minTopup, setMinTopup] = useState("20");
  const [maxTopup, setMaxTopup] = useState("5000");
  const [maxBalance, setMaxBalance] = useState("10000");

  const handleSaveWallet = () => {
    toast({ title: t("settings.paymentSettings", "Wallet settings saved") });
  };

  const paymentMethods = [
    {
      icon: Banknote,
      title: t("settings.cashOnBoard", "Cash on Board"),
      description: t("settings.cashDesc", "Passengers pay the driver directly at the time of the trip."),
      status: "active" as const,
      enabled: cashEnabled,
      onToggle: setCashEnabled,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      note: t("settings.cashNote", "Driver reconciliation handled manually at end of shift."),
    },
    {
      icon: Wallet,
      title: t("settings.veegoWallet", "VeeGo Wallet"),
      description: t("settings.walletDesc", "In-app wallet balance. Passengers top up and pay seamlessly."),
      status: "active" as const,
      enabled: walletEnabled,
      onToggle: setWalletEnabled,
      color: "bg-primary/10 text-primary",
      note: t("settings.walletNote", "Refunds issued automatically on cancellation."),
    },
    {
      icon: CreditCard,
      title: t("settings.onlineCard", "Online Card (Debit / Credit)"),
      description: t("settings.cardDesc", "Direct card payment via secure payment gateway."),
      status: "future_ready" as const,
      enabled: false,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      note: t("settings.cardNote", "Architecture ready. Awaiting Paymob / Stripe gateway integration."),
    },
    {
      icon: Zap,
      title: t("settings.paymobIntegration", "Paymob Integration"),
      description: t("settings.paymobDesc", "Egypt-native payment gateway supporting Meeza, Fawry, and Valupay."),
      status: "coming_soon" as const,
      enabled: false,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      note: t("settings.paymobNote", "Scheduled for Phase 3 rollout."),
    },
  ];

  const statusBadge = (status: string) => {
    if (status === "active") return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 text-[10px] font-semibold">{t("common.active")}</Badge>
    );
    if (status === "future_ready") return (
      <Badge variant="outline" className="text-primary/70 border-primary/30 text-[10px] font-semibold">{t("settings.futureReady", "Future Ready")}</Badge>
    );
    return (
      <Badge variant="outline" className="text-muted-foreground text-[10px] font-semibold">{t("settings.comingSoon", "Coming Soon")}</Badge>
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          {t("settings.paymentSettings", "Payment Settings")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("settings.paymentDesc", "Configure accepted payment methods and wallet parameters.")}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">{t("settings.paymentMethods", "Payment Methods")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <Card key={method.title} className={method.status !== "active" ? "opacity-80" : ""}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${method.color}`}>
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{method.title}</p>
                      {statusBadge(method.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                    {method.note && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" />
                        {method.note}
                      </p>
                    )}
                  </div>
                  {method.status === "active" && method.onToggle && (
                    <Switch checked={method.enabled} onCheckedChange={method.onToggle} />
                  )}
                  {method.status !== "active" && (
                    <Clock className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">{t("settings.walletParameters", "Wallet Parameters")}</h2>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("settings.topupBalanceLimits", "Top-up & Balance Limits")}</CardTitle>
            <CardDescription className="text-xs">
              {t("settings.topupDesc", "Control wallet top-up minimums, maximums, and maximum held balance.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("settings.minTopup", "Min Top-up (EGP)")}</Label>
                <Input type="number" min="1" value={minTopup} onChange={e => setMinTopup(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("settings.maxTopup", "Max Top-up (EGP)")}</Label>
                <Input type="number" min="1" value={maxTopup} onChange={e => setMaxTopup(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("settings.maxWalletBalance", "Max Wallet Balance (EGP)")}</Label>
                <Input type="number" min="1" value={maxBalance} onChange={e => setMaxBalance(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveWallet}>{t("settings.saveWalletSettings", "Save Wallet Settings")}</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">{t("settings.refundPolicy", "Refund Policy")}</h2>
        </div>
        <Card>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {[
                { labelKey: "settings.autoRefund", labelDefault: "Automatic refund on trip cancellation", valueKey: "settings.walletCreditInstant", valueDefault: "Wallet credit — instant", active: true },
                { labelKey: "settings.adminManualRefund", labelDefault: "Admin manual refund", valueKey: "settings.viaLedger", valueDefault: "Via Ledger page", active: true },
                { labelKey: "settings.cardRefundFuture", labelDefault: "Card refund (future)", valueKey: "settings.businessDays", valueDefault: "3–7 business days", active: false },
              ].map(({ labelKey, labelDefault, valueKey, valueDefault, active }) => (
                <div key={labelKey} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground/30"}`} />
                    <span className="text-sm">{t(labelKey, labelDefault)}</span>
                    {!active && <Badge variant="outline" className="text-[10px] text-muted-foreground">{t("settings.futureReady", "Future Ready")}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{t(valueKey, valueDefault)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t("settings.paymentArchStatus", "Payment Architecture Status")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("settings.paymentArchDesc", "The platform is architected for multi-method payments. Cash and Wallet are production-ready. Card processing and gateway integrations can be activated without changes to the booking or trip lifecycle.")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
