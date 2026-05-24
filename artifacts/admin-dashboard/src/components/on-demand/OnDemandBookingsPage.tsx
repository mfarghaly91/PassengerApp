import React, { useState, useCallback, useEffect } from "react";
import { adminFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Car,
  Bike,
  Filter,
  Download,
  MapPin,
  Navigation,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
} from "lucide-react";
import { formatEGP } from "@/lib/currency";
import { exportCSV, exportExcel, todayStr } from "@/lib/export";
import { format, parseISO } from "date-fns";

interface Ride {
  id: number;
  vehicleType: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  requestedAt: string;
  completedAt: string | null;
  passenger?: { id: number; name: string; phone: string } | null;
  driver?: { id: number; name: string; phone: string } | null;
}

interface RideDetail extends Ride {
  driverArrivedAt: string | null;
  driverAssignedAt: string | null;
  startedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  events: { id: number; type: string; metadata: unknown; createdAt: string }[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  searching: "Searching",
  driver_assigned: "Driver Assigned",
  driver_arrived: "Driver Arrived",
  active: "En Route",
  completed: "Completed",
  cancelled: "Cancelled",
};

const EVENT_LABELS: Record<string, string> = {
  RIDE_REQUESTED: "Ride Requested",
  DRIVER_ASSIGNED: "Driver Assigned",
  DRIVER_ARRIVED: "Driver Arrived at Pickup",
  RIDE_STARTED: "Ride Started",
  RIDE_COMPLETED: "Ride Completed",
  RIDE_CANCELLED: "Ride Cancelled",
};

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="outline" className="border-green-500/40 text-green-600 bg-green-500/10">{STATUS_LABELS[status] ?? status}</Badge>;
    case "cancelled":
      return <Badge variant="destructive">{STATUS_LABELS[status] ?? status}</Badge>;
    case "active":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">{STATUS_LABELS[status] ?? status}</Badge>;
    case "driver_assigned":
    case "driver_arrived":
      return <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 border-violet-500/30">{STATUS_LABELS[status] ?? status}</Badge>;
    default:
      return <Badge variant="secondary">{STATUS_LABELS[status] ?? status}</Badge>;
  }
}

export default function OnDemandBookingsPage({ vehicleType }: { vehicleType: "car" | "bike" }) {
  const label = vehicleType === "car" ? "Car" : "Motorcycle";
  const Icon = vehicleType === "car" ? Car : Bike;

  const [rides, setRides] = useState<Ride[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [selectedRide, setSelectedRide] = useState<RideDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ vehicleType, page: page.toString(), limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await adminFetch<{ data: Ride[]; meta: Meta }>(`/admin/rides?${params}`);
      setRides(res.data);
      setMeta(res.meta);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleType, page, statusFilter]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  async function openRideDetail(id: number) {
    setDetailLoading(true);
    setSelectedRide(null);
    try {
      const res = await adminFetch<{ data: RideDetail }>(`/admin/rides/${id}`);
      setSelectedRide(res.data);
    } catch {
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredRides = rides.filter((r) => {
    if (fromDate && new Date(r.requestedAt) < new Date(fromDate)) return false;
    if (toDate && new Date(r.requestedAt) > new Date(toDate + "T23:59:59")) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPassenger = r.passenger?.name.toLowerCase().includes(q) || r.passenger?.phone.includes(q);
      const matchDriver = r.driver?.name.toLowerCase().includes(q) || r.driver?.phone.includes(q);
      if (!matchPassenger && !matchDriver) return false;
    }
    return true;
  });

  function clearFilters() {
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setSearch("");
    setPage(1);
  }

  function buildExportRows() {
    return filteredRides.map((r) => ({
      "Ride ID": r.id,
      "Requested At": format(parseISO(r.requestedAt), "yyyy-MM-dd HH:mm"),
      "Passenger": r.passenger?.name ?? `ID #${r.passenger?.id ?? "—"}`,
      "Passenger Phone": r.passenger?.phone ?? "—",
      "Driver": r.driver?.name ?? "Unassigned",
      "Driver Phone": r.driver?.phone ?? "—",
      "Pickup": r.pickupAddress,
      "Dropoff": r.dropoffAddress,
      "Distance (km)": r.distanceKm ?? "",
      "Est. Price (EGP)": r.estimatedPrice ?? "",
      "Final Price (EGP)": r.finalPrice ?? "",
      "Status": STATUS_LABELS[r.status] ?? r.status,
    }));
  }

  const completedCount = rides.filter((r) => r.status === "completed").length;
  const cancelledCount = rides.filter((r) => r.status === "cancelled").length;
  const revenueOnPage = rides.filter((r) => r.status === "completed" && r.finalPrice).reduce((s, r) => s + (r.finalPrice ?? 0), 0);
  const hasFilters = statusFilter !== "all" || fromDate || toDate || search;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Icon className="h-7 w-7" />
            {label} Bookings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete history of all {label.toLowerCase()} ride requests. Search, filter, and export.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading || filteredRides.length === 0}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportCSV(buildExportRows(), `${vehicleType}-bookings-${todayStr()}.csv`)}>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportExcel(buildExportRows(), `${vehicleType}-bookings-${todayStr()}.xlsx`, "Bookings")}>
              Export Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: meta.total, icon: Search, color: "text-primary bg-primary/10" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300" },
          { label: "Cancelled", value: cancelledCount, icon: XCircle, color: "text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300" },
          { label: "Page Revenue", value: formatEGP(revenueOnPage), icon: DollarSign, color: "text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                {loading ? <Skeleton className="h-7 w-10 mb-1" /> : <p className="text-xl font-bold">{s.value}</p>}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-xl border border-border">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search passenger or driver..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="searching">Searching</SelectItem>
            <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
            <SelectItem value="driver_arrived">Driver Arrived</SelectItem>
            <SelectItem value="active">En Route</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">From</span>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-[140px] h-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">To</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-[140px] h-9"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Passenger</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Dropoff</TableHead>
              <TableHead>Dist.</TableHead>
              <TableHead>Fare</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : filteredRides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  {hasFilters ? "No ride requests match your filters." : `No ${label.toLowerCase()} ride requests yet.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredRides.map((ride) => (
                <TableRow
                  key={ride.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => openRideDetail(ride.id)}
                >
                  <TableCell><span className="font-mono text-sm font-medium">#{ride.id}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(ride.requestedAt), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{ride.passenger?.name ?? "—"}</p>
                      {ride.passenger?.phone && <p className="text-xs text-muted-foreground">{ride.passenger.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ride.driver ? (
                      <div>
                        <p className="text-sm font-medium">{ride.driver.name}</p>
                        <p className="text-xs text-muted-foreground">{ride.driver.phone}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground max-w-[120px] truncate block">{ride.pickupAddress}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground max-w-[120px] truncate block">{ride.dropoffAddress}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ride.distanceKm != null ? `${ride.distanceKm.toFixed(1)}km` : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {ride.finalPrice != null ? formatEGP(ride.finalPrice) : ride.estimatedPrice != null ? `~${formatEGP(ride.estimatedPrice)}` : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(ride.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta.pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Page {page} of {meta.pages} — {meta.total} total
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                className={page >= meta.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedRide || detailLoading}
        onOpenChange={(open) => { if (!open) setSelectedRide(null); }}
      >
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRide ? `Ride Request #${selectedRide.id}` : "Loading…"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && !selectedRide ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedRide ? (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    {statusBadge(selectedRide.status)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</p>
                    <p className="text-sm font-medium">{selectedRide.distanceKm != null ? `${selectedRide.distanceKm.toFixed(2)} km` : "—"}</p>
                  </div>
                  {selectedRide.cancelReason && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cancel Reason</p>
                      <p className="text-sm text-destructive">{selectedRide.cancelReason}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estimated Fare</p>
                    <p className="text-sm font-medium">{selectedRide.estimatedPrice != null ? formatEGP(selectedRide.estimatedPrice) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Fare</p>
                    <p className="text-lg font-bold text-emerald-600">{selectedRide.finalPrice != null ? formatEGP(selectedRide.finalPrice) : "—"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                  <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm">{selectedRide.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                  <Navigation className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dropoff</p>
                    <p className="text-sm">{selectedRide.dropoffAddress}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-1">Passenger</p>
                  <p className="font-medium text-sm">{selectedRide.passenger?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{selectedRide.passenger?.phone ?? ""}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-1">Driver</p>
                  <p className="font-medium text-sm">{selectedRide.driver?.name ?? "Unassigned"}</p>
                  <p className="text-xs text-muted-foreground">{selectedRide.driver?.phone ?? ""}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Timeline
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    { label: "Requested", val: selectedRide.requestedAt },
                    { label: "Driver Assigned", val: selectedRide.driverAssignedAt },
                    { label: "Driver Arrived", val: selectedRide.driverArrivedAt },
                    { label: "Ride Started", val: selectedRide.startedAt },
                    { label: "Completed", val: selectedRide.completedAt },
                    { label: "Cancelled", val: selectedRide.cancelledAt },
                  ]
                    .filter((t) => t.val)
                    .map((t) => (
                      <div key={t.label} className="flex justify-between border-b border-border/50 pb-1">
                        <span>{t.label}</span>
                        <span className="font-medium text-foreground">{format(parseISO(t.val!), "MMM d, HH:mm:ss")}</span>
                      </div>
                    ))}
                </div>
              </div>
              {selectedRide.events.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ride Events</p>
                  <div className="space-y-2">
                    {selectedRide.events.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          {i < selectedRide.events.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm font-medium">{EVENT_LABELS[ev.type] ?? ev.type}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(ev.createdAt), "MMM d, HH:mm:ss")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
