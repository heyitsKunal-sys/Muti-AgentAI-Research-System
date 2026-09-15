import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../api/client";

const VerifyOTP = () => {
    const navigate = useNavigate();

    const email = sessionStorage.getItem(
        "meridian_verification_email"
    );

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await apiRequest(
                "/api/auth/verify-otp",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        otp,
                    }),
                }
            );

            sessionStorage.removeItem(
                "meridian_verification_email"
            );

            navigate("/login");

        } catch (error) {
            setError(
                error.message || "OTP verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#050711] px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
                
                <h1 className="text-2xl font-bold text-white">
                    Verify your email
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                    Enter the 6-digit OTP sent to{" "}
                    <span className="text-indigo-300">
                        {email}
                    </span>
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4"
                >
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                            setOtp(
                                e.target.value.replace(
                                    /\D/g,
                                    ""
                                )
                            )
                        }
                        placeholder="Enter 6-digit OTP"
                        className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-4 text-center tracking-[0.4em] text-white outline-none placeholder:tracking-normal placeholder:text-slate-600 focus:border-indigo-400/50"
                    />

                    {error && (
                        <p className="text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            otp.length !== 6
                        }
                        className="h-11 w-full rounded-md bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify email"}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default VerifyOTP;