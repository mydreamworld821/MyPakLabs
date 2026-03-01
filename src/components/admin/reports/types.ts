export type BookingCategory = "lab" | "doctor" | "nurse" | "pharmacy";

export interface UniversalOrder {
  id: string;
  category: BookingCategory;
  entityName: string;
  patientName: string;
  bookingDate: string;
  availDate: string | null;
  isAvailed: boolean;
  items: string;
  originalTotal: number;
  discountedTotal: number;
  status: string;
}

export interface EntityOption {
  id: string;
  name: string;
  type: BookingCategory;
}
