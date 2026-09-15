import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { apiRequest } from "../api/client";

    const Signup = () => {
        const navigate = useNavigate();

        const [showPassword, setShowPassword] = useState(false);

        const [name, setName] = useState("");
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
                    "/api/auth/register",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            name,
                            email,
                            password,
                        }),
                    }
                );

                sessionStorage.setItem(
                    "meridian_verification_email",
                    data.email
                );

                navigate("/verify-otp");

            } catch (error) {
                setError(
                    error.message || "Registration failed."
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
                        lg:bottom-[10%]
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

                        {/* ================= CARD ================= */}
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
                                        Create your account
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
                                        Set up the pipeline once — every research
                                        thread starts here.
                                    </p>

                                </div>

                                {/* ================= FORM ================= */}
                                <form
                                    onSubmit={handleSubmit}
                                    className="mt-7 space-y-4 sm:mt-8 sm:space-y-5"
                                >

                                    {/* Full name */}
                                    <div className="space-y-2">

                                        <Label
                                            htmlFor="name"
                                            className="text-xs font-medium text-slate-300"
                                        >
                                            Full name
                                        </Label>

                                        <div className="relative">

                                            <User
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
                                                id="name"
                                                type="text"
                                                placeholder="your name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
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

                                    {/* Email */}
                                    <div className="space-y-2">

                                        <Label
                                            htmlFor="email"
                                            className="text-xs font-medium text-slate-300"
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
                                                onChange={(e) => setEmail(e.target.value)}
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

                                    {/* Password */}
                                    <div className="space-y-2">

                                        <Label
                                            htmlFor="password"
                                            className="text-xs font-medium text-slate-300"
                                        >
                                            Password
                                        </Label>

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
                                                placeholder="At least 8 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
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

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(!showPassword)
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

                                    {/* Terms */}
                                    <div className="flex items-start gap-2.5 pt-1 sm:gap-3">

                                        <Checkbox
                                            id="terms"
                                            className="
                                            mt-0.5
                                            shrink-0
                                            border-white/20
                                            data-[state=checked]:border-indigo-400
                                            data-[state=checked]:bg-indigo-500
                                        "
                                        />

                                        <Label
                                            htmlFor="terms"
                                            className="
                                            cursor-pointer
                                            text-[11px]
                                            leading-5
                                            text-slate-500

                                            sm:text-xs
                                        "
                                        >
                                            I agree to the{" "}
                                            <span className="text-slate-300">
                                                Terms of Service
                                            </span>{" "}
                                            and{" "}
                                            <span className="text-slate-300">
                                                Privacy Policy
                                            </span>
                                            .
                                        </Label>

                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-400">
                                            {error}
                                        </p>
                                    )}

                                    {/* Submit */}
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
                                        {loading ? "Creating account..." : "Create account"}
                                    </Button>

                                </form>

                            </CardContent>
                        </Card>

                        {/* ================= LOGIN ================= */}
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
                            Already have an account?{" "}

                            <Link
                                to="/login"
                                className="
                                font-medium
                                text-indigo-300
                                transition
                                hover:text-indigo-200
                            "
                            >
                                Sign in
                            </Link>
                        </p>

                    </div>
                </div>
            </main>
        );
    };

    export default Signup;