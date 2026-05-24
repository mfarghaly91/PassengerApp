import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { db, driversTable, tripsTable, busesTable, ridesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyAccessToken } from "./lib/jwt";
import { logger } from "./lib/logger";

export interface LocationPayload {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  tripId?: number;
}

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error("Authentication required"));
        return;
      }
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, role } = socket.data as { userId: number; role: string };
    logger.info({ socketId: socket.id, userId, role }, "Socket connected");

    if (role === "admin") {
      socket.join("admin:room");
    }

    if (role === "user") {
      socket.join(`passenger:${userId}`);
    }

    if (role === "driver") {
      try {
        const [driver] = await db
          .select({ id: driversTable.id, isOnline: driversTable.isOnline, vehicleType: driversTable.vehicleType })
          .from(driversTable)
          .where(eq(driversTable.userId, userId));

        if (driver?.vehicleType && driver.isOnline) {
          socket.join(`drivers:available:${driver.vehicleType}`);
          socket.data.driverId = driver.id;
          socket.data.vehicleType = driver.vehicleType;
        }
      } catch (err) {
        logger.error({ err }, "Error joining driver availability room");
      }
    }

    socket.on("driver:location:update", async (payload: LocationPayload) => {
      if (role !== "driver") {
        socket.emit("error", { message: "Forbidden" });
        return;
      }

      const { latitude, longitude, speed, heading, tripId } = payload;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        socket.emit("error", { message: "Invalid GPS coordinates" });
        return;
      }

      try {
        const [driver] = await db
          .select({ id: driversTable.id, assignedBusId: driversTable.assignedBusId })
          .from(driversTable)
          .where(eq(driversTable.userId, userId));

        if (!driver) {
          socket.emit("error", { message: "Driver profile not found" });
          return;
        }

        await db.update(driversTable).set({
          currentLatitude: latitude,
          currentLongitude: longitude,
          currentSpeed: speed,
          currentHeading: heading,
        }).where(eq(driversTable.id, driver.id));

        if (driver.assignedBusId) {
          await db.update(busesTable).set({
            currentLatitude: latitude,
            currentLongitude: longitude,
          }).where(eq(busesTable.id, driver.assignedBusId));
        }

        const locationBroadcast = {
          driverId: driver.id,
          userId,
          latitude,
          longitude,
          speed,
          heading,
          tripId,
          timestamp: Date.now(),
        };

        io!.to("admin:room").emit("admin:track:trip", locationBroadcast);

        if (tripId) {
          io!.to(`trip:${tripId}`).emit("passenger:trip:tracking", locationBroadcast);
        }

        socket.emit("driver:location:ack", { ok: true });
      } catch (err) {
        logger.error({ err }, "Error handling location update");
        socket.emit("error", { message: "Internal error" });
      }
    });

    socket.on("driver:ride:location", async (payload: { rideId: number; latitude: number; longitude: number }) => {
      if (role !== "driver") {
        socket.emit("error", { message: "Forbidden" });
        return;
      }

      const { rideId, latitude, longitude } = payload;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        socket.emit("error", { message: "Invalid GPS coordinates" });
        return;
      }

      try {
        const [ride] = await db
          .select({ passengerId: ridesTable.passengerId })
          .from(ridesTable)
          .where(eq(ridesTable.id, rideId));

        if (!ride) {
          socket.emit("error", { message: "Ride not found" });
          return;
        }

        io!.to(`passenger:${ride.passengerId}`).emit("ride:driver_location", {
          rideId,
          latitude,
          longitude,
          timestamp: Date.now(),
        });
      } catch (err) {
        logger.error({ err }, "Error handling ride location update");
        socket.emit("error", { message: "Internal error" });
      }
    });

    socket.on("passenger:join:trip", (tripId: number) => {
      if (role === "user") {
        socket.join(`trip:${tripId}`);
      }
    });

    socket.on("driver:trip:start", async (tripId: number) => {
      if (role !== "driver") return;
      try {
        const [trip] = await db
          .select({ id: tripsTable.id, driverId: tripsTable.driverId })
          .from(tripsTable)
          .where(eq(tripsTable.id, tripId));

        if (!trip) return;

        io!.to("admin:room").emit("admin:track:trip", {
          event: "trip:started",
          tripId,
          timestamp: Date.now(),
        });
        io!.to(`trip:${tripId}`).emit("passenger:trip:tracking", {
          event: "trip:started",
          tripId,
          timestamp: Date.now(),
        });
      } catch (err) {
        logger.error({ err }, "Error broadcasting trip start");
      }
    });

    socket.on("driver:trip:complete", async (tripId: number) => {
      if (role !== "driver") return;
      io!.to("admin:room").emit("admin:track:trip", {
        event: "trip:completed",
        tripId,
        timestamp: Date.now(),
      });
      io!.to(`trip:${tripId}`).emit("passenger:trip:tracking", {
        event: "trip:completed",
        tripId,
        timestamp: Date.now(),
      });
    });

    socket.on("driver:status:online", async () => {
      if (role !== "driver") return;
      try {
        const [driver] = await db
          .select({ id: driversTable.id, vehicleType: driversTable.vehicleType })
          .from(driversTable)
          .where(eq(driversTable.userId, userId));

        if (driver?.vehicleType) {
          socket.join(`drivers:available:${driver.vehicleType}`);
          socket.data.vehicleType = driver.vehicleType;
        }
      } catch (err) {
        logger.error({ err }, "Error joining availability room on online");
      }
    });

    socket.on("driver:status:offline", () => {
      if (role !== "driver") return;
      const vt = socket.data.vehicleType as string | undefined;
      if (vt) {
        socket.leave(`drivers:available:${vt}`);
      }
    });

    socket.on("driver:status:busy", () => {
      if (role !== "driver") return;
      const vt = socket.data.vehicleType as string | undefined;
      if (vt) {
        socket.leave(`drivers:available:${vt}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id, userId }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
