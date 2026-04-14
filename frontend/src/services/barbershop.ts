import api from "../lib/axios";
import type {
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

export const getAllBarbershop = async () => {
  const barber = await api.get("/api/barbershop");
  return barber;
};
