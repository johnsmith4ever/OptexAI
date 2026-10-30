import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 for OCR.space
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;
    
    let extractedText = "";

    try {
      // 1. Try OCR.space API first
      const ocrSpaceKey = process.env.OCR_SPACE_API_KEY;
      if (ocrSpaceKey) {
        const ocrFormData = new FormData();
        ocrFormData.append("base64Image", base64Image);
        ocrFormData.append("language", "eng");
        ocrFormData.append("isOverlayRequired", "false");
        ocrFormData.append("OCREngine", "2"); // Engine 2 is often better

        const ocrRes = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          headers: {
            apikey: ocrSpaceKey,
          },
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

    // 2. Fallback to Tesseract.js if OCR.space failed or returned empty
    if (!extractedText || extractedText.trim() === "") {
      const worker = await createWorker("eng");
      const ret = await worker.recognize(buffer);
      extractedText = ret.data.text;
      await worker.terminate();
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "OCR processing failed", message: error.message, stack: error.stack }, { status: 500 });
  }
}
