import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfMonth, formatDistanceToNow } from "date-fns";
import { formatEGP } from "@/lib/currency";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  UserCircle,
  Star,
  Phone,
  Mail,
  CreditCard,
  FileImage,
  CheckCircle2,
  XCircle,
  Clock,
  ZoomIn,
  Bus,
  ShieldCheck,
  ShieldX,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Wallet,
  Hash,
  CalendarDays,
  Activity,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Car,
  Bike,
  MapPin,
  Timer,
  LogIn,
  Image,
  ExternalLink,
  Fingerprint,
  IdCard,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Driver {
  id: number;
  userId: number;
  name: string;
  phone: string;
  licenseNumber: string | null;
  nationalId: string | null;
  assignedBusId: number | null;
  status: "offline" | "online" | "busy" | "suspended";
  isActive: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface UserInfo {
  id: number;
  email: string;
  walletBalance: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusInfo {
  id: number;
  plateNumber: string;
  model: string;
  capacity: number;
}

interface DriverDocument {
  id: number;
  driverId: number;
  type: string;
  fileUrl: string;
  mimeType: string | null;
  verificationStatus: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  uploadedAt: string;
}

interface Ride {
  id: number;
  vehicleType: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number | null;
  finalPrice: number | null;
  estimatedPrice: number | null;
  requestedAt: string;
  completedAt: string | null;
}

interface RidesResponse {
  data: Ride[];
  meta: { total: number; page: number; limit: number; pages: number };
}

interface ShuttleTrip {
  id: number;
  status: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
}

interface TripsResponse {
  data: ShuttleTrip[];
  meta: { total: number; page: number; limit: number; pages: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_DOC_TYPES: Array<{ type: string; labelEn: string; labelAr: string; group: string; isMulti?: boolean }> = [
  { type: "profile_photo",         labelEn: "Profile Photo",           labelAr: "الصورة الشخصية",        group: "identity" },
  { type: "national_id_front",     labelEn: "National ID — Front",     labelAr: "بطاقة هوية — وجه",      group: "identity" },
  { type: "national_id_back",      labelEn: "National ID — Back",      labelAr: "بطاقة هوية — ظهر",      group: "identity" },
  { type: "criminal_record",       labelEn: "Criminal Record (Feesh)", labelAr: "الفيش الجنائي",          group: "identity" },
  { type: "driving_license_front", labelEn: "Driving License — Front", labelAr: "رخصة القيادة — وجه",    group: "licenses" },
  { type: "driving_license_back",  labelEn: "Driving License — Back",  labelAr: "رخصة القيادة — ظهر",    group: "licenses" },
  { type: "vehicle_license_front", labelEn: "Vehicle License — Front", labelAr: "رخصة المركبة — وجه",    group: "licenses" },
  { type: "vehicle_license_back",  labelEn: "Vehicle License — Back",  labelAr: "رخصة المركبة — ظهر",    group: "licenses" },
  { type: "vehicle_photo",         labelEn: "Vehicle Photos",          labelAr: "صور المركبة (٤ اتجاهات)", group: "vehicle", isMulti: true },
  { type: "trip_selfie",           labelEn: "Trip Selfie",             labelAr: "سيلفي الرحلة",           group: "other" },
];

const DOC_GROUPS: Array<{ key: string; label: string; labelAr: string }> = [
  { key: "identity", label: "Identity & Background", labelAr: "الهوية والخلفية" },
  { key: "licenses", label: "Licenses",              labelAr: "التراخيص" },
  { key: "vehicle",  label: "Vehicle Photos",        labelAr: "صور المركبة" },
  { key: "other",    label: "Other",                 labelAr: "أخرى" },
];

const STATUS_COLORS: Record<string, string> = {
  online:    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  busy:      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  offline:   "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const RIDE_STATUS_LABELS: Record<string, string> = {
  requested: "Requested", searching: "Searching", driver_assigned: "Assigned",
  driver_arrived: "Arrived", active: "En Route", completed: "Completed", cancelled: "Cancelled",
};

const TRIP_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled", waiting_driver: "Waiting Driver", driver_assigned: "Driver Assigned",
  boarding: "Boarding", active: "Active", completed: "Completed", cancelled: "Cancelled",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, labelAr, value }: {
  icon: React.ElementType; label: string; labelAr?: string; value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}{labelAr && <span className="mr-1 text-muted-foreground/60"> · {labelAr}</span>}
        </p>
        <div className="text-sm font-medium mt-0.5 break-words">
          {value ?? <span className="text-muted-foreground italic text-xs">لم يُضف بعد</span>}
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-sm font-bold ml-1">{Number(rating).toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">/ 5</span>
    </div>
  );
}

function RideStatusBadge({ status }: { status: string }) {
  const label = RIDE_STATUS_LABELS[status] ?? status;
  if (status === "completed") return <Badge variant="outline" className="border-green-500/40 text-green-600 bg-green-500/10 text-[10px]">{label}</Badge>;
  if (status === "cancelled") return <Badge variant="destructive" className="text-[10px]">{label}</Badge>;
  if (status === "active") return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">{label}</Badge>;
  return <Badge variant="outline" className="text-[10px]">{label}</Badge>;
}

function TripStatusBadge({ status }: { status: string }) {
  const label = TRIP_STATUS_LABELS[status] ?? status;
  if (status === "completed") return <Badge variant="outline" className="border-green-500/40 text-green-600 bg-green-500/10 text-[10px]">{label}</Badge>;
  if (status === "cancelled") return <Badge variant="destructive" className="text-[10px]">{label}</Badge>;
  if (status === "active" || status === "boarding") return <Badge className="bg-blue-500 text-[10px]">{label}</Badge>;
  return <Badge variant="outline" className="text-[10px]">{label}</Badge>;
}

function StatCard({ icon: Icon, iconClass, label, value }: {
  icon: React.ElementType; iconClass: string; label: string; value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocStatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") return <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-600 bg-green-500/10"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-[10px]"><XCircle className="h-2.5 w-2.5 mr-1" />Rejected</Badge>;
  return <Badge variant="secondary" className="text-[10px] text-amber-600"><Clock className="h-2.5 w-2.5 mr-1" />Pending</Badge>;
}

function DocumentCard({ doc, labelEn, labelAr, onZoom, onVerify, isPending }: {
  doc: DriverDocument; labelEn: string; labelAr: string;
  onZoom: () => void; onVerify: (status: "approved" | "rejected") => void; isPending: boolean;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col">
      <div className="group relative aspect-video bg-muted flex items-center justify-center cursor-pointer" onClick={onZoom}>
        {doc.fileUrl ? (
          <img src={doc.fileUrl} alt={labelEn} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <FileImage className="h-8 w-8 text-muted-foreground/40" />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <ZoomIn className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-semibold leading-tight">{labelEn}</p>
        <p className="text-[10px] text-muted-foreground/70 leading-tight" dir="rtl">{labelAr}</p>
        <p className="text-[10px] text-muted-foreground">{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</p>
        <DocStatusBadge status={doc.verificationStatus} />
        {doc.verificationStatus === "pending" && (
          <div className="flex gap-1 mt-1">
            <Button size="sm" variant="destructive" className="flex-1 h-6 text-[10px] px-1" disabled={isPending}
              onClick={() => onVerify("rejected")}>
              <XCircle className="h-2.5 w-2.5 mr-1" />Reject
            </Button>
            <Button size="sm" className="flex-1 h-6 text-[10px] px-1" disabled={isPending}
              onClick={() => onVerify("approved")}>
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MissingDocCard({ labelEn, labelAr }: { labelEn: string; labelAr: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center p-4 min-h-[180px] gap-2 text-center">
      <FileImage className="h-7 w-7 text-muted-foreground/30" />
      <p className="text-xs font-medium text-muted-foreground">{labelEn}</p>
      <p className="text-[10px] text-muted-foreground/50" dir="rtl">{labelAr}</p>
      <Badge variant="outline" className="text-[10px] mt-1 text-muted-foreground">لم يُرفع بعد</Badge>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DriverDetailPanelProps {
  driverId: number;
  serviceType: "shuttle" | "car" | "bike";
  open: boolean;
  onClose: () => void;
}

export default function DriverDetailPanel({ driverId, serviceType, open, onClose }: DriverDetailPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [zoomDoc, setZoomDoc] = useState<DriverDocument | null>(null);

  const qKey = ["driver-detail", driverId];

  const { data: driver, isLoading: driverLoading, error: driverError } = useQuery<Driver>({
    queryKey: [...qKey, "driver"],
    queryFn: () => adminFetch<Driver>(`/drivers/${driverId}`),
    enabled: open && !!driverId,
  });

  const { data: userInfo, isLoading: userLoading } = useQuery<UserInfo>({
    queryKey: [...qKey, "user"],
    queryFn: () => adminFetch<UserInfo>(`/admin/users/${driver!.userId}`),
    enabled: !!driver?.userId,
  });

  const { data: busInfo, isLoading: busLoading } = useQuery<BusInfo>({
    queryKey: [...qKey, "bus"],
    queryFn: () => adminFetch<BusInfo>(`/buses/${driver!.assignedBusId}`),
    enabled: serviceType === "shuttle" && !!driver?.assignedBusId,
  });

  const { data: docsData, isLoading: docsLoading, error: docsError } = useQuery<{ driver: { id: number; name: string }; documents: DriverDocument[] }>({
    queryKey: [...qKey, "docs"],
    queryFn: () => adminFetch(`/driver-documents/by-driver/${driverId}`),
    enabled: open && !!driverId,
  });

  // On-demand rides (car/bike)
  const ridesParams = new URLSearchParams({ driverId: String(driverId), limit: "200" });
  if (serviceType !== "shuttle") ridesParams.set("vehicleType", serviceType);

  const { data: ridesData, isLoading: ridesLoading } = useQuery<RidesResponse>({
    queryKey: [...qKey, "rides", serviceType],
    queryFn: () => adminFetch<RidesResponse>(`/admin/rides?${ridesParams}`),
    enabled: open && !!driverId && serviceType !== "shuttle",
  });

  // Shuttle trips
  const { data: tripsData, isLoading: tripsLoading } = useQuery<TripsResponse>({
    queryKey: [...qKey, "trips"],
    queryFn: () => adminFetch<TripsResponse>(`/admin/trips?driverId=${driverId}&limit=200`),
    enabled: open && !!driverId && serviceType === "shuttle",
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      adminFetch(`/driver-documents/${id}`, { method: "PATCH", body: JSON.stringify({ verificationStatus: status }) }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [...qKey, "docs"] });
      queryClient.invalidateQueries({ queryKey: ["driver-documents"] });
      toast({ title: vars.status === "approved" ? "Document approved ✓" : "Document rejected" });
      setZoomDoc(null);
    },
    onError: (err: Error) => toast({ title: "Action failed", description: err.message, variant: "destructive" }),
  });

  const toggleBlockMutation = useMutation({
    mutationFn: () => adminFetch(`/admin/users/${driver!.userId}/toggle-block`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...qKey, "user"] });
      toast({ title: userInfo?.isBlocked ? "Driver unblocked" : "Driver blocked" });
    },
    onError: (err: Error) => toast({ title: "Action failed", description: err.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () =>
      adminFetch(`/drivers/${driverId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !driver!.isActive, status: driver!.isActive ? "suspended" : "offline" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...qKey, "driver"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({ title: driver?.isActive ? "Driver suspended" : "Driver activated" });
    },
    onError: (err: Error) => toast({ title: "Action failed", description: err.message, variant: "destructive" }),
  });

  const handleToggleBlock = () => {
    if (confirm(`Are you sure you want to ${userInfo?.isBlocked ? "unblock" : "block"} this driver?`))
      toggleBlockMutation.mutate();
  };
  const handleToggleActive = () => {
    if (confirm(`Are you sure you want to ${driver?.isActive ? "suspend" : "activate"} this driver?`))
      toggleActiveMutation.mutate();
  };

  // ─── Computed stats ────────────────────────────────────────────────────────

  const documents = docsData?.documents ?? [];
  const profilePhotoDoc = documents.find(d => d.type === "profile_photo");

  const rides = ridesData?.data ?? [];
  const trips = tripsData?.data ?? [];
  const now = new Date();
  const monthStart = startOfMonth(now);

  // On-demand stats
  const totalCompleted = rides.filter(r => r.status === "completed").length;
  const totalCancelled = rides.filter(r => r.status === "cancelled").length;
  const totalEarnings = rides.filter(r => r.status === "completed" && r.finalPrice != null).reduce((s, r) => s + (r.finalPrice ?? 0), 0);
  const ridesThisMonth = rides.filter(r => { try { return new Date(r.requestedAt) >= monthStart; } catch { return false; } });
  const completedThisMonth = ridesThisMonth.filter(r => r.status === "completed").length;
  const earningsThisMonth = ridesThisMonth.filter(r => r.status === "completed" && r.finalPrice != null).reduce((s, r) => s + (r.finalPrice ?? 0), 0);
  const recentRides = [...rides].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).slice(0, 10);

  // Shuttle stats
  const totalTrips = tripsData?.meta.total ?? trips.length;
  const completedTrips = trips.filter(t => t.status === "completed").length;
  const cancelledTrips = trips.filter(t => t.status === "cancelled").length;
  const activeTrip = trips.find(t => t.status === "active" || t.status === "boarding");
  const tripsThisMonth = trips.filter(t => { try { return new Date(t.departureTime) >= monthStart; } catch { return false; } });
  const recentTrips = [...trips].sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()).slice(0, 10);

  // Last seen: best available proxy
  const lastSeenRaw = userInfo?.updatedAt ?? driver?.updatedAt;
  const lastSeen = lastSeenRaw
    ? `${format(parseISO(lastSeenRaw), "MMM d, yyyy — HH:mm")} (${formatDistanceToNow(parseISO(lastSeenRaw), { addSuffix: true })})`
    : null;

  // Total ride count label
  const totalRideCount = serviceType === "shuttle" ? totalTrips : (ridesData?.meta.total ?? rides.length);

  // Docs summary
  const pendingDocs = documents.filter(d => d.verificationStatus === "pending").length;
  const approvedDocs = documents.filter(d => d.verificationStatus === "approved").length;
  const rejectedDocs = documents.filter(d => d.verificationStatus === "rejected").length;

  // Service icon
  const ServiceIcon = serviceType === "car" ? Car : serviceType === "bike" ? Bike : Bus;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 gap-0">

          {/* ── Header ── */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle asChild>
              <div className="flex items-center gap-4">
                {/* Profile photo or avatar */}
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                  {profilePhotoDoc?.fileUrl ? (
                    <img src={profilePhotoDoc.fileUrl} alt="Profile" className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <UserCircle className="h-9 w-9 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {driverLoading ? (
                    <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold">{driver?.name ?? `Driver #${driverId}`}</span>
                        <Badge variant="outline" className="text-[10px]">
                          <ServiceIcon className="h-3 w-3 mr-1" />{serviceType}
                        </Badge>
                        {driver && (
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[driver.status]}`}>
                            {driver.status}
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${driver?.isActive ? "text-green-600 border-green-500/30 bg-green-500/10" : "text-destructive border-destructive/30 bg-destructive/10"}`}>
                          {driver?.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {userInfo?.isBlocked && (
                          <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                        )}
                      </div>

                      {/* Quick stats row */}
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{driver?.phone}
                        </span>
                        {driver && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-foreground">{Number(driver.rating).toFixed(1)}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span className="font-semibold text-foreground">{totalRideCount}</span>
                          {serviceType === "shuttle" ? " trips" : " rides"}
                        </span>
                        {pendingDocs > 0 && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />{pendingDocs} pending doc{pendingDocs > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />ID #{driverId}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto">
            {driverError ? (
              <div className="py-16 flex flex-col items-center gap-2 text-destructive">
                <AlertTriangle className="h-8 w-8" />
                <p className="text-sm">Failed to load driver. {(driverError as Error).message}</p>
              </div>
            ) : (
              <Tabs defaultValue="profile" className="flex flex-col h-full">
                <TabsList className="shrink-0 mx-6 mt-4 mb-2 w-auto self-start flex-wrap h-auto gap-1">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="documents">
                    Documents
                    {pendingDocs > 0 && (
                      <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                        {pendingDocs}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                {/* ══ TAB: PROFILE ══ */}
                <TabsContent value="profile" className="flex-1 px-6 pb-6 mt-4 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Personal Info */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                          البيانات الشخصية · Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {driverLoading ? (
                          <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                        ) : (
                          <>
                            <InfoRow icon={UserCircle} label="Full Name" labelAr="الاسم كامل" value={driver?.name} />
                            <InfoRow icon={Phone} label="Phone Number" labelAr="رقم التليفون" value={driver?.phone} />
                            <InfoRow icon={Mail} label="Email Address" labelAr="البريد الإلكتروني"
                              value={userLoading ? <Skeleton className="h-4 w-32" /> : userInfo?.email} />
                            <InfoRow icon={IdCard} label="National ID" labelAr="رقم البطاقة"
                              value={driver?.nationalId ? <span className="font-mono">{driver.nationalId}</span> : null} />
                            <InfoRow icon={CreditCard} label="License Number" labelAr="رقم الرخصة"
                              value={driver?.licenseNumber ? <span className="font-mono">{driver.licenseNumber}</span> : null} />
                            <InfoRow icon={CalendarDays} label="Account Created" labelAr="تاريخ التسجيل"
                              value={driver?.createdAt ? format(parseISO(driver.createdAt), "MMMM d, yyyy") : null} />
                            <InfoRow icon={LogIn} label="Last Seen" labelAr="آخر نشاط"
                              value={userLoading ? <Skeleton className="h-4 w-36" /> : lastSeen} />
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <div className="space-y-5">
                      {/* Rating & Status card */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                            التقييم والحالة · Rating & Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {driverLoading ? (
                            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                          ) : (
                            <>
                              <InfoRow icon={Star} label="Driver Rating" labelAr="التقييم"
                                value={driver ? <StarRating rating={Number(driver.rating)} /> : null} />
                              <InfoRow icon={Activity} label="Current Status" labelAr="الحالة الحالية"
                                value={driver ? <Badge variant="outline" className={`${STATUS_COLORS[driver.status]} text-xs`}>{driver.status}</Badge> : null} />
                              <InfoRow icon={CheckCircle2} label="Is Active" labelAr="مفعّل؟"
                                value={driver != null ? (driver.isActive
                                  ? <span className="text-green-600 font-semibold">نعم · Yes</span>
                                  : <span className="text-destructive font-semibold">لا · No</span>) : null} />
                              <InfoRow icon={ShieldCheck} label="Account Blocked" labelAr="محظور؟"
                                value={userLoading ? <Skeleton className="h-4 w-16" /> : (userInfo
                                  ? (userInfo.isBlocked
                                    ? <span className="text-destructive font-semibold">محظور · Blocked</span>
                                    : <span className="text-green-600 font-semibold">لا · No</span>)
                                  : null)} />
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Wallet & Counts */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                            المحفظة والإحصائيات · Account Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {userLoading ? (
                            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                          ) : (
                            <>
                              <InfoRow icon={Wallet} label="Wallet Balance" labelAr="رصيد المحفظة"
                                value={userInfo ? <span className="font-bold text-primary">{formatEGP(userInfo.walletBalance)}</span> : null} />
                              <InfoRow icon={Activity} label={serviceType === "shuttle" ? "Total Trips" : "Total Rides"} labelAr="إجمالي الرحلات"
                                value={
                                  serviceType === "shuttle"
                                    ? (tripsLoading ? <Skeleton className="h-4 w-10" /> : <span className="font-bold">{totalRideCount}</span>)
                                    : (ridesLoading ? <Skeleton className="h-4 w-10" /> : <span className="font-bold">{totalRideCount}</span>)
                                } />
                              <InfoRow icon={Hash} label="User ID" labelAr="معرف المستخدم"
                                value={driver?.userId ? <span className="font-mono text-muted-foreground">#{driver.userId}</span> : null} />
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Shuttle: bus info */}
                      {serviceType === "shuttle" && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                              الأتوبيس المخصص · Assigned Bus
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {!driver?.assignedBusId ? (
                              <div className="py-6 text-center text-muted-foreground">
                                <Bus className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">لم يُخصص أتوبيس بعد</p>
                              </div>
                            ) : busLoading ? (
                              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                            ) : busInfo ? (
                              <>
                                <InfoRow icon={Bus} label="Plate Number" labelAr="لوحة الأرقام"
                                  value={<span className="font-mono font-bold">{busInfo.plateNumber}</span>} />
                                <InfoRow icon={Bus} label="Model" labelAr="الموديل" value={busInfo.model} />
                                <InfoRow icon={Activity} label="Capacity" labelAr="السعة" value={`${busInfo.capacity} مقاعد`} />
                                <InfoRow icon={Hash} label="Bus ID" labelAr="معرف الأتوبيس" value={`#${busInfo.id}`} />
                              </>
                            ) : (
                              <InfoRow icon={Bus} label="Bus ID" labelAr="معرف الأتوبيس" value={`#${driver.assignedBusId}`} />
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* ══ TAB: DOCUMENTS ══ */}
                <TabsContent value="documents" className="flex-1 px-6 pb-6 mt-4 space-y-6">
                  {/* Doc summary badges */}
                  {!docsLoading && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-muted-foreground">Documents:</span>
                      <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10">
                        <CheckCircle2 className="h-3 w-3 mr-1" />{approvedDocs} Approved
                      </Badge>
                      {pendingDocs > 0 && (
                        <Badge variant="secondary" className="text-amber-600">
                          <Clock className="h-3 w-3 mr-1" />{pendingDocs} Pending Review
                        </Badge>
                      )}
                      {rejectedDocs > 0 && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />{rejectedDocs} Rejected
                        </Badge>
                      )}
                    </div>
                  )}

                  {docsError ? (
                    <div className="py-10 text-center text-destructive">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm">Failed to load documents.</p>
                    </div>
                  ) : docsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="space-y-7">
                      {DOC_GROUPS.map(group => {
                        const groupDocs = ALL_DOC_TYPES.filter(d => d.group === group.key);
                        return (
                          <div key={group.key}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                              <span>{group.label}</span>
                              <span className="text-muted-foreground/50">·</span>
                              <span dir="rtl">{group.labelAr}</span>
                            </h3>

                            {group.key === "vehicle" ? (
                              /* Vehicle photos: show all uploads (multiple allowed — 4 directions) */
                              (() => {
                                const vehicleDocs = documents.filter(d => d.type === "vehicle_photo");
                                if (vehicleDocs.length === 0) {
                                  return (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      {["أمام · Front", "خلف · Back", "يمين · Right", "يسار · Left"].map(dir => (
                                        <div key={dir} className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center p-4 min-h-[150px] gap-2 text-center">
                                          <Image className="h-6 w-6 text-muted-foreground/30" />
                                          <p className="text-[10px] text-muted-foreground/60" dir="rtl">{dir}</p>
                                          <Badge variant="outline" className="text-[10px] text-muted-foreground">لم يُرفع</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {vehicleDocs.map((doc, idx) => (
                                      <DocumentCard
                                        key={doc.id}
                                        doc={doc}
                                        labelEn={`Vehicle Photo ${idx + 1}`}
                                        labelAr={["أمام · Front", "خلف · Back", "يمين · Right", "يسار · Left"][idx] ?? `صورة ${idx + 1}`}
                                        onZoom={() => setZoomDoc(doc)}
                                        onVerify={(status) => verifyMutation.mutate({ id: doc.id, status })}
                                        isPending={verifyMutation.isPending}
                                      />
                                    ))}
                                    {vehicleDocs.length < 4 && (
                                      [...Array(4 - vehicleDocs.length)].map((_, i) => {
                                        const dirs = ["أمام · Front", "خلف · Back", "يمين · Right", "يسار · Left"];
                                        return (
                                          <div key={`missing-${i}`} className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center p-3 min-h-[150px] gap-2 text-center">
                                            <Image className="h-5 w-5 text-muted-foreground/30" />
                                            <p className="text-[10px] text-muted-foreground/60" dir="rtl">{dirs[vehicleDocs.length + i]}</p>
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground">لم يُرفع</Badge>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {groupDocs.map(({ type, labelEn, labelAr }) => {
                                  const uploaded = documents.filter(d => d.type === type);
                                  if (uploaded.length === 0) return <MissingDocCard key={type} labelEn={labelEn} labelAr={labelAr} />;
                                  return uploaded.map(doc => (
                                    <DocumentCard
                                      key={doc.id}
                                      doc={doc}
                                      labelEn={labelEn}
                                      labelAr={labelAr}
                                      onZoom={() => setZoomDoc(doc)}
                                      onVerify={(status) => verifyMutation.mutate({ id: doc.id, status })}
                                      isPending={verifyMutation.isPending}
                                    />
                                  ));
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* ══ TAB: ACTIVITY ══ */}
                <TabsContent value="activity" className="flex-1 px-6 pb-6 mt-4 space-y-6">

                  {serviceType === "shuttle" ? (
                    <>
                      {/* Shuttle stats grid */}
                      {tripsLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <StatCard icon={Activity} iconClass="text-blue-600 bg-blue-500/10" label="إجمالي الرحلات · Total Trips" value={String(totalTrips)} />
                          <StatCard icon={CheckCircle2} iconClass="text-green-600 bg-green-500/10" label="مكتملة · Completed" value={String(completedTrips)} />
                          <StatCard icon={XCircle} iconClass="text-red-600 bg-red-500/10" label="ملغية · Cancelled" value={String(cancelledTrips)} />
                          <StatCard icon={Star} iconClass="text-amber-500 bg-amber-500/10" label="التقييم · Rating" value={driver ? `${Number(driver.rating).toFixed(1)} ★` : "—"} />
                        </div>
                      )}

                      {activeTrip && (
                        <Card className="border-blue-500/30 bg-blue-500/5">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <Activity className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-600">رحلة نشطة الآن · Currently on an active trip</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(activeTrip.departureTime), "HH:mm")} → {format(parseISO(activeTrip.arrivalTime), "HH:mm")}
                                  {" · "}Trip #{activeTrip.id}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={CalendarDays} iconClass="text-purple-600 bg-purple-500/10" label="رحلات هذا الشهر · This Month" value={String(tripsThisMonth.length)} />
                        <StatCard icon={LogIn} iconClass="text-slate-600 bg-slate-500/10" label="آخر نشاط · Last Seen" value={lastSeenRaw ? formatDistanceToNow(parseISO(lastSeenRaw), { addSuffix: true }) : "—"} />
                      </div>

                      {/* Recent trips table */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          آخر الرحلات · Recent Trips (last 10)
                        </h3>
                        <div className="rounded-xl border border-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Departure</TableHead>
                                <TableHead>Arrival</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Seats</TableHead>
                                <TableHead>Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tripsLoading ? (
                                [...Array(5)].map((_, i) => (
                                  <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                                ))
                              ) : recentTrips.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                                    لا توجد رحلات · No trips found.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                recentTrips.map(trip => (
                                  <TableRow key={trip.id}>
                                    <TableCell className="text-xs text-muted-foreground font-mono">#{trip.id}</TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">{format(parseISO(trip.departureTime), "MMM d, HH:mm")}</TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">{format(parseISO(trip.arrivalTime), "HH:mm")}</TableCell>
                                    <TableCell><TripStatusBadge status={trip.status} /></TableCell>
                                    <TableCell className="text-xs">{trip.totalSeats - trip.availableSeats}/{trip.totalSeats}</TableCell>
                                    <TableCell className="text-sm font-medium">{formatEGP(trip.price)}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* On-demand stats grid */}
                      {ridesLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <StatCard icon={CheckCircle2} iconClass="text-green-600 bg-green-500/10" label="إجمالي المكتملة · Completed" value={String(totalCompleted)} />
                          <StatCard icon={XCircle} iconClass="text-red-600 bg-red-500/10" label="ملغية · Cancelled" value={String(totalCancelled)} />
                          <StatCard icon={DollarSign} iconClass="text-amber-600 bg-amber-500/10" label="إجمالي الأرباح · Total Earnings" value={formatEGP(totalEarnings)} />
                          <StatCard icon={Star} iconClass="text-amber-500 bg-amber-500/10" label="التقييم · Rating" value={driver ? `${Number(driver.rating).toFixed(1)} ★` : "—"} />
                          <StatCard icon={TrendingUp} iconClass="text-blue-600 bg-blue-500/10" label="رحلات هذا الشهر · This Month" value={String(completedThisMonth)} />
                          <StatCard icon={Wallet} iconClass="text-primary bg-primary/10" label="أرباح هذا الشهر · Earnings MTD" value={formatEGP(earningsThisMonth)} />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={Activity} iconClass="text-slate-600 bg-slate-500/10" label="إجمالي الرحلات · Total Rides" value={String(ridesData?.meta.total ?? rides.length)} />
                        <StatCard icon={LogIn} iconClass="text-slate-600 bg-slate-500/10" label="آخر نشاط · Last Seen" value={lastSeenRaw ? formatDistanceToNow(parseISO(lastSeenRaw), { addSuffix: true }) : "—"} />
                      </div>

                      {/* Recent rides table */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          آخر الرحلات · Recent Rides (last 10)
                        </h3>
                        <div className="rounded-xl border border-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fare</TableHead>
                                <TableHead>KM</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ridesLoading ? (
                                [...Array(5)].map((_, i) => (
                                  <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                                ))
                              ) : recentRides.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                                    لا توجد رحلات · No rides found.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                recentRides.map(ride => (
                                  <TableRow key={ride.id}>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                      {format(parseISO(ride.requestedAt), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 text-xs max-w-[200px]">
                                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="truncate text-muted-foreground">{ride.pickupAddress}</span>
                                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <span className="truncate text-muted-foreground">{ride.dropoffAddress}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell><RideStatusBadge status={ride.status} /></TableCell>
                                    <TableCell className="text-sm font-medium">
                                      {ride.finalPrice != null ? formatEGP(ride.finalPrice) : ride.estimatedPrice != null ? formatEGP(ride.estimatedPrice) : "—"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {ride.distanceKm != null ? `${ride.distanceKm.toFixed(1)} km` : "—"}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* ══ TAB: ACTIONS ══ */}
                <TabsContent value="actions" className="flex-1 px-6 pb-6 mt-4">
                  <div className="max-w-lg space-y-4">
                    <p className="text-sm text-muted-foreground">
                      كل إجراء يتطلب تأكيداً ويُطبق فوراً · Each action requires confirmation and is applied immediately.
                    </p>

                    {/* Block / Unblock */}
                    <Card>
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                            {userInfo?.isBlocked ? <ShieldX className="h-5 w-5 text-amber-600" /> : <ShieldCheck className="h-5 w-5 text-amber-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {userInfo?.isBlocked ? "السائق محظور · Driver is Blocked" : "حظر السائق · Block Driver"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {userInfo?.isBlocked
                                ? "Unblocking will restore their access to the app."
                                : "Blocking prevents this driver from logging in and receiving rides."}
                            </p>
                            <Button className="mt-3" variant={userInfo?.isBlocked ? "outline" : "destructive"}
                              size="sm" onClick={handleToggleBlock}
                              disabled={toggleBlockMutation.isPending || userLoading || !userInfo}>
                              {userInfo?.isBlocked
                                ? <><ToggleRight className="h-4 w-4 mr-2" />Unblock Driver</>
                                : <><ToggleLeft className="h-4 w-4 mr-2" />Block Driver</>}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suspend / Activate */}
                    <Card>
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${driver?.isActive ? "bg-red-500/10" : "bg-green-500/10"}`}>
                            {driver?.isActive ? <XCircle className="h-5 w-5 text-red-600" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {driver?.isActive ? "إيقاف السائق · Suspend Driver" : "تفعيل السائق · Activate Driver"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {driver?.isActive
                                ? "Suspending will set the driver as inactive and change their status to suspended."
                                : "Activating will restore the driver's profile and set their status to offline."}
                            </p>
                            <Button className="mt-3" variant={driver?.isActive ? "destructive" : "default"}
                              size="sm" onClick={handleToggleActive}
                              disabled={toggleActiveMutation.isPending || driverLoading || !driver}>
                              {driver?.isActive
                                ? <><XCircle className="h-4 w-4 mr-2" />Suspend Driver</>
                                : <><CheckCircle2 className="h-4 w-4 mr-2" />Activate Driver</>}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Document Zoom Dialog ── */}
      <Dialog open={!!zoomDoc} onOpenChange={(o) => !o && setZoomDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {zoomDoc ? ALL_DOC_TYPES.find(d => d.type === zoomDoc.type)?.labelEn ?? zoomDoc.type : ""}
            </DialogTitle>
          </DialogHeader>

          {zoomDoc && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-muted flex items-center justify-center min-h-[200px] max-h-[420px]">
                {zoomDoc.fileUrl ? (
                  <img src={zoomDoc.fileUrl} alt="Document" className="max-w-full max-h-[420px] object-contain cursor-pointer"
                    onClick={() => window.open(zoomDoc.fileUrl, "_blank")} />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground py-10">
                    <FileImage className="h-12 w-12 opacity-30" />
                    <p className="text-sm">الصورة غير متاحة · Image not available</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Uploaded {format(new Date(zoomDoc.uploadedAt), "MMM d, yyyy HH:mm")}</span>
                {zoomDoc.mimeType && <><span>·</span><span>{zoomDoc.mimeType}</span></>}
                <DocStatusBadge status={zoomDoc.verificationStatus} />
                {zoomDoc.fileUrl && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 ml-auto"
                    onClick={() => window.open(zoomDoc.fileUrl, "_blank")}>
                    <ExternalLink className="h-3 w-3 mr-1" />فتح في تبويب جديد
                  </Button>
                )}
              </div>

              {zoomDoc.adminNotes && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="font-medium text-xs text-muted-foreground">Admin Notes: </span>
                  {zoomDoc.adminNotes}
                </div>
              )}

              {zoomDoc.verificationStatus === "pending" && (
                <div className="flex gap-3">
                  <Button variant="destructive" className="flex-1" disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: zoomDoc.id, status: "rejected" })}>
                    <XCircle className="h-4 w-4 mr-2" />رفض · Reject
                  </Button>
                  <Button className="flex-1" disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: zoomDoc.id, status: "approved" })}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />قبول · Approve
                  </Button>
                </div>
              )}

              {zoomDoc.verificationStatus !== "pending" && (
                <p className="text-xs text-center text-muted-foreground">
                  This document has already been <strong>{zoomDoc.verificationStatus}</strong>.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
