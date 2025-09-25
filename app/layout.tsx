import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext"; // 👈 importa o provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RECARGABUX - Sua Loja de Produtos Digitais | Entrega Automática 24h",
  description:
    "Compre na RECARGABUX: loja online especializada em produtos digitais. Gift cards, moedas virtuais, códigos de jogos e mais. Entrega automática 24h e segura.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 👇 agora todo o app tem acesso ao carrinho */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
