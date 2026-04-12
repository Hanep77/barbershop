import api from "../lib/axios";
import { getCsrf } from "./auth";
import type { CreateServiceRequest } from "../types/services";

export const adminGetBarbershopServices = async () => {
  await getCsrf();
  return await api.get(`/api/partner/barbershop/services`);
};

export const adminCreateServiceCategory = async (
  data: CreateServiceRequest,
) => {
  await getCsrf();
  return await api.post(`/api/partner/barbershop/services`, data);
};
