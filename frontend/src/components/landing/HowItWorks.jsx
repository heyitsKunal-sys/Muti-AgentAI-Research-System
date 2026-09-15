import {
    Search,
    BookOpen,
    PenLine,
    ShieldCheck,
} from "lucide-react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

const steps = [
    {
        number: "01",
        icon: Search,
        title: "Search",
        subtitle: "Find the evidence",
        description:
            "The search agent breaks your question into focused queries and finds relevant, trustworthy sources.",
    },
    {
        number: "02",
        icon: BookOpen,
        title: "Read",
        subtitle: "Understand the sources",
        description:
            "The reader agent extracts the important information and separates useful evidence from noise.",
    },
    {
        number: "03",
        icon: PenLine,
        title: "Write",
        subtitle: "Build the answer",
        description:
            "The writer chain combines the evidence into a clear answer with citations connected to its sources.",
    },
    {
        number: "04",
        icon: ShieldCheck,
        title: "Critique",
        subtitle: "Check every claim",
        description:
            "The critic chain reviews the answer, challenges unsupported claims, and sends it back for refinement.",
    },
];

const HowItWorks = () => {
    return (
        <section
            id="how-it-works"
            className="relative overflow-hidden py-32"
        >
            {/* Background glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/[0.045] blur-[150px]" />

            <div className="relative mx-auto max-w-[1100px] px-6">

                {/* Section heading */}
                <div className="max-w-[650px]">
                    <p className="mb-4 text-sm font-medium text-indigo-400">
                        How it works
                    </p>

                    <h2 className="text-4xl font-bold tracking-[-0.035em] text-white sm:text-5xl">
                        How a question becomes
                        <br />
                        <span className="text-slate-500">
                            an answer.
                        </span>
                    </h2>

                    <p className="mt-6 max-w-[570px] text-base leading-7 text-slate-400">
                        One question moves through four specialized stages.
                        Each agent has one job, and every stage leaves a trace.
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative mt-20">

                    {/* Connecting line */}
                    <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-indigo-500/0 via-indigo-400/30 to-cyan-400/0 lg:block" />

                    <div className="grid gap-6 lg:grid-cols-4">
                        {steps.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.number}
                                    className="relative"
                                >
                                    {/* Timeline node */}
                                    <div className="relative z-10 mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/20 bg-[#050711]">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/10">
                                            <Icon
                                                size={13}
                                                strokeWidth={1.8}
                                                className="text-indigo-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Step card */}
                                    <Card className="h-full border-white/[0.07] bg-white/[0.025] py-0 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/20 hover:bg-white/[0.04]">
                                        <CardContent className="p-5">

                                            <span className="text-xs font-medium text-slate-600">
                                                {step.number}
                                            </span>

                                            <h3 className="mt-5 text-lg font-semibold text-white">
                                                {step.title}
                                            </h3>

                                            <p className="mt-1 text-sm font-medium text-indigo-300">
                                                {step.subtitle}
                                            </p>

                                            <p className="mt-4 text-sm leading-6 text-slate-500">
                                                {step.description}
                                            </p>

                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;