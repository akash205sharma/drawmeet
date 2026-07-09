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
 
        } catch (error: any) {
            setMessage(
                error.response?.data?.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-xl">

                <h1 className="mb-8 text-center text-3xl font-bold text-white">
                    {isLogin ? "Login" : "Create Account"}
                </h1>

                <form onSubmit={submit} className="space-y-5">

                    {!isLogin && (
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg bg-slate-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg bg-slate-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg bg-slate-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading
                            ? "Please wait..."
                            : isLogin
                                ? "Login"
                                : "Create Account"}
                    </button>
                </form>

                {message && (
                    <p className="mt-5 text-center text-sm text-gray-300">
                        {message}
                    </p>
                )}

                <div className="mt-8 text-center text-gray-400">
                    {isLogin ? (
                        <>
                            Don't have an account?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(false);
                                    setMessage("");
                                }}
                                className="font-semibold text-blue-400 hover:text-blue-300"
                            >
                                Sign Up
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
                                className="font-semibold text-blue-400 hover:text-blue-300"
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