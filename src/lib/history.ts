export interface AnalysisResult {
    summary: string;
    data_collected: string[];
    data_shared_with: string[];
    retention_policy: string;
    hidden_risks: string[];
    risk_score: number;
    risk_level: string;
}

export interface HistoryEntry {
    id: string;
    title: string;
    company: string;
    date: string;
    riskScore: number;
    riskLevel: string;
    result: AnalysisResult;
}

const STORAGE_KEY = "pps_history";

export function saveAnalysis(entry: HistoryEntry): void {
    const history = getHistory();
    history.unshift(entry);
    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
}

export function getHistory(): HistoryEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function clearHistory(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
    }
}
