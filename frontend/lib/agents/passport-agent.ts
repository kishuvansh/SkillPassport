import QRCode from "qrcode";

export interface PassportPayload {
    qr_data_url: string;
    public_url: string;
}

export async function generatePassport(verificationUuid: string, hostHeader: string | null): Promise<PassportPayload> {
    // Gracefully handle local dev vs production environments
    const host = hostHeader || "skillpassport.ai";
    const protocol = host.includes("localhost") ? "http" : "https";
    const public_url = `${protocol}://${host}/passport/${verificationUuid}`;

    try {
        // Generate base64 data image URL cleanly on serverless execution execution
        const qr_data_url = await QRCode.toDataURL(public_url, {
            errorCorrectionLevel: "H",
            margin: 2,
            width: 300,
        });

        return {
            qr_data_url,
            public_url,
        };
    } catch (error) {
        console.error("QR Code engine failed:", error);
        throw new Error("Failed to process server-side passport visual matrix asset generation.");
    }
}