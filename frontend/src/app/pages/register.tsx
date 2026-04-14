import { type SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Scissors, Eye, EyeOff, User, Building2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import useAuthStore from "../../store/authStore";
import type { RegisterErrors, RegisterForm } from "../../types/auth";
import { AxiosError } from "axios";

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "owner">("customer");
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});
  const { loading, register } = useAuthStore();

  const handleRegister = async (e: SubmitEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const user = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: role == "owner" ? "barbershop" : "customer",
      password: formData.get("password"),
      password_confirmation: formData.get("password_confirmation"),
    } as RegisterForm;

    try {
      await register(
        user.name,
        user.email,
        user.role,
        user.password,
        user.password_confirmation,
      );

      // if (user.role == "barbershop") {
      //   navigate("/login");
      // } else {
      navigate("/");
      // }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.log(err.response?.data);
        setFieldErrors(err.response?.data?.errors || {});
        return;
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-background relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759134248487-e8baaf31e33e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwaW50ZXJpb3IlMjBtb2Rlcm58ZW58MXx8fHwxNzczODYyMjk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Barbershop"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                <Scissors className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="font-bold text-4xl text-foreground">
                BarberBrody
              </span>
            </div>
            <h1
              className="font-bold text-foreground mb-6"
              style={{ fontSize: "3rem", lineHeight: "1.2" }}
            >
              Join BarberBrody
            </h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-md">
              Create your account to start booking premium grooming services or
              manage your barbershop business.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-foreground font-normal">For Customers</p>
                <p className="text-muted-foreground font-light text-sm">
                  Book appointments, track history, save favorites
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-foreground font-normal">
                  For Barbershop Owners
                </p>
                <p className="text-muted-foreground font-light text-sm">
                  Manage schedules, track revenue, grow your business
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-foreground font-normal">Secure & Simple</p>
                <p className="text-muted-foreground font-light text-sm">
                  Your data is protected with industry-standard security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-card">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-card-foreground">
              BarberBrody
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-bold text-3xl text-card-foreground mb-2">
              Create Account
            </h2>
            <p className="text-muted-foreground font-light">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Full Name Field */}
            <div>
              {fieldErrors.name && (
                <p className="text-red-500 italic">{fieldErrors.name}</p>
              )}
              <label
                htmlFor="fullName"
                className="block font-bold text-card-foreground mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full px-4 py-4 rounded-lg border border-border bg-white text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              {fieldErrors.email && (
                <p className="text-red-500 italic">{fieldErrors.email}</p>
              )}
              <label
                htmlFor="email"
                className="block font-bold text-card-foreground mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="john@example.com"
                className="w-full px-4 py-4 rounded-lg border border-border bg-white text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              {fieldErrors.password && (
                <p className="text-red-500 italic">{fieldErrors.password}</p>
              )}
              <label
                htmlFor="password"
                className="block font-bold text-card-foreground mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  className="w-full px-4 py-4 rounded-lg border border-border bg-white text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block font-bold text-card-foreground mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-4 rounded-lg border border-border bg-white text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block font-bold text-card-foreground mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === "customer"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <User
                    className={`w-6 h-6 mx-auto mb-2 ${
                      role === "customer"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <p
                    className={`font-bold text-sm ${
                      role === "customer"
                        ? "text-card-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Customer
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === "owner"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Building2
                    className={`w-6 h-6 mx-auto mb-2 ${
                      role === "owner"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <p
                    className={`font-bold text-sm ${
                      role === "owner"
                        ? "text-card-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Barbershop Owner
                  </p>
                </button>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              {loading ? "Loading..." : "Create Account"}
            </button>
          </form>

          {/* Terms */}
          <p className="text-center mt-6 text-muted-foreground font-light text-sm">
            By signing up, you agree to our{" "}
            <Link
              to="/terms"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Privacy Policy
            </Link>
          </p>

          {/* Login Link */}
          <p className="text-center mt-8 text-muted-foreground font-light">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-bold transition-colors"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
