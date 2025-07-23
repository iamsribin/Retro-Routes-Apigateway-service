import  { Document } from "mongoose";


export interface RideDetails extends Document {
    ride_id: string;
    driver_id: string;
    user_id: string;
    pickupCoordinates: PickupCoordinates;
    dropoffCoordinates: DropoffCoordinates;
    pickupLocation: string;
    dropoffLocation: string;
    driverCoordinates?: {
        latitude?: number;
        longitude?: number;
    };
    distance: string;
    duration: string;
    vehicleModel: string;  // Renamed from 'model' to 'vehicleModel'
    price: number;
    date: string;
    status: string;
    pin: number;
    paymentMode: string;
    feedback?: string;
    rating?: number;
}

interface PickupCoordinates {
    latitude: number;
    longitude: number;
}

interface DropoffCoordinates {
    latitude: number;
    longitude: number;
}

