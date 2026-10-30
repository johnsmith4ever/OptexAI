"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { UploadCloud, FileText, Image as ImageIcon, Copy, Check, Loader2, Sparkles, X } from "lucide-react";

export default function Dashboard() {
  const [mode, setMode] = useState("free"); // "free", "premium"
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
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

    setIsProcessing(true);
    setResult("");

    try {
      const endpoint = mode === "premium" ? "/api/gemini" : "/api/ocr";
      
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
      setResult(data.text || data.error || data.message || "No text extracted.");
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
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <Link href="/" className="btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.875rem" }}>
          ← Home
        </Link>
      </nav>
      
      <header className="app-header" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Image src="/logo-green.png" alt="Optex Logo" width={48} height={48} style={{ borderRadius: "12px", boxShadow: "var(--shadow-glow)" }} />
          <h1 className="app-title" style={{ marginBottom: 0 }}>Optex</h1>
        </div>
        <p className="app-subtitle">Select a mode below and digitize your reality.</p>
      </header>

      <main>
        {/* Mode Selector - 2 Modes, Unlimited Uses */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === "free" ? "active" : ""}`}
            onClick={() => setMode("free")}
          >
            <FileText className="mode-icon" style={{ color: mode === "free" ? "var(--primary)" : "" }} />
            <span className="mode-title">Free Mode</span>
            <span className="mode-meta">Unlimited • Tesseract OCR</span>
          </button>
          
          <button 
            className={`mode-btn ${mode === "premium" ? "active" : ""}`}
            onClick={() => setMode("premium")}
          >
            <Sparkles className="mode-icon" style={{ color: mode === "premium" ? "var(--primary)" : "" }} />
            <span className="mode-title">Premium</span>
            <span className="mode-meta">Unlimited • Gemini Flash-Lite</span>
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
                Processing via {mode === "free" ? "Tesseract" : "Gemini"}...
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
    </div>
  );
}
