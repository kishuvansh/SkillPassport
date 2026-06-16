import { NextRequest, NextResponse } from "next/server";
import { generatePassport } from "@/lib/agents/passport-agent";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get("uuid");

    if (!uuid) {
        return NextResponse.json({ error: "Missing target validation passport UUID string parameter." }, { status: 400 });
    }

    try {
        const host = req.headers.get("host");
        const passportData = await generatePassport(uuid, host);
        return NextResponse.json(passportData, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed passport compilation." }, { status: 500 });
    }
}