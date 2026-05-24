import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Globe, Moon, Sun, Monitor, LogOut, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { setStoredLanguage, applyDirection } from "@/lib/i18n";
import i18n from "@/lib/i18n";

const NOTIF_KEY = "veego_notif_prefs";

type NotifPrefs = {
  newBookings: boolean;
  tripStatus: boolean;
  driverActivity: boolean;
  supportTickets: boolean;
  driverVerification: boolean;
};

function loadNotifPrefs(): NotifPrefs {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    newBookings: true,
    tripStatus: true,
    driverActivity: false,
    supportTickets: true,
    driverVerification: true,
  };
}

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { logout } = useAuth();

  const [currentLang, setCurrentLang] = useState<string>(() => i18n.language ?? "en");
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(loadNotifPrefs);

  useEffect(() => {
    const handler = (lang: string) => setCurrentLang(lang);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setStoredLanguage(lang);
    applyDirection(lang);
    setCurrentLang(lang);
  };

  const handleNotifToggle = (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    toast({ title: t("settings.notifSaved") });
  };

  const notifRows: [keyof NotifPrefs, string, string][] = [
    ["newBookings",        "notifyNewBookings",  "notifyNewBookingsDesc"],
    ["tripStatus",         "notifyNewTrips",     "notifyNewTripsDesc"],
    ["driverActivity",     "notifyDriverLogin",  "notifyDriverLoginDesc"],
    ["supportTickets",     "notifySupport",      "notifySupportDesc"],
    ["driverVerification", "notifyVerification", "notifyVerificationDesc"],
  ];

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            {t("settings.appearance")}
          </CardTitle>
          <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language switcher */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">{t("settings.language")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("settings.languageDesc")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={currentLang === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("en")}
                className="min-w-[110px]"
              >
                🇬🇧 {t("settings.english")}
              </Button>
              <Button
                variant={currentLang === "ar" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLanguageChange("ar")}
                className="min-w-[110px]"
              >
                🇸🇦 {t("settings.arabic")}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">{t("settings.theme")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("settings.themeDesc")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="gap-1.5"
              >
                <Sun className="h-3.5 w-3.5" />
                {t("settings.themeLight")}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="gap-1.5"
              >
                <Moon className="h-3.5 w-3.5" />
                {t("settings.themeDark")}
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="gap-1.5"
              >
                <Monitor className="h-3.5 w-3.5" />
                {t("settings.themeSystem")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            {t("settings.notifications")}
          </CardTitle>
          <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifRows.map(([key, labelKey, descKey], i) => (
            <React.Fragment key={key}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t(`settings.${labelKey}`)}</Label>
                  <p className="text-xs text-muted-foreground">{t(`settings.${descKey}`)}</p>
                </div>
                <Switch
                  checked={notifPrefs[key]}
                  onCheckedChange={(v) => handleNotifToggle(key, v)}
                />
              </div>
              {i < notifRows.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-4 w-4" />
            {t("settings.session")}
          </CardTitle>
          <CardDescription>{t("settings.sessionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">{t("settings.signOutBtn")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("settings.signOutDesc")}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={logout} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              {t("settings.signOutBtn")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
