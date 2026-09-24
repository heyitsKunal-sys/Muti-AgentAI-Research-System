import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../api/client";


const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        sessionStorage.getItem("meridian_password_reset_email") || ""
    );
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState("request");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setOtp("");
        setLoading(true);

        try {
            const data = await apiRequest(
                "/api/auth/forgot-password",
                {
                    method: "POST",
                    body: JSON.stringify({ email }),
                }
            );

            sessionStorage.setItem(
                "meridian_password_reset_email",
                email
            );
            setMessage(data.message || "If an account exists, an OTP has been sent.");
            setStep("reset");
        } catch (requestError) {
            setError(requestError.message || "Could not send the reset OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await apiRequest(
                "/api/auth/reset-password",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        otp,
                        new_password: newPassword,
                    }),
                }
            );

            sessionStorage.removeItem("meridian_password_reset_email");
            navigate("/login", {
                replace: true,
                state: { message: "Password updated. You can sign in now." },
            });
        } catch (resetError) {
            setError(resetError.message || "Could not reset your password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050711] px-4 py-10 sm:px-6 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.12),transparent_35%)]" />

            <div className="relative w-full max-w-[430px]">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                    <Link
                        to="/login"
                        className="mb-7 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-slate-300"
                    >
                        <ArrowLeft size={14} />
                        Back to sign in
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {step === "request" ? "Forgot your password?" : "Set a new password"}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        {step === "request"
                            ? "Enter your email and we will send a one-time reset code."
                            : `Enter the 6-digit code sent to ${email}.`}
                    </p>

                    {step === "request" ? (
                        <form onSubmit={handleRequestOtp} className="mt-7 space-y-5">
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@lab.edu"
                                    className="h-11 w-full rounded-md border border-white/10 bg-white/[0.025] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/50"
                                />
                            </div>

                            {error && <p className="text-sm text-red-400">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-11 w-full rounded-md bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Sending code..." : "Send reset code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="mt-7 space-y-4">
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                                placeholder="Enter 6-digit OTP"
                                className="h-11 w-full rounded-md border border-white/10 bg-white/[0.025] px-4 text-center tracking-[0.4em] text-white outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-indigo-400/50"
                            />

                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    required
                                    minLength={8}
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    placeholder="New password"
                                    className="h-11 w-full rounded-md border border-white/10 bg-white/[0.025] px-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <input
                                required
                                minLength={8}
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm new password"
                                className="h-11 w-full rounded-md border border-white/10 bg-white/[0.025] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/50"
                            />

                            {message && <p className="text-sm text-emerald-400">{message}</p>}
                            {error && <p className="text-sm text-red-400">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="h-11 w-full rounded-md bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Updating password..." : "Update password"}
                            </button>

                            <button
                                type="button"
                                onClick={handleRequestOtp}
                                disabled={loading}
                                className="w-full text-xs text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Sending code..." : "Resend code"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("request");
                                    setOtp("");
                                    setError("");
                                    setMessage("");
                                }}
                                className="w-full text-xs text-slate-500 transition hover:text-slate-300"
                            >
                                Use a different email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ForgotPassword;
