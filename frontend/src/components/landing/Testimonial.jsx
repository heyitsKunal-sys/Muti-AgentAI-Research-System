import { Star } from "lucide-react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

const testimonials = [
    {
        quote:
            "I stopped opening fifteen tabs for a literature check. It reads the field and tells me what actually disagrees.",
        name: "Priya Nair",
        role: "PhD Candidate, Computational Biology",
    },
    {
        quote:
            "The critic stage is the whole product for me — it flags the one claim in five that isn't actually backed by the source.",
        name: "Marcus Webb",
        role: "Equity Research Analyst",
    },
    {
        quote:
            "Watching the pipeline move from search to critique changed how I trust the output. I can see the work, not just the answer.",
        name: "Sofia Alvarez",
        role: "Policy Researcher",
    },
];

const Testimonials = () => {
    return (
        <section className="relative overflow-hidden py-32">
            {/* Background glow */}
            <div className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[500px] rounded-full bg-purple-600/[0.04] blur-[150px]" />

            <div className="relative mx-auto max-w-[1100px] px-6">

                {/* Heading */}
                <div className="max-w-[500px]">
                    <h2 className="text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl">
                        Trusted for work that needs
                        <br />
                        to hold up.
                    </h2>
                </div>

                {/* Testimonials */}
                <div className="mt-14 grid gap-4 md:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <Card
                            key={testimonial.name}
                            className="border-white/[0.08] bg-white/[0.02] py-0 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/20 hover:bg-white/[0.035]"
                        >
                            <CardContent className="flex h-full flex-col p-6">

                                {/* Stars */}
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Star
                                            key={index}
                                            size={13}
                                            fill="currentColor"
                                            className="text-purple-300"
                                        />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="mt-6 text-sm font-medium leading-6 text-slate-300">
                                    "{testimonial.quote}"
                                </p>

                                {/* Person */}
                                <div className="mt-auto pt-8">
                                    <p className="text-sm font-semibold text-white">
                                        {testimonial.name}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {testimonial.role}
                                    </p>
                                </div>

                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;