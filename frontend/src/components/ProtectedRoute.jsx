import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { apiRequest } from "../api/client";

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem(
                "meridian_token"
            );

            if (!token) {
                setAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                await apiRequest("/api/users/me");

                setAuthenticated(true);
            } catch {
                localStorage.removeItem(
                    "meridian_token"
                );

                setAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050711] text-sm text-slate-400">
                Loading Meridian...
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;