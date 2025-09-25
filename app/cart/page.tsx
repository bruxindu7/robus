"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import "./cart.css";

export default function CartPage() {
  const { cart, removeFromCart, updateQty } = useCart();
  const router = useRouter();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  // Campos do formulário
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (showPixModal) setTimeLeft(300);
  }, [showPixModal]);

  useEffect(() => {
    if (!showPixModal || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, showPixModal]);

  useEffect(() => {
    const extId = pixData?.external_id || localStorage.getItem("external_id");
    if (!extId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status/${extId}`);
        const data = await res.json();

        if (data.status === "paid") {
          clearInterval(interval);
          localStorage.removeItem("external_id");
          router.push("/sucess");
        }
      } catch (err) {
        console.error("Erro ao verificar status:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pixData, router]);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCheckout = async () => {
  if (!firstName || !lastName) {
    setFormError("Por favor, preencha nome e sobrenome");
    return;
  }
  if (!email || !validateEmail(email)) {
    setFormError("Por favor, insira um email válido");
    return;
  }
  setFormError("");

  setLoading(true);
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: subtotal,
        orderId: Date.now().toString(),
        description: "Compra de Robux",
        buyer: {
          email,
          firstName: firstName.trim(),   // ✅ manda separado
          lastName: lastName.trim(),     // ✅ manda separado
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Erro Checkout:", data);
      alert("Erro ao gerar Pix: " + (data.details?.error?.message || "desconhecido"));
      return;
    }

    setPixData(data);
    localStorage.setItem("external_id", data.external_id);
    setShowPixModal(true);
  } catch (err) {
    console.error(err);
    alert("Erro ao gerar PIX");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="cart-root">
      <Header />
      <div className="header-spacer" />

      <main className="cart-container">
        <h1 className="cart-title">Carrinho de compras</h1>
        <p className="cart-subtitle">
          Nesta página, você encontra os produtos adicionados ao seu carrinho.
        </p>

        <div className="cart-grid">
          <div className="cart-box">
            <h3>Informações de pagamento</h3>

            <label>Nome *</label>
            <input
              type="text"
              placeholder="Digite seu nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <label>Sobrenome *</label>
            <input
              type="text"
              placeholder="Digite seu sobrenome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <label>Email *</label>
            <input
              type="email"
              placeholder="Insira seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {formError && <p className="email-error">{formError}</p>}

            <button className="cart-coupon">Adicionar cupom de desconto</button>
          </div>

          <div className="cart-box">
            <h3>Produtos no carrinho</h3>
            {cart.length === 0 ? (
              <p>Seu carrinho está vazio.</p>
            ) : (
              cart.map((item) => (
                <div className="cart-product" key={item.id}>
                  <Image src={item.image} alt={item.name} width={64} height={64} />
                  <div className="cart-prod-info">
                    <h4>{item.name}</h4>
                    <button
                      className="cart-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                  <div className="cart-qty">
                    <button
                      onClick={() =>
                        updateQty(item.id, Math.max(1, item.qty - 1))
                      }
                      className="qtybtn"
                    >
                      –
                    </button>
                    <input type="text" value={item.qty} readOnly />
                    <button
                      onClick={() =>
                        updateQty(item.id, Math.min(99, item.qty + 1))
                      }
                      className="qtybtn"
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-price">
                    R$ {(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-box">
            <h3>Resumo da compra</h3>
            <div className="cart-resumo">
              <p>
                Subtotal ({cart.length} item{cart.length > 1 && "s"}){" "}
                <span>R$ {subtotal.toFixed(2)}</span>
              </p>
              <hr />
              <p className="cart-total">
                Total <span>R$ {subtotal.toFixed(2)}</span>
              </p>
            </div>
            <button
              className="cart-continue"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Gerando Pix..." : "Finalizar compra"}
            </button>
          </div>
        </div>
      </main>

      {showPixModal && pixData && (
        <div className="pix-overlay">
          <div className="pix-modal">
            <button className="pix-close" onClick={() => setShowPixModal(false)}>
              ×
            </button>

            {pixData?.qrBase64 && (
              <div className="pix-qr">
                <img
                  src={`data:image/png;base64,${pixData.qrBase64}`}
                  alt="QR Code Pix"
                />
              </div>
            )}

            {pixData?.brcode && (
              <div className="pix-card">
                <p className="pix-label">Código PIX:</p>
                <div className="pix-code-group">
                  <textarea value={pixData.brcode} readOnly />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(pixData.brcode)
                    }
                    className="btn-copy"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <p className="pix-info">
              Escaneie o QR Code ou copie o código PIX para realizar o pagamento
            </p>

            <div className="pix-progress">
              <div className="progress-bar"></div>
              <p className="pix-timer">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
