import api from "../lib/axios";
import type { CreateRatingRequest, Rating } from "../types/rating";

export const createRating = (data: CreateRatingRequest) => {
  return api.post("/api/ratings", data);
};

export const getBarbershopRatings = (barbershopId: string) => {
  return api.get<{ data: Rating[] }>(`/api/barbershop/${barbershopId}/ratings`);
};
