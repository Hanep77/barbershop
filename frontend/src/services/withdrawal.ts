import api from "../lib/axios";
import { getCsrf } from "./auth";

export interface Withdrawal {
  id: string;
  barbershop_id: string;
  amount: number;
  status: "pending" | "success" | "failed";
  bank_name: string;
  account_name: string;
  account_number: string;
  external_id?: string;
  xendit_disbursement_id?: string;
  xendit_status?: string;
  failure_code?: string;
  failure_reason?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalPayload {
  amount: number;
  bank_name: string;
  account_name: string;
  account_number: string;
}

export interface WithdrawalResponse {
  message: string;
  data: Withdrawal;
  current_balance?: number;
}

export const getWithdrawals = async () => {
  await getCsrf();
  return await api.get<{ message: string; data: Withdrawal[] }>(
    "/api/partner/barbershop/withdrawals",
  );
};

export const submitWithdrawal = async (payload: WithdrawalPayload) => {
  await getCsrf();
  return await api.post<WithdrawalResponse>(
    "/api/partner/barbershop/withdrawals",
    payload,
  );
};
