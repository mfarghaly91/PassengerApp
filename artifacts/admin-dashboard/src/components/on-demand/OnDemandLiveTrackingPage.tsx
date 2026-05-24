import React, { useEffect, useRef, useState, useCallback } from "react";
import { adminFetch } from "@/lib/api";
import { useGetAdminDriversLive } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Car,
  Bike,
  Radio,
  MapPin,
  Gauge,
  Navigation,
  UserCircle,
  RefreshCw,
  Activity,
  WifiOff,
} from "lucide-react";

interface Ride {
  id: number;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  requestedAt: string;
  passenger?: { id: number; name: string; phone: string } | null;
  driver?: { id: number; name: string; phone: string } | null;
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

export default function OnDemandLiveTrackingPage({ vehicleType }: { vehicleType: "car" | "bike" }) {
  const label = vehicleType === "car" ? "Car" : "Motorcycle";
  const Icon = vehicleType === "car" ? Car : Bike;

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);

  const { data, isLoading, refetch } = useGetAdminDriversLive({
    query: { refetchInterval: 5000 },
  });

  const fetchActiveRides = useCallback(async () => {
    setRidesLoading(true);
    try {
      const statuses = ["requested", "searching", "driver_assigned", "driver_arrived", "active"];
      const allRides: Ride[] = [];
      for (const s of ["active", "driver_assigned", "driver_arrived", "searching"]) {
        try {
          const res = await adminFetch<{ data: Ride[]; meta: { total: number } }>(
            `/admin/rides?vehicleType=${vehicleType}&status=${s}&limit=50`
          );
          allRides.push(...res.data);
        } catch {}
      }
      setActiveRides(allRides);
    } catch {
      setActiveRides([]);
    } finally {
      setRidesLoading(false);
    }
  }, [vehicleType]);

  useEffect(() => {
    fetchActiveRides();
    intervalRef.current = setInterval(() => {
      setLastRefresh(new Date());
      fetchActiveRides();
    }, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchActiveRides]);

  const allDrivers: LiveDriver[] = (data?.data ?? []) as LiveDriver[];
  const onDemandDrivers = allDrivers.filter((d) => !d.assignedBusId);

  const online = onDemandDrivers.filter((d) => d.status === "online");
  const busy = onDemandDrivers.filter((d) => d.status === "busy");
  const offline = onDemandDrivers.filter((d) => d.status === "offline" || d.status === "suspended");

  const driverRideMap = new Map<number, Ride>();
  for (const ride of activeRides) {
    if (ride.driver?.id) driverRideMap.set(ride.driver.id, ride);
  }

  function handleRefresh() {
    refetch();
    fetchActiveRides();
    setLastRefresh(new Date());
  }

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return "—"; }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="h-7 w-7 text-emerald-500 animate-pulse" />
            {label} Live Tracking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time driver positions and active ride dispatch — auto-refreshes every 10 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Updated: {lastRefresh.toLocaleTimeString()}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "On-Demand Drivers", value: onDemandDrivers.length, icon: Icon, color: "text-primary bg-primary/10" },
          { label: "Available", value: online.length, icon: Radio, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300" },
          { label: "On Active Ride", value: busy.length, icon: Activity, color: "text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300" },
          { label: "Active Requests", value: activeRides.length, icon: MapPin, color: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-7 w-10 mb-1" /> : <p className="text-2xl font-bold">{s.value}</p>}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fleet Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label} Fleet Map
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
              <span className="text-muted-foreground text-sm">Loading drivers…</span>
            ) : [...online, ...busy].length === 0 ? (
              <div className="text-center">
                <Radio className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No on-demand drivers currently online</p>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {[...online, ...busy].map((d) => {
                  const lat = d.currentLatitude;
                  const lng = d.currentLongitude;
                  const hasGps = lat != null && lng != null;
                  const top = hasGps ? Math.max(5, Math.min(90, ((lat - 30) / 20) * 80 + 10)) : Math.random() * 70 + 15;
                  const left = hasGps ? Math.max(5, Math.min(90, ((lng + 80) / 40) * 80 + 10)) : Math.random() * 70 + 15;
                  const ride = driverRideMap.get(d.id);
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
                        <div className="absolute hidden group-hover:block bottom-6 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-md shadow-lg p-2 text-xs w-40 z-10">
                          <p className="font-semibold">{d.name}</p>
                          {hasGps && <p className="text-muted-foreground">{coord(lat)}, {coord(lng)}</p>}
                          <p className="text-muted-foreground capitalize">{d.status === "busy" ? "On Ride" : d.status}</p>
                          {ride && <p className="text-muted-foreground truncate">→ {ride.dropoffAddress}</p>}
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
                  <span className="capitalize">{s === "busy" ? "on ride" : s}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active rides */}
      {activeRides.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Active Ride Requests ({activeRides.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeRides.map((ride) => (
              <Card key={ride.id} className="border-l-4 border-l-amber-500">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">Ride #{ride.id}</span>
                    <Badge variant="outline" className="text-xs">
                      {ride.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="truncate">{ride.pickupAddress}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Navigation className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                      <span className="truncate">{ride.dropoffAddress}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-muted-foreground">
                      Passenger: <span className="text-foreground font-medium">{ride.passenger?.name ?? "—"}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Driver: <span className="text-foreground font-medium">{ride.driver?.name ?? "Searching…"}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available drivers */}
      {online.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Radio className="h-5 w-5 text-emerald-500" />
            Available Drivers ({online.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {online.map((d) => (
              <Card key={d.id} className="border-l-4 border-l-emerald-500">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.phone}</p>
                    </div>
                    <Badge className={`ml-auto text-xs ${STATUS_BADGE[d.status] ?? ""}`}>Available</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{d.currentLatitude != null ? `${coord(d.currentLatitude)}, ${coord(d.currentLongitude)}` : "No GPS"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" />
                      <span>{d.currentSpeed != null ? `${d.currentSpeed.toFixed(0)} km/h` : "—"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Updated: {formatTime(d.updatedAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Offline */}
      {offline.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-slate-400" />
            Offline / Suspended ({offline.length})
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium">Driver</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {offline.map((d) => (
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
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatTime(d.updatedAt)}</td>
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
