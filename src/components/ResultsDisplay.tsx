"use client";

import { motion, Variants } from "framer-motion";
import { AnalysisResult } from "@/lib/history";

interface ResultsDisplayProps {
    result: AnalysisResult;
}

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
    }),
};

function getRiskColor(score: number) {
    if (score <= 30) return { bar: "#22C55E", label: "text-green-600", bg: "bg-green-50" };
    if (score <= 60) return { bar: "#EAB308", label: "text-yellow-600", bg: "bg-yellow-50" };
    return { bar: "#EF4444", label: "text-red-600", bg: "bg-red-50" };
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
    const riskColor = getRiskColor(result.risk_score);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="mt-10 space-y-6 max-w-[900px] mx-auto"
        >
            {/* Summary */}
            <motion.div custom={0} variants={fadeUp} className="card p-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
                    Summary
                </h3>
                <p className="text-[15px] leading-relaxed text-[#111]">{result.summary}</p>
            </motion.div>

            {/* Data Collected */}
            <motion.div custom={1} variants={fadeUp} className="card p-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
                    Data Collected
                </h3>
                <ul className="space-y-2">
                    {result.data_collected.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px]">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#111] shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Shared With */}
            <motion.div custom={2} variants={fadeUp} className="card p-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
                    Shared With
                </h3>
                <ul className="space-y-2">
                    {result.data_shared_with.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[15px]">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6B7280] shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Retention Policy */}
            <motion.div custom={3} variants={fadeUp} className="card p-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
                    Retention Policy
                </h3>
                <p className="text-[15px] leading-relaxed text-[#111]">{result.retention_policy}</p>
            </motion.div>

            {/* Hidden Risks */}
            <motion.div custom={4} variants={fadeUp} className="rounded-2xl bg-red-50/70 border border-red-100 p-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-4">
                    Hidden Risks
                </h3>
                <ul className="space-y-3">
                    {result.hidden_risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-3 text-[15px] text-red-800">
                            <span className="text-base mt-0.5">⚠️</span>
                            {risk}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Risk Score */}
            <motion.div custom={5} variants={fadeUp} className="card p-10 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-6">
                    Privacy Risk Score
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-bold tracking-tight" style={{ color: riskColor.bar }}>
                        {result.risk_score}
                    </span>
                    <span className="text-2xl text-[#6B7280] font-light">/ 100</span>
                </div>
                <p className={`mt-2 text-sm font-semibold ${riskColor.label}`}>{result.risk_level}</p>

                {/* Progress bar */}
                <div className="mt-6 mx-auto max-w-xs">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.risk_score}%` }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: riskColor.bar }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.p custom={6} variants={fadeUp} className="text-center text-xs text-[#9CA3AF] pb-10">
                This AI-generated analysis is for informational purposes only and does not constitute legal advice.
            </motion.p>
        </motion.div>
    );
}
