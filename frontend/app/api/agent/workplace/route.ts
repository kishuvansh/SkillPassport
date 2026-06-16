import { NextRequest, NextResponse } from "next/server";
import { generateMission } from "@/lib/agents/workplace-agent";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role } = body;

        if (!role) {
            return NextResponse.json({ error: "Missing parameter: role" }, { status: 400 });
        }

        const missionBrief = await generateMission(role);
        return NextResponse.json(missionBrief, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}