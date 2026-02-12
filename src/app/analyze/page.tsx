"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import ResultsDisplay from "@/components/ResultsDisplay";
import { AnalysisResult, saveAnalysis } from "@/lib/history";
import { EXAMPLE_POLICY } from "@/lib/example-policy";

export default function AnalyzePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [company, setCompany] = useState("");
    const [policyText, setPolicyText] = useState("");
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [identifying, setIdentifying] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    const loadExample = useCallback(() => {
        setTitle(EXAMPLE_POLICY.title);
        setCompany(EXAMPLE_POLICY.company);
        setPolicyText(EXAMPLE_POLICY.content);
        setFileName("");
        setResult(null);
        setError("");
    }, []);

    const identifyPolicy = useCallback(async (text: string) => {
        if (!text || text.trim().length < 50) return;
        setIdentifying(true);
        try {
            const res = await fetch("/api/identify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text }),
            });
            const data = await res.json();
            if (data.company) setCompany(data.company);
            if (data.title) setTitle(data.title);
        } catch (e) {
            console.error("Identify failed", e);
        } finally {
            setIdentifying(false);
        }
    }, []);

    const handleFileDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) await handleFile(file);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) await handleFile(file);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    async function handleFile(file: File) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext !== "txt" && ext !== "pdf") {
            setError("Please upload a .txt or .pdf file.");
            return;
        }

        setFileName(file.name);
        setError("");

        let text = "";
        if (ext === "txt") {
            text = await file.text();
            setPolicyText(text);
        } else {
            // Send to API for PDF parsing
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
                const data = await res.json();
                if (data.text) {
                    text = data.text;
                    setPolicyText(data.text);
                } else {
                    setError(data.error || "Failed to parse PDF.");
                    return;
                }
            } catch {
                setError("Failed to parse file. Please try pasting the text directly.");
                return;
            }
        }

        // Auto-identify if we have text
        if (text) {
            identifyPolicy(text);
        }
    }

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData("text");
        if (text) {
            // Wait for paste to complete then identify
            // Or just use the clipboard text directly
            identifyPolicy(text);
        }
    }, [identifyPolicy]);

    async function handleAnalyze() {
        if (!policyText.trim()) {
            setError("Please paste or upload a privacy policy first.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title || "Unknown Policy",
                    company: company || "Unknown Company",
                    content: policyText,
                }),
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            setResult(data);

            // Save to history
            saveAnalysis({
                id: Date.now().toString(),
                title: title || "Unknown Policy",
                company: company || "Unknown Company",
                date: new Date().toISOString(),
                riskScore: data.risk_score,
                riskLevel: data.risk_level,
                result: data,
            });

            // Scroll to results
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 200);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-h-screen bg-white">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
                    <div className="flex items-center justify-between px-5 py-4 max-w-[1100px] mx-auto">
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
                        <h1 className="text-sm font-semibold tracking-tight">Privacy Policy Simplifier</h1>
                        <div className="w-9" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Main content */}
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="px-6 py-10 max-w-[1100px] mx-auto sm:px-12"
                >
                    {/* Input Card */}
                    <div className="card p-6 sm:p-10">
                        <div className="space-y-6">
                            {/* Policy Title */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2 flex items-center gap-2">
                                    Privacy Policy Of
                                    {identifying && <span className="text-[10px] text-blue-500 animate-pulse">✨ AI Detecting...</span>}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Instagram Privacy Policy"
                                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[15px] text-[#111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2 flex items-center gap-2">
                                    Company
                                    {identifying && <span className="text-[10px] text-blue-500 animate-pulse">✨ AI Detecting...</span>}
                                </label>
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="Meta Platforms Inc."
                                    className="w-full px-4 py-3 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[15px] text-[#111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Policy Content — Split */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">
                                    Policy Content
                                </label>
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Textarea (70%) */}
                                    <div className="flex-[7]">
                                        <textarea
                                            value={policyText}
                                            onChange={(e) => setPolicyText(e.target.value)}
                                            onPaste={handlePaste}
                                            placeholder="Paste the privacy policy text here…"
                                            className="w-full min-h-[250px] px-4 py-3 rounded-xl bg-[#F9FAFB] border border-gray-200 text-[15px] text-[#111] placeholder:text-[#9CA3AF] resize-y focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-transparent transition-all leading-relaxed"
                                        />
                                    </div>

                                    {/* Upload (30%) */}
                                    <div className="flex-[3]">
                                        <div
                                            onDrop={handleFileDrop}
                                            onDragOver={(e) => e.preventDefault()}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-full min-h-[250px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-[#FAFAFA] hover:border-gray-300 hover:bg-[#F5F5F5] cursor-pointer transition-all p-4"
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".txt,.pdf"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />

                                            {fileName ? (
                                                <div className="text-center">
                                                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs font-medium text-[#111] break-all">{fileName}</p>
                                                    <p className="text-[10px] text-[#9CA3AF] mt-1">Click to replace</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs font-medium text-[#6B7280]">Drop file here</p>
                                                    <p className="text-[10px] text-[#9CA3AF] mt-1">.txt or .pdf</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Try Example */}
                        <div className="mt-4 text-center">
                            <button
                                onClick={loadExample}
                                className="text-xs text-[#6B7280] hover:text-[#111] underline underline-offset-4 decoration-gray-300 hover:decoration-gray-500 transition-colors"
                            >
                                Try an example — Instagram Privacy Policy
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 text-sm text-red-500 text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Analyze Button */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="btn-primary px-12 py-4 text-[15px]"
                            >
                                {loading && <span className="spinner" />}
                                {loading ? "Analyzing…" : "Analyze Policy"}
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div ref={resultRef}>
                        {result && <ResultsDisplay result={result} />}
                    </div>
                </motion.main>
            </div>
        </>
    );
}
