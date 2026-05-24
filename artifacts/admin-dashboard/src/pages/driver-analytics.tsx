import React, { useState } from "react";
import { useGetAdminDriverAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  UserCircle,
  Radio,
  Bus,
  TrendingUp,
  DollarSign,
  Star,
  AlertTriangle,
  Trophy,
  Clock,
  Download,
} from "lucide-react";
import { exportCSV, exportExcel, todayStr } from "@/lib/export";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  online: "#10b981",
  busy: "#f59e0b",
  offline: "#94a3b8",
  suspended: "#ef4444",
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type TopEarner = {
  id: number;
  name: string;
  rating: string | number;
  total_earnings: number;
  trip_count: number;
};

type Earning = {
  id: number;
  driverId: number;
  tripId?: number | null;
  amount: number;
  status: string;
  date: string;
};

export default function DriverAnalytics() {
  const { data, isLoading } = useGetAdminDriverAnalytics();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { t } = useTranslation();

  const statusChartData = data
    ? [
        { label: t("liveTracking.online", "Online"), value: data.onlineDrivers, color: STATUS_COLORS.online },
        { label: t("liveTracking.onTrip", "On Trip"), value: data.busyDrivers, color: STATUS_COLORS.busy },
        { label: t("driverAnalytics.suspended", "Suspended"), value: data.suspendedDrivers, color: STATUS_COLORS.suspended },
        { label: t("drivers.offline", "Offline"), value: Math.max(0, data.totalDrivers - data.onlineDrivers - data.busyDrivers - data.suspendedDrivers), color: STATUS_COLORS.offline },
      ]
    : [];

  const topEarners: TopEarner[] = (data?.topEarners ?? []) as TopEarner[];
  const allEarnings: Earning[] = (data?.recentEarnings ?? []) as Earning[];
  const recentEarnings: Earning[] = allEarnings.filter(e => {
    const d = new Date(e.date);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate + "T23:59:59")) return false;
    return true;
  });

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    sub,
  }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    sub?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            {t("driverAnalytics.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("driverAnalytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{t("driverAnalytics.earningsRange", "Earnings range")}:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm w-[140px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span className="text-xs text-muted-foreground">{t("bookings.to", "to")}</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm w-[140px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(""); setToDate(""); }}>{t("common.clear", "Clear")}</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t("drivers.totalDrivers", "Total Drivers")}
          value={data?.totalDrivers ?? "—"}
          icon={UserCircle}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label={t("driverAnalytics.currentlyOnline", "Currently Online")}
          value={data ? data.onlineDrivers + data.busyDrivers : "—"}
          icon={Radio}
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          sub={`${data?.busyDrivers ?? 0} ${t("driverAnalytics.onActiveTrips", "on active trips")}`}
        />
        <StatCard
          label={t("driverAnalytics.totalEarningsPaid", "Total Earnings Paid")}
          value={data ? `$${fmt(data.totalEarningsPaid)}` : "—"}
          icon={DollarSign}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        />
        <StatCard
          label={t("driverAnalytics.tripsCompleted", "Trips Completed")}
          value={data?.totalTripsCompleted ?? "—"}
          icon={TrendingUp}
          color="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-4 w-4" /> {t("driverAnalytics.fleetStatusDistribution", "Fleet Status Distribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="value" name={t("drivers.title")} radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {!isLoading && data && (
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { label: t("liveTracking.online", "Online"), count: data.onlineDrivers, color: "bg-emerald-500" },
                  { label: t("driverAnalytics.busy", "Busy"), count: data.busyDrivers, color: "bg-amber-500" },
                  { label: t("driverAnalytics.suspended", "Suspended"), count: data.suspendedDrivers, color: "bg-red-500" },
                  { label: t("drivers.offline", "Offline"), count: Math.max(0, data.totalDrivers - data.onlineDrivers - data.busyDrivers - data.suspendedDrivers), color: "bg-slate-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 text-xs">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">({s.count})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!isLoading && data && data.suspendedDrivers > 0 && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> {t("driverAnalytics.suspendedDrivers", "Suspended Drivers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {data.suspendedDrivers} {t("driverAnalytics.suspendedDesc", "driver(s) are currently suspended and cannot accept trips. Review their profiles in the Drivers section to reinstate.")}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && data && data.totalTripsCompleted > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> {t("driverAnalytics.earningsEfficiency", "Earnings Efficiency")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("driverAnalytics.avgEarningsPerTrip", "Avg earnings per trip")}</span>
                <span className="font-semibold">
                  ${fmt(data.totalEarningsPaid / data.totalTripsCompleted)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("driverAnalytics.tripsCompleted", "Total trips completed")}</span>
                <span className="font-semibold">{data.totalTripsCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("driverAnalytics.totalEarningsDistributed", "Total earnings distributed")}</span>
                <span className="font-semibold text-emerald-600">${fmt(data.totalEarningsPaid)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> {t("driverAnalytics.topEarningDrivers", "Top Earning Drivers")}
            </CardTitle>
            {!isLoading && topEarners.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />{t("bookings.export", "Export")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportCSV(topEarners.map((d, i) => ({
                    "Rank": i + 1,
                    "Driver ID": d.id,
                    "Name": d.name,
                    "Rating": parseFloat(String(d.rating)).toFixed(1),
                    "Trips Completed": d.trip_count,
                    "Total Earnings": Number(d.total_earnings).toFixed(2),
                  })), `top-earners-${todayStr()}.csv`)}>
                    {t("bookings.exportCSV", "Export CSV")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportExcel(topEarners.map((d, i) => ({
                    "Rank": i + 1,
                    "Driver ID": d.id,
                    "Name": d.name,
                    "Rating": parseFloat(String(d.rating)).toFixed(1),
                    "Trips Completed": d.trip_count,
                    "Total Earnings": Number(d.total_earnings).toFixed(2),
                  })), `top-earners-${todayStr()}.xlsx`, "Top Earners")}>
                    {t("bookings.exportExcel", "Export Excel (.xlsx)")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : topEarners.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">{t("driverAnalytics.noEarnings", "No earnings recorded yet.")}</p>
          ) : (
            <div className="space-y-3">
              {topEarners.map((d, i) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg w-7 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{parseFloat(String(d.rating)).toFixed(1)}</span>
                        <span className="ml-2">{d.trip_count} {t("driverAnalytics.trips", "trips")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">${fmt(d.total_earnings)}</p>
                    <p className="text-xs text-muted-foreground">{t("driverAnalytics.totalEarned", "total earned")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> {t("driverAnalytics.recentEarnings", "Recent Earnings")}
            </CardTitle>
            {!isLoading && recentEarnings.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />{t("bookings.export", "Export")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportCSV(recentEarnings.map((e) => ({
                    "Earning ID": e.id,
                    "Driver ID": e.driverId,
                    "Trip ID": e.tripId ?? "",
                    "Amount": Number(e.amount).toFixed(2),
                    "Status": e.status,
                    "Date": new Date(e.date).toLocaleDateString(),
                  })), `driver-earnings-${todayStr()}.csv`)}>
                    {t("bookings.exportCSV", "Export CSV")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportExcel(recentEarnings.map((e) => ({
                    "Earning ID": e.id,
                    "Driver ID": e.driverId,
                    "Trip ID": e.tripId ?? "",
                    "Amount": Number(e.amount).toFixed(2),
                    "Status": e.status,
                    "Date": new Date(e.date).toLocaleDateString(),
                  })), `driver-earnings-${todayStr()}.xlsx`, "Earnings")}>
                    {t("bookings.exportExcel", "Export Excel (.xlsx)")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : recentEarnings.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">{t("driverAnalytics.noEarnings", "No earnings recorded yet.")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">{t("driverAnalytics.driverId", "Driver ID")}</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">{t("trips.title")}</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">{t("wallet.amount")}</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">{t("common.status")}</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEarnings.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 text-muted-foreground">#{e.driverId}</td>
                      <td className="py-2.5 text-muted-foreground">{e.tripId ? `#${e.tripId}` : "—"}</td>
                      <td className="py-2.5 font-semibold text-emerald-600">${fmt(e.amount)}</td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            e.status === "paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
                              : e.status === "confirmed"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                          }
                        >
                          {e.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
