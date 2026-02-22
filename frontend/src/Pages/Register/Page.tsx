"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authServices } from "@/services/auth";
import Fetcher from "@/lib/fetcher";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router";
import { useLoadingBar } from "react-top-loading-bar";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "customer";
};

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { start, complete } = useLoadingBar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "customer",
    },
  });
  const { url, method } = authServices.register();

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    start();
    const { url: cookieUrl, method: cookieMethod } = authServices.getCookie();

    try {
      await Fetcher({ url: cookieUrl, method: cookieMethod }).then(async () => {
        await Fetcher({
          url,
          method,
          data,
        }).then((res) => {
          const { data } = res.data;
          login(data.user);
          toast.success("Registration successful");
          navigate("/dashboard");
        });
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    } finally {
      complete();
      setLoading(false);
    }
    // navigate("/login");
  };

  return (
    <div className="w-full h-full m-auto text-slate-100 grid place-items-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl bg-[#151820] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-7">
        <div className="mb-6">
          <div className="text-xl font-bold text-center tracking-[0.25em] text-white/70 mb-8">
            Nephair
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Create Account</h1>
          <p className="mt-2 text-xs text-white/60">
            Join the barbershop experience
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs text-white/70">Name</span>
            <input
              type="text"
              placeholder="Michael"
              {...register("name", { required: "Name is required" })}
              className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
            {errors.name && (
              <span className="text-xs text-red-400">
                {errors.name.message}
              </span>
            )}
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-white/70">Email</span>
            <input
              type="email"
              placeholder="michael@email.com"
              {...register("email", {
                required: "Email is required",
              })}
              className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
            {errors.email && (
              <span className="text-xs text-red-400">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-white/70">Password</span>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password", {
                required: "Password is required",
              })}
              className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
            {errors.password && (
              <span className="text-xs text-red-400">
                {errors.password.message}
              </span>
            )}
          </label>

          <label className="grid gap-2">
            <span className="text-xs text-white/70">Confirm Password</span>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password_confirmation", {
                required: "Password confirmation is required",
              })}
              className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
            {errors.password_confirmation && (
              <span className="text-xs text-red-400">
                {errors.password_confirmation.message}
              </span>
            )}
          </label>

          <button
            disabled={loading}
            className={`mt-1 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm
                    font-semibold text-slate-900 transition hover:bg-white ${
                      loading ? "cursor-not-allowed opacity-50" : ""
                    }`}
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-[11px] text-white/60">
          By continuing, you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
