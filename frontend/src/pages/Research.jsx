import { useState } from "react";
import {
    ArrowUp,
    Menu,
    Paperclip,
    Sparkles,
    X,
    Plus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const Research = () => {
    const [question, setQuestion] = useState("");
    const [researchStarted, setResearchStarted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleResearch = () => {
        if (!question.trim()) return;
        setResearchStarted(true);
        setSidebarOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleResearch();
        }
    };

    const handleNewResearch = () => {
        setQuestion("");
        setResearchStarted(false);
        setSidebarOpen(false);
    };

    return (
        <main className="flex h-screen overflow-hidden bg-[#050711] text-white">

            {/* ================= MOBILE OVERLAY ================= */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* ================= SIDEBAR ================= */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col
                    border-r border-white/[0.07] bg-[#070914]
                    transition-transform duration-300
                    lg:static lg:z-auto lg:w-[250px]
                    lg:translate-x-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Sidebar header */}
                <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400">
                            <Sparkles size={15} className="text-white" />
                        </div>

                        <span className="font-semibold tracking-tight">
                            Meridian
                        </span>
                    </div>

                    {/* Close button only mobile */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* New research */}
                <div className="p-3">
                    <button
                        type="button"
                        onClick={handleNewResearch}
                        className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05]"
                    >
                        <Plus size={17} />
                        New research
                    </button>
                </div>

                {/* Research history */}
                <div className="flex-1 overflow-y-auto px-3">
                    <p className="px-2 py-4 text-xs leading-5 text-slate-600">
                        Your research will appear here.
                    </p>
                </div>

                {/* User */}
                <div className="shrink-0 border-t border-white/[0.06] p-3">
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-400/20 text-xs font-semibold text-indigo-200">
                            U
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">
                                User
                            </p>
                            <p className="text-[10px] text-slate-600">
                                Free plan
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ================= MAIN ================= */}
            <section className="flex min-w-0 flex-1 flex-col">

                {/* Header */}
                <header className="flex h-[68px] shrink-0 items-center border-b border-white/[0.07] px-4 sm:px-6">

                    {/* Hamburger */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                        className="mr-3 rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
                    >
                        <Menu size={19} />
                    </button>

                    <h1 className="truncate text-sm font-semibold text-slate-300">
                        {researchStarted ? "Research" : "New research"}
                    </h1>
                </header>

                {/* ================= CONTENT ================= */}
                <div className="flex min-h-0 flex-1 overflow-y-auto">

                    <div className="mx-auto flex w-full max-w-[800px] flex-1 px-4 py-8 sm:px-8 sm:py-10">

                        {!researchStarted ? (
                            /* EMPTY STATE */
                            <div className="flex w-full items-center justify-center text-center">

                                <div className="w-full">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400/20 via-purple-400/15 to-cyan-400/10 ring-1 ring-white/[0.08]">
                                        <Sparkles
                                            size={20}
                                            strokeWidth={1.8}
                                            className="text-indigo-300"
                                        />
                                    </div>

                                    <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                        What would you like to research?
                                    </h2>

                                    <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-slate-500">
                                        Ask a question and Meridian will search,
                                        analyze, write, and critique the answer.
                                    </p>
                                </div>

                            </div>
                        ) : (
                            /* RESEARCH STATE */
                            <div className="w-full self-start pt-4 sm:pt-10">

                                {/* User question */}
                                <div className="flex justify-end">
                                    <Card className="max-w-[90%] border-indigo-400/20 bg-indigo-400/[0.07] py-0 sm:max-w-[650px]">
                                        <CardContent className="px-4 py-3">
                                            <p className="text-sm leading-6 text-slate-200">
                                                {question}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Pipeline placeholder */}
                                <div className="mt-8 sm:mt-10">

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400/20 via-purple-400/15 to-cyan-400/10 ring-1 ring-white/[0.08]">
                                            <Sparkles
                                                size={15}
                                                className="text-indigo-300"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-white">
                                                Research pipeline
                                            </p>

                                            <p className="mt-0.5 text-[10px] text-indigo-300">
                                                Ready to start
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-5 text-sm leading-6 text-slate-500">
                                        Your Search Agent, Reader Agent,
                                        Writer Chain, and Critic Chain will
                                        appear here when the backend is
                                        connected.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ================= INPUT ================= */}
                <div className="shrink-0 p-3 sm:p-6">

                    <div className="mx-auto max-w-[800px]">

                        <Card className="border-white/[0.08] bg-white/[0.025] py-0 backdrop-blur-xl">
                            <CardContent className="flex items-end gap-2 p-2 sm:gap-3">

                                <button
                                    type="button"
                                    className="mb-2 ml-1 shrink-0 text-slate-500 transition hover:text-slate-300"
                                >
                                    <Paperclip size={17} />
                                </button>

                                <Textarea
                                    value={question}
                                    onChange={(e) =>
                                        setQuestion(e.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a question, or start new research..."
                                    className="min-h-[42px] max-h-[160px] resize-none border-0 bg-transparent px-2 py-2 text-sm text-white shadow-none placeholder:text-slate-600 focus-visible:ring-0"
                                />

                                <button
                                    type="button"
                                    onClick={handleResearch}
                                    disabled={!question.trim()}
                                    className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <ArrowUp size={16} />
                                </button>

                            </CardContent>
                        </Card>

                        <p className="mt-2 px-2 text-center text-[10px] leading-4 text-slate-700">
                            Meridian verifies claims against sources, but
                            always check citations for high-stakes work.
                        </p>

                    </div>
                </div>
            </section>

            {/* ================= SOURCES ================= */}
            <aside className="hidden w-[290px] shrink-0 border-l border-white/[0.07] xl:block">

                <div className="flex h-[68px] items-center border-b border-white/[0.07] px-5">
                    <div>
                        <p className="text-xs font-semibold text-slate-300">
                            Sources
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                            No sources yet
                        </p>
                    </div>
                </div>

                <div className="flex h-[calc(100%-68px)] items-center justify-center px-6 text-center">
                    <p className="text-xs leading-5 text-slate-600">
                        Sources collected during your research will appear here.
                    </p>
                </div>

            </aside>
        </main>
    );
};

export default Research;