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

  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [emailError, setEmailError] = useState("");

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
        console.log("🔍 Status pagamento:", data);

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
    if (!email || !emailConfirm) {
      setEmailError("Por favor, preencha o email corretamente");
      return;
    }
    if (!validateEmail(email) || email !== emailConfirm) {
      setEmailError("Os emails não conferem ou são inválidos");
      return;
    }
    setEmailError("");

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
            name: email.split("@")[0] + " Roblox",
          },
        }),
      });
      const data = await res.json();
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
            <button className="cart-pay">
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                className="pix-icon"
                height="20"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C256.1 224.4 247.9 224.5 242.4 218.9L165.7 142.2C151.5 127.1 132.6 120.2 112.6 120.2H103.3L200.7 22.76C231.1-7.586 280.3-7.586 310.6 22.76L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.1L226.4 234.8C233.6 241.1 243 245.6 252.5 245.6C261.9 245.6 271.3 241.1 278.5 234.8L355.5 157.8C365.3 148.1 378.8 142.5 392.6 142.5H430.3L488.6 200.8C518.9 231.1 518.9 280.3 488.6 310.6L430.3 368.9H392.6C378.8 368.9 365.3 363.3 355.5 353.5L278.5 276.5C264.6 262.6 240.3 262.6 226.4 276.6L149.7 353.2C139.1 363 126.4 368.6 112.6 368.6H80.78L22.76 310.6C-7.586 280.3-7.586 231.1 22.76 200.8L80.78 142.7H112.6z"></path>
              </svg>
              Pix
            </button>


            <label>Informe seu Email *</label>
            <input
              type="email"
              placeholder="Insira seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
{emailError && <p className="email-error">{emailError}</p>}

            <label>Informe novamente o seu email *</label>
            <input
              type="email"
              placeholder="Insira seu email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
            />


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
