import { getCsrf } from "./auth";
import api from "../lib/axios";
import type {
  CapsterCreateRequest,
  CapsterUpdateRequest,
} from "../types/capster";

export const adminGetCapsters = async () => {
  await getCsrf();
  return await api.get("/api/partner/barbershop/capsters");
};

export const adminCreateCapster = async (data: CapsterCreateRequest) => {
  await getCsrf();
  return await api.post("/api/partner/barbershop/capsters", data);
};

export const adminUpdateCapster = async (
  id: string,
  data: CapsterUpdateRequest,
) => {
  await getCsrf();
  return await api.put(`/api/partner/barbershop/capsters/${id}`, data);
};

export const adminDeleteCapster = async (id: string) => {
  await getCsrf();
  return await api.delete(`/api/partner/barbershop/capsters/${id}`);
};

export const getCapstersByBarbershopId = async (id: string) => {
  return await api.get(`/api/barbershop/${id}/capsters`);
};
