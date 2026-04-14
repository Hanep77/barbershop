import api from "../lib/axios";
import type {
  CreateBarbershopInput,
  UpdateBarbershopInput,
} from "../types/barbershop";
import { getCsrf } from "./auth";

export const createBarbershop = async (
  data: Omit<CreateBarbershopInput, "user_id">,
) => {
  await getCsrf();
  return api.post("/api/barbershop", data);
};

export const getBarbershop = async () => {
  await getCsrf();
  return await api.get("/api/partner/barbershop");
};

export const updateBarbershop = async (data: UpdateBarbershopInput) => {
  await getCsrf();
  return api.put("/api/partner/barbershop", data);
};
