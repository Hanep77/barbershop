import api from "../lib/axios";
import { getCsrf } from "./auth";
import type {
  CreateServiceRequest,
  UpdateServiceRequest,
} from "../types/services";

export const adminGetBarbershopServices = async () => {
  await getCsrf();
  return await api.get(`/api/partner/barbershop/services`);
};

export const adminUpdateService = async (
  data: UpdateServiceRequest,
  id: string,
) => {
  await getCsrf();
  return await api.put(`/api/partner/barbershop/services/${id}`, data);
};

export const adminCreateService = async (data: CreateServiceRequest) => {
  await getCsrf();
  return await api.post(`/api/partner/barbershop/services`, data);
};

export const adminDeleteService = async (id: string) => {
  await getCsrf();
  return await api.delete(`/api/partner/barbershop/services/${id}`);
};

export const getServicesByBarbershopId = async (id: string) => {
  return await api.get(`/api/barbershop/${id}/services`);
};
