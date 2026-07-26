"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { UploadCloud, FileText, Image as ImageIcon, Copy, Check, Loader2, Sparkles, PenTool, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "../components/ThemeToggle";

export default function Dashboard() {
  const [mode, setMode] = useState("free"); // "free", "handwritten", "premium"
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [usages, setUsages] = useState({ free: 0, handwritten: 0, premium: 0 });
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamic Limits configuration
  const limits = {
    free: { free: 100, handwritten: 7, premium: 2 },
    core: { free: Infinity, handwritten: 100, premium: 30 },
    pro: { free: Infinity, handwritten: 300, premium: 100 }
  };
  
  const currentLimits = limits[currentPlan] || limits.free;

  const loadLocalData = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get("success");
      const urlPlan = urlParams.get("plan");

      let storedPlan = localStorage.getItem("currentPlan") || "free";
      
      if (success === "true" && urlPlan) {
        storedPlan = urlPlan;
        localStorage.setItem("currentPlan", storedPlan);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const storedUsages = JSON.parse(localStorage.getItem("usages") || '{"free":0,"handwritten":0,"premium":0}');
      
      setCurrentPlan(storedPlan);
      setUsages(storedUsages);
      setIsLoaded(true);
    }
  };

  // Load usages from server
  useEffect(() => {
    loadLocalData();
  }, []);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.includes("image/")) return;
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
    setResult("");
  };

  const handleClearImage = (e) => {
    e.stopPropagation();
    setImage(null);
    setFile(null);
    setResult("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processImage = async () => {
    if (!file || !image) return;

    // Check local limits first
    if (usages[mode] >= currentLimits[mode]) {
      setResult(`Usage limit reached for ${mode} mode on your current plan.`);
      return;
    }

    setIsProcessing(true);
    setResult("");

    try {
      let endpoint = "/api/ocr"; // Free mode
      
      if (mode === "handwritten") {
        endpoint = "/api/llama";
      } else if (mode === "premium") {
        endpoint = "/api/gemini";
      }
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to process image");
      }
      
      const data = await response.json();
      setResult(data.text || "No text extracted.");
      
      // Increment usage locally
      setUsages(prev => {
        const newUsages = { ...prev, [mode]: prev[mode] + 1 };
        localStorage.setItem("usages", JSON.stringify(newUsages));
        return newUsages;
      });
      
    } catch (error) {
      console.error(error);
      setResult("Error processing image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      <nav style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "1rem", alignItems: "center" }}>
        <ThemeToggle />
        <UserButton afterSignOutUrl="/" />
      </nav>
      
      <header className="app-header" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Image src="/logo-green.png" alt="Optex Logo" width={48} height={48} style={{ borderRadius: "12px", boxShadow: "var(--shadow-glow)" }} />
          <h1 className="app-title" style={{ marginBottom: 0 }}>Optex</h1>
        </div>
        <p className="app-subtitle">Select a mode below and digitize your reality.</p>
      </header>

      <main>
        {/* Mode Selector */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === "free" ? "active" : ""}`}
            onClick={() => setMode("free")}
          >
            <FileText className="mode-icon" style={{ color: mode === "free" ? "var(--primary)" : "" }} />
            <span className="mode-title">Free Mode</span>
            <span className="mode-meta">100 uses • Tesseract</span>
          </button>
          
          <button 
            className={`mode-btn ${mode === "handwritten" ? "active" : ""}`}
            onClick={() => setMode("handwritten")}
          >
            <PenTool className="mode-icon" style={{ color: mode === "handwritten" ? "var(--primary)" : "" }} />
            <span className="mode-title">Handwritten</span>
            <span className="mode-meta">7 uses/day • Llama 70B & OCR</span>
          </button>
          
          <button 
            className={`mode-btn ${mode === "premium" ? "active" : ""}`}
            onClick={() => setMode("premium")}
          >
            <Sparkles className="mode-icon" style={{ color: mode === "premium" ? "var(--primary)" : "" }} />
            <span className="mode-title">Premium</span>
            <span className="mode-meta">2 uses/day • Gemini Flash-Lite</span>
          </button>
        </div>

        {/* Card containing Uploader and Results */}
        <div className="card">
          {/* Uploader */}
          <div 
            className={`uploader ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="file-input" 
              accept="image/*"
              onChange={handleChange}
            />
            
            {image ? (
              <div className="image-preview-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Preview" className="image-preview" />
                <button className="clear-image-btn" onClick={handleClearImage}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="uploader-content">
                <UploadCloud className="uploader-icon" />
                <div className="uploader-text">
                  <h3 style={{fontFamily: "var(--font-inter)", marginBottom:"0.5rem"}}>Drag & Drop your image</h3>
                  <p style={{color: "var(--text-muted)"}}>or click to browse from your computer</p>
                </div>
              </div>
            )}
          </div>

          <button 
            className="btn-primary full-width" 
            disabled={!image || isProcessing}
            onClick={processImage}
          >
            {isProcessing ? (
              <>
                <Loader2 className="spinner" size={20} />
                Processing via {mode === "free" ? "Tesseract" : mode === "handwritten" ? "Llama 70B" : "Gemini"}...
              </>
            ) : (
              <>
                <ImageIcon size={20} />
                Extract Text
              </>
            )}
          </button>
          
          {/* Results Area */}
          {(result || isProcessing) && (
            <div className="results-area">
              <div className="results-header">
                <h3>Extracted Text</h3>
                <button 
                  className="btn-small" 
                  onClick={copyToClipboard}
                  disabled={!result || isProcessing}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="results-content">
                {isProcessing ? "Analyzing image structure and extracting content..." : result}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Subscriptions Section */}
      <section style={{ marginTop: "4rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2rem", fontFamily: "var(--font-merriweather)", color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            Your Plan & Usage
            <span className="badge" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", background: "rgba(255,255,255,0.1)", color: "var(--text-main)", border: "1px solid var(--border)", textTransform: "uppercase" }}>CURRENT: {currentPlan} TIER</span>
          </h2>
          <p style={{ color: "var(--text-muted)" }}>Manage your Optex subscription and track your limits.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
          
          {/* Usage Tracker Card */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem" }}>Current Limits</h3>
            
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                <span>Free OCR</span>
                <span>{usages.free} / {currentLimits.free === Infinity ? "Unlimited" : currentLimits.free}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${currentLimits.free === Infinity ? 100 : (usages.free / currentLimits.free) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }}></div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                <span>Handwritten Mode</span>
                <span>{usages.handwritten} / {currentLimits.handwritten}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${(usages.handwritten / currentLimits.handwritten) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }}></div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                <span>Premium Mode</span>
                <span>{usages.premium} / {currentLimits.premium}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${(usages.premium / currentLimits.premium) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }}></div>
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>* Usages reset on your billing cycle.</p>
          </div>

          {/* Core Plan */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "1.5rem" }}>Core</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", margin: "1rem 0", color: "var(--text-main)" }}>$1.99<span style={{ fontSize: "1rem", fontWeight: "400", color: "var(--text-muted)" }}>/mo</span></p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--text-muted)" }}>
              <li>✓ Unlimited Free OCR</li>
              <li>✓ 100 Handwriting corrections</li>
              <li>✓ 30 Premium (Gemini) uses</li>
            </ul>
            <button 
              className="btn-secondary" 
              style={{ marginTop: "auto", width: "100%" }}
              onClick={async () => {
                const res = await fetch("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "core" }) });
                const { url } = await res.json();
                if(url) window.location.href = url;
              }}
            >
              Subscribe to Core
            </button>
          </div>

          {/* Pro Plan */}
          <div className="card" style={{ display: "flex", flexDirection: "column", borderColor: "var(--primary)", boxShadow: "var(--shadow-glow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.5rem", color: "var(--primary-active)" }}>Pro</h3>
              <span className="badge">MOST POPULAR</span>
            </div>
            <p style={{ fontSize: "2rem", fontWeight: "700", margin: "1rem 0", color: "var(--text-main)" }}>$3.99<span style={{ fontSize: "1rem", fontWeight: "400", color: "var(--text-muted)" }}>/mo</span></p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--text-muted)" }}>
              <li>✓ Unlimited Free OCR</li>
              <li>✓ 300 Handwriting corrections</li>
              <li>✓ 100 Premium (Gemini) uses</li>
            </ul>
            <button 
              className="btn-primary" 
              style={{ marginTop: "auto", width: "100%" }}
              onClick={async () => {
                const res = await fetch("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan: "pro" }) });
                const { url } = await res.json();
                if(url) window.location.href = url;
              }}
            >
              Subscribe to Pro
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
