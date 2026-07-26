import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 for Gemini
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    
    const { userId } = await auth();
    if (!userId) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ 
        text: "[Gemini API Key missing - Premium mode is currently unavailable. Please add GEMINI_API_KEY to your environment variables.]" 
      });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Extract all the text from this image. Preserve formatting as best as you can. Do not add any conversational filler, just return the exact text."
              },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json();
      console.error("Gemini error:", errorData);
      return NextResponse.json({ text: "[Gemini API Error occurred during extraction.]" }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    
    // Extract the text from Gemini response structure
    let extractedText = "No text extracted.";
    if (
      geminiData.candidates && 
      geminiData.candidates.length > 0 && 
      geminiData.candidates[0].content && 
      geminiData.candidates[0].content.parts &&
      geminiData.candidates[0].content.parts.length > 0
    ) {
      extractedText = geminiData.candidates[0].content.parts[0].text;
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error("Premium OCR Error:", error);
    return NextResponse.json({ error: "Premium processing failed" }, { status: 500 });
  }
}
