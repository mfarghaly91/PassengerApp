import React, { useEffect, useRef, useState } from "react";
import { useGetAdminDriversLive } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, MapPin, Gauge, Navigation, Bus, UserCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  offline: "bg-slate-400",
  suspended: "bg-red-500",
};

const STATUS_BADGE: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  busy: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  offline: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

function coord(val: number | null | undefined) {
  if (val == null) return "—";
  return val.toFixed(5);
}

type LiveDriver = {
  id: number;
  name: string;
  phone: string;
  status: string;
  isOnline: boolean;
  rating: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  currentSpeed?: number | null;
  currentHeading?: number | null;
  assignedBusId?: number | null;
  updatedAt: string;
  activeTrip?: { id: number; status: string; departureTime: string; arrivalTime: string } | null;
};

export default function LiveTracking() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useGetAdminDriversLive({
    query: { refetchInterval: 5000 },
  });

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const drivers: LiveDriver[] = (data?.data ?? []) as LiveDriver[];
  const online = drivers.filter((d) => d.status === "online" || d.status === "busy");
  const offline = drivers.filter((d) => d.status === "offline" || d.status === "suspended");

  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-7 w-7 text-emerald-500 animate-pulse" />
            {t("liveTracking.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("liveTracking.autoRefresh", "Real-time driver positions — auto-refreshes every 5 seconds")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t("liveTracking.lastUpdated", "Last updated")}: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> {t("common.refresh")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("drivers.totalDrivers", "Total Drivers"), value: drivers.length, icon: UserCircle, color: "text-primary" },
          { label: t("liveTracking.online", "Online"), value: drivers.filter((d) => d.status === "online").length, icon: Radio, color: "text-emerald-500" },
          { label: t("liveTracking.onTrip", "On Trip"), value: drivers.filter((d) => d.status === "busy").length, icon: Bus, color: "text-amber-500" },
          { label: t("drivers.offline", "Offline"), value: drivers.filter((d) => d.status === "offline").length, icon: UserCircle, color: "text-slate-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("liveTracking.fleetMapOverview", "Fleet Map Overview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-64 rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <React.Fragment key={i}>
                  <div className="absolute border-b border-foreground/20 w-full" style={{ top: `${i * 10}%` }} />
                  <div className="absolute border-r border-foreground/20 h-full" style={{ left: `${i * 10}%` }} />
                </React.Fragment>
              ))}
            </div>
            {isLoading ? (
              <span className="text-muted-foreground text-sm">{t("common.loading")}</span>
            ) : online.length === 0 ? (
              <div className="text-center">
                <Radio className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">{t("liveTracking.noDriversOnline", "No drivers currently online")}</p>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {online.map((d) => {
                  const lat = d.currentLatitude;
                  const lng = d.currentLongitude;
                  const hasGps = lat != null && lng != null;
                  const top = hasGps ? Math.max(5, Math.min(90, ((lat - 30) / 20) * 80 + 10)) : Math.random() * 70 + 15;
                  const left = hasGps ? Math.max(5, Math.min(90, ((lng + 80) / 40) * 80 + 10)) : Math.random() * 70 + 15;
                  return (
                    <div
                      key={d.id}
                      className="absolute"
                      style={{ top: `${top}%`, left: `${left}%`, transform: "translate(-50%,-50%)" }}
                    >
                      <div className="relative group cursor-pointer">
                        <span className={`flex h-4 w-4 rounded-full ${STATUS_COLORS[d.status] ?? "bg-slate-400"} ring-2 ring-background shadow-md`}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${STATUS_COLORS[d.status] ?? "bg-slate-400"} opacity-40`} />
                        </span>
                        <div className="absolute hidden group-hover:block bottom-6 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-md shadow-lg p-2 text-xs w-36 z-10">
                          <p className="font-semibold">{d.name}</p>
                          {hasGps && <p className="text-muted-foreground">{coord(lat)}, {coord(lng)}</p>}
                          <p className="text-muted-foreground capitalize">{d.status}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="absolute bottom-3 right-3 flex flex-col gap-1">
              {["online", "busy", "offline"].map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[s]}`} />
                  <span className="capitalize">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {online.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3">{t("liveTracking.activeDrivers", "Active Drivers")} ({online.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {online.map((d) => (
              <Card key={d.id} className="border-l-4" style={{ borderLeftColor: d.status === "busy" ? "#f59e0b" : "#10b981" }}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.phone}</p>
                      </div>
                    </div>
                    <Badge className={STATUS_BADGE[d.status] ?? ""}>
                      {d.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {d.currentLatitude != null
                          ? `${coord(d.currentLatitude)}, ${coord(d.currentLongitude)}`
                          : t("liveTracking.noGps", "No GPS signal")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Gauge className="h-3 w-3" />
                      <span>{d.currentSpeed != null ? `${d.currentSpeed.toFixed(0)} km/h` : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      <span>{d.currentHeading != null ? `${d.currentHeading.toFixed(0)}°` : "—"}</span>
                    </div>
                    {d.assignedBusId && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Bus className="h-3 w-3" />
                        <span>{t("buses.title")} #{d.assignedBusId}</span>
                      </div>
                    )}
                  </div>

                  {d.activeTrip && (
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                      <p className="font-medium">{t("liveTracking.activeTrip", "Active Trip")} #{d.activeTrip.id}</p>
                      <p className="text-muted-foreground">
                        {formatTime(d.activeTrip.departureTime)} → {formatTime(d.activeTrip.arrivalTime)}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t("liveTracking.updated", "Updated")}: {formatTime(d.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {offline.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3">{t("liveTracking.offlineSuspended", "Offline / Suspended")} ({offline.length})</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium">{t("drivers.title")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("common.phone")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("common.status")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("buses.title")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(3)].map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                      </tr>
                    ))
                  : offline.map((d) => (
                      <tr key={d.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            {d.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{d.phone}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={STATUS_BADGE[d.status] ?? ""}>{d.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {d.assignedBusId ? `${t("buses.title")} #${d.assignedBusId}` : "—"}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
