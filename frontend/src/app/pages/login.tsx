import { type SubmitEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Scissors, Eye, EyeOff } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import useAuthStore from "../../store/authStore";
import type { LoginErrors, LoginForm } from "../../types/auth";
import { getGoogleRedirectUrl } from "../../services/auth";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const { login, loading } = useAuthStore();

  const handleLogin = async (e: SubmitEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    console.log(formData.get("name"));

    const user = {
      email: formData.get("email"),
      password: formData.get("password"),
    } as LoginForm;

    try {
      await login(
        user.email,
        user.password,
      );
      navigate("/");
    } catch (err: unknown) {
      const laravelErrors = (err as any)?.response?.data?.errors as
        | LoginErrors;
      setFieldErrors(laravelErrors);
    }
  };

  const handleGoogleLogin = async () => {
    const url = await getGoogleRedirectUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-background relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1769034260387-39fa07f0c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXJzaG9wJTIwY2hhaXIlMjB2aW50YWdlfGVufDF8fHx8MTc3MzgzNDI3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
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
            <h1 className="font-bold text-foreground mb-6" style={{ fontSize: '3rem', lineHeight: '1.2' }}>
              Welcome Back
            </h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-md">
              Premium grooming made simple. Log in to manage your appointments and experience the BarberBrody difference.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-foreground font-normal">Easy Online Booking</p>
                <p className="text-muted-foreground font-light text-sm">Schedule appointments in seconds</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-foreground font-normal">Expert Barbers</p>
                <p className="text-muted-foreground font-light text-sm">Choose from our skilled professionals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-foreground font-normal">Manage Bookings</p>
                <p className="text-muted-foreground font-light text-sm">View and update your appointments anytime</p>
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
              Log In
            </h2>
            <p className="text-muted-foreground font-light">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              {fieldErrors.email && <p className="text-red-500 italic">{fieldErrors.email}</p>}
              <label htmlFor="email" className="block font-bold text-card-foreground mb-2">
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
              {fieldErrors.password && <p className="text-red-500 italic">{fieldErrors.password}</p>}
              <label htmlFor="password" className="block font-bold text-card-foreground mb-2">
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

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary/80 font-normal text-sm transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              {loading ? "Loading..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground font-light text-sm">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full px-6 py-4 bg-white border-2 border-border text-card-foreground rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Register Link */}
          <p className="text-center mt-8 text-muted-foreground font-light">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-bold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
