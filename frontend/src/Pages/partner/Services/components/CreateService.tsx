"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { partnerServices } from "@/services/partner";
import type { Service, CreateServiceFormValues } from "@/types/Services";
import { toast } from "sonner";
import Fetcher from "@/lib/fetcher";
import { AxiosError } from "axios";

export default function CreateService({
  setServices,
}: {
  setServices: (services: Service) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceFormValues>({
    defaultValues: {
      name: "",
      price: 0,
      duration_minutes: 0,
    },
  });

  const onSubmit = async (value: CreateServiceFormValues) => {
    const { url, method } = partnerServices.createService();

    await Fetcher({ url, method, data: value })
      .then((res) => {
        const { data } = res;
        const newService: Service = {
          ...data,
          is_active: true,
        };
        setServices(newService);
        toast.success("Service created successfully");
      })
      .catch((err: unknown) => {
        console.error(err);
        if (err instanceof AxiosError) {
          toast.error(
            err?.response?.data.message || "Failed to create service",
          );
        } else {
          toast.error("Failed to create service");
        }
      })
      .finally(() => {
        setIsSubmitting(false);
        reset();
      });
  };
  return (
    <section className="rounded-2xl border border-white/10 bg-[#151820] p-6 h-fit">
      <h1 className="text-xl font-semibold">Manage Services</h1>
      <p className="mt-1 text-sm text-white/60">
        Add a new service for your barbershop.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-2">
          <span className="text-xs text-white/70">Service Name</span>
          <input
            type="text"
            placeholder="Haircut"
            {...register("name", {
              required: "Name is required",
            })}
            className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
          />
          {errors.name && (
            <span className="text-xs text-red-400">{errors.name.message}</span>
          )}
        </label>

        <label className="grid gap-2">
          <span className="text-xs text-white/70">Price</span>
          <input
            type="number"
            step="0.01"
            placeholder="50000"
            {...register("price", {
              required: "Price is required",
              valueAsNumber: true,
              validate: (value) =>
                value > 0 || "Price must be a positive number",
            })}
            className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
          />
          {errors.price && (
            <span className="text-xs text-red-400">{errors.price.message}</span>
          )}
        </label>

        <label className="grid gap-2">
          <span className="text-xs text-white/70">Duration (minutes)</span>
          <input
            type="number"
            placeholder="30"
            {...register("duration_minutes", {
              required: "Duration is required",
              valueAsNumber: true,
              validate: (value) =>
                value > 0 || "Duration must be a positive number",
            })}
            className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
          />
          {errors.duration_minutes && (
            <span className="text-xs text-red-400">
              {errors.duration_minutes.message}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
        >
          {isSubmitting ? "Saving..." : "Add Service"}
        </button>
      </form>
    </section>
  );
}
