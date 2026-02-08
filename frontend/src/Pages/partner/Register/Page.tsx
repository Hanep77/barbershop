"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { authServices } from "@/services/auth";
import Fetcher from "@/lib/fetcher";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import MapLocation from "./components/MapLocation";
import LocationInput from "./components/LocationInput";

type RegisterPartnerFormValues = {
  name: string;
  address: string;
  map_url?: string;
  phone_number: string;
  description?: string;
  is_active: boolean;
};

export default function PartnerRegister() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterPartnerFormValues>({
    defaultValues: { name: "", address: "", phone_number: "", is_active: true },
  });

  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterPartnerFormValues) => {
    const { url, method } = authServices.login();
    await Fetcher({
      url,
      method,
      data,
    })
      .then((response) => {
        const { data } = response;
        login(data.token, data.user);
        setUser(data.user);
        navigate("/dashboard");
      })
      .catch((error) => {
        if (error instanceof Error) {
          toast.error(error.message || "Login failed");
          console.log(error.message);
        }
      });
  };

  return (
    <div className="w-full h-full m-auto text-slate-100 grid place-items-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl bg-[#151820] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-7">
        <div className="mb-6">
          <div className="text-xl font-bold text-center tracking-[0.25em] text-white/70 mb-8">
            Nephair
          </div>
          <h1 className="mt-2 text-2xl font-semibold">
            Create your own Barbershop
          </h1>
          <p className="mt-2 text-xs text-white/60">
            Join the barbershop experience
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs text-white/70">Barbershop Name</span>
            <input
              type="text"
              placeholder="Barbershop Name"
              {...register("name", { required: "name is required" })}
              className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
            {errors.name && (
              <span className="text-xs text-red-400">
                {errors.name.message}
              </span>
            )}
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-white/70">
              Barbershop Phone Number
            </span>
            <input
              type="text"
              placeholder="Barbershop Phone Number"
              {...register("phone_number", {
                required: "phone number is required",
              })}
              className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
            {errors.phone_number && (
              <span className="text-xs text-red-400">
                {errors.phone_number.message}
              </span>
            )}
          </label>

          <LocationInput />

          <label className="grid gap-2">
            <span className="text-xs text-white/70">Barbershop Location</span>
            <MapLocation />
          </label>

          <button
            type="submit"
            className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            Submit Barbershop
          </button>
          {/* <button
            onClick={() => {
              navigate('/register')
            }}
              type="submit"
              className="mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Don't have an account?
            </button> */}
        </form>

        <p className="mt-4 text-[11px] text-white/60">
          By continuing, you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
