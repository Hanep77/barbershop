import api from "../lib/axios";
import type { CreateBarbershopInput } from "../types/barbershop";
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
