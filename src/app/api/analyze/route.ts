import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { title, company, content } = await req.json();

        if (!content || content.trim().length < 50) {
            return NextResponse.json(
                { error: "Policy text is too short. Please provide more content." },
                { status: 400 }
            );
        }

        // Preprocess
        const cleanedText = content
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 15000);

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        // Try real AI first
        if (apiKey) {
            const aiResult = await tryGeminiAPI(apiKey, title, company, cleanedText);
            if (aiResult) return NextResponse.json(aiResult);
            console.log("Gemini API unavailable, using content-aware analysis fallback");
        }

        // Content-aware fallback — analyzes actual policy text
        const fallbackResult = analyzeLocally(title, company, cleanedText);
        return NextResponse.json(fallbackResult);
    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: "Failed to analyze policy. Please try again." },
            { status: 500 }
        );
    }
}

async function tryGeminiAPI(
    apiKey: string,
    title: string,
    company: string,
    cleanedText: string
) {
    const prompt = `You are a privacy policy expert analyst. Carefully read and analyze the SPECIFIC privacy policy provided below. Your analysis must be UNIQUE and SPECIFIC to this exact policy text — do NOT give generic or template answers.

Policy Title: ${title || "Unknown"}
Company: ${company || "Unknown"}

--- BEGIN POLICY TEXT ---
${cleanedText}
--- END POLICY TEXT ---

Analyze the ACTUAL content of this specific policy. Identify the SPECIFIC data types mentioned, the SPECIFIC third parties named, and the SPECIFIC risks present in THIS policy.

You MUST return ONLY valid JSON (no markdown, no code fences, no extra text). Use this exact structure:

{
  "summary": "A clear 2-3 sentence plain-language summary of what THIS SPECIFIC policy actually says. Reference specific details from the policy.",
  "data_collected": ["Each item should be a SPECIFIC type of data mentioned in THIS policy"],
  "data_shared_with": ["Each item should be a SPECIFIC third party or category mentioned in THIS policy"],
  "retention_policy": "Describe the SPECIFIC retention periods and conditions stated in THIS policy",
  "hidden_risks": ["Each risk should reference SPECIFIC clauses or language from THIS policy that are concerning"],
  "risk_score": 0,
  "risk_level": "Low"
}

Scoring rules:
- 0-30 = "Low" risk (minimal data collection, clear policies, strong user rights)
- 31-60 = "Medium" risk (moderate data collection, some sharing, average transparency)
- 61-100 = "High" risk (extensive data collection, broad sharing, poor transparency, hidden practices)

Set risk_score as an integer and risk_level as the matching label. Be accurate and thorough.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 3000,
            responseMimeType: "application/json",
        },
    });

    // Try with retries for rate limits
    const retryDelays = [0, 3000, 8000];
    for (let i = 0; i < retryDelays.length; i++) {
        if (retryDelays[i] > 0) {
            await new Promise((r) => setTimeout(r, retryDelays[i]));
        }

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const jsonStr = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```$/i, "").trim();
                    return JSON.parse(jsonStr);
                }
            }

            if (res.status === 429 || res.status === 503) {
                console.log(`Gemini rate limited (${res.status}), attempt ${i + 1}/${retryDelays.length}`);
                continue;
            }

            // Non-retryable error
            console.error("Gemini API error:", res.status);
            return null;
        } catch (e) {
            console.error("Gemini fetch error:", e);
            return null;
        }
    }

    return null; // All retries exhausted
}

// ----- Content-aware local analysis -----

const dataPatterns: [RegExp, string][] = [
    [/\b(full name|first name|last name|your name|real name)\b/i, "Full name and personal identifiers"],
    [/\b(email|e-mail)\b/i, "Email address"],
    [/\b(phone|telephone|mobile number|call logs)\b/i, "Phone number and call information"],
    [/\b(address|postal|zip code|mailing)\b/i, "Physical address and postal information"],
    [/\b(date of birth|birthday|age|DOB)\b/i, "Date of birth and age information"],
    [/\b(payment|credit card|billing|financial|bank|debit)\b/i, "Payment and financial information"],
    [/\b(photos?|images?|pictures?|videos?|media)\b/i, "Photos, videos, and media content"],
    [/\b(messages?|chats?|communications?|DMs?|direct message)\b/i, "Messages and communications content"],
    [/\b(contacts?|address book|friends? list)\b/i, "Contacts and address book data"],
    [/\b(location|GPS|geo|latitude|longitude|coordinates)\b/i, "Precise location and GPS data"],
    [/\b(IP address|internet protocol)\b/i, "IP address"],
    [/\b(device|hardware|IMEI|serial number|device identifier)\b/i, "Device identifiers and hardware info"],
    [/\b(browser|user agent|operating system)\b/i, "Browser and operating system information"],
    [/\b(cookies?|pixel|beacon|tracking|web beacon)\b/i, "Cookies and tracking technologies"],
    [/\b(browsing|search|usage|activity|click|interaction|viewed)\b/i, "Browsing history and usage activity"],
    [/\b(purchase|transaction|order|buy|shopping)\b/i, "Purchase and transaction history"],
    [/\b(biometric|fingerprint|face|facial|voice|voiceprint)\b/i, "Biometric data (face, voice, fingerprint)"],
    [/\b(health|medical|fitness|wellness)\b/i, "Health and medical information"],
    [/\b(social security|SSN|passport|ID number|driver.?s? license)\b/i, "Government-issued ID numbers"],
    [/\b(Wi-?Fi|cell tower|Bluetooth|sensor|accelerometer|gyroscope)\b/i, "Sensor and network proximity data"],
    [/\b(audio|voice|recording|microphone)\b/i, "Audio and voice recordings"],
    [/\b(employment|job|occupation|employer|work)\b/i, "Employment information"],
    [/\b(education|school|university|degree|student)\b/i, "Education information"],
    [/\b(gender|sex|race|ethnicity|religion|political)\b/i, "Demographic and sensitive categories"],
    [/\b(third.?party|external.*(?:source|partner|provider))\b/i, "Data from third-party sources"],
];

const sharingPatterns: [RegExp, string][] = [
    [/\b(advertis(?:er|ing)|ad (?:network|partner)|targeted ad)\b/i, "Advertising networks and ad partners"],
    [/\b(analytics?|measurement|metrics)\b/i, "Analytics and measurement providers"],
    [/\b(data broker|data marketplace|data reseller)\b/i, "Data brokers and resellers"],
    [/\b(law enforcement|government|legal|court|subpoena|warrant)\b/i, "Law enforcement and government agencies"],
    [/\b(service provider|vendor|processor|contractor|supplier)\b/i, "Service providers and contractors"],
    [/\b(business partner|commercial partner|strategic partner)\b/i, "Business and commercial partners"],
    [/\b(affiliate|subsidiary|parent company|related compan)\b/i, "Affiliated companies and subsidiaries"],
    [/\b(social media|facebook|google|twitter|meta|instagram)\b/i, "Social media platforms"],
    [/\b(payment processor|stripe|paypal|financial institution)\b/i, "Payment processors and financial institutions"],
    [/\b(cloud|hosting|infrastructure|AWS|Azure|storage)\b/i, "Cloud infrastructure providers"],
    [/\b(marketing|promotions?|campaigns?)\b/i, "Marketing and promotions partners"],
    [/\b(research|academic|universit)\b/i, "Research institutions"],
    [/\b(insurance|insurer)\b/i, "Insurance companies"],
    [/\b(merger|acquisition|sale|bankruptcy|successor)\b/i, "Potential acquirers in mergers or sales"],
    [/\b(developer|app|plugin|integration|SDK|API)\b/i, "Third-party developers and integrations"],
];

const riskPatterns: [RegExp, string, number][] = [
    [/\b(indefinite|unlimited|perpetual|forever|no.*time limit)\b/i, "Data may be retained indefinitely with no clear expiration", 12],
    [/\b(sell|sold|monetiz|commercializ)\b.*\b(data|information)\b/i, "Your data may be sold or commercially monetized", 15],
    [/\b(cross.?(?:platform|site|service|device)|across.*(?:service|platform|app))\b/i, "Cross-platform tracking and data sharing between services", 10],
    [/\b(third.?part(?:y|ies)).*\b(track|cookie|pixel|beacon)\b/i, "Third-party tracking across the web", 12],
    [/\b(location|GPS).*\b(precise|exact|real.?time|continuous)\b/i, "Precise real-time location tracking", 10],
    [/\bprofile\b.*\b(build|creat|construct|develop|infer)\b/i, "Behavioral profiling from your activity data", 8],
    [/\b(chang|modif|updat|revis).*\b(policy|terms|privacy)\b.*\b(without|any time|discretion)\b/i, "Policy can change without explicit user consent", 8],
    [/\b(share|disclos|provid).*\b(broad|wide|extensive|unlimit)\b/i, "Broad and extensive data sharing practices", 10],
    [/\b(backup|archive|residual).*\b(retain|remain|persist|delet)\b/i, "Deleted data persists in backups and archives", 7],
    [/\b(automat|algorithm|machine learning|AI|artificial)\b.*\b(decision|profil|analys|inference)\b/i, "Automated decision-making and algorithmic profiling", 8],
    [/\b(vague|unclear|ambiguous|discretion|may|might|could)\b.*\b(share|collect|use|retain|transfer)\b/i, "Vague language allowing broad data practices", 8],
    [/\b(opt.?out).*\b(limit|restrict|reduc|affect)\b.*\b(function|feature|service|experience)\b/i, "Opting out reduces functionality or service quality", 6],
    [/\b(child|minor|under.?13|COPPA|kid)\b/i, "Potential exposure risks to children's data", 5],
    [/\b(transfer|transmit|send).*\b(country|international|overseas|abroad|jurisdiction)\b/i, "International data transfers to countries with weaker protections", 7],
    [/\b(consent|agree).*\b(continu|using|browse|implicit)\b/i, "Implied consent through continued use rather than explicit opt-in", 6],
    [/\b(sensitive|special.*categor|protected)\b.*\b(data|information)\b/i, "Collection of sensitive or specially protected data categories", 10],
    [/\b(facial|recognition|biometric).*\b(scan|detect|identif|analyz)\b/i, "Facial recognition or biometric analysis", 12],
    [/\b(microphone|camera|screen).*\b(access|record|captur)\b/i, "Access to device microphone, camera, or screen", 8],
];

function analyzeLocally(title: string, company: string, text: string) {
    const lowerText = text.toLowerCase();

    // Detect data collected
    const dataCollected: string[] = [];
    for (const [pattern, label] of dataPatterns) {
        if (pattern.test(text)) {
            dataCollected.push(label);
        }
    }
    if (dataCollected.length === 0) {
        dataCollected.push("General personal information");
    }

    // Detect sharing partners
    const sharedWith: string[] = [];
    for (const [pattern, label] of sharingPatterns) {
        if (pattern.test(text)) {
            sharedWith.push(label);
        }
    }
    if (sharedWith.length === 0) {
        sharedWith.push("Third-party service providers");
    }

    // Detect risks and calculate score
    const hiddenRisks: string[] = [];
    let riskScore = 0;

    // Base risk from data volume
    riskScore += Math.min(dataCollected.length * 3, 25);
    riskScore += Math.min(sharedWith.length * 3, 20);

    for (const [pattern, description, weight] of riskPatterns) {
        if (pattern.test(text)) {
            hiddenRisks.push(description);
            riskScore += weight;
        }
    }

    // Policy length factor (longer = more complex = more risk)
    if (text.length > 10000) riskScore += 5;
    if (text.length > 20000) riskScore += 5;

    // Cap at 100
    riskScore = Math.min(riskScore, 98);
    riskScore = Math.max(riskScore, 10);

    if (hiddenRisks.length === 0) {
        hiddenRisks.push("Insufficient transparency about specific data handling practices");
    }

    // Determine risk level
    let riskLevel = "Low";
    if (riskScore > 60) riskLevel = "High";
    else if (riskScore > 30) riskLevel = "Medium";

    // Generate retention policy text
    let retentionPolicy = "The policy does not clearly specify data retention periods.";
    if (/indefinite|unlimited|perpetual|forever/i.test(text)) {
        retentionPolicy = "Data may be retained indefinitely. The policy uses broad language about retention without clear time limits.";
    } else if (/\d+\s*(day|month|year|week)/i.test(text)) {
        const match = text.match(/(\d+\s*(day|month|year|week)s?)/i);
        retentionPolicy = `The policy mentions retaining some data for ${match?.[1] || "a specified period"}. However, certain types of data may be kept longer for legal or security reasons.`;
    } else if (/as long as.*account|while.*active/i.test(text)) {
        retentionPolicy = "Data is retained for as long as your account remains active, with certain data potentially kept longer after deletion for legal and security purposes.";
    }

    // Generate summary
    const companyName = company || "This company";
    const policyName = title || "privacy policy";
    const dataCount = dataCollected.length;
    const shareCount = sharedWith.length;

    const summaryParts = [
        `${companyName}'s ${policyName} outlines ${dataCount > 5 ? "extensive" : dataCount > 3 ? "significant" : "moderate"} data collection practices covering ${dataCollected.slice(0, 3).join(", ").toLowerCase()}${dataCount > 3 ? `, and ${dataCount - 3} more categories` : ""}.`,
        `Data is shared with ${shareCount > 3 ? `at least ${shareCount} categories of third parties` : sharedWith.slice(0, 2).join(" and ").toLowerCase()}.`,
        riskScore > 60
            ? "The policy contains several concerning practices that put user privacy at significant risk."
            : riskScore > 30
                ? "Some data practices may warrant closer attention from privacy-conscious users."
                : "Overall, the policy demonstrates reasonable data handling practices.",
    ];

    return {
        summary: summaryParts.join(" "),
        data_collected: dataCollected,
        data_shared_with: sharedWith,
        retention_policy: retentionPolicy,
        hidden_risks: hiddenRisks,
        risk_score: riskScore,
        risk_level: riskLevel,
    };
}
