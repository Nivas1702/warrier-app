import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('bill') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is missing. Add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Convert file buffer to base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    // Call Gemini 1.5 Flash with structured schema
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'You are an intelligent warranty OCR agent. Analyze this bill/invoice/receipt image and extract the product information accurately in JSON format.',
            },
            {
              inlineData: {
                mimeType: file.type || 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            storeName: { type: Type.STRING },
            purchaseDate: { type: Type.STRING, description: 'YYYY-MM-DD format' },
            price: { type: Type.NUMBER },
            warrantyMonths: {
              type: Type.INTEGER,
              description: 'Warranty duration in months (default to 12 if not explicitly stated)',
            },
            category: { type: Type.STRING },
          },
          required: ['productName', 'purchaseDate', 'warrantyMonths'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to scan bill' },
      { status: 500 }
    );
  }
}

