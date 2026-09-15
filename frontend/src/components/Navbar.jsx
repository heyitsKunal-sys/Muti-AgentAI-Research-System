import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = () => {
  const location = useLocation();

  const isLanding = location.pathname === "/";

  return (
    <header className="absolute left-0 top-0 z-50 w-full border-b border-white/[0.06]">
      <nav className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-6 ">
        
        {/* Left */}
        <div className="flex items-center ">
          {isLanding ? (
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-red-400 via-purple-800 to-cyan-800 shadow-lg shadow-indigo-500/10">
                <Sparkles
                  size={17}
                  strokeWidth={2.2}
                  className="text-white"
                />
              </div>

              <span className="text-[17px] font-semibold tracking-[-0.02em] text-white">
                Meridian
              </span>
            </Link>
          ) : (
            <Button
              onClick={() => window.history.back()}
              className="group flex items-center gap-2 text-sm font-medium text-slate-800 transition hover:text-white"
            >
              <ArrowLeft
                size={17}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back
            </Button>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block"
          >
            Sign in
          </Link>

          <Link
            to="/signup"
            className="rounded-lg bg-gradient-to-r from-blue-900 via-purple-500 to-cyan-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:scale-[1.02]"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;