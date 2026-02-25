export const partnerServices = {
  register: () => ({ url: "/api/barbershop", method: "POST" }),
  get: () => ({ url: "/api/partner/barbershop", method: "GET" }),
  listBarbershops: () => ({ url: "/api/barbershop", method: "GET" }),
  listServices: () => ({
    url: `/api/partner/barbershop/services`,
    method: "GET",
  }),
  createService: () => ({
    url: `/api/partner/barbershop/services`,
    method: "POST",
  }),
};
