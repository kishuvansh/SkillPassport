import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface VettingInput {
    githubUrl: string;
    targetRole: string;
}

export interface VettingReport {
    code_quality_score: number;
    logic_score: number;
    blind_spots: string[];
    review_data: any;
}

// Helper to parse owner and repo out of standard GitHub URL structures
function parseGitHubUrl(url: string): { owner: string; repo: string } {
    const cleaned = url.replace("https://github.com/", "").replace(".git", "");
    const segments = cleaned.split("/");
    return { owner: segments[0], repo: segments[1] };
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
    const headers: HeadersInit = { Accept: "application/vnd.github.v3.raw" };
    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await fetch(url, { headers });

    if (!response.ok) return `// Could not extract source code from path location: ${path}`;
    return response.text();
}

export async function vetSubmission(input: VettingInput): Promise<VettingReport> {
    try {
        const { owner, repo } = parseGitHubUrl(input.githubUrl);

        // Core structural file mapping extraction target array
        // Pulls common entry point paradigms for free-tier applications
        const targetFiles = ["README.md", "package.json", "requirements.txt", "index.js", "main.py", "src/index.ts", "src/App.tsx", "app/page.tsx"];
        let bundledCodebase = "";

        for (const file of targetFiles) {
            const content = await fetchFileContent(owner, repo, file);
            if (!content.startsWith("// Could not extract")) {
                bundledCodebase += `\n\n--- File Entity Path: ${file} ---\n${content}`;
            }
        }

        if (!bundledCodebase) {
            throw new Error("No readable source files or README discovered at target repository root.");
        }

        const systemContextPrompt = `
      Act as a Principal Staff Engineer assessing a candidate PR submission code matrix for a ${input.targetRole} assignment path.
      Analyze the provided software architecture text payload for semantic errors, design pattern flaws, and algorithmic readability problems.
      
      You must respond with a strictly formatted JSON object following this exact model schema specification:
      {
        "code_quality_score": 85, // Integer 0 to 100
        "logic_score": 90,        // Integer 0 to 100
        "blind_spots": ["Missing input error boundary validation", "Hardcoded API keys discovered"],
        "detailed_notes": "Comprehensive synthesis evaluation description string."
      }
      
      Target Code Base Content to Process:
      ${bundledCodebase}
    `;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        code_quality_score: { type: SchemaType.INTEGER, description: "Integer 0 to 100" },
                        logic_score: { type: SchemaType.INTEGER, description: "Integer 0 to 100" },
                        blind_spots: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Specific shortcomings" },
                        detailed_notes: { type: SchemaType.STRING, description: "Comprehensive synthesis evaluation description string." }
                    },
                    required: ["code_quality_score", "logic_score", "blind_spots", "detailed_notes"]
                }
            },
            systemInstruction: systemContextPrompt
        });

        const response = await model.generateContent("Evaluate the codebase and provide your JSON report.");
        const parsedOutput = JSON.parse(response.response.text()?.trim() || "{}");

        return {
            code_quality_score: parsedOutput.code_quality_score || 70,
            logic_score: parsedOutput.logic_score || 70,
            blind_spots: parsedOutput.blind_spots || ["Further structural reviews needed."],
            review_data: parsedOutput,
        };
    } catch (error: any) {
        console.error("Vetting failure event cascade:", error);
        return {
            code_quality_score: 50,
            logic_score: 50,
            blind_spots: ["Automated system fell back to safety parameters during processing."],
            review_data: { error: error.message },
        };
    }
}