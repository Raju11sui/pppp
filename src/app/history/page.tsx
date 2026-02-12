"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ResultsDisplay from "@/components/ResultsDisplay";
import { getHistory, clearHistory, HistoryEntry } from "@/lib/history";

function getRiskColor(score: number) {
    if (score <= 30) return "text-green-600 bg-green-50";
    if (score <= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
}

export default function HistoryPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const handleClear = () => {
        clearHistory();
        setHistory([]);
        setSelectedEntry(null);
    };

    return (
        <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-h-screen bg-white">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
                    <div className="flex items-center justify-between px-6 py-4 max-w-[1100px] mx-auto sm:px-12">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-xl hover:bg-[#F3F4F6] transition-colors"
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <h1 className="text-sm font-semibold tracking-tight">History</h1>
                        <div className="w-9" />
                    </div>
                </header>

                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="px-6 py-10 max-w-[1100px] mx-auto sm:px-12"
                >
                    <AnimatePresence mode="wait">
                        {selectedEntry ? (
                            <motion.div
                                key="detail"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <button
                                    onClick={() => setSelectedEntry(null)}
                                    className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111] mb-6 transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Back to History
                                </button>

                                <div className="mb-4">
                                    <h2 className="text-xl font-semibold">{selectedEntry.title}</h2>
                                    <p className="text-sm text-[#6B7280] mt-1">
                                        {selectedEntry.company} · {new Date(selectedEntry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                </div>

                                <ResultsDisplay result={selectedEntry.result} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {history.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F3F4F6] flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <p className="text-[#6B7280] text-sm">No analysis history yet.</p>
                                        <Link
                                            href="/analyze"
                                            className="inline-block mt-4 text-sm text-[#111] underline underline-offset-4 decoration-gray-300 hover:decoration-gray-500 transition-colors"
                                        >
                                            Analyze your first policy
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((entry, i) => (
                                            <motion.button
                                                key={entry.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                                onClick={() => setSelectedEntry(entry)}
                                                className="w-full card p-5 flex items-center justify-between hover:shadow-md transition-shadow text-left group"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-[#111] group-hover:text-[#111] truncate">
                                                        {entry.company}
                                                    </p>
                                                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                                                        {entry.title} · {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getRiskColor(entry.riskScore)}`}>
                                                        {entry.riskScore}
                                                    </span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#9CA3AF] transition-colors">
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                </div>
                                            </motion.button>
                                        ))}

                                        {/* Clear History */}
                                        <div className="pt-6 text-center">
                                            <button
                                                onClick={handleClear}
                                                className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors underline underline-offset-4 decoration-gray-200 hover:decoration-red-300"
                                            >
                                                Clear History
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.main>
            </div>
        </>
    );
}
