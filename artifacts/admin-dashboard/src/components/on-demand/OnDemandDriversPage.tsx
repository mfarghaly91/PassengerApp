import React, { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
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
  Car,
  Bike,
  UserCircle,
  Star,
  RefreshCw,
  Search,
  Radio,
  Activity,
  WifiOff,
  ShieldOff,
} from "lucide-react";

// استدعاء لوحة السائق التلقائية ومكون الـ Dialog لعرضها في منبثق احترافي
import DriverDetailPanel from "@/components/DriverDetailPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Driver {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  status: string;
  isActive: boolean;
  rating: string | number;
  assignedBusId: number | null;
  createdAt: string;
}

interface DriversResponse {
  data: Driver[];
  total: number;
}

const STATUS_BADGE: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  busy: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  offline: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function OnDemandDriversPage({ vehicleType }: { vehicleType: "car" | "bike" }) {
  const label = vehicleType === "car" ? "Car" : "Motorcycle";
  const Icon = vehicleType === "car" ? Car : Bike;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State للتحكم في الكابتن المختار وعرض مستنداته وفشله
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<DriversResponse>("/drivers?limit=200");
      setDrivers(res.data ?? []);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const filtered = drivers.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !d.phone.includes(q)) return false;
    }
    return true;
  });

  const onlineCount = drivers.filter((d) => d.status === "online").length;
  const busyCount = drivers.filter((d) => d.status === "busy").length;
  const offlineCount = drivers.filter((d) => d.status === "offline").length;
  const suspendedCount = drivers.filter((d) => d.status === "suspended").length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Icon className="h-7 w-7" />
            {label} Drivers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage on-demand {label.toLowerCase()} service drivers and their status.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Drivers", value: drivers.length, icon: UserCircle, color: "text-primary bg-primary/10" },
          { label: "Online", value: onlineCount, icon: Radio, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300" },
          { label: "On Ride", value: busyCount, icon: Activity, color: "text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300" },
          { label: "Offline / Suspended", value: offlineCount + suspendedCount, icon: WifiOff, color: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-10 mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="busy">On Ride</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search || statusFilter !== "all" ? "No drivers match your filters." : "No drivers registered yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">ID #{d.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.phone}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{d.licenseNumber || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">
                        {parseFloat(String(d.rating)).toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE[d.status] ?? ""}>
                      {d.status === "busy" ? "On Ride" : d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* تعديل الزرار ليفتح اللوحة المنبثقة مباشرة بدل الانتقال لصفحة أخرى */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDriverId(d.id)}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && suspendedCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
          <ShieldOff className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-destructive font-medium">{suspendedCount} suspended driver{suspendedCount > 1 ? "s" : ""}</span>
          <span className="text-muted-foreground"> — review their profiles to reinstate or remove.</span>
        </div>
      )}

      {/* الشاشة المنبثقة التلقائية: تفتح عند النقر وتمرر الـ vehicleType بدقة */}
      <Dialog open={selectedDriverId !== null} onOpenChange={(open) => !open && setSelectedDriverId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent">
          {selectedDriverId && (
            <div className="bg-background rounded-xl p-4 shadow-lg border border-border">
              <DriverDetailPanel 
                driverId={selectedDriverId} 
                serviceType={vehicleType} // بيمرر تلقائياً car أو bike للـ API المظبوط
                open={true} 
                onClose={() => setSelectedDriverId(null)} // عند الضغط على إكس يقفل المودال فوراً
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}