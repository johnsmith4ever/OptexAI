"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Zap, Feather, ShieldCheck, Loader2 } from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";

export default function LandingPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  // Optionally show nothing or a loading state while redirecting
  if (isLoaded && userId) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--primary)" }}>
        <Loader2 className="spinner" size={48} />
      </div>
    );
  }

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.5rem", fontWeight: "700", fontFamily: "var(--font-merriweather)" }}>
          <Image src="/logo-green.png" alt="Optex Logo" width={40} height={40} style={{ borderRadius: "8px" }} />
          Optex<span style={{ color: "var(--primary-active)" }}>.</span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {isLoaded && !userId && (
            <SignInButton mode="modal" forceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard">
              <button className="btn-secondary">Sign In</button>
            </SignInButton>
          )}
          {isLoaded && userId && (
            <>
              <Link href="/dashboard" className="btn-secondary" style={{ marginRight: "1rem" }}>
                Go to Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <h1 className="landing-title">
          Read anything.<br />
          Typed, scanned, or handwritten.
        </h1>
        <p className="landing-subtitle">
          A serious upgrade over typical OCR tools. Optex combines standard text extraction with cutting-edge AI correction to flawlessly digitize your hardest inputs.
        </p>
        <div className="landing-actions">
          {isLoaded && !userId && (
            <SignInButton mode="modal" forceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard">
              <button className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.125rem" }}>
                Get Started
              </button>
            </SignInButton>
          )}
          {isLoaded && userId && (
            <Link href="/dashboard" className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.125rem" }}>
              Launch Optex
            </Link>
          )}
        </div>
      </section>

      {/* Signature Scan-line Demo */}
      <section className="container" style={{ paddingTop: "0" }}>
        <div className="demo-section">
          <div className="demo-container">
            <div className="demo-blurry">
              Th1s text iz reely hrd too reed.
            </div>
            <div className="scan-line"></div>
            <div className="demo-sharp">
              This text is really hard to read.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="container">
        <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "3rem" }}>Three Tiers of Accuracy</h2>
        <div className="feature-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <Zap className="feature-icon" size={32} />
            <h3 style={{ marginBottom: "0.5rem" }}>Free Mode</h3>
            <p>Fast, no-cost OCR for typed and printed text using Tesseract. Perfect for standard documents.</p>
          </div>
          {/* Card 2 */}
          <div className="feature-card">
            <Feather className="feature-icon" size={32} />
            <h3 style={{ marginBottom: "0.5rem" }}>Handwritten</h3>
            <p>Raw OCR combined with an AI correction pass (Llama 70B) to fix garbled handwriting recognition instantly.</p>
          </div>
          {/* Card 3 */}
          <div className="feature-card">
            <ShieldCheck className="feature-icon" size={32} />
            <h3 style={{ marginBottom: "0.5rem" }}>Premium</h3>
            <p>The highest accuracy tier utilizing Gemini Flash-Lite for the absolute hardest, lowest-quality image cases.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div style={{ fontFamily: "var(--font-merriweather)", fontSize: "1.25rem", marginBottom: "0.5rem", color: "#fff" }}>
          Optex
        </div>
        <p>Digitize reality with precision.</p>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Pricing</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}
