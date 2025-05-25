import redisClient from "../config/redis.config";

export interface DriverDetails {
    driverId: string;
    distance: number;
    rating: number;
    cancelCount: number;
  }

export async function findNearbyDrivers(latitude: number, longitude: number, vehicleModel: string): Promise<DriverDetails[]> {
    try {
      const drivers = (await redisClient.sendCommand([
        'GEORADIUS',
        'driver:locations',
        longitude.toString(),
        latitude.toString(),
        '5000',
        'm',
        'WITHDIST',
      ])) as Array<[string, string]>;

      const driverDetails: DriverDetails[] = [];

      for (const [driverId, distance] of drivers) {
        const driverDetailsKey = `onlineDriver:details:${driverId}`;
        const driverData = await redisClient.get(driverDetailsKey);

        if (driverData) {
          const parsedDriver = JSON.parse(driverData);

          if (parsedDriver.vehicleModel === vehicleModel) {
            driverDetails.push({
              driverId,
              distance: parseFloat(distance),
              rating: parsedDriver.rating,
              cancelCount: parsedDriver.cancelCount,
            });
          }
        }
      }

      return driverDetails.sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        if (a.rating !== b.rating) return b.rating - a.rating;
        return a.cancelCount - b.cancelCount;
      });
    } catch (error) {
      throw new Error(`Failed to find nearby drivers: ${(error as Error).message}`);
    }
  }
