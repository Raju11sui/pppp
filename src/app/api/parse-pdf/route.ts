import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".txt")) {
            const text = await file.text();
            return NextResponse.json({ text });
        }

        if (fileName.endsWith(".pdf")) {
            // Read PDF as array buffer and extract text
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Simple PDF text extraction without external dependency
            const text = extractTextFromPDF(buffer);
            return NextResponse.json({ text });
        }

        return NextResponse.json(
            { error: "Unsupported file type. Please use .txt or .pdf files." },
            { status: 400 }
        );
    } catch (error) {
        console.error("File parsing error:", error);
        return NextResponse.json(
            { error: "Failed to parse file. Please try pasting the text directly." },
            { status: 500 }
        );
    }
}

function extractTextFromPDF(buffer: Buffer): string {
    // Basic PDF text extraction
    // This handles most standard PDF text content
    const content = buffer.toString("latin1");
    const textParts: string[] = [];

    // Extract text between BT (Begin Text) and ET (End Text) markers
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;

    while ((match = btEtRegex.exec(content)) !== null) {
        const block = match[1];
        // Extract text from Tj and TJ operators
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
            textParts.push(tjMatch[1]);
        }

        // TJ array operator
        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let tjArrayMatch;
        while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
            const items = tjArrayMatch[1];
            const stringRegex = /\(([^)]*)\)/g;
            let strMatch;
            while ((strMatch = stringRegex.exec(items)) !== null) {
                textParts.push(strMatch[1]);
            }
        }
    }

    const text = textParts
        .join(" ")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return text || "Could not extract text from this PDF. Please try pasting the text directly.";
}
