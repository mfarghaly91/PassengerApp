import React, { useState, useCallback, useEffect } from "react";
import { adminFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Car,
  Bike,
  BarChart3,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  UserCircle,
  RefreshCw,
  Star,
  MapPin,
} from "lucide-react";
import { formatEGP } from "@/lib/currency";
import { format, parseISO, subDays } from "date-fns";

interface Ride {
  id: number;
  status: string;
  finalPrice: number | null;
  estimatedPrice: number | null;
  distanceKm: number | null;
  requestedAt: string;
  completedAt: string | null;
  driver?: { id: number; name: string; phone: string } | null;
  passenger?: { id: number; name: string; phone: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  cancelled: "#ef4444",
  active: "#3b82f6",
  searching: "#f59e0b",
  requested: "#8b5cf6",
  driver_assigned: "#6366f1",
  driver_arrived: "#0ea5e9",
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OnDemandAnalyticsPage({ vehicleType }: { vehicleType: "car" | "bike" }) {
  const label = vehicleType === "car" ? "Car" : "Motorcycle";
  const Icon = vehicleType === "car" ? Car : Bike;

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ data: Ride[]; meta: { total: number; pages: number } }>(
        `/admin/rides?vehicleType=${vehicleType}&limit=500`
      );
      setRides(res.data);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleType]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const completed = rides.filter((r) => r.status === "completed");
  const cancelled = rides.filter((r) => r.status === "cancelled");
  const active = rides.filter((r) => ["active", "driver_assigned", "driver_arrived", "searching", "requested"].includes(r.status));

  const totalRevenue = completed.reduce((sum, r) => sum + (r.finalPrice ?? 0), 0);
  const avgFare = completed.length > 0 ? totalRevenue / completed.length : 0;
  const completionRate = rides.length > 0 ? (completed.length / rides.length) * 100 : 0;
  const avgDistance = completed.filter((r) => r.distanceKm != null).length > 0
    ? completed.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0) / completed.filter((r) => r.distanceKm != null).length
    : 0;

  const statusDistribution = [
    { name: "Completed", value: completed.length, color: STATUS_COLORS.completed },
    { name: "Cancelled", value: cancelled.length, color: STATUS_COLORS.cancelled },
    { name: "Active", value: active.length, color: STATUS_COLORS.active },
  ].filter((d) => d.value > 0);

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayRides = rides.filter((r) => r.requestedAt.startsWith(dateStr));
    const dayCompleted = dayRides.filter((r) => r.status === "completed");
    return {
      date: format(date, "MMM d"),
      rides: dayRides.length,
      completed: dayCompleted.length,
      revenue: dayCompleted.reduce((sum, r) => sum + (r.finalPrice ?? 0), 0),
    };
  });

  const driverMap = new Map<number, { name: string; rides: number; revenue: number }>();
  for (const ride of completed) {
    if (!ride.driver) continue;
    const existing = driverMap.get(ride.driver.id);
    if (existing) {
      existing.rides += 1;
      existing.revenue += ride.finalPrice ?? 0;
    } else {
      driverMap.set(ride.driver.id, { name: ride.driver.name, rides: 1, revenue: ride.finalPrice ?? 0 });
    }
  }
  const topDrivers = [...driverMap.entries()]
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.rides - a.rides)
    .slice(0, 5);

  const StatCard = ({
    label: cardLabel,
    value,
    sub,
    icon: CardIcon,
    color,
  }: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{cardLabel}</p>
          <div className={`p-2 rounded-lg ${color}`}>
            <CardIcon className="h-4 w-4" />
          </div>
        </div>
        {loading ? (
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            {label} Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Performance metrics and revenue insights for the on-demand {label.toLowerCase()} service.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRides} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={loading ? "—" : formatEGP(totalRevenue)}
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          sub={`${completed.length} completed rides`}
        />
        <StatCard
          label="Avg Fare per Ride"
          value={loading ? "—" : formatEGP(avgFare)}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          sub={`across all completed rides`}
        />
        <StatCard
          label="Completion Rate"
          value={loading ? "—" : `${completionRate.toFixed(1)}%`}
          icon={CheckCircle2}
          color="bg-primary/10 text-primary"
          sub={`${cancelled.length} cancelled`}
        />
        <StatCard
          label="Avg Distance"
          value={loading ? "—" : `${avgDistance.toFixed(1)} km`}
          icon={MapPin}
          color="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
          sub="per completed ride"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily rides chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ride Volume — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last14Days} barSize={18} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="rides" name="Total" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ride Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : statusDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No rides recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Top Drivers by Completed Rides
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : topDrivers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">No completed rides yet.</p>
          ) : (
            <div className="space-y-3">
              {topDrivers.map((d, i) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg w-7 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </span>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.rides} completed ride{d.rides !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{formatEGP(d.revenue)}</p>
                    <p className="text-xs text-muted-foreground">total earned</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue per day table */}
      {!loading && last14Days.some((d) => d.revenue > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Daily Revenue — Last 14 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Total Requests</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Completed</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...last14Days].reverse().map((day) => (
                    <tr key={day.date} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 font-medium">{day.date}</td>
                      <td className="py-2.5 text-muted-foreground">{day.rides}</td>
                      <td className="py-2.5">
                        {day.completed > 0 ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100 border-emerald-200">
                            {day.completed}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2.5 font-semibold text-emerald-600">{day.revenue > 0 ? formatEGP(day.revenue) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
