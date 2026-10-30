import { NextResponse } from "next/server";

function detectMimeType(buffer, originalType, fileName = "") {
  // Check magic bytes
  if (buffer.length >= 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return "image/png";
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return "image/jpeg";
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return "image/gif";
    }
    if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
      return "image/webp";
    }
  }
  // Check file extension
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  
  if (originalType && originalType.startsWith("image/")) {
    if (originalType === "image/jpg") return "image/jpeg";
    return originalType;
  }
  return "image/png";
}

async function callGeminiModel(model, apiKey, mimeType, base64Data) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "You are an expert optical character recognition (OCR) engine. Carefully transcribe all visible text in this image, including handwritten notes, cursive, printed text, numbers, symbols, signs, headers, and code. Preserve original line breaks and formatting as accurately as possible. Output ONLY the extracted text. If there is absolutely no text in the image, reply with: [No text detected in this image]."
            },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    })
  });

  return response;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ 
        text: "[Gemini API Key missing - Please add GEMINI_API_KEY to your environment variables.]" 
      });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = detectMimeType(buffer, file.type, file.name || "");

    // Models to try in order of speed and stability
    const models = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
    let lastError = null;

    for (const model of models) {
      try {
        const geminiRes = await callGeminiModel(model, geminiKey, mimeType, base64Data);
        
        if (!geminiRes.ok) {
          const errorData = await geminiRes.json();
          console.warn(`[Gemini API] Model ${model} returned ${geminiRes.status}:`, errorData);
          lastError = errorData;
          continue; // Try fallback model
        }

        const geminiData = await geminiRes.json();

        // Extract text from parts (handling potential thought parts)
        const parts = geminiData.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          const textParts = parts.filter(p => !p.thought && typeof p.text === "string" && p.text.trim().length > 0);
          if (textParts.length > 0) {
            return NextResponse.json({ text: textParts.map(p => p.text).join("\n").trim() });
          }

          const anyTextParts = parts.filter(p => typeof p.text === "string" && p.text.trim().length > 0);
          if (anyTextParts.length > 0) {
            return NextResponse.json({ text: anyTextParts.map(p => p.text).join("\n").trim() });
          }
        }

        // If candidate finished due to SAFETY or other reasons
        const finishReason = geminiData.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== "STOP") {
          return NextResponse.json({ text: `[Image extraction could not be completed. Reason: ${finishReason}]` });
        }
      } catch (err) {
        console.warn(`[Gemini API] Failed call to ${model}:`, err);
        lastError = err;
      }
    }

    return NextResponse.json({ 
      text: lastError ? `[AI Vision could not extract text: ${lastError?.message || "Please try another image format or Free Mode."}]` : "No text extracted." 
    });
  } catch (error) {
    console.error("Premium OCR Error:", error);
    return NextResponse.json({ error: "Premium processing failed", message: error.message }, { status: 500 });
  }
}
