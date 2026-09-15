import {
    ArrowRight,
    Check,
    LoaderCircle,
    Search,
    BookOpen,
    PenLine,
    ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

const pipeline = [
    {
        icon: Search,
        title: "Search Agent",
        description: "18 sources found",
        status: "done",
    },
    {
        icon: BookOpen,
        title: "Reader Agent",
        description: "12 sources parsed",
        status: "done",
    },
    {
        icon: PenLine,
        title: "Writer Chain",
        description: "Draft assembled",
        status: "done",
    },
    {
        icon: ShieldCheck,
        title: "Critic Chain",
        description: "Verifying claims...",
        status: "loading",
    },
];

const Hero = () => {
    return (
        <section className="relative min-h-screen overflow-hidden">
            {/* Background atmosphere */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[25%] top-[10%] h-[500px] w-[700px] rounded-full bg-indigo-600/[0.07] blur-[150px]" />

                <div className="absolute right-[10%] top-[25%] h-[350px] w-[450px] rounded-full bg-blue-500/[0.04] blur-[140px]" />
            </div>

            <div className="relative mx-auto max-w-[1100px] px-6">
                {/* Hero content */}
                <div className="flex min-h-[620px] flex-col justify-center pt-24">

                    {/* Eyebrow */}
                    <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-300">
                        <span className="text-indigo-400">✣</span>
                        Four agents. One research pipeline.
                    </div>

                    {/* Heading */}
                    <h1 className="max-w-[700px] text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-[68px]">
                        Research that shows
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            its working.
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="mt-7 max-w-[560px] text-[16px] font-medium leading-7 text-slate-400">
                        Meridian sends a search agent, a reader, a writer, and a critic
                        after your question — and hands you back a cited answer that's
                        already been checked against its own sources.
                    </p>

                    {/* Actions */}
                    <div className="mt-8 flex items-center gap-5">
                        <Link
                            to="/signup"
                            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all duration-200 hover:scale-[1.02]"
                        >
                            Get started
                            <ArrowRight
                                size={16}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </Link>

                        <a
                            href="#how-it-works"
                            className="text-sm font-semibold text-white transition hover:text-indigo-300"
                        >
                            See how it works
                        </a>
                    </div>
                </div>

                {/* Live Pipeline */}
                <div className="pb-32">
                    <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />

                        <span>
                            Live pipeline · "compare mRNA vaccine platforms 2020–2026"
                        </span>
                    </div>

                    <div className="space-y-2">
                        {pipeline.map((agent) => {
                            const Icon = agent.icon;

                            return (
                                <Card
                                    key={agent.title}
                                    className="border-white/[0.07] bg-white/[0.035] py-0 backdrop-blur-md transition-colors hover:border-indigo-400/20 hover:bg-white/[0.05]"
                                >
                                    <CardContent className="flex min-h-15.5 items-center justify-between px-4 py-0">
                                        <div className="flex items-center gap-4">
                                            {/* Icon */}
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400/30 to-cyan-400/20 ring-1 ring-white/10">
                                                <Icon
                                                    size={17}
                                                    strokeWidth={1.8}
                                                    className="text-indigo-200"
                                                />
                                            </div>

                                            {/* Text */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">
                                                    {agent.title}
                                                </h3>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {agent.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        {agent.status === "done" ? (
                                            <Check
                                                size={17}
                                                strokeWidth={2}
                                                className="text-cyan-300"
                                            />
                                        ) : (
                                            <LoaderCircle
                                                size={17}
                                                className="animate-spin text-purple-400"
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;