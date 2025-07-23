
export interface ResubmissionInterface {
  driverId: string;
  fields: (
    | "rc"
    | "model"
    | "registrationId"
    | "carImage"
    | "insurance"
    | "pollution"
    | "location"
    | "license"
    | "aadhar"
    | "driverImage"
  )[];
}