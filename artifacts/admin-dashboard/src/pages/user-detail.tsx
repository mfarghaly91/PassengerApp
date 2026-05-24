import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetAdminUser, 
  useListBookings,
  useUpdateAdminUser,
  getGetAdminUserQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Edit2, Save, User as UserIcon, Wallet, Calendar, Ticket, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import DriverDetailPanel from "@/components/DriverDetailPanel";
import { useTranslation } from "react-i18next";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  role: z.enum(["user", "driver", "admin"]),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function UserDetail() {
  const { id } = useParams();
  const userId = parseInt(id || "0", 10);
  const [isEditing, setIsEditing] = useState(false);
  const [bookingsPage, setBookingsPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const { data: user, isLoading: isUserLoading } = useGetAdminUser(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetAdminUserQueryKey(userId)
    }
  });

  const { data: bookingsData, isLoading: isBookingsLoading } = useListBookings({
    userId,
    page: bookingsPage,
    limit: 5,
  }, {
    query: {
      enabled: !!userId && user?.role === "user"
    }
  });

  const updateMutation = useUpdateAdminUser();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    values: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: (user?.role as "user" | "driver" | "admin") || "user",
    },
  });

  const onSubmit = (data: EditUserFormValues) => {
    updateMutation.mutate({
      id: userId,
      data
    }, {
      onSuccess: () => {
        toast({ title: t("users.userUpdated", "User updated successfully") });
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetAdminUserQueryKey(userId) });
      }
    });
  };

  if (isUserLoading) {
    return <div className="p-8"><Skeleton className="h-[600px] rounded-xl" /></div>;
  }

  if (!user) {
    return <div className="p-8 text-center">{t("users.userNotFound", "User not found")}</div>;
  }

  const backRoute = user.role === "driver" ? "/drivers" : "/users";

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={backRoute}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("users.userProfile", "User Profile")}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{t("users.profileDetails", "Profile Details")}</CardTitle>
            <div className="flex justify-end">
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> {t("common.edit")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.name")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.email")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.phone")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("users.role")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("users.selectRole", "Select a role")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">{t("users.userPassenger", "User (Passenger)")}</SelectItem>
                            <SelectItem value="driver">{t("drivers.title")}</SelectItem>
                            <SelectItem value="admin">{t("users.admin", "Admin")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" /> {t("common.save")}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <Badge variant={user.isBlocked ? "destructive" : "secondary"}>
                      {user.isBlocked ? t("users.blocked") : t("common.active")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t("common.email")}</div>
                    <div className="text-sm border-b pb-1 break-all">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t("common.phone")}</div>
                    <div className="text-sm border-b pb-1">{user.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t("users.role")}</div>
                    <div className="capitalize text-sm border-b pb-1">{user.role}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{t("users.joined")}</div>
                    <div className="text-sm">{format(new Date(user.createdAt), "PPP")}</div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Wallet className="h-4 w-4 text-primary" /> {t("wallet.walletBalance", "Wallet Balance")}
                  </div>
                  <div className="font-bold">${user.walletBalance}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {user.role === "driver" ? (
            <div className="p-4 flex-1">
              <DriverDetailPanel 
                driverId={userId} 
                serviceType={(user as any).vehicleType || "car"} 
                open={true} 
                onClose={() => setLocation(backRoute)} 
              />
            </div>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  {t("users.passengerRideHistory", "Passenger Ride History")}
                </CardTitle>
                <CardDescription>{t("users.rideHistoryDesc", "View and monitor this user's shuttle bookings and trip history.")}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="rounded-xl border border-border overflow-hidden bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("bookings.bookingId", "Booking ID")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="text-right">{t("bookings.fare")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isBookingsLoading ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : !bookingsData || bookingsData.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                            {t("users.noBookings", "No ride bookings found for this passenger.")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookingsData.data.map((booking: any) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">#{booking.id}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {booking.createdAt ? format(new Date(booking.createdAt), "MMM d, yyyy") : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {booking.status || t("trips.completed", "Completed")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">${booking.fare || "0.0"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {bookingsData && bookingsData.total > bookingsData.limit && (
                  <div className="pt-4 border-t border-border mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                            className={bookingsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        <PaginationItem className="text-xs text-muted-foreground px-2">
                          {t("common.page", "Page")} {bookingsPage} {t("common.of", "of")} {Math.ceil(bookingsData.total / bookingsData.limit)}
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setBookingsPage(p => p + 1)}
                            className={bookingsPage >= Math.ceil(bookingsData.total / bookingsData.limit) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
