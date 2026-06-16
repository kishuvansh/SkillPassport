import { GoogleGenerativeAI, SchemaType } from "@google/gen-ai";

/* -------------------------------------------------------------------------- */
/*  Agent 1 — Workplace & Alignment Agent                                      */
/*  Generates a realistic virtual company + mission brief for a target role.   */
/* -------------------------------------------------------------------------- */

export interface MissionBrief {
  id: string;
  project: string;
  company: string;
  companyTag: string;
  manager: string;
  managerTitle: string;
  role: string;
  status: string;
  day: number;
  timeline: number;
  summary: string;
  requirements: string[];
  constraints: string[];
  acceptance: string[];
  readme: string;
}

const MISSION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    project: { type: SchemaType.STRING, description: "Project title, e.g. 'Hospital Support Chatbot'" },
    company: { type: SchemaType.STRING, description: "Fictional company name, e.g. 'HealthTech Solutions'" },
    companyTag: { type: SchemaType.STRING, description: "One-liner about the company stage/domain, e.g. 'Series B · Health AI'" },
    manager: { type: SchemaType.STRING, description: "Fictional manager full name" },
    managerTitle: { type: SchemaType.STRING, description: "Manager's job title, e.g. 'Engineering Manager'" },
    role: { type: SchemaType.STRING, description: "The student's role in the simulation, e.g. 'Junior AI Engineer'" },
    timeline: { type: SchemaType.NUMBER, description: "Number of days for the sprint (3-7)" },
    summary: { type: SchemaType.STRING, description: "2-3 sentence project summary" },
    requirements: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "4-6 specific functional requirements",
    },
    constraints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "3-5 technical constraints (frameworks, latency, etc.)",
    },
    acceptance: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "3-5 acceptance criteria for the submission",
    },
    readme: { type: SchemaType.STRING, description: "Full README.md content in markdown for the project brief" },
  },
  required: [
    "project", "company", "companyTag", "manager", "managerTitle",
    "role", "timeline", "summary", "requirements", "constraints",
    "acceptance", "readme",
  ],
};

const SYSTEM_PROMPT = `You are the Workplace & Alignment Agent for CareerSim AI — an AI employment simulator.

Your job: given a target career role, generate a REALISTIC virtual company and project mission.

Rules:
- The company must feel like a real startup or mid-size tech company (give it a believable name, stage, and domain).
- The project must be something a junior hire in that role would ACTUALLY work on in their first week.
- Requirements should be specific and testable — not vague.
- Constraints should include real tech stack choices relevant to the role.
- The README should be professional-grade: include a project overview, setup instructions skeleton, architecture hints, and evaluation criteria.
- Make each generation UNIQUE — vary the company domain (fintech, edtech, healthtech, logistics, media, etc.), project type, and tech stack.
- Keep the timeline between 3-7 days.
- The role should be a junior-level position matching the career input.`;

/**
 * Generate a virtual workplace mission brief for the given career role.
 */
export async function generateMission(role: string): Promise<MissionBrief> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Get a free key at https://aistudio.google.com/app/api-keys");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: MISSION_SCHEMA,
      temperature: 1.0, // high creativity for variety
      maxOutputTokens: 4096,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = `Generate a workplace simulation mission for a student targeting the role: "${role}".

Make it feel like a real Day 1 onboarding at a startup. The project should be challenging but achievable in 3-7 days.
Vary the industry — don't always pick healthcare. Consider: fintech, edtech, climate, logistics, media, gaming, cybersecurity, e-commerce, etc.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);

  // Generate a deterministic-ish ID from the project name
  const id = parsed.project
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return {
    id,
    project: parsed.project,
    company: parsed.company,
    companyTag: parsed.companyTag,
    manager: parsed.manager,
    managerTitle: parsed.managerTitle,
    role: parsed.role,
    status: "Not Started",
    day: 1,
    timeline: parsed.timeline,
    summary: parsed.summary,
    requirements: parsed.requirements,
    constraints: parsed.constraints,
    acceptance: parsed.acceptance,
    readme: parsed.readme,
  };
}
