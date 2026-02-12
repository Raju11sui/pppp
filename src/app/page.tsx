"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 sm:px-12 md:px-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-3xl text-center"
      >
        <h1 className="text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl md:text-7xl lg:text-8xl text-[#111]">
          See The Truth
          <br />
          Before You Agree.
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-6 text-lg sm:text-xl text-[#6B7280] leading-relaxed max-w-lg mx-auto"
        >
          Instant AI breakdown of privacy policies. Clear. Transparent. Fast.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-10"
        >
          <Link href="/analyze" className="btn-primary text-base px-10 py-4 sm:px-12 sm:py-5 sm:text-lg shadow-xl hover:shadow-2xl">
            Get Started
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
