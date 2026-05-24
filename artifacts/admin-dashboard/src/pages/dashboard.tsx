import React, { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Bus, Users, Map as MapIcon, Route, Navigation, AlertTriangle,
  CheckCircle2, Clock, FileText, Lightbulb, TrendingUp, Activity,
  Shield, Wifi, RefreshCw, ArrowRight, UserCheck, MessageSquare,
  BarChart2, Layers, Circle,
} from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";

interface DashboardSummary {
  routes: { total: number; active: number; inactive: number };
  stations: { total: number };
  trips: { total: number; active: number; scheduled: number; boarding: number; upcoming: number; cancelled: number };
  fleet: { totalBuses: number; activeBuses: number; totalDrivers: number; onlineDrivers: number };
  support: { openTickets: number; pendingTickets: number; totalMessages: number };
  verifications: { pending: number };
  suggestions: { pending: number };
  users: { total: number; passengers: number; drivers: number };
  generatedAt: string;
}

interface TripItem {
  id: number;
  departureTime: string;
  arrivalTime: string;
  status: string;
  availableSeats: number;
  totalSeats: number;
  routeName: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  driverName: string | null;
}

interface DashboardActivity {
  recentTickets: Array<{ id: number; subject: string; status: string; priority: string; type: string; createdAt: string }>;
  pendingDocuments: Array<{ id: number; driverId: number; type: string; verificationStatus: string; uploadedAt: string; driverName: string | null }>;
  recentSuggestions: Array<{ id: number; title: string; type: string; status: string; startLocation: string | null; endLocation: string | null; createdAt: string }>;
  upcomingDepartures: TripItem[];
  activeTrips: TripItem[];
  recentBookings: Array<{ id: number; status: string; totalPrice: string; seatCount: number; createdAt: string; userName: string | null; userEmail: string | null }>;
}

interface DashboardAnalytics {
  tripsPerDay: Array<{ date: string; trips: number; completed: number; cancelled: number }>;
  routePopularity: Array<{ id: number; name: string; fromLocation: string; toLocation: string; tripCount: number; activeCount: number }>;
  tripStatusBreakdown: Array<{ status: string; count: number }>;
  driverActivity: Array<{ id: number; name: string; tripCount: number; rating: number; isOnline: boolean; status: string }>;
  busiestStations: Array<{ name: string; routeName: string; tripCount: number }>;
  bookingsPerDay: Array<{ date: string; bookings: number; revenue: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  scheduled: "#3b82f6",
  boarding: "#f59e0b",
  completed: "#6b7280",
  cancelled: "#ef4444",
  waiting_driver: "#8b5cf6",
  driver_assigned: "#06b6d4",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "open" || status === "active" || status === "online") return "default";
  if (status === "completed" || status === "approved" || status === "resolved") return "secondary";
  if (status === "cancelled" || status === "rejected" || status === "closed") return "destructive";
  return "outline";
}

function priorityColor(priority: string) {
  if (priority === "high") return "text-red-500";
  if (priority === "medium") return "text-amber-500";
  return "text-muted-foreground";
}

function SummaryCard({
  title, value, sub, icon: Icon, accent, loading,
}: {
  title: string; value: number | string; sub?: string; icon: React.ElementType; accent?: string; loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${accent ?? "bg-muted"}`}>
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {sub && !loading && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function AlertBanner({ summary }: { summary: DashboardSummary }) {
  const alerts: Array<{ msg: string; level: "warn" | "error" | "info" }> = [];

  if (summary.verifications.pending > 0)
    alerts.push({ msg: `${summary.verifications.pending} driver document(s) awaiting verification`, level: "warn" });
  if (summary.support.openTickets > 0)
    alerts.push({ msg: `${summary.support.openTickets} open support ticket(s) need attention`, level: "warn" });
  if (summary.suggestions.pending > 0)
    alerts.push({ msg: `${summary.suggestions.pending} route suggestion(s) pending review`, level: "info" });
  if (summary.routes.inactive > 0)
    alerts.push({ msg: `${summary.routes.inactive} route(s) are currently inactive`, level: "info" });
  if (summary.fleet.onlineDrivers === 0 && summary.fleet.totalDrivers > 0)
    alerts.push({ msg: "No drivers are currently online", level: "error" });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm border ${
            a.level === "error"
              ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
              : a.level === "warn"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

function TripRow({ trip }: { trip: TripItem }) {
  const occupancy = Math.round(((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100);
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-0 gap-4">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{trip.routeName ?? `Trip #${trip.id}`}</div>
        <div className="text-xs text-muted-foreground truncate">
          {trip.fromLocation} → {trip.toLocation}
        </div>
        {trip.driverName && (
          <div className="text-xs text-muted-foreground mt-0.5">Driver: {trip.driverName}</div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium">{format(parseISO(trip.departureTime), "HH:mm")}</div>
        <div className="text-xs text-muted-foreground">{format(parseISO(trip.departureTime), "MMM d")}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{occupancy}% full</div>
      </div>
      <Badge variant={statusVariant(trip.status)} className="shrink-0 self-center capitalize text-xs">
        {trip.status.replace("_", " ")}
      </Badge>
    </div>
  );
}

export default function Dashboard() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const canSeeOperations = isSuperAdmin || hasPermission("operations");
  const canSeeSupport = isSuperAdmin || hasPermission("support");
  const canSeeFinance = isSuperAdmin || hasPermission("finance");

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => adminFetch<DashboardSummary>("/dashboard/summary"),
    refetchInterval: 30_000,
  });

  const { data: activity, isLoading: activityLoading } = useQuery<DashboardActivity>({
    queryKey: ["dashboard-activity"],
    queryFn: () => adminFetch<DashboardActivity>("/dashboard/activity"),
    refetchInterval: 30_000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["dashboard-analytics"],
    queryFn: () => adminFetch<DashboardAnalytics>("/dashboard/analytics"),
    refetchInterval: 60_000,
  });

  const handleRefresh = useCallback(() => {
    refetchSummary();
  }, [refetchSummary]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("dashboard.subtitle")}
            {summary?.generatedAt && (
              <span className="ml-2 text-xs">
                · {t("dashboard.lastSynced")} {formatDistanceToNow(new Date(summary.generatedAt), { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <Wifi className="h-3 w-3" />
            <span>{t("dashboard.neonConnected")}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {summary && !summaryLoading && <AlertBanner summary={summary} />}

      {/* Primary KPI Cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{t("dashboard.networkOverview")}</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard
            title={t("dashboard.totalRoutes")}
            value={summary?.routes.total ?? 0}
            sub={`${summary?.routes.active ?? 0} ${t("dashboard.activeRoutes")}`}
            icon={Route}
            accent="bg-blue-500/10"
            loading={summaryLoading}
          />
          <SummaryCard
            title={t("dashboard.stations")}
            value={summary?.stations.total ?? 0}
            sub={t("dashboard.networkNodes")}
            icon={MapIcon}
            accent="bg-indigo-500/10"
            loading={summaryLoading}
          />
          <SummaryCard
            title={t("dashboard.totalTrips")}
            value={summary?.trips.total ?? 0}
            sub={`${summary?.trips.active ?? 0} ${t("dashboard.activeNow")}`}
            icon={Navigation}
            accent="bg-green-500/10"
            loading={summaryLoading}
          />
          <SummaryCard
            title={t("dashboard.fleet")}
            value={summary?.fleet.totalBuses ?? 0}
            sub={`${summary?.fleet.activeBuses ?? 0} ${t("dashboard.activeBuses")}`}
            icon={Bus}
            accent="bg-amber-500/10"
            loading={summaryLoading}
          />
          <SummaryCard
            title={t("dashboard.drivers")}
            value={summary?.fleet.totalDrivers ?? 0}
            sub={`${summary?.fleet.onlineDrivers ?? 0} ${t("dashboard.online")}`}
            icon={UserCheck}
            accent="bg-violet-500/10"
            loading={summaryLoading}
          />
          <SummaryCard
            title={t("dashboard.totalUsers")}
            value={summary?.users.total ?? 0}
            sub={`${summary?.users.passengers ?? 0} ${t("dashboard.passengers")}`}
            icon={Users}
            accent="bg-rose-500/10"
            loading={summaryLoading}
          />
        </div>
      </div>

      {/* Secondary Status Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> {t("dashboard.tripStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summaryLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("common.active")}</span>
                  <span className="font-semibold text-green-600">{summary?.trips.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.boarding")}</span>
                  <span className="font-semibold text-amber-600">{summary?.trips.boarding}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.scheduled")}</span>
                  <span className="font-semibold text-blue-600">{summary?.trips.scheduled}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.upcoming")}</span>
                  <span className="font-semibold">{summary?.trips.upcoming}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> {t("dashboard.pendingActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summaryLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.docVerifications")}</span>
                  <span className={`font-semibold ${(summary?.verifications.pending ?? 0) > 0 ? "text-amber-600" : ""}`}>
                    {summary?.verifications.pending}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.openTickets")}</span>
                  <span className={`font-semibold ${(summary?.support.openTickets ?? 0) > 0 ? "text-red-500" : ""}`}>
                    {summary?.support.openTickets}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("nav.suggestions")}</span>
                  <span className={`font-semibold ${(summary?.suggestions.pending ?? 0) > 0 ? "text-blue-600" : ""}`}>
                    {summary?.suggestions.pending}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.inactiveRoutes")}</span>
                  <span className={`font-semibold ${(summary?.routes.inactive ?? 0) > 0 ? "text-amber-600" : ""}`}>
                    {summary?.routes.inactive}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Map Preview Widget */}
        <Card className="col-span-2 relative overflow-hidden cursor-pointer group" onClick={() => setLocation("/live-tracking")}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90 z-10" />
          <div className="absolute inset-0 opacity-20 z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 50% 80%, #fff 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <CardContent className="relative z-20 flex flex-col justify-between h-full p-5 min-h-[130px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white font-bold text-base">{t("dashboard.liveNetworkMap")}</div>
                <div className="text-blue-100 text-xs mt-1">
                  {summary?.routes.active ?? "—"} {t("dashboard.activeRoutes")} · {summary?.stations.total ?? "—"} {t("dashboard.stations").toLowerCase()}
                </div>
              </div>
              <MapIcon className="h-8 w-8 text-white/70" />
            </div>
            <div className="flex items-center gap-1.5 text-white/90 text-sm group-hover:text-white transition-colors mt-3">
              <span>{t("common.openView")}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Tables */}
      {canSeeOperations && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  {t("dashboard.upcomingDepartures")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/trips")} className="text-xs gap-1">
                  {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : activity?.upcomingDepartures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">{t("dashboard.noUpcomingDepartures")}</p>
                </div>
              ) : (
                activity?.upcomingDepartures.map((trip) => (
                  <TripRow key={trip.id} trip={trip} />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Circle className="h-4 w-4 text-green-500 fill-green-500" />
                  {t("dashboard.activeTrips")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/live-tracking")} className="text-xs gap-1">
                  {t("common.liveView")} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : activity?.activeTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bus className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">{t("dashboard.noActiveTrips")}</p>
                </div>
              ) : (
                activity?.activeTrips.map((trip) => (
                  <TripRow key={trip.id} trip={trip} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Trips per day */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-500" />
              {t("dashboard.tripsPerDay")}
            </CardTitle>
            <CardDescription>{t("dashboard.tripsChart")}</CardDescription>
          </CardHeader>
          <CardContent className="pl-1">
            {analyticsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.tripsPerDay ?? []} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => {
                        try { return format(parseISO(v), "MMM d"); } catch { return v; }
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      labelFormatter={(v) => { try { return format(parseISO(v as string), "MMM d, yyyy"); } catch { return v; } }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="trips" name="Total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trip Status Pie */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500" />
              {t("dashboard.statusBreakdown")}
            </CardTitle>
            <CardDescription>{t("dashboard.allTimeDistribution")}</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.tripStatusBreakdown ?? []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {(analytics?.tripStatusBreakdown ?? []).map((entry, index) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number, name) => [v, String(name).replace(/_/g, " ")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Route Popularity & Busiest Stations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t("dashboard.routePopularity")}
            </CardTitle>
            <CardDescription>{t("dashboard.byTripVolume")}</CardDescription>
          </CardHeader>
          <CardContent className="pl-1">
            {analyticsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.routePopularity ?? []}
                    layout="vertical"
                    barSize={10}
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="tripCount" name="Trips" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="activeCount" name="Active" fill="#22c55e" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-indigo-500" />
              {t("dashboard.busiestStations")}
            </CardTitle>
            <CardDescription>{t("dashboard.associatedTripVolume")}</CardDescription>
          </CardHeader>
          <CardContent className="pl-1">
            {analyticsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.busiestStations ?? []}
                    layout="vertical"
                    barSize={10}
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="tripCount" name="Trips" fill="#6366f1" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-amber-500" />
            {t("dashboard.driverActivity")}
          </CardTitle>
          <CardDescription>{t("dashboard.tripCountPerDriver")}</CardDescription>
        </CardHeader>
        <CardContent className="pl-1">
          {analyticsLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.driverActivity ?? []} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.split(" ")[0]}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v, name) => [v, name === "tripCount" ? "Trips" : name]}
                  />
                  <Bar
                    dataKey="tripCount"
                    name="Trips"
                    radius={[4, 4, 0, 0]}
                    fill="#f59e0b"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row: Support, Verifications, Suggestions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Support Tickets */}
        {canSeeSupport && (
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-red-500" />
                  {t("dashboard.supportTickets")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/support")} className="text-xs gap-1">
                  {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 overflow-auto">
              {activityLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : activity?.recentTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-7 w-7 mb-2 opacity-40" />
                  <p className="text-sm">{t("dashboard.noOpenTickets")}</p>
                </div>
              ) : (
                activity?.recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{ticket.subject}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusVariant(ticket.status)} className="text-[10px] h-4 px-1.5">{ticket.status}</Badge>
                        <span className={`text-[10px] font-medium ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                        <span className="text-[10px] text-muted-foreground">{ticket.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Driver Verifications */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                {t("dashboard.pendingVerifications")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/driver-verification")} className="text-xs gap-1">
                {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-auto">
            {activityLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : activity?.pendingDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-7 w-7 mb-2 opacity-40" />
                <p className="text-sm">{t("dashboard.noPendingVerifications")}</p>
              </div>
            ) : (
              activity?.pendingDocuments.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{doc.driverName ?? `Driver #${doc.driverId}`}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{doc.type.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Route Suggestions */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                {t("dashboard.routeSuggestions")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/suggestions")} className="text-xs gap-1">
                {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-auto">
            {activityLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : activity?.recentSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-7 w-7 mb-2 opacity-40" />
                <p className="text-sm">{t("dashboard.noNewSuggestions")}</p>
              </div>
            ) : (
              activity?.recentSuggestions.map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusVariant(s.status)} className="text-[10px] h-4 px-1.5">{s.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{s.type.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
