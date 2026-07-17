export interface GrammarSuggestion {
  original: string;
  suggested: string;
  explanation: string;
}

export interface ImprovedBulletPoint {
  section: string;
  original: string;
  improved: string;
  rationale: string;
}

export interface AnalysisResult {
  resumeScore: number;
  atsScore: number;
  grammarSuggestions: GrammarSuggestion[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  improvedBulletPoints: ImprovedBulletPoint[];
  // Job Description matching fields (optional, active only if JD is entered)
  jobMatchPercentage?: number;
  missingKeywords?: string[];
  matchedKeywords?: string[];
  suggestedImprovements?: string[];
}

export interface ExampleTemplate {
  name: string;
  category: string;
  resumeText: string;
  jobDescription: string;
}
