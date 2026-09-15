import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#050711]">
            {/* Background atmosphere */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-[20%] h-[450px] w-[650px] -translate-x-1/2 rounded-full bg-indigo-600/[0.06] blur-[150px]" />

                <div className="absolute bottom-[5%] right-[10%] h-[300px] w-[350px] rounded-full bg-cyan-500/[0.035] blur-[130px]" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-6 py-24">
                <div className="w-full max-w-[430px]">

                    {/* Login Card */}
                    <Card className="border-white/[0.08] bg-white/[0.025] py-0 shadow-2xl shadow-black/20 backdrop-blur-xl">
                        <CardContent className="p-7 sm:p-8">

                            {/* Heading */}
                            <div className="text-center">
                                <h1 className="text-2xl font-bold tracking-[-0.025em] text-white">
                                    Welcome back
                                </h1>

                                <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-slate-500">
                                    Continue your research from where you left off.
                                </p>
                            </div>

                            {/* Form */}
                            <form className="mt-8 space-y-5">

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-slate-300">
                                        Email
                                    </Label>

                                    <div className="relative">
                                        <Mail
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                                        />

                                        <Input
                                            type="email"
                                            placeholder="you@lab.edu"
                                            className="h-11 border-white/[0.10] bg-white/[0.025] pl-10 text-sm text-white placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-indigo-400/10"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-slate-300">
                                            Password
                                        </Label>

                                        <button
                                            type="button"
                                            className="text-xs text-indigo-300 transition hover:text-indigo-200"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Lock
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                                        />

                                        <Input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter your password"
                                            className="h-11 border-white/[0.10] bg-white/[0.025] pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus-visible:border-indigo-400/50 focus-visible:ring-indigo-400/10"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                                        >
                                            {showPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    className="h-11 w-full border-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:opacity-90"
                                >
                                    Sign in
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Signup */}
                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-indigo-300 transition hover:text-indigo-200"
                        >
                            Create account
                        </Link>
                    </p>

                    {/* Back */}
                    <div className="mt-4 text-center">
                        <Link
                            to="/"
                            className="text-xs text-slate-600 transition hover:text-slate-400"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Login;