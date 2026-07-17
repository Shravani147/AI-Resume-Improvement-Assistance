import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

// Increase request size limits for base64 file uploads (PDF resumes, etc.)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Server-side health check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Resume analysis API
app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, resumeFile, jobDescription } = req.body;

    if (!resumeText && !resumeFile) {
      return res.status(400).json({ error: "Please provide either resume text or an uploaded resume file." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured in the server environment. Please set GEMINI_API_KEY.",
      });
    }

    // Build the contents parts for the model
    const parts: any[] = [];

    // System instruction and user prompts
    let promptText = "Analyze the provided resume.";
    
    if (resumeFile) {
      // The client sends resumeFile as { data: "base64...", mimeType: "application/pdf" }
      parts.push({
        inlineData: {
          data: resumeFile.data,
          mimeType: resumeFile.mimeType,
        },
      });
      promptText += " Please inspect the attached file to extract details and analyze.";
    }

    if (resumeText) {
      parts.push({
        text: `--- RESUME TEXT CONTENT ---\n${resumeText}\n--- END RESUME TEXT CONTENT ---`,
      });
      promptText += " Please use the pasted text as the core resume content.";
    }

    if (jobDescription) {
      parts.push({
        text: `--- TARGET JOB DESCRIPTION ---\n${jobDescription}\n--- END TARGET JOB DESCRIPTION ---`,
      });
      promptText += "\nIn addition to the overall resume evaluation, compare this resume to the target Job Description to compute the matching metrics and custom tailoring advice.";
    }

    // Push the main instructions
    parts.push({
      text: promptText + "\nProvide your complete analysis adhering strictly to the requested JSON response schema.",
    });

    const isJobComparison = !!jobDescription;

    // Define JSON Schema
    const responseSchemaProperties: any = {
      resumeScore: {
        type: Type.INTEGER,
        description: "A comprehensive assessment score from 0 to 100 for overall professional presentation, structure, and quality.",
      },
      atsScore: {
        type: Type.INTEGER,
        description: "An estimated score from 0 to 100 of how well ATS scanners can parse this resume (evaluating tables, headers, columns, font choices mentioned, layout clarity).",
      },
      grammarSuggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING, description: "The original line or snippet with spelling, grammar, passive voice, or formatting issues." },
            suggested: { type: Type.STRING, description: "An improved, corrected, or more dynamic phrasing." },
            explanation: { type: Type.STRING, description: "Detailed rationale for the change." },
          },
          required: ["original", "suggested", "explanation"],
        },
        description: "Spelling, grammar, phrasing, or flow suggestions found throughout the resume.",
      },
      missingSkills: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Technical or soft skills missing in the resume that are crucial for the candidate's field or industry.",
      },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 to 5 notable highlights or strongly articulated elements of the resume.",
      },
      weaknesses: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 to 5 key formatting, phrasing, structural, or detailed gaps in the resume.",
      },
      improvedBulletPoints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            section: { type: Type.STRING, description: "E.g., Professional Experience, Education, Projects." },
            original: { type: Type.STRING, description: "The weak original bullet point or line." },
            improved: { type: Type.STRING, description: "Suggested rewrite using strong action verbs, dynamic metrics, and precise outcomes." },
            rationale: { type: Type.STRING, description: "Why this rewrite is significantly more convincing and impactful." },
          },
          required: ["section", "original", "improved", "rationale"],
        },
        description: "Before-and-after bullet point rewrites to increase layout power and demonstrate concrete achievements.",
      },
    };

    const requiredFields = ["resumeScore", "atsScore", "grammarSuggestions", "missingSkills", "strengths", "weaknesses", "improvedBulletPoints"];

    if (isJobComparison) {
      responseSchemaProperties.jobMatchPercentage = {
        type: Type.INTEGER,
        description: "An score from 0 to 100 showing how well this resume matches the target Job Description based on keywords, skills, and seniority.",
      };
      responseSchemaProperties.missingKeywords = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Keywords or tools specified in the Job Description that are totally absent from the resume.",
      };
      responseSchemaProperties.matchedKeywords = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Keywords, skills, or tools from the job description successfully identified inside the candidate's resume.",
      };
      responseSchemaProperties.suggestedImprovements = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Specific actionable steps or tailoring points to modify this resume so it aligns closely with the Job Description's expectations.",
      };

      requiredFields.push("jobMatchPercentage", "missingKeywords", "matchedKeywords", "suggestedImprovements");
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: responseSchemaProperties,
      required: requiredFields,
    };

    // Call Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: parts,
      config: {
        systemInstruction: `You are a certified executive resume coach, expert ATS auditor, and recruitment strategist.
Your job is to thoroughly analyze the provided resume.
Be encouraging yet highly objective, and suggest improvements that are highly rigorous, industry-standard, and professional.
Focus heavily on making bullet points quantifiable (demonstrating business or technical metrics, results, and timeframes).
Format your final response perfectly matching the JSON schema provided.`,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for highly consistent structured feedback
      },
    });

    if (!response.text) {
      throw new Error("No analysis response returned from the Gemini AI model.");
    }

    const rawResponseText = response.text.trim();
    const result = JSON.parse(rawResponseText);
    res.json(result);

  } catch (error: any) {
    console.error("Analysis endpoint error:", error);
    res.status(500).json({
      error: "Error occurred during resume analysis.",
      details: error.message || error,
    });
  }
});

// Configure Vite or Static asset serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Resume Improvement Assistant running on http://0.0.0.0:${PORT}`);
  });
}

configureServer().catch((err) => {
  console.error("Failed to start server:", err);
});
