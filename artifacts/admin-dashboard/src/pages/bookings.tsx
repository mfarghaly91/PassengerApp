import React, { useState } from "react";
import { 
  useListBookings, 
  useCancelBooking,
  getListBookingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ticket, Filter, Ban, RefreshCcw, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportCSV, exportExcel, todayStr } from "@/lib/export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatEGP } from "@/lib/currency";
import { useTranslation } from "react-i18next";

export default function Bookings() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [tripIdFilter, setTripIdFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading } = useListBookings({
    page,
    limit: 15,
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
    tripId: tripIdFilter ? parseInt(tripIdFilter) : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const cancelMutation = useCancelBooking();

  const handleCancelBooking = (id: number) => {
    if (confirm(t("bookings.cancelConfirm", "Are you sure you want to cancel this booking? The user will be refunded automatically."))) {
      cancelMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: t("bookings.cancelledAndRefunded", "Booking cancelled and refunded") });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        }
      });
    }
  };

  const clearFilters = () => {
    setUserIdFilter("");
    setTripIdFilter("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const dateFilteredData = (data?.data ?? []).filter((b) => {
    const d = new Date(b.createdAt);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate + "T23:59:59")) return false;
    return true;
  });

  const buildBookingRows = () =>
    dateFilteredData.map((b) => ({
      "Booking ID": b.id,
      "Date": format(new Date(b.createdAt), "yyyy-MM-dd HH:mm"),
      "Customer Name": b.user?.name ?? `User #${b.userId}`,
      "Customer Phone": b.user?.phone ?? "",
      "Trip ID": b.tripId,
      "Seats": b.seatCount,
      "Total Price (EGP)": b.totalPrice,
      "Payment Status": (b as any).paymentStatus ?? "",
      "Status": b.status,
    }));

  const handleExportCSV = () => {
    const suffix = statusFilter !== "all" ? `-${statusFilter}` : "";
    exportCSV(buildBookingRows(), `bookings${suffix}-${todayStr()}.csv`);
  };

  const handleExportExcel = () => {
    const suffix = statusFilter !== "all" ? `-${statusFilter}` : "";
    exportExcel(buildBookingRows(), `bookings${suffix}-${todayStr()}.xlsx`, "Bookings");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("bookings.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("bookings.subtitle")}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading || !data?.data.length}>
              <Download className="h-4 w-4 mr-2" />{t("bookings.export", "Export")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>{t("bookings.exportCSV", "Export CSV")}</DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>{t("bookings.exportExcel", "Export Excel (.xlsx)")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("bookings.searchAndFilters", "Search & Filters")}:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            placeholder={t("bookings.userId", "User ID...")} 
            value={userIdFilter} 
            onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
            className="w-[120px]"
            type="number"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input 
            placeholder={t("bookings.tripId", "Trip ID...")} 
            value={tripIdFilter} 
            onChange={(e) => { setTripIdFilter(e.target.value); setPage(1); }}
            className="w-[120px]"
            type="number"
          />
        </div>

        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("bookings.allStatuses", "All Statuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("bookings.allStatuses", "All Statuses")}</SelectItem>
            <SelectItem value="pending">{t("support.pending")}</SelectItem>
            <SelectItem value="confirmed">{t("bookings.confirmed", "Confirmed")}</SelectItem>
            <SelectItem value="completed">{t("dashboard.completed")}</SelectItem>
            <SelectItem value="cancelled">{t("dashboard.cancelled")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{t("bookings.from", "From")}</span>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-[140px] h-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{t("bookings.to", "To")}</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-[140px] h-9"
          />
        </div>

        {(userIdFilter || tripIdFilter || statusFilter !== "all" || fromDate || toDate) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            {t("bookings.clearFilters", "Clear Filters")}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("bookings.refId", "Ref ID")}</TableHead>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("bookings.customer", "Customer")}</TableHead>
              <TableHead>{t("bookings.tripRef", "Trip Ref")}</TableHead>
              <TableHead>{t("bookings.seats")}</TableHead>
              <TableHead>{t("bookings.amount")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : dateFilteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {t("bookings.noBookings")}
                </TableCell>
              </TableRow>
            ) : (
              dateFilteredData.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm font-medium">#{booking.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(booking.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.user?.name || `ID: ${booking.userId}`}</div>
                    <div className="text-xs text-muted-foreground">{booking.user?.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">TRP-{booking.tripId}</Badge>
                  </TableCell>
                  <TableCell>{booking.seatCount}</TableCell>
                  <TableCell className="font-medium">{formatEGP(booking.totalPrice)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' : 
                        booking.status === 'completed' ? 'secondary' :
                        booking.status === 'cancelled' ? 'destructive' : 'outline'
                      } className="w-fit">
                        {booking.status}
                      </Badge>
                      {booking.paymentStatus === 'refunded' && (
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          <RefreshCcw className="h-3 w-3 mr-1" /> {t("bookings.refunded", "Refunded")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <Ban className="h-4 w-4 mr-2" /> {t("common.cancel")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {data && data.total > data.limit && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem className="text-sm text-muted-foreground px-4">
              {t("common.page", "Page")} {page} {t("common.of", "of")} {Math.ceil(data.total / data.limit)}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => p + 1)}
                className={page >= Math.ceil(data.total / data.limit) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
