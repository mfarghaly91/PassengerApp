import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Map as MapIcon,
  Bus,
  UserCircle,
  Ticket,
  Wallet,
  Tags,
  Bell,
  Settings,
  LogOut,
  Radio,
  BarChart3,
  MessageSquare,
  Lightbulb,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronRight,
  UsersRound,
  Menu,
  Car,
  Bike,
  PackageOpen,
  BadgeCheck,
  CreditCard,
  Navigation,
} from "lucide-react";

import logoUrl from "/logo.png";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  permission?: string;
  comingSoon?: boolean;
  subItems?: NavItem[];
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const shuttleSubItems: NavItem[] = [
  { title: "nav.overview", href: "/shuttle/dashboard", icon: LayoutDashboard }, // قمنا بتعديل المسار هنا لمنع التداخل مع الرئيسة
  { title: "nav.routes", href: "/routes", icon: MapIcon },
  { title: "nav.drivers", href: "/drivers", icon: UserCircle },
  { title: "nav.buses", href: "/buses", icon: Bus },
  { title: "nav.liveTracking", href: "/live-tracking", icon: Radio },
  { title: "nav.driverAnalytics", href: "/driver-analytics", icon: BarChart3 },
  { title: "nav.bookings", href: "/bookings", icon: Ticket },
];

const carSubItems: NavItem[] = [
  { title: "Drivers", href: "/car/drivers", icon: UserCircle },
  { title: "Rides", href: "/car/rides", icon: Navigation },
  { title: "Live Tracking", href: "/car/live-tracking", icon: Radio },
  { title: "Analytics", href: "/car/analytics", icon: BarChart3 },
  { title: "Bookings", href: "/car/bookings", icon: Ticket },
];

const bikeSubItems: NavItem[] = [
  { title: "Drivers", href: "/bike/drivers", icon: UserCircle },
  { title: "Rides", href: "/bike/rides", icon: Navigation },
  { title: "Live Tracking", href: "/bike/live-tracking", icon: Radio },
  { title: "Analytics", href: "/bike/analytics", icon: BarChart3 },
  { title: "Bookings", href: "/bike/bookings", icon: Ticket },
];

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.dashboard",
    items: [
      { title: "nav.overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "nav.transport", 
    items: [
      { title: "Shuttle Services", icon: Bus, subItems: shuttleSubItems },
      { title: "Car Services", icon: Car, subItems: carSubItems }, 
      { title: "Bike Services", icon: Bike, subItems: bikeSubItems },
    ],
  },
  {
    labelKey: "nav.customers",
    items: [
      { title: "nav.passengers", href: "/users", icon: Users },
      { title: "nav.bookings", href: "/bookings", icon: Ticket },
      { title: "nav.wallets", href: "/wallet", icon: Wallet },
      { title: "nav.promoCodes", href: "/promo", icon: Tags },
    ],
  },
  {
    labelKey: "Finance",
    items: [
      { title: "Subscriptions", href: "/subscriptions", icon: BadgeCheck },
      { title: "Payment Settings", href: "/payment-settings", icon: CreditCard },
    ],
  },
  {
    labelKey: "nav.supportCompliance",
    items: [
      { title: "nav.supportInbox", href: "/support", icon: MessageSquare },
      { title: "nav.suggestions", href: "/suggestions", icon: Lightbulb },
      { title: "nav.driverVerification", href: "/driver-verification", icon: ShieldCheck },
    ],
  },
  {
    labelKey: "nav.system",
    items: [
      { title: "nav.analytics", href: "/analytics", icon: BarChart3 },
      { title: "nav.staffPermissions", href: "/staff", icon: UsersRound },
      { title: "nav.notifications", href: "/notifications", icon: Bell },
      { title: "nav.settings", href: "/settings", icon: Settings },
    ],
  },
];

/* ---------------- NAV ITEM (WITH COLLAPSIBLE SUBITEMS) ---------------- */

function NavItemButton({ item, location, collapsed, isSubItem = false }: any) {
  const Icon = item.icon;
  const { t } = useTranslation();
  const label = item.title.startsWith("nav.") ? t(item.title) : item.title;

  // الآن الحالة تعتمد 100% على ضغطتك للمجلد ولا تفتح تلقائياً وتسبب مشاكل
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isActive = location === item.href;

  const renderButtonContent = () => (
    <div
      className={cn(
        "flex h-9 items-center justify-between rounded-lg px-3 text-sm my-0.5 transition-all cursor-pointer select-none",
        isSubItem ? "pl-8 text-xs text-slate-500" : "text-slate-700 font-medium",
        isActive ? "bg-slate-100 text-slate-900 font-semibold" : "hover:bg-slate-50 hover:text-slate-900"
      )}
      onClick={() => hasSubItems && setIsOpen(!isOpen)}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4 text-slate-500", isSubItem && "h-3.5 w-3.5")} />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && hasSubItems && (
        isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
      )}
    </div>
  );

  if (collapsed) {
    return (
      <div className="w-full flex flex-col items-center">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              {item.href ? (
                <Link href={item.href} className="w-full">{renderButtonContent()}</Link>
              ) : (
                <div className="w-full">{renderButtonContent()}</div>
              )}
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {hasSubItems && isOpen && (
          <div className="w-full bg-slate-50 py-1 flex flex-col gap-1 rounded-md mt-1">
            {item.subItems.map((sub: any) => (
              <NavItemButton
                key={sub.href}
                item={sub}
                location={location}
                collapsed={true}
                isSubItem={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full transition-all">
      {item.href ? (
        <Link href={item.href}>{renderButtonContent()}</Link>
      ) : (
        renderButtonContent()
      )}

      {hasSubItems && isOpen && (
        <div className="mt-0.5 space-y-0.5 border-l border-slate-200 ml-5 transition-all">
          {item.subItems.map((sub: any) => (
            <NavItemButton
              key={sub.href}
              item={sub}
              location={location}
              collapsed={false}
              isSubItem={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- GROUP ---------------- */

function SidebarGroup({ group, location, collapsed }: any) {
  const { t } = useTranslation();
  const label = group.labelKey.startsWith("nav.") ? t(group.labelKey) : group.labelKey;

  return (
    <div className="py-2 px-2 border-b border-slate-100 last:border-b-0">
      {!collapsed && (
        <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-1">
          {label}
        </div>
      )}

      <div className="space-y-0.5">
        {group.items.map((item: any, idx: number) => (
          <NavItemButton
            key={item.href || idx}
            item={item}
            location={location}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- APP LAYOUT ---------------- */

export function AppLayout({ children }: any) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "flex flex-col border-r bg-white h-full transition-all duration-300 select-none",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 border-b min-h-[70px]">
          {!collapsed && (
            <img
              src={logoUrl}
              alt="logo"
              className="h-12 w-auto object-contain"
            />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("h-8 w-8", collapsed && "mx-auto")}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto py-2 px-1">
          {navGroups.map((g) => (
            <SidebarGroup
              key={g.labelKey}
              group={g}
              location={location}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}