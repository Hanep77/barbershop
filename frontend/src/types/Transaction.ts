export interface Transaction {
  id: string;
  user_id: string;
  barbershop_id: string;
  booking_date: string;
  status: "pending" | "confirmed" | "cancelled";
  total_price: number;
  created_at: string;
  updated_at: string;
}
