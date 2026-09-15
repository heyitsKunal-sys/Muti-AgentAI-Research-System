import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Footer = () => {
    return (
        <footer className="border-t border-white/[0.06]">
            <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">

                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 via-purple-800 to-cyan-800">
                        <Sparkles
                            size={14}
                            className="text-white"
                        />
                    </div>

                    <span className="text-sm font-semibold text-white">
                        Meridian
                    </span>
                </Link>

                {/* Links */}
                <div className="flex items-center gap-6 text-xs text-slate-500">
                    <a
                        href="#"
                        className="transition hover:text-white"
                    >
                        Docs
                    </a>

                    <a
                        href="#"
                        className="transition hover:text-white"
                    >
                        GitHub
                    </a>

                    <a
                        href="#"
                        className="transition hover:text-white"
                    >
                        Privacy
                    </a>

                    <a
                        href="#"
                        className="transition hover:text-white"
                    >
                        Contact
                    </a>
                </div>

                {/* Copyright */}
                <p className="text-xs text-slate-600">
                    © 2026 Meridian Research
                </p>
            </div>
        </footer>
    );
};

export default Footer;