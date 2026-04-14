import api from "../lib/axios";
import type { CreateBarbershopInput } from "../types/barbershop";

export const createBarbershop = async (
  data: Omit<CreateBarbershopInput, "user_id">,
) => {
  return api.post("/api/barbershop", data);
};

export const getBarbershop = async () => {
  return await api.get("/api/partner/barbershop");
};

export const getAllBarbershop = async () => {
  const barber = await api.get("/api/barbershop");
  return barber
};
