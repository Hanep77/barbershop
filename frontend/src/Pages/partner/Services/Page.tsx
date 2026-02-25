"use client";

import { useEffect, useState } from "react";
import { partnerServices } from "@/services/partner";
import Fetcher from "@/lib/fetcher";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Dialog from "@/components/Dialog";
import type { Service } from "@/types/Services";
import CreateService from "./components/CreateService";
import SearchService from "./components/SearchService";

export default function Services() {
  const [services, setServicesState] = useState<Service[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  const toggleDialog = () => {
    setDialogOpen((prev) => !prev);
  };

  const setServices = (services: Service) => {
    setServicesState((prev) => [...prev, services]);
    toggleDialog();
  };

  const getBarbershopServices = async () => {
    const { url, method } = partnerServices.listServices();
    await Fetcher({ url, method })
      .then((res) => {
        const { data } = res;
        setServicesState(data);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (err instanceof AxiosError) {
          toast.error(err?.response?.data || "Failed to fetch services");
        }
        toast.error("Failed to fetch services");
      })
      .finally(() => {
        setIsLoadingPage(false);
      });
  };

  useEffect(() => {
    getBarbershopServices();
  }, []);

  return (
    <div className="w-full h-full px-6 py-8 text-slate-100 flex flex-col gap-8">
      <div className="flex xl:flex-row lg:flex-row flex-col gap-y-5 justify-between">
        <SearchService value={searchQuery} onChange={setSearchQuery} />
        <button
          className="bg-white text-black rounded-lg py-2 px-10 W-fit ms-auto"
          onClick={() => setDialogOpen(true)}
        >
          Add Service
        </button>
      </div>
      <Dialog
        open={dialogOpen}
        toggleDialog={toggleDialog}
        children={<CreateService setServices={setServices} />}
      ></Dialog>
      <section className="rounded-2xl border border-white/10 bg-[#151820] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Service List</h2>
          <span className="text-xs text-white/60">
            {filteredServices.length} of {services.length} services
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/60">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Duration</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingPage ? (
                <tr>
                  <td className="px-3 py-4 text-white/60" colSpan={4}>
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-white/60" colSpan={4}>
                    No services available yet.
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-white/60" colSpan={4}>
                    No service found for "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-white/5 text-white/90"
                  >
                    <td className="px-3 py-3">{service.name}</td>
                    <td className="px-3 py-3">
                      Rp {Number(service.price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-3 py-3">
                      {service.duration_minutes} min
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          service.is_active
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
