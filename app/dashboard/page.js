"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { UploadCloud, FileText, Image as ImageIcon, Copy, Check, Loader2, Sparkles, PenTool, X } from "lucide-react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { ThemeToggle } from "../components/ThemeToggle";
import { supabaseClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's date as YYYY-MM-DD in the user's LOCAL timezone.
 * Never use toISOString() for this — it returns UTC and will be off
 * by up to ±14 hours depending on the user's timezone.
 */
function localDateString() {
  const d = new Date();
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the number of milliseconds from right now until the next
 * local midnight (00:00:00.000).
 */
function msUntilMidnight() {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next - now;
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

/**
 * Load this user's usage row from Supabase.
 * - If last_reset < today  → reset all counts to 0 and upsert.
 * - Overwrites localStorage so counts are consistent across devices.
 */
async function loadUsageFromSupabase(userId, setUsages) {
  if (!supabaseClient || !userId) return;
  try {
    const { data, error } = await supabaseClient
      .from("optex_usage")
      .select("free_used, handwritten_used, premium_used, last_reset")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = row not found (first-time user) — not a real error
      console.error("[Supabase] loadUsageFromSupabase error:", error);
      return;
    }

    const today = localDateString();

    if (!data) {
      // First-time user — row doesn't exist yet, nothing to load
      console.log("[Supabase] No existing usage row — will create on first use.");
      return;
    }

    let remote = {
      free: data.free_used,
      handwritten: data.handwritten_used,
      premium: data.premium_used,
    };

    if (data.last_reset !== today) {
      // Stale day — reset counts
      remote = { free: 0, handwritten: 0, premium: 0 };
      const { error: upsertError } = await supabaseClient
        .from("optex_usage")
        .upsert({
          user_id: userId,
          free_used: 0,
          handwritten_used: 0,
          premium_used: 0,
          last_reset: today,
          updated_at: new Date().toISOString(),
        });
      if (upsertError) console.error("[Supabase] reset upsert error:", upsertError);
    }

    // Overwrite localStorage with the authoritative remote values
    localStorage.setItem("usages", JSON.stringify(remote));
    setUsages(remote);
    console.log("[Supabase] Loaded usage from DB:", remote);
  } catch (err) {
    console.error("[Supabase] loadUsageFromSupabase threw:", err);
  }
}

/**
 * Upsert the user's current usage counts to Supabase.
 * Called as fire-and-forget after every successful OCR action.
 */
async function syncUsageToSupabase(userId, usages) {
  if (!supabaseClient || !userId) return;
  try {
    const today = localDateString();
    const { error } = await supabaseClient
      .from("optex_usage")
      .upsert({
        user_id: userId,
        free_used: usages.free,
        handwritten_used: usages.handwritten,
        premium_used: usages.premium,
        last_reset: today,
        updated_at: new Date().toISOString(),
      });
    if (error) console.error("[Supabase] syncUsageToSupabase error:", error);
  } catch (err) {
    console.error("[Supabase] syncUsageToSupabase threw:", err);
  }
}

// ---------------------------------------------------------------------------
// Dashboard Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { isLoaded: clerkLoaded, userId } = useAuth();

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

  // Load local data first, then hydrate from Supabase once Clerk confirms identity
  useEffect(() => {
    if (!clerkLoaded) return;
    loadLocalData();
    if (userId) {
      loadUsageFromSupabase(userId, setUsages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkLoaded, userId]);

  // Midnight reset — fires when the clock ticks past 00:00 local time.
  // Re-arms itself every day so the page never needs a refresh.
  useEffect(() => {
    if (!userId) return;

    const resetAtMidnight = () => {
      const zeroed = { free: 0, handwritten: 0, premium: 0 };
      localStorage.setItem("usages", JSON.stringify(zeroed));
      setUsages(zeroed);
      console.log("[Supabase] Midnight reset — counts zeroed.");
      syncUsageToSupabase(userId, zeroed);

      // Re-arm for the next midnight
      const nextTimer = setTimeout(resetAtMidnight, msUntilMidnight());
      return nextTimer;
    };

    const timer = setTimeout(resetAtMidnight, msUntilMidnight());
    return () => clearTimeout(timer);
  }, [userId]);
  
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
      
      // Increment usage locally then sync to Supabase (fire-and-forget)
      setUsages(prev => {
        const newUsages = { ...prev, [mode]: prev[mode] + 1 };
        localStorage.setItem("usages", JSON.stringify(newUsages));
        syncUsageToSupabase(userId, newUsages);
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
