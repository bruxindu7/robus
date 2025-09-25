// app/api/checkout/route.ts
import { NextResponse } from "next/server";

const BUCKPAY_BASE_URL = "https://api.realtechdev.com.br";
const PIX_CREATE_PATH = "/v1/transactions";

// 🔐 Domínios permitidos
const allowedOrigins = [
  "http://localhost:3000",
  "https://www.recargabuxs.cc", // troque pelo seu real
];

function isOriginAllowed(req: Request) {
  const origin = req.headers.get("origin") || "";
  console.log("🔍 Origin recebido:", origin);
  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}

export async function POST(req: Request) {
  if (!isOriginAllowed(req)) {
    return NextResponse.json(
      {
        error: "Origem não autorizada",
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
        allowed: allowedOrigins,
      },
      { status: 403 }
    );
  }

  try {
    const { amount, description, buyer } = await req.json();

    // ⚡ external_id único
    const external_id = `order-${Date.now()}`;

    // 🔹 garante nome + sobrenome (se não, cai no fallback)
    const buyerName =
      buyer?.name && buyer.name.includes(" ")
        ? buyer.name
        : `${buyer?.name || buyer?.email || "Cliente"} Robux`;

    const payload = {
      external_id,
      payment_method: "pix",
      amount: Math.round(amount * 100), // em centavos
      description: description || "Compra na RecargaBux",
      buyer: {
        name: buyerName,
        email: buyer?.email || "teste@teste.com",
        document: buyer?.document || undefined,
        phone: buyer?.phone ? "55" + buyer.phone.replace(/\D/g, "") : undefined,
      },
      tracking: {
        ref: process.env.SITE_NAME || "Roblox", // ✅ identifica o site
        src: null,
        sck: null,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_id: null,
        utm_term: null,
        utm_content: null,
      },
    };

    console.log("➡ Enviando para BuckPay:", payload);

    const r = await fetch(`${BUCKPAY_BASE_URL}${PIX_CREATE_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BUCKPAY_TOKEN}`, // seu token no .env.local
        "User-Agent": "Buckpay API",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    console.log("➡ Resposta BuckPay:", r.status, data);

    if (!r.ok) {
      console.error("❌ Erro BuckPay:", data);
      return NextResponse.json(
        { error: "Erro ao criar transação", details: data },
        { status: r.status }
      );
    }

   return NextResponse.json(
  {
    id: data.data.id,
    external_id, // 👈 adiciona aqui
    status: data.data.status,
    brcode: data.data.pix.code,
    qrBase64: data.data.pix.qrcode_base64,
    amount: data.data.total_amount,
  },
  { status: 200 }
);

  } catch (err: any) {
    console.error("❌ Erro no checkout:", err);
    return NextResponse.json(
      { error: "Erro no checkout", details: String(err) },
      { status: 500 }
    );
  }
}
