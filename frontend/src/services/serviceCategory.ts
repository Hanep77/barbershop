import api from "../lib/axios";
import { getCsrf } from "./auth";
import type {
  UpdateServiceCategoryRequest,
  CreateServiceCategoryRequest,
} from "../types/serviceCategory";

export const adminGetServiceCategories = async () => {
  await getCsrf();
  return await api.get(`/api/partner/barbershop/service-categories`);
};

export const adminCreateServiceCategory = async (
  data: CreateServiceCategoryRequest,
) => {
  await getCsrf();
  return await api.post(`/api/partner/barbershop/service-categories`, data);
};

export const adminUpdateServiceCategory = async (
  id: string,
  data: UpdateServiceCategoryRequest,
) => {
  await getCsrf();
  return await api.put(
    `/api/partner/barbershop/service-categories/${id}`,
    data,
  );
};

export const adminDeleteServiceCategory = async (id: string) => {
  await getCsrf();
  return await api.delete(`/api/partner/barbershop/service-categories/${id}`);
};

// http://localhost:8000/api/partner/barbershop/service-categories/019d8c7f-07fd-72be-9566-5e5ba7985b4c
