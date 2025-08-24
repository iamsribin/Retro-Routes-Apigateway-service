export interface PricingInterface{
  vehicleModel: string;
  image: string;
  minDistanceKm: string;
  basePrice: number;
  pricePerKm: number;
  eta: string;
  features: string[];
  updatedBy?: string;
  updatedAt?: Date;
}