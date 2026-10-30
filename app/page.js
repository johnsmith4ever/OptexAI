"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle 
} from "lucide-react";

export default function LandingPage() {
  const handleDummyClick = (e) => {
    e.preventDefault();
  };

  return (
    <div className="landing-container">
      {/* Navigation - Clean Branding, No secondary button */}
      <nav style={{ padding: "2rem", display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.5rem", fontWeight: "700", fontFamily: "var(--font-merriweather)" }}>
          <Image src="/logo-green.png" alt="Optex Logo" width={40} height={40} style={{ borderRadius: "8px" }} />
          Optex<span style={{ color: "var(--primary-active)" }}>.</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "var(--radius-full)", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--border-glow)", color: "var(--primary-active)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "1.5rem" }}>
          <Sparkles size={16} /> Enterprise-Grade Optical AI Pipeline
        </div>
        <h1 className="landing-title">
          Read anything.<br />
          Typed, scanned, or handwritten.
        </h1>
        <p className="landing-subtitle">
          A serious upgrade over typical OCR tools. Optex combines standard text extraction with cutting-edge AI to flawlessly digitize your hardest inputs.
        </p>
        <div className="landing-actions">
          <Link href="/dashboard" className="btn-primary" style={{ padding: "1rem 2.75rem", fontSize: "1.125rem" }}>
            Get Started
          </Link>
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

      {/* Performance Benchmarks / Stats Bar */}
      <section className="container" style={{ paddingBottom: "1rem" }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">99.4%</div>
            <div className="stat-label">Character Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">&lt;1.2s</div>
            <div className="stat-label">Inference Latency</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">100+</div>
            <div className="stat-label">Supported Languages</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0 KB</div>
            <div className="stat-label">Persistent Storage (Ephemeral)</div>
          </div>
        </div>
      </section>

      {/* Feature Section - Two Modes */}
      <section className="container">
        <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "1rem" }}>Two Modes of Accuracy</h2>
        <p style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 3rem", color: "var(--text-muted)" }}>
          Tailor inference density to your input difficulty. Switch seamlessly between instant local OCR and deep multimodal vision reasoning.
        </p>
        <div className="feature-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <Zap className="feature-icon" size={32} />
            <h3 style={{ marginBottom: "0.5rem" }}>Free Mode</h3>
            <p>Fast, unlimited OCR for typed and printed text using Tesseract. Perfect for standard documents, receipts, PDFs, and clean digital captures.</p>
          </div>
          {/* Card 2 */}
          <div className="feature-card">
            <ShieldCheck className="feature-icon" size={32} />
            <h3 style={{ marginBottom: "0.5rem" }}>Premium</h3>
            <p>The highest accuracy tier utilizing Gemini Flash-Lite for handwritten notes, complex multi-column layouts, skewed angles, and low-contrast images.</p>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="container">
        <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "1rem" }}>Engineered for Total Fidelity</h2>
        <p style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto 3rem", color: "var(--text-muted)" }}>
          State-of-the-art heuristic preprocessing combined with transformer attention models guarantees pristine text reconstitution across every document category.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <Cpu className="feature-icon" size={28} />
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Binarization & Denoising</h4>
            <p style={{ fontSize: "0.925rem" }}>
              Adaptive Otsu thresholding and morphological gradient filtering remove paper creases, glare, shadows, and low-contrast artifacts before extraction begins.
            </p>
          </div>
          <div className="feature-card">
            <Layers className="feature-icon" size={28} />
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Spatial Layout Reconstitution</h4>
            <p style={{ fontSize: "0.925rem" }}>
              Intelligent bounding-box clustering preserves tabular structures, hierarchical headers, indentations, and vertical paragraph alignment automatically.
            </p>
          </div>
          <div className="feature-card">
            <Lock className="feature-icon" size={28} />
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Zero-Retention Privacy</h4>
            <p style={{ fontSize: "0.925rem" }}>
              Documents are processed strictly in volatile system memory. No client payloads, extracted transcripts, or image buffers are ever written to disk or stored.
            </p>
          </div>
          <div className="feature-card">
            <CheckCircle2 className="feature-icon" size={28} />
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Cross-Script Decoding</h4>
            <p style={{ fontSize: "0.925rem" }}>
              Native unicode parsing handles Latin, Cyrillic, CJK ideographs, mathematical syntax, and programming code blocks without font-substitution errors.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container">
        <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "1rem" }}>Execution Pipeline</h2>
        <p style={{ textAlign: "center", maxWidth: "550px", margin: "0 auto 2.5rem", color: "var(--text-muted)" }}>
          From raw pixels to structured plaintext in three deterministic operations.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">STAGE 01</span>
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Payload Ingestion</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
              Drag and drop any PNG, JPEG, WEBP, or screenshot. Automatic MIME inspection and memory validation prevent payload corruptions.
            </p>
          </div>
          <div className="step-card">
            <span className="step-num">STAGE 02</span>
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Neural Optical Extraction</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
              Select Free Mode for fast classical OCR or Premium for deep multimodal transformer inference capable of decoding cursive handwriting.
            </p>
          </div>
          <div className="step-card">
            <span className="step-num">STAGE 03</span>
            <h4 style={{ marginBottom: "0.5rem", fontSize: "1.15rem" }}>Immediate Plaintext Copy</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
              Review output formatted with original line breaks and layout. Copy to your clipboard with single-click zero-latency synchronization.
            </p>
          </div>
        </div>
      </section>

      {/* Technical FAQ */}
      <section className="container">
        <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "1rem" }}>Technical Specifications</h2>
        <p style={{ textAlign: "center", maxWidth: "550px", margin: "0 auto 2.5rem", color: "var(--text-muted)" }}>
          Common questions regarding model architectures, inference pipelines, and security.
        </p>
        <div className="faq-grid">
          <div className="faq-card">
            <div className="faq-question">
              <HelpCircle size={18} style={{ color: "var(--primary)" }} />
              How does Premium handle cursive & messy handwriting?
            </div>
            <div className="faq-answer">
              Unlike traditional rule-based OCR which expects standardized character matrices, Premium utilizes multimodal vision transformers that understand semantic context, word shapes, and continuous stroke trajectories.
            </div>
          </div>
          <div className="faq-card">
            <div className="faq-question">
              <HelpCircle size={18} style={{ color: "var(--primary)" }} />
              Is my uploaded document data saved or logged?
            </div>
            <div className="faq-answer">
              No. Optex operates under a strict zero-retention paradigm. Images are decoded ephemerally in RAM solely for the duration of inference, after which the buffers are immediately dereferenced and garbage collected.
            </div>
          </div>
          <div className="faq-card">
            <div className="faq-question">
              <HelpCircle size={18} style={{ color: "var(--primary)" }} />
              Which image formats and resolutions are supported?
            </div>
            <div className="faq-answer">
              PNG, JPG, JPEG, WEBP, and GIF images of up to 4K resolution are natively supported with automated aspect-ratio preservation and downsample protection.
            </div>
          </div>
          <div className="faq-card">
            <div className="faq-question">
              <HelpCircle size={18} style={{ color: "var(--primary)" }} />
              When should I select Free Mode vs. Premium?
            </div>
            <div className="faq-answer">
              Free Mode is ideal for high-speed digitizing of digital receipts, printed books, PDFs, and high-contrast typed pages. Premium is optimal for handwriting, angled camera snapshots, degraded microfilms, and complex forms.
            </div>
          </div>
        </div>
      </section>


      {/* Footer - About and Contact do not navigate or jump anywhere */}
      <footer className="footer">
        <div style={{ fontFamily: "var(--font-merriweather)", fontSize: "1.25rem", marginBottom: "0.5rem", color: "#fff" }}>
          Optex
        </div>
        <p>Digitize reality with precision.</p>
        <div className="footer-links">
          <a href="javascript:void(0)" onClick={handleDummyClick} style={{ cursor: "default" }}>About</a>
          <a href="javascript:void(0)" onClick={handleDummyClick} style={{ cursor: "default" }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
