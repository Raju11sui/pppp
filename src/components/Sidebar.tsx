"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { label: "Home", href: "/" },
    { label: "History", href: "/history" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overlay"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl"
                    >
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <span className="text-sm font-semibold tracking-tight text-[#111]">
                                    Privacy Policy Simplifier
                                </span>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                    aria-label="Close menu"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-4 py-6">
                                <ul className="space-y-1">
                                    {menuItems.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === item.href
                                                        ? "bg-[#F3F4F6] text-[#111]"
                                                        : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111]"
                                                    }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
