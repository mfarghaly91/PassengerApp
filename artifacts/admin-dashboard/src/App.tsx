import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/app-layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Users from "@/pages/users";
import UserDetail from "@/pages/user-detail";
import RoutesList from "@/pages/routes";
import RouteDetail from "@/pages/route-detail";
import Trips from "@/pages/trips";
import Buses from "@/pages/buses";
import Drivers from "@/pages/drivers";
import Bookings from "@/pages/bookings";
import Wallet from "@/pages/wallet";
import Promo from "@/pages/promo";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import LiveTracking from "@/pages/live-tracking";
import DriverAnalytics from "@/pages/driver-analytics";
import Support from "@/pages/support";
import Suggestions from "@/pages/suggestions";
import DriverVerification from "@/pages/driver-verification";
import Staff from "@/pages/staff";
import Subscriptions from "@/pages/subscriptions";
import PaymentSettings from "@/pages/payment-settings";
import Car from "@/pages/car";
import Bike from "@/pages/bike";
import CarDrivers from "@/pages/car-drivers";
import CarRides from "@/pages/car-rides";
import CarLiveTracking from "@/pages/car-live-tracking";
import CarAnalytics from "@/pages/car-analytics";
import CarBookings from "@/pages/car-bookings";
import BikeDrivers from "@/pages/bike-drivers";
import BikeRides from "@/pages/bike-rides";
import BikeLiveTracking from "@/pages/bike-live-tracking";
import BikeAnalytics from "@/pages/bike-analytics";
import BikeBookings from "@/pages/bike-bookings";

const logoutRef = { current: () => {} };

function is401(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 401
  );
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (is401(error)) logoutRef.current();
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (is401(error)) logoutRef.current();
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (is401(error)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function AuthSync() {
  const { logout } = useAuth();
  const logoutFn = useRef(logout);
  useEffect(() => { logoutFn.current = logout; }, [logout]);
  useEffect(() => {
    logoutRef.current = () => logoutFn.current();
  }, []);
  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />

        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
        <Route path="/users/:id" component={() => <ProtectedRoute component={UserDetail} />} />
        <Route path="/routes" component={() => <ProtectedRoute component={RoutesList} />} />
        <Route path="/routes/:id" component={() => <ProtectedRoute component={RouteDetail} />} />
        <Route path="/trips" component={() => <ProtectedRoute component={Trips} />} />
        <Route path="/buses" component={() => <ProtectedRoute component={Buses} />} />
        <Route path="/drivers" component={() => <ProtectedRoute component={Drivers} />} />
        <Route path="/live-tracking" component={() => <ProtectedRoute component={LiveTracking} />} />
        <Route path="/driver-analytics" component={() => <ProtectedRoute component={DriverAnalytics} />} />
        <Route path="/bookings" component={() => <ProtectedRoute component={Bookings} />} />
        <Route path="/wallet" component={() => <ProtectedRoute component={Wallet} />} />
        <Route path="/promo" component={() => <ProtectedRoute component={Promo} />} />
        <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route path="/support" component={() => <ProtectedRoute component={Support} />} />
        <Route path="/suggestions" component={() => <ProtectedRoute component={Suggestions} />} />
        <Route path="/driver-verification" component={() => <ProtectedRoute component={DriverVerification} />} />
        <Route path="/staff" component={() => <ProtectedRoute component={Staff} />} />
        <Route path="/subscriptions" component={() => <ProtectedRoute component={Subscriptions} />} />
        <Route path="/payment-settings" component={() => <ProtectedRoute component={PaymentSettings} />} />

        <Route path="/car" component={() => <ProtectedRoute component={Car} />} />
        <Route path="/car/drivers" component={() => <ProtectedRoute component={CarDrivers} />} />
        <Route path="/car/drivers/:id" component={() => <ProtectedRoute component={UserDetail} />} />
        <Route path="/car/rides" component={() => <ProtectedRoute component={CarRides} />} />
        <Route path="/car/live-tracking" component={() => <ProtectedRoute component={CarLiveTracking} />} />
        <Route path="/car/analytics" component={() => <ProtectedRoute component={CarAnalytics} />} />
        <Route path="/car/bookings" component={() => <ProtectedRoute component={CarBookings} />} />

        <Route path="/bike" component={() => <ProtectedRoute component={Bike} />} />
        <Route path="/bike/drivers" component={() => <ProtectedRoute component={BikeDrivers} />} />
        <Route path="/bike/drivers/:id" component={() => <ProtectedRoute component={UserDetail} />} />
        <Route path="/bike/rides" component={() => <ProtectedRoute component={BikeRides} />} />
        <Route path="/bike/live-tracking" component={() => <ProtectedRoute component={BikeLiveTracking} />} />
        <Route path="/bike/analytics" component={() => <ProtectedRoute component={BikeAnalytics} />} />
        <Route path="/bike/bookings" component={() => <ProtectedRoute component={BikeBookings} />} />

        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AuthSync />
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}