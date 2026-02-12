import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { content } = await req.json();

        if (!content || content.trim().length < 50) {
            return NextResponse.json(
                { error: "Content too short to identify." },
                { status: 400 }
            );
        }

        const cleanedText = content.slice(0, 3000).replace(/\s+/g, " ").trim();
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        console.log("Identifying policy...", content.length, "chars");

        if (apiKey) {
            console.log("Trying Gemini for identification...");
            const aiResult = await tryGeminiIdentify(apiKey, cleanedText);
            if (aiResult) {
                console.log("Gemini identified:", aiResult);
                return NextResponse.json(aiResult);
            }
            console.log("Gemini failed or returned null, falling back...");
        } else {
            console.log("No API key, falling back to local...");
        }

        const localResult = identifyLocally(cleanedText);
        console.log("Local identification result:", localResult);
        return NextResponse.json(localResult);

    } catch (error) {
        console.error("Identify error:", error);
        return NextResponse.json(
            { error: "Failed to identify policy details." },
            { status: 500 }
        );
    }
}

async function tryGeminiIdentify(apiKey: string, text: string) {
    const prompt = `Identify the "Company Name" and the "Type of Policy" (e.g., Privacy Policy, Terms of Service) from the text below.
  
  Text: "${text.slice(0, 2000)}..."
  
  Return ONLY valid JSON:
  {
    "company": "Exact Company Name",
    "title": "Exact Policy Title"
  }`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const retryDelays = [0, 2000, 5000]; // Retries: immediate, 2s, 5s

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
        if (retryDelays[attempt] > 0) {
            await new Promise(r => setTimeout(r, retryDelays[attempt]));
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json",
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    try {
                        return JSON.parse(text);
                    } catch (jsonErr) {
                        console.error("Gemini JSON parse error:", jsonErr, text);
                    }
                }
            } else {
                const errText = await response.text();
                console.error(`Gemini attempt ${attempt + 1} failed: ${response.status} ${errText}`);
                if (response.status !== 429 && response.status !== 503) {
                    break; // Don't retry non-rate-limit errors
                }
            }
        } catch (e) {
            console.error(`Gemini identification error (attempt ${attempt + 1}):`, e);
        }
    }
    return null;
}

function identifyLocally(text: string) {
    let company = "";
    let title = "Privacy Policy";

    // Try to find "Privacy Policy of [Company]" or "[Company] Privacy Policy"
    const titleMatch = text.match(/([A-Z][a-z0-9\s]+(?:Inc\.|LLC|Ltd\.|Corporation|Company)?)\s+(?:Privacy|Data)\s+Policy/i);

    if (titleMatch) {
        company = titleMatch[1].trim();
        title = `${company} Privacy Policy`;
    } else {
        // Look for copyright lines
        const copyrightMatch = text.match(/©\s*(?:20\d\d)?\s*([A-Za-z0-9\s\.,]+)/);
        if (copyrightMatch) {
            company = copyrightMatch[1].trim().replace(/All rights reserved/i, "").trim();
        }
    }

    if (!company) company = "Unknown Company";

    return { company, title };
}
