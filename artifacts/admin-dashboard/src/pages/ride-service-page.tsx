import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/api";
import DriverDetailPanel from "@/components/DriverDetailPanel";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  Bike,
  CheckCircle2,
  XCircle,
  Activity,
  DollarSign,
  Save,
  Filter,
  Clock,
} from "lucide-react";
import { formatEGP } from "@/lib/currency";
import { format, parseISO } from "date-fns";

interface Pricing {
  id: number;
  vehicleType: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  isActive: boolean;
}

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

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="outline" className="border-green-500/40 text-green-600 bg-green-500/10">{STATUS_LABELS[status] ?? status}</Badge>;
    case "cancelled":
      return <Badge variant="destructive">{STATUS_LABELS[status] ?? status}</Badge>;
    case "active":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">{STATUS_LABELS[status] ?? status}</Badge>;
    case "searching":
    case "requested":
      return <Badge variant="secondary">{STATUS_LABELS[status] ?? status}</Badge>;
    default:
      return <Badge variant="outline">{STATUS_LABELS[status] ?? status}</Badge>;
  }
}

function EventTimeline({ events }: { events: RideDetail["events"] }) {
  const EVENT_LABELS: Record<string, string> = {
    RIDE_REQUESTED: "Ride Requested",
    DRIVER_ASSIGNED: "Driver Assigned",
    DRIVER_ARRIVED: "Driver Arrived at Pickup",
    RIDE_STARTED: "Ride Started",
    RIDE_COMPLETED: "Ride Completed",
    RIDE_CANCELLED: "Ride Cancelled",
  };
  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={ev.id} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
            {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />}
          </div>
          <div className="flex-1 pb-3">
            <p className="text-sm font-medium">{EVENT_LABELS[ev.type] ?? ev.type}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(ev.createdAt), "MMM d, HH:mm:ss")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RideServicePage({ vehicleType }: { vehicleType: "car" | "bike" }) {
  const { toast } = useToast();
  const label = vehicleType === "car" ? "Car" : "Motorcycle";
  const Icon = vehicleType === "car" ? Car : Bike;

  const [viewDriverId, setViewDriverId] = useState<number | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingForm, setPricingForm] = useState({
    baseFare: "",
    perKmRate: "",
    perMinuteRate: "",
    minimumFare: "",
  });
  const [savingPricing, setSavingPricing] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(true);

  const [rides, setRides] = useState<Ride[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [ridesLoading, setRidesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRide, setSelectedRide] = useState<RideDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPricing = useCallback(async () => {
    try {
      setPricingLoading(true);
      const res = await adminFetch<{ data: Pricing[] }>("/admin/rides/pricing");
      const found = res.data.find((p) => p.vehicleType === vehicleType) ?? null;
      setPricing(found);
      if (found) {
        setPricingForm({
          baseFare: found.baseFare.toString(),
          perKmRate: found.perKmRate.toString(),
          perMinuteRate: found.perMinuteRate.toString(),
          minimumFare: found.minimumFare.toString(),
        });
      }
    } catch {
      toast({ title: "Failed to load pricing", variant: "destructive" });
    } finally {
      setPricingLoading(false);
    }
  }, [vehicleType, toast]);

  const fetchRides = useCallback(async () => {
    try {
      setRidesLoading(true);
      const params = new URLSearchParams({
        vehicleType,
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await adminFetch<{ data: Ride[]; meta: Meta }>(`/admin/rides?${params}`);
      setRides(res.data);
      setMeta(res.meta);
    } catch {
      toast({ title: "Failed to load rides", variant: "destructive" });
    } finally {
      setRidesLoading(false);
    }
  }, [vehicleType, page, statusFilter, toast]);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);
  useEffect(() => { fetchRides(); }, [fetchRides]);

  async function savePricing() {
    const baseFare = parseFloat(pricingForm.baseFare);
    const perKmRate = parseFloat(pricingForm.perKmRate);
    const perMinuteRate = parseFloat(pricingForm.perMinuteRate);
    const minimumFare = parseFloat(pricingForm.minimumFare);

    if ([baseFare, perKmRate, perMinuteRate, minimumFare].some(isNaN)) {
      toast({ title: "All pricing fields must be valid numbers", variant: "destructive" });
      return;
    }
    if (baseFare <= 0 || minimumFare <= 0) {
      toast({ title: "Base fare and minimum fare must be positive", variant: "destructive" });
      return;
    }

    try {
      setSavingPricing(true);
      await adminFetch(`/admin/rides/pricing/${vehicleType}`, {
        method: "PATCH",
        body: JSON.stringify({ baseFare, perKmRate, perMinuteRate, minimumFare }),
      });
      toast({ title: "Pricing updated successfully" });
      fetchPricing();
    } catch (err: unknown) {
      toast({
        title: "Failed to update pricing",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSavingPricing(false);
    }
  }

  async function openRideDetail(id: number) {
    setDetailLoading(true);
    setSelectedRide(null);
    try {
      const res = await adminFetch<{ data: RideDetail }>(`/admin/rides/${id}`);
      setSelectedRide(res.data);
    } catch {
      toast({ title: "Failed to load ride details", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  }

  const stats = {
    total: meta.total,
    completed: rides.filter((r) => r.status === "completed").length,
    cancelled: rides.filter((r) => r.status === "cancelled").length,
    revenue: rides
      .filter((r) => r.status === "completed" && r.finalPrice != null)
      .reduce((sum, r) => sum + (r.finalPrice ?? 0), 0),
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Icon className="h-7 w-7" />
          {label} Service
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage pricing, monitor rides, and review events for the {label.toLowerCase()} service.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meta.total}</p>
                <p className="text-xs text-muted-foreground">Total Rides</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatEGP(stats.revenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue (page)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Pricing Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricingLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !pricing ? (
            <p className="text-sm text-muted-foreground">No pricing configured for this vehicle type.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Fare (EGP)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pricingForm.baseFare}
                    onChange={(e) => setPricingForm((f) => ({ ...f, baseFare: e.target.value }))}
                    placeholder="e.g. 10.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Per KM Rate (EGP)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pricingForm.perKmRate}
                    onChange={(e) => setPricingForm((f) => ({ ...f, perKmRate: e.target.value }))}
                    placeholder="e.g. 5.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Per Minute Rate (EGP)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pricingForm.perMinuteRate}
                    onChange={(e) => setPricingForm((f) => ({ ...f, perMinuteRate: e.target.value }))}
                    placeholder="e.g. 0.50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minimum Fare (EGP)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pricingForm.minimumFare}
                    onChange={(e) => setPricingForm((f) => ({ ...f, minimumFare: e.target.value }))}
                    placeholder="e.g. 20.00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={savePricing} disabled={savingPricing} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  {savingPricing ? "Saving…" : "Save Pricing"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Formula: <span className="font-mono">max(minimum_fare, base_fare + km × per_km_rate)</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 mr-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => { setStatusFilter(val); setPage(1); }}
          >
            <SelectTrigger className="w-[180px]">
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
          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStatusFilter("all"); setPage(1); }}
              className="ml-auto"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ride</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Dropoff</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Est. Price</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ridesLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    No {label.toLowerCase()} rides found.
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride) => (
                  <TableRow
                    key={ride.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => openRideDetail(ride.id)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium">#{ride.id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ride.passenger?.name ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      {ride.driver ? (
                        <button
                          className="text-sm text-primary underline-offset-2 hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setViewDriverId(ride.driver!.id); }}
                        >
                          {ride.driver.name}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground max-w-[120px] truncate block">{ride.pickupAddress}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground max-w-[120px] truncate block">{ride.dropoffAddress}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ride.distanceKm != null ? `${ride.distanceKm.toFixed(1)} km` : "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ride.estimatedPrice != null ? formatEGP(ride.estimatedPrice) : "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{ride.finalPrice != null ? formatEGP(ride.finalPrice) : "—"}</span>
                    </TableCell>
                    <TableCell>{statusBadge(ride.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(ride.requestedAt), "MMM d, HH:mm")}
                      </span>
                    </TableCell>
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
                  Page {page} of {meta.pages}
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
      </div>

      <Dialog
        open={!!selectedRide || detailLoading}
        onOpenChange={(open) => { if (!open) setSelectedRide(null); }}
      >
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRide ? `Ride #${selectedRide.id} Details` : "Loading ride…"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading && !selectedRide ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedRide ? (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                    {statusBadge(selectedRide.status)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Vehicle Type</p>
                    <p className="text-sm font-medium capitalize">{selectedRide.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Distance</p>
                    <p className="text-sm font-medium">
                      {selectedRide.distanceKm != null ? `${selectedRide.distanceKm.toFixed(2)} km` : "—"}
                    </p>
                  </div>
                  {selectedRide.cancelReason && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Cancel Reason</p>
                      <p className="text-sm font-medium">{selectedRide.cancelReason.replace(/_/g, " ")}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Estimated Price</p>
                    <p className="text-sm font-medium">
                      {selectedRide.estimatedPrice != null ? formatEGP(selectedRide.estimatedPrice) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Final Price</p>
                    <p className="text-base font-bold">
                      {selectedRide.finalPrice != null ? formatEGP(selectedRide.finalPrice) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Passenger</p>
                  {selectedRide.passenger ? (
                    <>
                      <p className="text-sm font-medium">{selectedRide.passenger.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedRide.passenger.phone}</p>
                    </>
                  ) : <p className="text-sm text-muted-foreground">—</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Driver</p>
                  {selectedRide.driver ? (
                    <>
                      <p className="text-sm font-medium">{selectedRide.driver.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedRide.driver.phone}</p>
                    </>
                  ) : <p className="text-sm text-muted-foreground">Unassigned</p>}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Pickup</p>
                  <p className="text-sm">{selectedRide.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Dropoff</p>
                  <p className="text-sm">{selectedRide.dropoffAddress}</p>
                </div>
              </div>

              {selectedRide.events.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Event Timeline
                    </p>
                    <EventTimeline events={selectedRide.events} />
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {viewDriverId !== null && (
        <DriverDetailPanel
          driverId={viewDriverId}
          serviceType={vehicleType}
          open={viewDriverId !== null}
          onClose={() => setViewDriverId(null)}
        />
      )}
    </div>
  );
}
