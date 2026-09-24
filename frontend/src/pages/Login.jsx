import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { apiRequest } from "../api/client";


const Login = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await apiRequest(
                "/api/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            // Store JWT token
            localStorage.setItem(
                "meridian_token",
                data.access_token
            );

            // Redirect to Research dashboard
            navigate("/research");

        } catch (error) {
            setError(
                error.message || "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <main className="relative min-h-screen overflow-hidden bg-[#050711]">

            {/* ================= BACKGROUND ================= */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div
                    className="
                        absolute left-1/2 top-[15%]
                        h-[280px] w-[420px]
                        -translate-x-1/2
                        rounded-full
                        bg-indigo-600/[0.06]
                        blur-[120px]

                        sm:top-[20%]
                        sm:h-[350px]
                        sm:w-[500px]
                        sm:blur-[140px]

                        lg:h-[450px]
                        lg:w-[650px]
                        lg:blur-[150px]
                    "
                />

                <div
                    className="
                        absolute
                        -right-[100px]
                        bottom-[5%]
                        h-[220px]
                        w-[250px]
                        rounded-full
                        bg-cyan-500/[0.035]
                        blur-[100px]

                        sm:-right-[50px]
                        sm:h-[280px]
                        sm:w-[320px]
                        sm:blur-[120px]

                        lg:right-[10%]
                        lg:bottom-[5%]
                        lg:h-[300px]
                        lg:w-[350px]
                        lg:blur-[130px]
                    "
                />

            </div>


            {/* ================= CONTENT ================= */}
            <div
                className="
                    relative
                    flex min-h-screen
                    items-center
                    justify-center
                    px-4 py-10

                    sm:px-6
                    sm:py-16

                    lg:px-8
                    lg:py-24
                "
            >

                <div className="w-full max-w-[430px]">

                    {/* ================= LOGIN CARD ================= */}
                    <Card
                        className="
                            border-white/[0.08]
                            bg-white/[0.025]
                            py-0
                            shadow-2xl
                            shadow-black/20
                            backdrop-blur-xl
                        "
                    >

                        <CardContent
                            className="
                                p-5

                                sm:p-7

                                md:p-8
                            "
                        >

                            {/* ================= HEADING ================= */}
                            <div className="text-center">

                                <h1
                                    className="
                                        text-[22px]
                                        font-bold
                                        leading-tight
                                        tracking-[-0.025em]
                                        text-white

                                        sm:text-2xl
                                    "
                                >
                                    Welcome back
                                </h1>

                                <p
                                    className="
                                        mx-auto
                                        mt-3
                                        max-w-[290px]
                                        text-xs
                                        leading-5
                                        text-slate-500

                                        sm:max-w-[300px]
                                        sm:text-sm
                                        sm:leading-6
                                    "
                                >
                                    Continue your research from where you
                                    left off.
                                </p>

                            </div>


                            {/* ================= FORM ================= */}
                            <form
                                onSubmit={handleSubmit}
                                className="
                                    mt-7
                                    space-y-4

                                    sm:mt-8
                                    sm:space-y-5
                                "
                            >

                                {/* ================= EMAIL ================= */}
                                <div className="space-y-2">

                                    <Label
                                        htmlFor="email"
                                        className="
                                            text-xs
                                            font-medium
                                            text-slate-300
                                        "
                                    >
                                        Email
                                    </Label>

                                    <div className="relative">

                                        <Mail
                                            size={16}
                                            className="
                                                absolute
                                                left-3
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-500
                                            "
                                        />

                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@lab.edu"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(
                                                    e.target.value
                                                )
                                            }
                                            className="
                                                h-10
                                                border-white/[0.10]
                                                bg-white/[0.025]
                                                pl-10
                                                text-sm
                                                text-white
                                                placeholder:text-slate-600
                                                focus-visible:border-indigo-400/50
                                                focus-visible:ring-indigo-400/10

                                                sm:h-11
                                            "
                                        />

                                    </div>

                                </div>


                                {/* ================= PASSWORD ================= */}
                                <div className="space-y-2">

                                    <div className="flex items-center justify-between gap-3">

                                        <Label
                                            htmlFor="password"
                                            className="
                                                text-xs
                                                font-medium
                                                text-slate-300
                                            "
                                        >
                                            Password
                                        </Label>

                                        <button
                                            type="button"
                                            onClick={() => navigate("/forgot-password")}
                                            className="
                                                shrink-0
                                                text-[11px]
                                                text-indigo-300
                                                transition
                                                hover:text-indigo-200

                                                sm:text-xs
                                            "
                                        >
                                            Forgot password?
                                        </button>

                                    </div>


                                    <div className="relative">

                                        <Lock
                                            size={16}
                                            className="
                                                absolute
                                                left-3
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-500
                                            "
                                        />

                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(
                                                    e.target.value
                                                )
                                            }
                                            className="
                                                h-10
                                                border-white/[0.10]
                                                bg-white/[0.025]
                                                pl-10
                                                pr-10
                                                text-sm
                                                text-white
                                                placeholder:text-slate-600
                                                focus-visible:border-indigo-400/50
                                                focus-visible:ring-indigo-400/10

                                                sm:h-11
                                            "
                                        />


                                        {/* Show / Hide password */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    !showPassword
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                p-1
                                                text-slate-500
                                                transition
                                                hover:text-slate-300
                                            "
                                        >
                                            {showPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>

                                    </div>

                                </div>


                                {/* ================= ERROR ================= */}
                                {error && (
                                    <p className="text-sm text-red-400">
                                        {error}
                                    </p>
                                )}


                                {/* ================= SUBMIT ================= */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        h-10
                                        w-full
                                        border-0
                                        bg-gradient-to-r
                                        from-indigo-400
                                        via-purple-400
                                        to-cyan-400
                                        text-sm
                                        font-semibold
                                        text-white
                                        shadow-lg
                                        shadow-indigo-500/10
                                        transition
                                        hover:opacity-90
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60

                                        sm:h-11
                                    "
                                >
                                    {loading
                                        ? "Signing in..."
                                        : "Sign in"}
                                </Button>

                            </form>

                        </CardContent>

                    </Card>


                    {/* ================= SIGNUP ================= */}
                    <p
                        className="
                            mt-5
                            text-center
                            text-xs
                            text-slate-500

                            sm:mt-6
                            sm:text-sm
                        "
                    >
                        Don't have an account?{" "}

                        <Link
                            to="/signup"
                            className="
                                font-medium
                                text-indigo-300
                                transition
                                hover:text-indigo-200
                            "
                        >
                            Create account
                        </Link>
                    </p>


                    {/* ================= BACK ================= */}
                    <div className="mt-3 text-center sm:mt-4">

                        <Link
                            to="/"
                            className="
                                text-[11px]
                                text-slate-600
                                transition
                                hover:text-slate-400

                                sm:text-xs
                            "
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