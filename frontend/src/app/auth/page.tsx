"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthResponse {
    token: string;
    user: User;
}

interface FormData {
    username: string;
    email: string;
    password: string;
}

export default function AuthPage() {
    const API = `${process.env.NEXT_PUBLIC_API_URL}/auth`;
    const [isLogin, setIsLogin] = useState<boolean>(true);

    const { login } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState<FormData>({
        username: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const url = isLogin ? `${API}/login` : `${API}/register`;

            const payload = isLogin
                ? {
                    email: form.email,
                    password: form.password,
                }
                : form;

            const { data } = await axios.post<AuthResponse>(url, payload);

            await login(data.token);
            
            setMessage(
                isLogin ? "Login successful!" : "Account created successfully!"
            );

            router.push("/dashboard");
 
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message
                : "Something went wrong.";

            setMessage(message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">

    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">

      {/* Logo */}

      <div className="mb-8 flex flex-col items-center">

        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3h4.5A2.25 2.25 0 0116.5 5.25v13.5A2.25 2.25 0 0114.25 21h-4.5A2.25 2.25 0 017.5 18.75V5.25A2.25 2.25 0 019.75 3z"
            />
          </svg>

        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        <p className="mt-2 text-center text-slate-500">
          {isLogin
            ? "Sign in to continue to DrawMeet."
            : "Create your DrawMeet workspace."}
        </p>

      </div>

      <form onSubmit={submit} className="space-y-5">

        {!isLogin && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Create Account"}
        </button>

      </form>

      {message && (
        <div
          className={`mt-5 rounded-xl border p-3 text-center text-sm ${
            message.toLowerCase().includes("success")
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-slate-500">

        {isLogin ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setMessage("");
              }}
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setMessage("");
              }}
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Login
            </button>
          </>
        )}

      </div>

    </div>

  </div>
);
}