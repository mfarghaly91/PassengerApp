import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ShieldCheck, UserCircle, FileImage, CheckCircle2, XCircle,
  Clock, ChevronRight, ZoomIn, ChevronLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useTranslation } from "react-i18next";

type DriverDocument = {
  id: number;
  driverId: number;
  type: string;
  fileUrl: string;
  mimeType: string | null;
  verificationStatus: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  uploadedAt: string;
  driver: { name: string | null; phone: string | null };
};

type DriverDocs = {
  driver: { id: number; name: string; phone: string };
  documents: DriverDocument[];
};

export default function DriverVerification() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewDriver, setViewDriver] = useState<DriverDocs | null>(null);
  const [zoomDoc, setZoomDoc] = useState<DriverDocument | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const docTypeLabels: Record<string, string> = {
    national_id_front:       t("verification.nationalIdFront", "National ID (Front)"),
    national_id_back:        t("verification.nationalIdBack", "National ID (Back)"),
    driving_license_front:   t("verification.drivingLicenseFront", "Driving License (Front)"),
    driving_license_back:    t("verification.drivingLicenseBack", "Driving License (Back)"),
    vehicle_license_front:   t("verification.vehicleLicenseFront", "Vehicle License (Front)"),
    vehicle_license_back:    t("verification.vehicleLicenseBack", "Vehicle License (Back)"),
    vehicle_photo:           t("verification.vehiclePhoto", "Vehicle Photo"),
    profile_photo:           t("verification.profilePhoto", "Profile Photo"),
    trip_selfie:             t("verification.tripSelfie", "Trip Selfie"),
  };

  const docGroups = [
    { label: t("verification.identityDocuments", "Identity Documents"), keys: ["national_id_front", "national_id_back"] },
    { label: t("verification.licenses", "Licenses"), keys: ["driving_license_front", "driving_license_back", "vehicle_license_front", "vehicle_license_back"] },
    { label: t("verification.vehicleAndProfile", "Vehicle & Profile"), keys: ["vehicle_photo", "profile_photo"] },
    { label: t("verification.tripSelfies", "Trip Selfies"), keys: ["trip_selfie"] },
  ];

  const statusConfig: Record<string, { variant: any; icon: React.ElementType }> = {
    pending:  { variant: "secondary",   icon: Clock },
    approved: { variant: "default",     icon: CheckCircle2 },
    rejected: { variant: "destructive", icon: XCircle },
  };

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (statusFilter !== "all") params.set("verificationStatus", statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["driver-documents", page, statusFilter],
    queryFn: () => adminFetch<{ data: DriverDocument[]; total: number; limit: number }>(`/driver-documents?${params}`),
  });

  const { data: stats } = useQuery({
    queryKey: ["driver-documents-stats"],
    queryFn: () => adminFetch<Record<string, number>>("/driver-documents/stats"),
  });

  const openDriverDocs = async (driverId: number) => {
    const result = await adminFetch<DriverDocs>(`/driver-documents/by-driver/${driverId}`);
    setViewDriver(result);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes: string }) =>
      adminFetch(`/driver-documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus: status, adminNotes: notes }),
      }),
    onSuccess: async (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["driver-documents"] });
      queryClient.invalidateQueries({ queryKey: ["driver-documents-stats"] });
      toast({ title: vars.status === "approved" ? t("verification.documentApproved", "Document approved") : t("verification.documentRejected", "Document rejected") });
      if (viewDriver) {
        const updated = await adminFetch<DriverDocs>(`/driver-documents/by-driver/${viewDriver.driver.id}`);
        setViewDriver(updated);
      }
      setZoomDoc(null);
    },
  });

  const uniqueDriverIds = [...new Set(data?.data.map(d => d.driverId) || [])];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("verification.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("verification.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "pending",  label: t("suggestions.pendingReview", "Pending Review"), icon: Clock,         cls: "text-amber-500" },
          { key: "approved", label: t("verification.approved"),       icon: CheckCircle2,  cls: "text-green-500" },
          { key: "rejected", label: t("verification.rejected"),       icon: XCircle,       cls: "text-destructive" },
        ].map(({ key, label, icon: Icon, cls }) => (
          <Card key={key} className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => { setStatusFilter(key); setPage(1); }}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${cls}`} />
              <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xl font-bold">{stats?.[key] ?? 0}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
        <span className="text-sm font-medium">{t("common.filter", "Filter")}:</span>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder={t("verification.allStatus", "All Status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("verification.allDocuments", "All Documents")}</SelectItem>
            <SelectItem value="pending">{t("verification.pending")}</SelectItem>
            <SelectItem value="approved">{t("verification.approved")}</SelectItem>
            <SelectItem value="rejected">{t("verification.rejected")}</SelectItem>
          </SelectContent>
        </Select>
        {data && <p className="ml-auto text-sm text-muted-foreground">{data.total} {t("verification.documentsTotal", "documents total")}</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : uniqueDriverIds.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{t("verification.noDocuments", "No documents found")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueDriverIds.map((driverId) => {
            const driverDocs = data!.data.filter(d => d.driverId === driverId);
            const firstDoc = driverDocs[0];
            const pending = driverDocs.filter(d => d.verificationStatus === "pending").length;
            const approved = driverDocs.filter(d => d.verificationStatus === "approved").length;
            return (
              <div
                key={driverId}
                className="p-4 bg-card border border-border rounded-xl flex items-center gap-4 hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => openDriverDocs(driverId)}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{firstDoc.driver.name || `${t("drivers.title")} #${driverId}`}</div>
                  <div className="text-xs text-muted-foreground">{firstDoc.driver.phone}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{driverDocs.length} {t("verification.docs", "docs")}</span>
                    {pending > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{pending} {t("verification.pending")}</Badge>
                    )}
                    {approved > 0 && (
                      <Badge variant="outline" className="text-[10px] text-green-600">{approved} {t("verification.approved")}</Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.total > data.limit && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            <PaginationItem className="text-sm text-muted-foreground px-4">
              {t("common.page", "Page")} {page} {t("common.of", "of")} {Math.ceil(data.total / data.limit)}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => setPage(p => p + 1)}
                className={page >= Math.ceil(data.total / data.limit) ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={!!viewDriver} onOpenChange={(open) => !open && setViewDriver(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              {viewDriver?.driver.name} — {t("verification.documents", "Documents")}
            </DialogTitle>
          </DialogHeader>

          {viewDriver && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {docGroups.map((group) => {
                const groupDocs = viewDriver.documents.filter(d => group.keys.includes(d.type));
                if (groupDocs.length === 0) return null;
                return (
                  <div key={group.label}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {groupDocs.map((doc) => {
                        const cfg = statusConfig[doc.verificationStatus];
                        const StatusIcon = cfg.icon;
                        return (
                          <div key={doc.id} className="group relative rounded-xl border border-border overflow-hidden bg-muted/30">
                            <div
                              className="aspect-video bg-muted flex items-center justify-center cursor-pointer relative"
                              onClick={() => { setZoomDoc(doc); setAdminNotes(doc.adminNotes || ""); }}
                            >
                              {doc.fileUrl ? (
                                <img
                                  src={doc.fileUrl}
                                  alt={docTypeLabels[doc.type]}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <FileImage className="h-8 w-8 text-muted-foreground" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{docTypeLabels[doc.type] || doc.type}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant={cfg.variant} className="text-[10px]">
                                  <StatusIcon className="h-2.5 w-2.5 mr-1" />
                                  {doc.verificationStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {viewDriver.documents.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">
                  <FileImage className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("verification.noDocumentsUploaded", "No documents uploaded yet")}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!zoomDoc} onOpenChange={(open) => !open && setZoomDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {zoomDoc ? docTypeLabels[zoomDoc.type] || zoomDoc.type : ""}
            </DialogTitle>
          </DialogHeader>

          {zoomDoc && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-muted flex items-center justify-center min-h-[200px] max-h-[400px]">
                {zoomDoc.fileUrl ? (
                  <img
                    src={zoomDoc.fileUrl}
                    alt="Document"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground py-10">
                    <FileImage className="h-12 w-12 opacity-30" />
                    <p className="text-sm">{t("verification.imageNotAvailable", "Image not available")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{t("verification.uploaded", "Uploaded")} {format(new Date(zoomDoc.uploadedAt), "MMM d, yyyy HH:mm")}</span>
                {zoomDoc.mimeType && <><span>·</span><span>{zoomDoc.mimeType}</span></>}
              </div>

              {zoomDoc.adminNotes && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="font-medium text-xs text-muted-foreground">{t("verification.adminNotes", "Admin Notes")}: </span>
                  {zoomDoc.adminNotes}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("verification.adminNotes", "Admin Notes")}</label>
                <Textarea
                  placeholder={t("verification.notesPlaceholder", "Optional notes about this document...")}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={updateMutation.isPending || zoomDoc.verificationStatus === "rejected"}
                  onClick={() => updateMutation.mutate({ id: zoomDoc.id, status: "rejected", notes: adminNotes })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {zoomDoc.verificationStatus === "rejected" ? t("verification.rejected") : t("verification.reject", "Reject")}
                </Button>
                <Button
                  className="flex-1"
                  disabled={updateMutation.isPending || zoomDoc.verificationStatus === "approved"}
                  onClick={() => updateMutation.mutate({ id: zoomDoc.id, status: "approved", notes: adminNotes })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {zoomDoc.verificationStatus === "approved" ? t("verification.approved") : t("verification.approve", "Approve")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
