import { NextResponse } from "next/server";

// 🌐 URL do site central (produção)
const CENTRAL_API = "https://www.eqp.lat/api/buckpay/receiver";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔄 Reenvia para o site principal
    const r = await fetch(CENTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        sourceSite: process.env.SITE_NAME || "Roblox", // marca qual site enviou
      }),
    });

    if (!r.ok) {
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
