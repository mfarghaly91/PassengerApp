import React from "react";
import { 
  useListNotifications, 
  useSendNotification,
  useMarkNotificationRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Send, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const notificationSchema = z.object({
  userId: z.coerce.number().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message body is required"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: notifications, isLoading } = useListNotifications();

  const sendMutation = useSendNotification();
  const markReadMutation = useMarkNotificationRead();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      userId: 0,
      title: "",
      body: "",
    },
  });

  const onSubmitSend = (data: NotificationFormValues) => {
    sendMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: t("notifications.sent", "Notification sent successfully") });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("notifications.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("notifications.sendAndView", "Send system alerts and view notification history.")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> {t("notifications.sendNewAlert", "Send New Alert")}
            </CardTitle>
            <CardDescription>{t("notifications.dispatchDesc", "Dispatch a push notification to a specific user")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitSend)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("notifications.targetUserId", "Target User ID")}</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g. 1234" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("notifications.notifTitle", "Title")}</FormLabel>
                      <FormControl><Input placeholder={t("notifications.titlePlaceholder", "Trip Update")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("notifications.messageBody", "Message Body")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("notifications.bodyPlaceholder", "Your trip #555 has been delayed by 15 minutes...")} 
                          className="resize-none min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={sendMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" /> {t("notifications.sendNotification", "Send Notification")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> {t("notifications.recentBroadcasts", "Recent Broadcasts")}
            </CardTitle>
            <CardDescription>{t("notifications.recentDesc", "Log of recently dispatched notifications")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pr-2 space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))
            ) : !notifications || notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>{t("notifications.noNotifications")}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-xl border transition-colors ${
                    notification.isRead 
                      ? "bg-card border-border" 
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="font-semibold text-sm leading-tight flex items-center gap-2">
                        {notification.title}
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </h4>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t("notifications.to", "To")}: {t("users.title")} #{notification.userId} • {format(new Date(notification.createdAt), "MMM d, HH:mm")}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        title={t("notifications.markAsRead", "Mark as read")}
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={markReadMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed mt-2 whitespace-pre-wrap">
                    {notification.body}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
