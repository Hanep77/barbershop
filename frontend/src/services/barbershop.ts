import api from "../lib/axios";
import type {
  BarbershopImage,
  CreateBarbershopInput,
  UpdateBarbershopInput,
} from "../types/barbershop";
import { getCsrf } from "./auth";

export const createBarbershop = async (
  data: Omit<CreateBarbershopInput, "user_id">,
) => {
  return api.post("/api/barbershop", data);
};

export const getBarbershop = async () => {
  return await api.get("/api/partner/barbershop");
};

export const updateBarbershop = async (data: UpdateBarbershopInput) => {
  await getCsrf();
  return api.put("/api/partner/barbershop", data);
};

export const getAllBarbershop = async (search?: string) => {
  const params = search ? { search } : {};
  const barber = await api.get("/api/barbershop", { params });
  return barber;
};

export const getBarbershopById = async (id: string) => {
  return await api.get(`/api/barbershop/${id}`);
};

export const getBarbershopImages = async () => {
  return api.get<{ images: BarbershopImage[] }>("/api/barbershop/images");
};

export const uploadBarbershopImage = async (file: File) => {
  await getCsrf();
  const formData = new FormData();
  formData.append("image", file);

  return api.post<{ message: string; image: BarbershopImage }>(
    "/api/barbershop/images",
    formData,
  );
};

export const setPrimaryBarbershopImage = async (id: string) => {
  await getCsrf();
  return api.patch<{ message: string; image: BarbershopImage }>(
    `/api/barbershop/images/${id}/set-primary`,
  );
};

export const deleteBarbershopImage = async (id: string) => {
  await getCsrf();
  return api.delete<{ message: string }>(`/api/barbershop/images/${id}`);
};

export const getPublicAssetUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/.test(url)) return url;

  const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};
