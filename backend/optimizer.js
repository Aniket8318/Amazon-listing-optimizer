const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function optimizeListing(productData) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are an Amazon SEO expert. Respond ONLY with valid JSON, no markdown.",
      },
      {
        role: "user",
        content: `Optimize this Amazon listing:
ASIN: ${productData.asin}
TITLE: ${productData.title}
BULLETS: ${(productData.bullets || []).join(" | ")}
DESCRIPTION: ${productData.description}
CATEGORY: ${productData.category}

Return exactly this JSON:
{
  "optimized_title": "...",
  "optimized_bullets": ["...", "...", "...", "...", "..."],
  "optimized_description": "...",
  "suggested_keywords": ["...", "...", "...", "...", "..."],
  "reasoning": "..."
}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content
    .replace(/```json|```/g, "")
    .trim();

  const parsed = JSON.parse(text);

  return {
    optimizedTitle: parsed.optimized_title,
    optimizedBullets: parsed.optimized_bullets,
    optimizedDescription: parsed.optimized_description,
    suggestedKeywords: parsed.suggested_keywords,
    reasoning: parsed.reasoning,
  };
}

module.exports = { optimizeListing };
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// async function optimizeListing(productData) {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const prompt = `
// You are an Amazon SEO expert. Optimize this product listing and respond ONLY with valid JSON, no markdown.

// ASIN: ${productData.asin}
// TITLE: ${productData.title}
// BULLETS: ${(productData.bullets || []).join(" | ")}
// DESCRIPTION: ${productData.description}
// CATEGORY: ${productData.category}

// Return exactly:
// {
//   "optimized_title": "...",
//   "optimized_bullets": ["...", "...", "...", "...", "..."],
//   "optimized_description": "...",
//   "suggested_keywords": ["...", "...", "...", "...", "..."],
//   "reasoning": "..."
// }`;

//   const result = await model.generateContent(prompt);
//   const text = result.response.text()
//     .replace(/```json|```/g, "").trim();

//   const parsed = JSON.parse(text);

//   return {
//     optimizedTitle: parsed.optimized_title,
//     optimizedBullets: parsed.optimized_bullets,
//     optimizedDescription: parsed.optimized_description,
//     suggestedKeywords: parsed.suggested_keywords,
//     reasoning: parsed.reasoning,
//   };
// }

// module.exports = { optimizeListing };