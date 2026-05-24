import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  BadgeCheck,
  Plus,
  Users,
  Calendar,
  Layers,
  Zap,
  Building2,
  GraduationCap,
  Bus,
  Clock,
  Repeat,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const EXAMPLE_PLANS = [
  {
    id: 1,
    nameKey: "subscriptions.monthlySmartVillage",
    nameDefault: "Monthly Smart Village Pass",
    descKey: "subscriptions.monthlySmartVillageDesc",
    descDefault: "Unlimited shuttle rides for Smart Village commuters",
    duration: "monthly",
    price: 850,
    currency: "EGP",
    tripAllowance: "unlimited",
    targetGroup: "corporate",
    icon: Building2,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: 2,
    nameKey: "subscriptions.corporateEmployee",
    nameDefault: "Corporate Employee Plan",
    descKey: "subscriptions.corporateEmployeeDesc",
    descDefault: "Subsidized monthly plan for partner company employees",
    duration: "monthly",
    price: 600,
    currency: "EGP",
    tripAllowance: "60 trips/month",
    targetGroup: "corporate",
    icon: Users,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    id: 3,
    nameKey: "subscriptions.studentShuttle",
    nameDefault: "Student Shuttle Plan",
    descKey: "subscriptions.studentShuttleDesc",
    descDefault: "Discounted weekly plan for university students",
    duration: "weekly",
    price: 120,
    currency: "EGP",
    tripAllowance: "20 trips/week",
    targetGroup: "student",
    icon: GraduationCap,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: 4,
    nameKey: "subscriptions.expressCommuter",
    nameDefault: "Express Commuter Pass",
    descKey: "subscriptions.expressCommuterDesc",
    descDefault: "Daily peak-hour express routes for power commuters",
    duration: "monthly",
    price: 450,
    currency: "EGP",
    tripAllowance: "40 trips/month",
    targetGroup: "individual",
    icon: Zap,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
];

export default function Subscriptions() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [duration, setDuration] = useState("monthly");
  const [price, setPrice] = useState("");
  const [tripAllowance, setTripAllowance] = useState("unlimited");
  const [targetGroup, setTargetGroup] = useState("individual");
  const [isActive, setIsActive] = useState(true);

  const DURATION_OPTIONS = [
    { value: "weekly", label: t("subscriptions.weekly", "Weekly") },
    { value: "monthly", label: t("subscriptions.monthly", "Monthly") },
    { value: "quarterly", label: t("subscriptions.quarterly", "Quarterly") },
    { value: "annual", label: t("subscriptions.annual", "Annual") },
  ];

  const TARGET_GROUPS = [
    { value: "individual", label: t("subscriptions.individual", "Individual") },
    { value: "student", label: t("subscriptions.student", "Student") },
    { value: "corporate", label: t("subscriptions.corporate", "Corporate") },
    { value: "employee", label: t("subscriptions.employee", "Employee") },
  ];

  const resetForm = () => {
    setPlanName(""); setPlanDesc(""); setDuration("monthly");
    setPrice(""); setTripAllowance("unlimited"); setTargetGroup("individual");
    setIsActive(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BadgeCheck className="h-7 w-7 text-primary" />
            {t("subscriptions.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("subscriptions.subtitle")}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("subscriptions.createPlan", "Create Plan")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("subscriptions.createSubscriptionPlan", "Create Subscription Plan")}</DialogTitle>
              <DialogDescription>
                {t("subscriptions.createDesc", "Define the parameters of a new shuttle subscription plan.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>{t("subscriptions.planName", "Plan Name")}</Label>
                <Input placeholder={t("subscriptions.planNamePlaceholder", "e.g. Monthly Smart Village Pass")} value={planName} onChange={e => setPlanName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("subscriptions.description", "Description")}</Label>
                <Input placeholder={t("subscriptions.descPlaceholder", "Brief description of the plan")} value={planDesc} onChange={e => setPlanDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("subscriptions.duration", "Duration")}</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("subscriptions.targetGroup", "Target Group")}</Label>
                  <Select value={targetGroup} onValueChange={setTargetGroup}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARGET_GROUPS.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("subscriptions.priceEGP", "Price (EGP)")}</Label>
                  <Input type="number" min="0" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("subscriptions.tripAllowance", "Trip Allowance")}</Label>
                  <Input placeholder={t("subscriptions.unlimitedOrNum", "unlimited or e.g. 40")} value={tripAllowance} onChange={e => setTripAllowance(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active-toggle" className="cursor-pointer">{t("subscriptions.activeOnLaunch", "Active on launch")}</Label>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{t("subscriptions.backendPending", "Backend Integration Pending")}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {t("subscriptions.backendPendingDesc", "Plans created here will be staged for activation once the subscription API is connected to the passenger app.")}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={() => setIsCreateOpen(false)} disabled={!planName || !price}>
                {t("subscriptions.savePlan", "Save Plan")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { labelKey: "subscriptions.activePlans", labelDefault: "Active Plans", icon: Layers },
          { labelKey: "subscriptions.subscribers", labelDefault: "Subscribers", icon: Users },
          { labelKey: "subscriptions.monthlyRevenue", labelDefault: "Monthly Revenue", icon: Repeat },
          { labelKey: "subscriptions.renewalRate", labelDefault: "Renewal Rate", icon: CheckCircle2 },
        ].map(({ labelKey, labelDefault, icon: Icon }) => (
          <Card key={labelKey}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{t(labelKey, labelDefault)}</p>
                <Icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-bold text-muted-foreground/60">—</p>
              <Badge variant="outline" className="mt-1.5 text-[10px] font-semibold border-primary/30 text-primary/70">
                {t("settings.futureReady", "Future Ready")}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{t("subscriptions.planTemplates", "Plan Templates")}</h2>
          <Badge variant="outline" className="text-xs gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" /> {t("subscriptions.awaitingIntegration", "Awaiting passenger app integration")}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXAMPLE_PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className={`border ${plan.borderColor} relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 ${plan.color.split(" ")[0]}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${plan.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold leading-tight">{t(plan.nameKey, plan.nameDefault)}</CardTitle>
                      <CardDescription className="text-xs mt-0.5 line-clamp-2">{t(plan.descKey, plan.descDefault)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("subscriptions.price", "Price")}</p>
                      <p className="font-semibold">{plan.price} {plan.currency}<span className="text-xs font-normal text-muted-foreground">/{plan.duration === "weekly" ? t("subscriptions.wk", "wk") : t("subscriptions.mo", "mo")}</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("trips.title")}</p>
                      <p className="font-semibold capitalize">{plan.tripAllowance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("subscriptions.cycle", "Cycle")}</p>
                      <p className="font-semibold capitalize">{plan.duration}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="outline" className="text-[10px] capitalize">{plan.targetGroup}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-[11px] text-muted-foreground">{t("subscriptions.templateNotLive", "Template — not yet live")}</span>
                    <Bus className="h-3 w-3 text-muted-foreground/40 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> {t("subscriptions.roadmap", "Roadmap")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            {[
              { phase: "Phase 1", labelKey: "subscriptions.phase1", labelDefault: "Plan configuration & admin management", done: true },
              { phase: "Phase 2", labelKey: "subscriptions.phase2", labelDefault: "Passenger app subscription selection & checkout", done: false },
              { phase: "Phase 3", labelKey: "subscriptions.phase3", labelDefault: "Auto-renewal, corporate invoicing & usage analytics", done: false },
            ].map(({ phase, labelKey, labelDefault, done }) => (
              <div key={phase} className="flex items-start gap-2">
                <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${done ? "text-primary" : "text-muted-foreground/30"}`} />
                <div>
                  <p className={`font-semibold ${done ? "text-foreground" : ""}`}>{phase}</p>
                  <p>{t(labelKey, labelDefault)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
