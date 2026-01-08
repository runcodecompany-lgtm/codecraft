import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "أنت خبير سيو متخصص في أخبار جوجل. يجب أن يكون ردك بصيغة JSON فقط."
        },
        {
          role: "user",
          content: `حلل النص التالي واقترح لي باللغة العربية:
          1. مصفوفة "titles" (3 عناوين جذابة).
          2. مصفوفة "keywords" (10 كلمات مفتاحية).
          3. نص "description" (وصف ميتا).
          
          النص: ${content}`
        }
      ],
      model: "llama-3.3-70b-versatile", // موديل قوي جداً ومجاني
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    return NextResponse.json(JSON.parse(responseContent || "{}"));
    
  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json({ error: "فشل في تحليل النص" }, { status: 500 });
  }
}