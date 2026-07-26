import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert file to base64 for OCR.space
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
    
    let extractedText = "";

    try {
      const ocrSpaceKey = process.env.OCR_SPACE_API_KEY;
      if (ocrSpaceKey) {
        const ocrFormData = new FormData();
        ocrFormData.append("base64Image", base64Image);
        ocrFormData.append("language", "eng");
        ocrFormData.append("isOverlayRequired", "false");
        ocrFormData.append("OCREngine", "2");

        const ocrRes = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          headers: { apikey: ocrSpaceKey },
          body: ocrFormData,
        });

        if (ocrRes.ok) {
          const ocrData = await ocrRes.json();
          if (!ocrData.IsErroredOnProcessing && ocrData.ParsedResults?.length > 0) {
            extractedText = ocrData.ParsedResults[0].ParsedText;
          }
        }
      }
    } catch (e) {
      console.warn("OCR.space failed, falling back to Tesseract.js", e);
    }

    if (!extractedText || extractedText.trim() === "") {
      const worker = await createWorker("eng");
      const ret = await worker.recognize(buffer);
      extractedText = ret.data.text;
      await worker.terminate();
    }

    if (!extractedText || extractedText.trim() === "") {
      return NextResponse.json({ text: "No text could be extracted to correct." });
    }

    // Now, pass the extracted text to Groq (Llama) for correction
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      // If no key is set yet, just return the raw text with a warning
      return NextResponse.json({ 
        text: `[Groq API Key missing - returning raw OCR]\n\n${extractedText}` 
      });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Replaced deprecated llama3-70b-8192
        messages: [
          {
            role: "system",
            content: "You are an expert text correction tool. The user will provide raw OCR text extracted from handwriting. Your job is to fix any garbled words, obvious typos, and formatting errors caused by the OCR process (for example, fixing 'Iam' to 'I am', or '1' to 'I' where contextually appropriate). Output ONLY the corrected text. Do not add conversational filler."
          },
          {
            role: "user",
            content: extractedText
          }
        ],
        temperature: 0.2
      })
    });

    if (!groqRes.ok) {
      const errorData = await groqRes.json();
      console.error("Groq error:", errorData);
      return NextResponse.json({ text: `[Groq Error]\n\n${extractedText}` });
    }

    const groqData = await groqRes.json();
    const correctedText = groqData.choices[0]?.message?.content || extractedText;

    return NextResponse.json({ text: correctedText });
  } catch (error) {
    console.error("Handwritten OCR Error:", error);
    return NextResponse.json({ error: "Handwritten processing failed" }, { status: 500 });
  }
}
