import api from "../lib/axios";
import { getCsrf } from "./auth";

export const adminGetServiceCategories = async () => {
  await getCsrf();
  return await api.get(`/api/partner/barbershop/service-categories`);
};

export const adminCreateServiceCategory = async (data: { name: string }) => {
  await getCsrf();
  return await api.post(`/api/partner/barbershop/service-categories`, data);
};
