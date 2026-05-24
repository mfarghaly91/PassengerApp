import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AdminUserUpdate, Analytics, AuthResponse, Booking, BookingInput, BookingsPage, Bus, BusInput, BusUpdate, BusesPage, Driver, DriverAnalytics, DriverAuthResponse, DriverCancelTripInput, DriverEarningsHistory, DriverEarningsSummary, DriverInput, DriverLocationInput, DriverLoginInput, DriverProfile, DriverTripDetail, DriverTripList, DriverUpdate, DriversPage, ErrorResponse, GetDriverEarningsHistoryParams, HealthStatus, ListAdminUsersParams, ListAllTransactionsParams, ListBookingsParams, ListBusesParams, ListDriverTripsParams, ListDriversParams, ListPromoCodesParams, ListRoutesParams, ListTripsParams, ListWalletTransactionsParams, LiveDriverList, LoginInput, Notification, NotificationInput, NotificationList, OkResponse, PromoCode, PromoCodeInput, PromoCodeUpdate, PromoCodesPage, PromoValidateInput, RefreshTokenInput, RefundInput, RegisterInput, Route, RouteInput, RouteUpdate, RoutesPage, Station, StationInput, StationProgress, StationUpdate, Trip, TripInput, TripStationList, TripUpdate, TripsPage, User, UserProfileUpdate, UsersPage, Wallet, WalletTransaction, WalletTransactionsPage } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRegisterUrl: () => string;
/**
 * @summary Register a new user
 */
export declare const register: (registerInput: RegisterInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterInput>;
export type RegisterMutationError = ErrorType<ErrorResponse>;
/**
* @summary Register a new user
*/
export declare const useRegister: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export declare const getLoginUrl: () => string;
/**
 * @summary Login
 */
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
* @summary Login
*/
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export declare const getRefreshTokenUrl: () => string;
/**
 * @summary Refresh access token
 */
export declare const refreshToken: (refreshTokenInput: RefreshTokenInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRefreshTokenMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshTokenInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshTokenInput>;
}, TContext>;
export type RefreshTokenMutationResult = NonNullable<Awaited<ReturnType<typeof refreshToken>>>;
export type RefreshTokenMutationBody = BodyType<RefreshTokenInput>;
export type RefreshTokenMutationError = ErrorType<ErrorResponse>;
/**
* @summary Refresh access token
*/
export declare const useRefreshToken: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshTokenInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshTokenInput>;
}, TContext>;
export declare const getGetMeUrl: () => string;
/**
 * @summary Get current user
 */
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetUserProfileUrl: () => string;
/**
 * @summary Get my profile
 */
export declare const getUserProfile: (options?: RequestInit) => Promise<User>;
export declare const getGetUserProfileQueryKey: () => readonly ["/api/users/me"];
export declare const getGetUserProfileQueryOptions: <TData = Awaited<ReturnType<typeof getUserProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;
export type GetUserProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get my profile
 */
export declare function useGetUserProfile<TData = Awaited<ReturnType<typeof getUserProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateUserProfileUrl: () => string;
/**
 * @summary Update my profile
 */
export declare const updateUserProfile: (userProfileUpdate: UserProfileUpdate, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
        data: BodyType<UserProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
    data: BodyType<UserProfileUpdate>;
}, TContext>;
export type UpdateUserProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateUserProfile>>>;
export type UpdateUserProfileMutationBody = BodyType<UserProfileUpdate>;
export type UpdateUserProfileMutationError = ErrorType<unknown>;
/**
* @summary Update my profile
*/
export declare const useUpdateUserProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
        data: BodyType<UserProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
    data: BodyType<UserProfileUpdate>;
}, TContext>;
export declare const getGetMyBookingsUrl: () => string;
/**
 * @summary Get my bookings
 */
export declare const getMyBookings: (options?: RequestInit) => Promise<Booking[]>;
export declare const getGetMyBookingsQueryKey: () => readonly ["/api/users/me/bookings"];
export declare const getGetMyBookingsQueryOptions: <TData = Awaited<ReturnType<typeof getMyBookings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyBookings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyBookings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyBookingsQueryResult = NonNullable<Awaited<ReturnType<typeof getMyBookings>>>;
export type GetMyBookingsQueryError = ErrorType<unknown>;
/**
 * @summary Get my bookings
 */
export declare function useGetMyBookings<TData = Awaited<ReturnType<typeof getMyBookings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyBookings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListRoutesUrl: (params?: ListRoutesParams) => string;
/**
 * @summary List shuttle routes
 */
export declare const listRoutes: (params?: ListRoutesParams, options?: RequestInit) => Promise<RoutesPage>;
export declare const getListRoutesQueryKey: (params?: ListRoutesParams) => readonly ["/api/routes", ...ListRoutesParams[]];
export declare const getListRoutesQueryOptions: <TData = Awaited<ReturnType<typeof listRoutes>>, TError = ErrorType<unknown>>(params?: ListRoutesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRoutes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRoutes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListRoutesQueryResult = NonNullable<Awaited<ReturnType<typeof listRoutes>>>;
export type ListRoutesQueryError = ErrorType<unknown>;
/**
 * @summary List shuttle routes
 */
export declare function useListRoutes<TData = Awaited<ReturnType<typeof listRoutes>>, TError = ErrorType<unknown>>(params?: ListRoutesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRoutes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateRouteUrl: () => string;
/**
 * @summary Create a route (admin)
 */
export declare const createRoute: (routeInput: RouteInput, options?: RequestInit) => Promise<Route>;
export declare const getCreateRouteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRoute>>, TError, {
        data: BodyType<RouteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createRoute>>, TError, {
    data: BodyType<RouteInput>;
}, TContext>;
export type CreateRouteMutationResult = NonNullable<Awaited<ReturnType<typeof createRoute>>>;
export type CreateRouteMutationBody = BodyType<RouteInput>;
export type CreateRouteMutationError = ErrorType<unknown>;
/**
* @summary Create a route (admin)
*/
export declare const useCreateRoute: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRoute>>, TError, {
        data: BodyType<RouteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createRoute>>, TError, {
    data: BodyType<RouteInput>;
}, TContext>;
export declare const getGetRouteUrl: (id: number) => string;
/**
 * @summary Get a route
 */
export declare const getRoute: (id: number, options?: RequestInit) => Promise<Route>;
export declare const getGetRouteQueryKey: (id: number) => readonly [`/api/routes/${number}`];
export declare const getGetRouteQueryOptions: <TData = Awaited<ReturnType<typeof getRoute>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRoute>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRoute>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRouteQueryResult = NonNullable<Awaited<ReturnType<typeof getRoute>>>;
export type GetRouteQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a route
 */
export declare function useGetRoute<TData = Awaited<ReturnType<typeof getRoute>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRoute>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateRouteUrl: (id: number) => string;
/**
 * @summary Update a route (admin)
 */
export declare const updateRoute: (id: number, routeUpdate: RouteUpdate, options?: RequestInit) => Promise<Route>;
export declare const getUpdateRouteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRoute>>, TError, {
        id: number;
        data: BodyType<RouteUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRoute>>, TError, {
    id: number;
    data: BodyType<RouteUpdate>;
}, TContext>;
export type UpdateRouteMutationResult = NonNullable<Awaited<ReturnType<typeof updateRoute>>>;
export type UpdateRouteMutationBody = BodyType<RouteUpdate>;
export type UpdateRouteMutationError = ErrorType<unknown>;
/**
* @summary Update a route (admin)
*/
export declare const useUpdateRoute: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRoute>>, TError, {
        id: number;
        data: BodyType<RouteUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRoute>>, TError, {
    id: number;
    data: BodyType<RouteUpdate>;
}, TContext>;
export declare const getDeleteRouteUrl: (id: number) => string;
/**
 * @summary Delete a route (admin)
 */
export declare const deleteRoute: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteRouteMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRoute>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteRoute>>, TError, {
    id: number;
}, TContext>;
export type DeleteRouteMutationResult = NonNullable<Awaited<ReturnType<typeof deleteRoute>>>;
export type DeleteRouteMutationError = ErrorType<unknown>;
/**
* @summary Delete a route (admin)
*/
export declare const useDeleteRoute: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteRoute>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteRoute>>, TError, {
    id: number;
}, TContext>;
export declare const getGetRouteStationsUrl: (id: number) => string;
/**
 * @summary Get stations for a route
 */
export declare const getRouteStations: (id: number, options?: RequestInit) => Promise<Station[]>;
export declare const getGetRouteStationsQueryKey: (id: number) => readonly [`/api/routes/${number}/stations`];
export declare const getGetRouteStationsQueryOptions: <TData = Awaited<ReturnType<typeof getRouteStations>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRouteStations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRouteStations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRouteStationsQueryResult = NonNullable<Awaited<ReturnType<typeof getRouteStations>>>;
export type GetRouteStationsQueryError = ErrorType<unknown>;
/**
 * @summary Get stations for a route
 */
export declare function useGetRouteStations<TData = Awaited<ReturnType<typeof getRouteStations>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRouteStations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAddStationUrl: (id: number) => string;
/**
 * @summary Add a station to a route (admin)
 */
export declare const addStation: (id: number, stationInput: StationInput, options?: RequestInit) => Promise<Station>;
export declare const getAddStationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addStation>>, TError, {
        id: number;
        data: BodyType<StationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addStation>>, TError, {
    id: number;
    data: BodyType<StationInput>;
}, TContext>;
export type AddStationMutationResult = NonNullable<Awaited<ReturnType<typeof addStation>>>;
export type AddStationMutationBody = BodyType<StationInput>;
export type AddStationMutationError = ErrorType<unknown>;
/**
* @summary Add a station to a route (admin)
*/
export declare const useAddStation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addStation>>, TError, {
        id: number;
        data: BodyType<StationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addStation>>, TError, {
    id: number;
    data: BodyType<StationInput>;
}, TContext>;
export declare const getUpdateStationUrl: (id: number, stationId: number) => string;
/**
 * @summary Update a station (admin)
 */
export declare const updateStation: (id: number, stationId: number, stationUpdate: StationUpdate, options?: RequestInit) => Promise<Station>;
export declare const getUpdateStationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateStation>>, TError, {
        id: number;
        stationId: number;
        data: BodyType<StationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateStation>>, TError, {
    id: number;
    stationId: number;
    data: BodyType<StationUpdate>;
}, TContext>;
export type UpdateStationMutationResult = NonNullable<Awaited<ReturnType<typeof updateStation>>>;
export type UpdateStationMutationBody = BodyType<StationUpdate>;
export type UpdateStationMutationError = ErrorType<unknown>;
/**
* @summary Update a station (admin)
*/
export declare const useUpdateStation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateStation>>, TError, {
        id: number;
        stationId: number;
        data: BodyType<StationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateStation>>, TError, {
    id: number;
    stationId: number;
    data: BodyType<StationUpdate>;
}, TContext>;
export declare const getDeleteStationUrl: (id: number, stationId: number) => string;
/**
 * @summary Delete a station (admin)
 */
export declare const deleteStation: (id: number, stationId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteStationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteStation>>, TError, {
        id: number;
        stationId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteStation>>, TError, {
    id: number;
    stationId: number;
}, TContext>;
export type DeleteStationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteStation>>>;
export type DeleteStationMutationError = ErrorType<unknown>;
/**
* @summary Delete a station (admin)
*/
export declare const useDeleteStation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteStation>>, TError, {
        id: number;
        stationId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteStation>>, TError, {
    id: number;
    stationId: number;
}, TContext>;
export declare const getListTripsUrl: (params?: ListTripsParams) => string;
/**
 * @summary List trips
 */
export declare const listTrips: (params?: ListTripsParams, options?: RequestInit) => Promise<TripsPage>;
export declare const getListTripsQueryKey: (params?: ListTripsParams) => readonly ["/api/trips", ...ListTripsParams[]];
export declare const getListTripsQueryOptions: <TData = Awaited<ReturnType<typeof listTrips>>, TError = ErrorType<unknown>>(params?: ListTripsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTrips>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTrips>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTripsQueryResult = NonNullable<Awaited<ReturnType<typeof listTrips>>>;
export type ListTripsQueryError = ErrorType<unknown>;
/**
 * @summary List trips
 */
export declare function useListTrips<TData = Awaited<ReturnType<typeof listTrips>>, TError = ErrorType<unknown>>(params?: ListTripsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTrips>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTripUrl: () => string;
/**
 * @summary Create a trip (admin)
 */
export declare const createTrip: (tripInput: TripInput, options?: RequestInit) => Promise<Trip>;
export declare const getCreateTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTrip>>, TError, {
        data: BodyType<TripInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTrip>>, TError, {
    data: BodyType<TripInput>;
}, TContext>;
export type CreateTripMutationResult = NonNullable<Awaited<ReturnType<typeof createTrip>>>;
export type CreateTripMutationBody = BodyType<TripInput>;
export type CreateTripMutationError = ErrorType<unknown>;
/**
* @summary Create a trip (admin)
*/
export declare const useCreateTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTrip>>, TError, {
        data: BodyType<TripInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTrip>>, TError, {
    data: BodyType<TripInput>;
}, TContext>;
export declare const getGetTripUrl: (id: number) => string;
/**
 * @summary Get a trip
 */
export declare const getTrip: (id: number, options?: RequestInit) => Promise<Trip>;
export declare const getGetTripQueryKey: (id: number) => readonly [`/api/trips/${number}`];
export declare const getGetTripQueryOptions: <TData = Awaited<ReturnType<typeof getTrip>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrip>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTrip>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTripQueryResult = NonNullable<Awaited<ReturnType<typeof getTrip>>>;
export type GetTripQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a trip
 */
export declare function useGetTrip<TData = Awaited<ReturnType<typeof getTrip>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrip>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateTripUrl: (id: number) => string;
/**
 * @summary Update a trip (admin)
 */
export declare const updateTrip: (id: number, tripUpdate: TripUpdate, options?: RequestInit) => Promise<Trip>;
export declare const getUpdateTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTrip>>, TError, {
        id: number;
        data: BodyType<TripUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTrip>>, TError, {
    id: number;
    data: BodyType<TripUpdate>;
}, TContext>;
export type UpdateTripMutationResult = NonNullable<Awaited<ReturnType<typeof updateTrip>>>;
export type UpdateTripMutationBody = BodyType<TripUpdate>;
export type UpdateTripMutationError = ErrorType<unknown>;
/**
* @summary Update a trip (admin)
*/
export declare const useUpdateTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTrip>>, TError, {
        id: number;
        data: BodyType<TripUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTrip>>, TError, {
    id: number;
    data: BodyType<TripUpdate>;
}, TContext>;
export declare const getCancelTripUrl: (id: number) => string;
/**
 * @summary Cancel a trip (admin)
 */
export declare const cancelTrip: (id: number, options?: RequestInit) => Promise<Trip>;
export declare const getCancelTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelTrip>>, TError, {
    id: number;
}, TContext>;
export type CancelTripMutationResult = NonNullable<Awaited<ReturnType<typeof cancelTrip>>>;
export type CancelTripMutationError = ErrorType<unknown>;
/**
* @summary Cancel a trip (admin)
*/
export declare const useCancelTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelTrip>>, TError, {
    id: number;
}, TContext>;
export declare const getListBusesUrl: (params?: ListBusesParams) => string;
/**
 * @summary List buses (admin)
 */
export declare const listBuses: (params?: ListBusesParams, options?: RequestInit) => Promise<BusesPage>;
export declare const getListBusesQueryKey: (params?: ListBusesParams) => readonly ["/api/buses", ...ListBusesParams[]];
export declare const getListBusesQueryOptions: <TData = Awaited<ReturnType<typeof listBuses>>, TError = ErrorType<unknown>>(params?: ListBusesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBuses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBuses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBusesQueryResult = NonNullable<Awaited<ReturnType<typeof listBuses>>>;
export type ListBusesQueryError = ErrorType<unknown>;
/**
 * @summary List buses (admin)
 */
export declare function useListBuses<TData = Awaited<ReturnType<typeof listBuses>>, TError = ErrorType<unknown>>(params?: ListBusesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBuses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateBusUrl: () => string;
/**
 * @summary Create a bus (admin)
 */
export declare const createBus: (busInput: BusInput, options?: RequestInit) => Promise<Bus>;
export declare const getCreateBusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBus>>, TError, {
        data: BodyType<BusInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createBus>>, TError, {
    data: BodyType<BusInput>;
}, TContext>;
export type CreateBusMutationResult = NonNullable<Awaited<ReturnType<typeof createBus>>>;
export type CreateBusMutationBody = BodyType<BusInput>;
export type CreateBusMutationError = ErrorType<unknown>;
/**
* @summary Create a bus (admin)
*/
export declare const useCreateBus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBus>>, TError, {
        data: BodyType<BusInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createBus>>, TError, {
    data: BodyType<BusInput>;
}, TContext>;
export declare const getGetBusUrl: (id: number) => string;
/**
 * @summary Get a bus
 */
export declare const getBus: (id: number, options?: RequestInit) => Promise<Bus>;
export declare const getGetBusQueryKey: (id: number) => readonly [`/api/buses/${number}`];
export declare const getGetBusQueryOptions: <TData = Awaited<ReturnType<typeof getBus>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusQueryResult = NonNullable<Awaited<ReturnType<typeof getBus>>>;
export type GetBusQueryError = ErrorType<unknown>;
/**
 * @summary Get a bus
 */
export declare function useGetBus<TData = Awaited<ReturnType<typeof getBus>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateBusUrl: (id: number) => string;
/**
 * @summary Update a bus (admin)
 */
export declare const updateBus: (id: number, busUpdate: BusUpdate, options?: RequestInit) => Promise<Bus>;
export declare const getUpdateBusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBus>>, TError, {
        id: number;
        data: BodyType<BusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateBus>>, TError, {
    id: number;
    data: BodyType<BusUpdate>;
}, TContext>;
export type UpdateBusMutationResult = NonNullable<Awaited<ReturnType<typeof updateBus>>>;
export type UpdateBusMutationBody = BodyType<BusUpdate>;
export type UpdateBusMutationError = ErrorType<unknown>;
/**
* @summary Update a bus (admin)
*/
export declare const useUpdateBus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBus>>, TError, {
        id: number;
        data: BodyType<BusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateBus>>, TError, {
    id: number;
    data: BodyType<BusUpdate>;
}, TContext>;
export declare const getDeleteBusUrl: (id: number) => string;
/**
 * @summary Delete a bus (admin)
 */
export declare const deleteBus: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteBusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBus>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteBus>>, TError, {
    id: number;
}, TContext>;
export type DeleteBusMutationResult = NonNullable<Awaited<ReturnType<typeof deleteBus>>>;
export type DeleteBusMutationError = ErrorType<unknown>;
/**
* @summary Delete a bus (admin)
*/
export declare const useDeleteBus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBus>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteBus>>, TError, {
    id: number;
}, TContext>;
export declare const getListDriversUrl: (params?: ListDriversParams) => string;
/**
 * @summary List drivers (admin)
 */
export declare const listDrivers: (params?: ListDriversParams, options?: RequestInit) => Promise<DriversPage>;
export declare const getListDriversQueryKey: (params?: ListDriversParams) => readonly ["/api/drivers", ...ListDriversParams[]];
export declare const getListDriversQueryOptions: <TData = Awaited<ReturnType<typeof listDrivers>>, TError = ErrorType<unknown>>(params?: ListDriversParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDrivers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDrivers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDriversQueryResult = NonNullable<Awaited<ReturnType<typeof listDrivers>>>;
export type ListDriversQueryError = ErrorType<unknown>;
/**
 * @summary List drivers (admin)
 */
export declare function useListDrivers<TData = Awaited<ReturnType<typeof listDrivers>>, TError = ErrorType<unknown>>(params?: ListDriversParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDrivers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateDriverUrl: () => string;
/**
 * @summary Create a driver (admin)
 */
export declare const createDriver: (driverInput: DriverInput, options?: RequestInit) => Promise<Driver>;
export declare const getCreateDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDriver>>, TError, {
        data: BodyType<DriverInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDriver>>, TError, {
    data: BodyType<DriverInput>;
}, TContext>;
export type CreateDriverMutationResult = NonNullable<Awaited<ReturnType<typeof createDriver>>>;
export type CreateDriverMutationBody = BodyType<DriverInput>;
export type CreateDriverMutationError = ErrorType<unknown>;
/**
* @summary Create a driver (admin)
*/
export declare const useCreateDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDriver>>, TError, {
        data: BodyType<DriverInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDriver>>, TError, {
    data: BodyType<DriverInput>;
}, TContext>;
export declare const getGetDriverUrl: (id: number) => string;
/**
 * @summary Get a driver
 */
export declare const getDriver: (id: number, options?: RequestInit) => Promise<Driver>;
export declare const getGetDriverQueryKey: (id: number) => readonly [`/api/drivers/${number}`];
export declare const getGetDriverQueryOptions: <TData = Awaited<ReturnType<typeof getDriver>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriver>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriver>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverQueryResult = NonNullable<Awaited<ReturnType<typeof getDriver>>>;
export type GetDriverQueryError = ErrorType<unknown>;
/**
 * @summary Get a driver
 */
export declare function useGetDriver<TData = Awaited<ReturnType<typeof getDriver>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriver>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateDriverUrl: (id: number) => string;
/**
 * @summary Update a driver (admin)
 */
export declare const updateDriver: (id: number, driverUpdate: DriverUpdate, options?: RequestInit) => Promise<Driver>;
export declare const getUpdateDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriver>>, TError, {
        id: number;
        data: BodyType<DriverUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDriver>>, TError, {
    id: number;
    data: BodyType<DriverUpdate>;
}, TContext>;
export type UpdateDriverMutationResult = NonNullable<Awaited<ReturnType<typeof updateDriver>>>;
export type UpdateDriverMutationBody = BodyType<DriverUpdate>;
export type UpdateDriverMutationError = ErrorType<unknown>;
/**
* @summary Update a driver (admin)
*/
export declare const useUpdateDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriver>>, TError, {
        id: number;
        data: BodyType<DriverUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDriver>>, TError, {
    id: number;
    data: BodyType<DriverUpdate>;
}, TContext>;
export declare const getDeleteDriverUrl: (id: number) => string;
/**
 * @summary Delete a driver (admin)
 */
export declare const deleteDriver: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDriver>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDriver>>, TError, {
    id: number;
}, TContext>;
export type DeleteDriverMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDriver>>>;
export type DeleteDriverMutationError = ErrorType<unknown>;
/**
* @summary Delete a driver (admin)
*/
export declare const useDeleteDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDriver>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDriver>>, TError, {
    id: number;
}, TContext>;
export declare const getGetDriverProfileUrl: () => string;
/**
 * @summary Get my driver profile
 */
export declare const getDriverProfile: (options?: RequestInit) => Promise<Driver>;
export declare const getGetDriverProfileQueryKey: () => readonly ["/api/drivers/me"];
export declare const getGetDriverProfileQueryOptions: <TData = Awaited<ReturnType<typeof getDriverProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverProfile>>>;
export type GetDriverProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get my driver profile
 */
export declare function useGetDriverProfile<TData = Awaited<ReturnType<typeof getDriverProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateDriverLocationUrl: () => string;
/**
 * @summary Update driver GPS location
 */
export declare const updateDriverLocation: (driverLocationInput: DriverLocationInput, options?: RequestInit) => Promise<DriverProfile>;
export declare const getUpdateDriverLocationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriverLocation>>, TError, {
        data: BodyType<DriverLocationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDriverLocation>>, TError, {
    data: BodyType<DriverLocationInput>;
}, TContext>;
export type UpdateDriverLocationMutationResult = NonNullable<Awaited<ReturnType<typeof updateDriverLocation>>>;
export type UpdateDriverLocationMutationBody = BodyType<DriverLocationInput>;
export type UpdateDriverLocationMutationError = ErrorType<unknown>;
/**
* @summary Update driver GPS location
*/
export declare const useUpdateDriverLocation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriverLocation>>, TError, {
        data: BodyType<DriverLocationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDriverLocation>>, TError, {
    data: BodyType<DriverLocationInput>;
}, TContext>;
export declare const getListBookingsUrl: (params?: ListBookingsParams) => string;
/**
 * @summary List all bookings (admin)
 */
export declare const listBookings: (params?: ListBookingsParams, options?: RequestInit) => Promise<BookingsPage>;
export declare const getListBookingsQueryKey: (params?: ListBookingsParams) => readonly ["/api/bookings", ...ListBookingsParams[]];
export declare const getListBookingsQueryOptions: <TData = Awaited<ReturnType<typeof listBookings>>, TError = ErrorType<unknown>>(params?: ListBookingsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBookings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBookings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBookingsQueryResult = NonNullable<Awaited<ReturnType<typeof listBookings>>>;
export type ListBookingsQueryError = ErrorType<unknown>;
/**
 * @summary List all bookings (admin)
 */
export declare function useListBookings<TData = Awaited<ReturnType<typeof listBookings>>, TError = ErrorType<unknown>>(params?: ListBookingsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBookings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateBookingUrl: () => string;
/**
 * @summary Create a booking
 */
export declare const createBooking: (bookingInput: BookingInput, options?: RequestInit) => Promise<Booking>;
export declare const getCreateBookingMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBooking>>, TError, {
        data: BodyType<BookingInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createBooking>>, TError, {
    data: BodyType<BookingInput>;
}, TContext>;
export type CreateBookingMutationResult = NonNullable<Awaited<ReturnType<typeof createBooking>>>;
export type CreateBookingMutationBody = BodyType<BookingInput>;
export type CreateBookingMutationError = ErrorType<ErrorResponse>;
/**
* @summary Create a booking
*/
export declare const useCreateBooking: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBooking>>, TError, {
        data: BodyType<BookingInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createBooking>>, TError, {
    data: BodyType<BookingInput>;
}, TContext>;
export declare const getGetBookingUrl: (id: number) => string;
/**
 * @summary Get a booking
 */
export declare const getBooking: (id: number, options?: RequestInit) => Promise<Booking>;
export declare const getGetBookingQueryKey: (id: number) => readonly [`/api/bookings/${number}`];
export declare const getGetBookingQueryOptions: <TData = Awaited<ReturnType<typeof getBooking>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBooking>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBooking>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBookingQueryResult = NonNullable<Awaited<ReturnType<typeof getBooking>>>;
export type GetBookingQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a booking
 */
export declare function useGetBooking<TData = Awaited<ReturnType<typeof getBooking>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBooking>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCancelBookingUrl: (id: number) => string;
/**
 * @summary Cancel a booking
 */
export declare const cancelBooking: (id: number, options?: RequestInit) => Promise<Booking>;
export declare const getCancelBookingMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelBooking>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelBooking>>, TError, {
    id: number;
}, TContext>;
export type CancelBookingMutationResult = NonNullable<Awaited<ReturnType<typeof cancelBooking>>>;
export type CancelBookingMutationError = ErrorType<unknown>;
/**
* @summary Cancel a booking
*/
export declare const useCancelBooking: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelBooking>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelBooking>>, TError, {
    id: number;
}, TContext>;
export declare const getGetWalletUrl: () => string;
/**
 * @summary Get my wallet
 */
export declare const getWallet: (options?: RequestInit) => Promise<Wallet>;
export declare const getGetWalletQueryKey: () => readonly ["/api/wallet"];
export declare const getGetWalletQueryOptions: <TData = Awaited<ReturnType<typeof getWallet>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWallet>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWallet>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWalletQueryResult = NonNullable<Awaited<ReturnType<typeof getWallet>>>;
export type GetWalletQueryError = ErrorType<unknown>;
/**
 * @summary Get my wallet
 */
export declare function useGetWallet<TData = Awaited<ReturnType<typeof getWallet>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWallet>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListWalletTransactionsUrl: (params?: ListWalletTransactionsParams) => string;
/**
 * @summary List my wallet transactions
 */
export declare const listWalletTransactions: (params?: ListWalletTransactionsParams, options?: RequestInit) => Promise<WalletTransactionsPage>;
export declare const getListWalletTransactionsQueryKey: (params?: ListWalletTransactionsParams) => readonly ["/api/wallet/transactions", ...ListWalletTransactionsParams[]];
export declare const getListWalletTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof listWalletTransactions>>, TError = ErrorType<unknown>>(params?: ListWalletTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWalletTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listWalletTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListWalletTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof listWalletTransactions>>>;
export type ListWalletTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary List my wallet transactions
 */
export declare function useListWalletTransactions<TData = Awaited<ReturnType<typeof listWalletTransactions>>, TError = ErrorType<unknown>>(params?: ListWalletTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listWalletTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getValidatePromoCodeUrl: () => string;
/**
 * @summary Validate a promo code
 */
export declare const validatePromoCode: (promoValidateInput: PromoValidateInput, options?: RequestInit) => Promise<PromoCode>;
export declare const getValidatePromoCodeMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof validatePromoCode>>, TError, {
        data: BodyType<PromoValidateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof validatePromoCode>>, TError, {
    data: BodyType<PromoValidateInput>;
}, TContext>;
export type ValidatePromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof validatePromoCode>>>;
export type ValidatePromoCodeMutationBody = BodyType<PromoValidateInput>;
export type ValidatePromoCodeMutationError = ErrorType<ErrorResponse>;
/**
* @summary Validate a promo code
*/
export declare const useValidatePromoCode: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof validatePromoCode>>, TError, {
        data: BodyType<PromoValidateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof validatePromoCode>>, TError, {
    data: BodyType<PromoValidateInput>;
}, TContext>;
export declare const getListPromoCodesUrl: (params?: ListPromoCodesParams) => string;
/**
 * @summary List promo codes (admin)
 */
export declare const listPromoCodes: (params?: ListPromoCodesParams, options?: RequestInit) => Promise<PromoCodesPage>;
export declare const getListPromoCodesQueryKey: (params?: ListPromoCodesParams) => readonly ["/api/promo", ...ListPromoCodesParams[]];
export declare const getListPromoCodesQueryOptions: <TData = Awaited<ReturnType<typeof listPromoCodes>>, TError = ErrorType<unknown>>(params?: ListPromoCodesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPromoCodes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPromoCodes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPromoCodesQueryResult = NonNullable<Awaited<ReturnType<typeof listPromoCodes>>>;
export type ListPromoCodesQueryError = ErrorType<unknown>;
/**
 * @summary List promo codes (admin)
 */
export declare function useListPromoCodes<TData = Awaited<ReturnType<typeof listPromoCodes>>, TError = ErrorType<unknown>>(params?: ListPromoCodesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPromoCodes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePromoCodeUrl: () => string;
/**
 * @summary Create a promo code (admin)
 */
export declare const createPromoCode: (promoCodeInput: PromoCodeInput, options?: RequestInit) => Promise<PromoCode>;
export declare const getCreatePromoCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPromoCode>>, TError, {
        data: BodyType<PromoCodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPromoCode>>, TError, {
    data: BodyType<PromoCodeInput>;
}, TContext>;
export type CreatePromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof createPromoCode>>>;
export type CreatePromoCodeMutationBody = BodyType<PromoCodeInput>;
export type CreatePromoCodeMutationError = ErrorType<unknown>;
/**
* @summary Create a promo code (admin)
*/
export declare const useCreatePromoCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPromoCode>>, TError, {
        data: BodyType<PromoCodeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPromoCode>>, TError, {
    data: BodyType<PromoCodeInput>;
}, TContext>;
export declare const getUpdatePromoCodeUrl: (id: number) => string;
/**
 * @summary Update a promo code (admin)
 */
export declare const updatePromoCode: (id: number, promoCodeUpdate: PromoCodeUpdate, options?: RequestInit) => Promise<PromoCode>;
export declare const getUpdatePromoCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePromoCode>>, TError, {
        id: number;
        data: BodyType<PromoCodeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePromoCode>>, TError, {
    id: number;
    data: BodyType<PromoCodeUpdate>;
}, TContext>;
export type UpdatePromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof updatePromoCode>>>;
export type UpdatePromoCodeMutationBody = BodyType<PromoCodeUpdate>;
export type UpdatePromoCodeMutationError = ErrorType<unknown>;
/**
* @summary Update a promo code (admin)
*/
export declare const useUpdatePromoCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePromoCode>>, TError, {
        id: number;
        data: BodyType<PromoCodeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePromoCode>>, TError, {
    id: number;
    data: BodyType<PromoCodeUpdate>;
}, TContext>;
export declare const getDeletePromoCodeUrl: (id: number) => string;
/**
 * @summary Delete a promo code (admin)
 */
export declare const deletePromoCode: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePromoCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePromoCode>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePromoCode>>, TError, {
    id: number;
}, TContext>;
export type DeletePromoCodeMutationResult = NonNullable<Awaited<ReturnType<typeof deletePromoCode>>>;
export type DeletePromoCodeMutationError = ErrorType<unknown>;
/**
* @summary Delete a promo code (admin)
*/
export declare const useDeletePromoCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePromoCode>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePromoCode>>, TError, {
    id: number;
}, TContext>;
export declare const getListNotificationsUrl: () => string;
/**
 * @summary Get my notifications
 */
export declare const listNotifications: (options?: RequestInit) => Promise<Notification[]>;
export declare const getListNotificationsQueryKey: () => readonly ["/api/notifications"];
export declare const getListNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listNotifications>>>;
export type ListNotificationsQueryError = ErrorType<unknown>;
/**
 * @summary Get my notifications
 */
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendNotificationUrl: () => string;
/**
 * @summary Send notification (admin)
 */
export declare const sendNotification: (notificationInput: NotificationInput, options?: RequestInit) => Promise<Notification>;
export declare const getSendNotificationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendNotification>>, TError, {
        data: BodyType<NotificationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendNotification>>, TError, {
    data: BodyType<NotificationInput>;
}, TContext>;
export type SendNotificationMutationResult = NonNullable<Awaited<ReturnType<typeof sendNotification>>>;
export type SendNotificationMutationBody = BodyType<NotificationInput>;
export type SendNotificationMutationError = ErrorType<unknown>;
/**
* @summary Send notification (admin)
*/
export declare const useSendNotification: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendNotification>>, TError, {
        data: BodyType<NotificationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendNotification>>, TError, {
    data: BodyType<NotificationInput>;
}, TContext>;
export declare const getMarkNotificationReadUrl: (id: number) => string;
/**
 * @summary Mark notification as read
 */
export declare const markNotificationRead: (id: number, options?: RequestInit) => Promise<Notification>;
export declare const getMarkNotificationReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    id: number;
}, TContext>;
export type MarkNotificationReadMutationResult = NonNullable<Awaited<ReturnType<typeof markNotificationRead>>>;
export type MarkNotificationReadMutationError = ErrorType<unknown>;
/**
* @summary Mark notification as read
*/
export declare const useMarkNotificationRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    id: number;
}, TContext>;
export declare const getGetAnalyticsUrl: () => string;
/**
 * @summary Get dashboard analytics (admin)
 */
export declare const getAnalytics: (options?: RequestInit) => Promise<Analytics>;
export declare const getGetAnalyticsQueryKey: () => readonly ["/api/admin/analytics"];
export declare const getGetAnalyticsQueryOptions: <TData = Awaited<ReturnType<typeof getAnalytics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAnalytics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAnalyticsQueryResult = NonNullable<Awaited<ReturnType<typeof getAnalytics>>>;
export type GetAnalyticsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard analytics (admin)
 */
export declare function useGetAnalytics<TData = Awaited<ReturnType<typeof getAnalytics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAdminUsersUrl: (params?: ListAdminUsersParams) => string;
/**
 * @summary List all users (admin)
 */
export declare const listAdminUsers: (params?: ListAdminUsersParams, options?: RequestInit) => Promise<UsersPage>;
export declare const getListAdminUsersQueryKey: (params?: ListAdminUsersParams) => readonly ["/api/admin/users", ...ListAdminUsersParams[]];
export declare const getListAdminUsersQueryOptions: <TData = Awaited<ReturnType<typeof listAdminUsers>>, TError = ErrorType<unknown>>(params?: ListAdminUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAdminUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAdminUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminUsers>>>;
export type ListAdminUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all users (admin)
 */
export declare function useListAdminUsers<TData = Awaited<ReturnType<typeof listAdminUsers>>, TError = ErrorType<unknown>>(params?: ListAdminUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAdminUserUrl: (id: number) => string;
/**
 * @summary Get user by id (admin)
 */
export declare const getAdminUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getGetAdminUserQueryKey: (id: number) => readonly [`/api/admin/users/${number}`];
export declare const getGetAdminUserQueryOptions: <TData = Awaited<ReturnType<typeof getAdminUser>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminUserQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;
export type GetAdminUserQueryError = ErrorType<unknown>;
/**
 * @summary Get user by id (admin)
 */
export declare function useGetAdminUser<TData = Awaited<ReturnType<typeof getAdminUser>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateAdminUserUrl: (id: number) => string;
/**
 * @summary Update user (admin)
 */
export declare const updateAdminUser: (id: number, adminUserUpdate: AdminUserUpdate, options?: RequestInit) => Promise<User>;
export declare const getUpdateAdminUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAdminUser>>, TError, {
        id: number;
        data: BodyType<AdminUserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAdminUser>>, TError, {
    id: number;
    data: BodyType<AdminUserUpdate>;
}, TContext>;
export type UpdateAdminUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateAdminUser>>>;
export type UpdateAdminUserMutationBody = BodyType<AdminUserUpdate>;
export type UpdateAdminUserMutationError = ErrorType<unknown>;
/**
* @summary Update user (admin)
*/
export declare const useUpdateAdminUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAdminUser>>, TError, {
        id: number;
        data: BodyType<AdminUserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAdminUser>>, TError, {
    id: number;
    data: BodyType<AdminUserUpdate>;
}, TContext>;
export declare const getToggleBlockUserUrl: (id: number) => string;
/**
 * @summary Block or unblock a user (admin)
 */
export declare const toggleBlockUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getToggleBlockUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof toggleBlockUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof toggleBlockUser>>, TError, {
    id: number;
}, TContext>;
export type ToggleBlockUserMutationResult = NonNullable<Awaited<ReturnType<typeof toggleBlockUser>>>;
export type ToggleBlockUserMutationError = ErrorType<unknown>;
/**
* @summary Block or unblock a user (admin)
*/
export declare const useToggleBlockUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof toggleBlockUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof toggleBlockUser>>, TError, {
    id: number;
}, TContext>;
export declare const getListAllTransactionsUrl: (params?: ListAllTransactionsParams) => string;
/**
 * @summary List all wallet transactions (admin)
 */
export declare const listAllTransactions: (params?: ListAllTransactionsParams, options?: RequestInit) => Promise<WalletTransactionsPage>;
export declare const getListAllTransactionsQueryKey: (params?: ListAllTransactionsParams) => readonly ["/api/admin/wallet/transactions", ...ListAllTransactionsParams[]];
export declare const getListAllTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof listAllTransactions>>, TError = ErrorType<unknown>>(params?: ListAllTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAllTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAllTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof listAllTransactions>>>;
export type ListAllTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary List all wallet transactions (admin)
 */
export declare function useListAllTransactions<TData = Awaited<ReturnType<typeof listAllTransactions>>, TError = ErrorType<unknown>>(params?: ListAllTransactionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminRefundUrl: () => string;
/**
 * @summary Issue a refund (admin)
 */
export declare const adminRefund: (refundInput: RefundInput, options?: RequestInit) => Promise<WalletTransaction>;
export declare const getAdminRefundMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminRefund>>, TError, {
        data: BodyType<RefundInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminRefund>>, TError, {
    data: BodyType<RefundInput>;
}, TContext>;
export type AdminRefundMutationResult = NonNullable<Awaited<ReturnType<typeof adminRefund>>>;
export type AdminRefundMutationBody = BodyType<RefundInput>;
export type AdminRefundMutationError = ErrorType<unknown>;
/**
* @summary Issue a refund (admin)
*/
export declare const useAdminRefund: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminRefund>>, TError, {
        data: BodyType<RefundInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminRefund>>, TError, {
    data: BodyType<RefundInput>;
}, TContext>;
export declare const getDriverLoginUrl: () => string;
/**
 * @summary Driver login
 */
export declare const driverLogin: (driverLoginInput: DriverLoginInput, options?: RequestInit) => Promise<DriverAuthResponse>;
export declare const getDriverLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverLogin>>, TError, {
        data: BodyType<DriverLoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof driverLogin>>, TError, {
    data: BodyType<DriverLoginInput>;
}, TContext>;
export type DriverLoginMutationResult = NonNullable<Awaited<ReturnType<typeof driverLogin>>>;
export type DriverLoginMutationBody = BodyType<DriverLoginInput>;
export type DriverLoginMutationError = ErrorType<ErrorResponse>;
/**
* @summary Driver login
*/
export declare const useDriverLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverLogin>>, TError, {
        data: BodyType<DriverLoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof driverLogin>>, TError, {
    data: BodyType<DriverLoginInput>;
}, TContext>;
export declare const getDriverLogoutUrl: () => string;
/**
 * @summary Driver logout
 */
export declare const driverLogout: (options?: RequestInit) => Promise<OkResponse>;
export declare const getDriverLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverLogout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof driverLogout>>, TError, void, TContext>;
export type DriverLogoutMutationResult = NonNullable<Awaited<ReturnType<typeof driverLogout>>>;
export type DriverLogoutMutationError = ErrorType<unknown>;
/**
* @summary Driver logout
*/
export declare const useDriverLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverLogout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof driverLogout>>, TError, void, TContext>;
export declare const getGetDriverMeUrl: () => string;
/**
 * @summary Get driver profile
 */
export declare const getDriverMe: (options?: RequestInit) => Promise<DriverProfile>;
export declare const getGetDriverMeQueryKey: () => readonly ["/api/driver/me"];
export declare const getGetDriverMeQueryOptions: <TData = Awaited<ReturnType<typeof getDriverMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverMeQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverMe>>>;
export type GetDriverMeQueryError = ErrorType<unknown>;
/**
 * @summary Get driver profile
 */
export declare function useGetDriverMe<TData = Awaited<ReturnType<typeof getDriverMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDriverGoOnlineUrl: () => string;
/**
 * @summary Set driver online
 */
export declare const driverGoOnline: (options?: RequestInit) => Promise<DriverProfile>;
export declare const getDriverGoOnlineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverGoOnline>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof driverGoOnline>>, TError, void, TContext>;
export type DriverGoOnlineMutationResult = NonNullable<Awaited<ReturnType<typeof driverGoOnline>>>;
export type DriverGoOnlineMutationError = ErrorType<unknown>;
/**
* @summary Set driver online
*/
export declare const useDriverGoOnline: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverGoOnline>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof driverGoOnline>>, TError, void, TContext>;
export declare const getDriverGoOfflineUrl: () => string;
/**
 * @summary Set driver offline
 */
export declare const driverGoOffline: (options?: RequestInit) => Promise<DriverProfile>;
export declare const getDriverGoOfflineMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverGoOffline>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof driverGoOffline>>, TError, void, TContext>;
export type DriverGoOfflineMutationResult = NonNullable<Awaited<ReturnType<typeof driverGoOffline>>>;
export type DriverGoOfflineMutationError = ErrorType<unknown>;
/**
* @summary Set driver offline
*/
export declare const useDriverGoOffline: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof driverGoOffline>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof driverGoOffline>>, TError, void, TContext>;
export declare const getListDriverTripsUrl: (params?: ListDriverTripsParams) => string;
/**
 * @summary List driver assigned trips
 */
export declare const listDriverTrips: (params?: ListDriverTripsParams, options?: RequestInit) => Promise<DriverTripList>;
export declare const getListDriverTripsQueryKey: (params?: ListDriverTripsParams) => readonly ["/api/driver/trips", ...ListDriverTripsParams[]];
export declare const getListDriverTripsQueryOptions: <TData = Awaited<ReturnType<typeof listDriverTrips>>, TError = ErrorType<unknown>>(params?: ListDriverTripsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDriverTrips>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDriverTrips>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDriverTripsQueryResult = NonNullable<Awaited<ReturnType<typeof listDriverTrips>>>;
export type ListDriverTripsQueryError = ErrorType<unknown>;
/**
 * @summary List driver assigned trips
 */
export declare function useListDriverTrips<TData = Awaited<ReturnType<typeof listDriverTrips>>, TError = ErrorType<unknown>>(params?: ListDriverTripsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDriverTrips>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDriverTripUrl: (id: number) => string;
/**
 * @summary Get specific driver trip with bookings
 */
export declare const getDriverTrip: (id: number, options?: RequestInit) => Promise<DriverTripDetail>;
export declare const getGetDriverTripQueryKey: (id: number) => readonly [`/api/driver/trips/${number}`];
export declare const getGetDriverTripQueryOptions: <TData = Awaited<ReturnType<typeof getDriverTrip>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverTrip>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverTrip>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverTripQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverTrip>>>;
export type GetDriverTripQueryError = ErrorType<unknown>;
/**
 * @summary Get specific driver trip with bookings
 */
export declare function useGetDriverTrip<TData = Awaited<ReturnType<typeof getDriverTrip>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverTrip>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAcceptTripUrl: (id: number) => string;
/**
 * @summary Accept trip assignment
 */
export declare const acceptTrip: (id: number, options?: RequestInit) => Promise<Trip>;
export declare const getAcceptTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof acceptTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof acceptTrip>>, TError, {
    id: number;
}, TContext>;
export type AcceptTripMutationResult = NonNullable<Awaited<ReturnType<typeof acceptTrip>>>;
export type AcceptTripMutationError = ErrorType<unknown>;
/**
* @summary Accept trip assignment
*/
export declare const useAcceptTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof acceptTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof acceptTrip>>, TError, {
    id: number;
}, TContext>;
export declare const getRejectTripUrl: (id: number) => string;
/**
 * @summary Reject trip assignment
 */
export declare const rejectTrip: (id: number, options?: RequestInit) => Promise<Trip>;
export declare const getRejectTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectTrip>>, TError, {
    id: number;
}, TContext>;
export type RejectTripMutationResult = NonNullable<Awaited<ReturnType<typeof rejectTrip>>>;
export type RejectTripMutationError = ErrorType<unknown>;
/**
* @summary Reject trip assignment
*/
export declare const useRejectTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectTrip>>, TError, {
    id: number;
}, TContext>;
export declare const getStartTripUrl: (id: number) => string;
/**
 * @summary Start trip
 */
export declare const startTrip: (id: number, options?: RequestInit) => Promise<Trip>;
export declare const getStartTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startTrip>>, TError, {
    id: number;
}, TContext>;
export type StartTripMutationResult = NonNullable<Awaited<ReturnType<typeof startTrip>>>;
export type StartTripMutationError = ErrorType<unknown>;
/**
* @summary Start trip
*/
export declare const useStartTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startTrip>>, TError, {
    id: number;
}, TContext>;
export declare const getCompleteTripUrl: (id: number) => string;
/**
 * @summary Complete trip
 */
export declare const completeTrip: (id: number, options?: RequestInit) => Promise<Trip>;
export declare const getCompleteTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeTrip>>, TError, {
    id: number;
}, TContext>;
export type CompleteTripMutationResult = NonNullable<Awaited<ReturnType<typeof completeTrip>>>;
export type CompleteTripMutationError = ErrorType<unknown>;
/**
* @summary Complete trip
*/
export declare const useCompleteTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeTrip>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeTrip>>, TError, {
    id: number;
}, TContext>;
export declare const getCancelDriverTripUrl: (id: number) => string;
/**
 * @summary Cancel trip with reason
 */
export declare const cancelDriverTrip: (id: number, driverCancelTripInput: DriverCancelTripInput, options?: RequestInit) => Promise<Trip>;
export declare const getCancelDriverTripMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelDriverTrip>>, TError, {
        id: number;
        data: BodyType<DriverCancelTripInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelDriverTrip>>, TError, {
    id: number;
    data: BodyType<DriverCancelTripInput>;
}, TContext>;
export type CancelDriverTripMutationResult = NonNullable<Awaited<ReturnType<typeof cancelDriverTrip>>>;
export type CancelDriverTripMutationBody = BodyType<DriverCancelTripInput>;
export type CancelDriverTripMutationError = ErrorType<unknown>;
/**
* @summary Cancel trip with reason
*/
export declare const useCancelDriverTrip: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelDriverTrip>>, TError, {
        id: number;
        data: BodyType<DriverCancelTripInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelDriverTrip>>, TError, {
    id: number;
    data: BodyType<DriverCancelTripInput>;
}, TContext>;
export declare const getGetDriverTripStationsUrl: (id: number) => string;
/**
 * @summary List trip stations with progress
 */
export declare const getDriverTripStations: (id: number, options?: RequestInit) => Promise<TripStationList>;
export declare const getGetDriverTripStationsQueryKey: (id: number) => readonly [`/api/driver/trips/${number}/stations`];
export declare const getGetDriverTripStationsQueryOptions: <TData = Awaited<ReturnType<typeof getDriverTripStations>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverTripStations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverTripStations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverTripStationsQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverTripStations>>>;
export type GetDriverTripStationsQueryError = ErrorType<unknown>;
/**
 * @summary List trip stations with progress
 */
export declare function useGetDriverTripStations<TData = Awaited<ReturnType<typeof getDriverTripStations>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverTripStations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getMarkStationArrivedUrl: (id: number, stationId: number) => string;
/**
 * @summary Mark arrived at station
 */
export declare const markStationArrived: (id: number, stationId: number, options?: RequestInit) => Promise<StationProgress>;
export declare const getMarkStationArrivedMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markStationArrived>>, TError, {
        id: number;
        stationId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markStationArrived>>, TError, {
    id: number;
    stationId: number;
}, TContext>;
export type MarkStationArrivedMutationResult = NonNullable<Awaited<ReturnType<typeof markStationArrived>>>;
export type MarkStationArrivedMutationError = ErrorType<unknown>;
/**
* @summary Mark arrived at station
*/
export declare const useMarkStationArrived: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markStationArrived>>, TError, {
        id: number;
        stationId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markStationArrived>>, TError, {
    id: number;
    stationId: number;
}, TContext>;
export declare const getMarkStationCompletedUrl: (id: number, stationId: number) => string;
/**
 * @summary Mark station completed
 */
export declare const markStationCompleted: (id: number, stationId: number, options?: RequestInit) => Promise<StationProgress>;
export declare const getMarkStationCompletedMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markStationCompleted>>, TError, {
        id: number;
        stationId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markStationCompleted>>, TError, {
    id: number;
    stationId: number;
}, TContext>;
export type MarkStationCompletedMutationResult = NonNullable<Awaited<ReturnType<typeof markStationCompleted>>>;
export type MarkStationCompletedMutationError = ErrorType<unknown>;
/**
* @summary Mark station completed
*/
export declare const useMarkStationCompleted: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markStationCompleted>>, TError, {
        id: number;
        stationId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markStationCompleted>>, TError, {
    id: number;
    stationId: number;
}, TContext>;
export declare const getBoardPassengerUrl: (id: number) => string;
/**
 * @summary Mark passenger as boarded
 */
export declare const boardPassenger: (id: number, options?: RequestInit) => Promise<Booking>;
export declare const getBoardPassengerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof boardPassenger>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof boardPassenger>>, TError, {
    id: number;
}, TContext>;
export type BoardPassengerMutationResult = NonNullable<Awaited<ReturnType<typeof boardPassenger>>>;
export type BoardPassengerMutationError = ErrorType<unknown>;
/**
* @summary Mark passenger as boarded
*/
export declare const useBoardPassenger: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof boardPassenger>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof boardPassenger>>, TError, {
    id: number;
}, TContext>;
export declare const getMarkPassengerAbsentUrl: (id: number) => string;
/**
 * @summary Mark passenger as absent
 */
export declare const markPassengerAbsent: (id: number, options?: RequestInit) => Promise<Booking>;
export declare const getMarkPassengerAbsentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markPassengerAbsent>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markPassengerAbsent>>, TError, {
    id: number;
}, TContext>;
export type MarkPassengerAbsentMutationResult = NonNullable<Awaited<ReturnType<typeof markPassengerAbsent>>>;
export type MarkPassengerAbsentMutationError = ErrorType<unknown>;
/**
* @summary Mark passenger as absent
*/
export declare const useMarkPassengerAbsent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markPassengerAbsent>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markPassengerAbsent>>, TError, {
    id: number;
}, TContext>;
export declare const getGetDriverEarningsUrl: () => string;
/**
 * @summary Get driver earnings summary
 */
export declare const getDriverEarnings: (options?: RequestInit) => Promise<DriverEarningsSummary>;
export declare const getGetDriverEarningsQueryKey: () => readonly ["/api/driver/earnings"];
export declare const getGetDriverEarningsQueryOptions: <TData = Awaited<ReturnType<typeof getDriverEarnings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverEarnings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverEarnings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverEarningsQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverEarnings>>>;
export type GetDriverEarningsQueryError = ErrorType<unknown>;
/**
 * @summary Get driver earnings summary
 */
export declare function useGetDriverEarnings<TData = Awaited<ReturnType<typeof getDriverEarnings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverEarnings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDriverEarningsHistoryUrl: (params?: GetDriverEarningsHistoryParams) => string;
/**
 * @summary Get driver earnings history
 */
export declare const getDriverEarningsHistory: (params?: GetDriverEarningsHistoryParams, options?: RequestInit) => Promise<DriverEarningsHistory>;
export declare const getGetDriverEarningsHistoryQueryKey: (params?: GetDriverEarningsHistoryParams) => readonly ["/api/driver/earnings/history", ...GetDriverEarningsHistoryParams[]];
export declare const getGetDriverEarningsHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getDriverEarningsHistory>>, TError = ErrorType<unknown>>(params?: GetDriverEarningsHistoryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverEarningsHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverEarningsHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverEarningsHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverEarningsHistory>>>;
export type GetDriverEarningsHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get driver earnings history
 */
export declare function useGetDriverEarningsHistory<TData = Awaited<ReturnType<typeof getDriverEarningsHistory>>, TError = ErrorType<unknown>>(params?: GetDriverEarningsHistoryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverEarningsHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDriverNotificationsUrl: () => string;
/**
 * @summary Get driver notifications
 */
export declare const getDriverNotifications: (options?: RequestInit) => Promise<NotificationList>;
export declare const getGetDriverNotificationsQueryKey: () => readonly ["/api/driver/notifications"];
export declare const getGetDriverNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof getDriverNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverNotifications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverNotifications>>>;
export type GetDriverNotificationsQueryError = ErrorType<unknown>;
/**
 * @summary Get driver notifications
 */
export declare function useGetDriverNotifications<TData = Awaited<ReturnType<typeof getDriverNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAdminDriverAnalyticsUrl: () => string;
/**
 * @summary Get admin driver analytics
 */
export declare const getAdminDriverAnalytics: (options?: RequestInit) => Promise<DriverAnalytics>;
export declare const getGetAdminDriverAnalyticsQueryKey: () => readonly ["/api/admin/driver-analytics"];
export declare const getGetAdminDriverAnalyticsQueryOptions: <TData = Awaited<ReturnType<typeof getAdminDriverAnalytics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDriverAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminDriverAnalytics>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminDriverAnalyticsQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminDriverAnalytics>>>;
export type GetAdminDriverAnalyticsQueryError = ErrorType<unknown>;
/**
 * @summary Get admin driver analytics
 */
export declare function useGetAdminDriverAnalytics<TData = Awaited<ReturnType<typeof getAdminDriverAnalytics>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDriverAnalytics>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAdminDriversLiveUrl: () => string;
/**
 * @summary Get all drivers with live location
 */
export declare const getAdminDriversLive: (options?: RequestInit) => Promise<LiveDriverList>;
export declare const getGetAdminDriversLiveQueryKey: () => readonly ["/api/admin/drivers/live"];
export declare const getGetAdminDriversLiveQueryOptions: <TData = Awaited<ReturnType<typeof getAdminDriversLive>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDriversLive>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminDriversLive>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminDriversLiveQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminDriversLive>>>;
export type GetAdminDriversLiveQueryError = ErrorType<unknown>;
/**
 * @summary Get all drivers with live location
 */
export declare function useGetAdminDriversLive<TData = Awaited<ReturnType<typeof getAdminDriversLive>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDriversLive>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map