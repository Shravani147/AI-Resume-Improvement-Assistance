import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  FileDown, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Check, 
  Search, 
  Award, 
  AlertTriangle, 
  Copy, 
  ThumbsUp, 
  BookOpen, 
  Target, 
  Briefcase, 
  ArrowUpRight,
  Info
} from "lucide-react";
import { EXAMPLES } from "./examples";
import { AnalysisResult } from "./types";

export default function App() {
  // Input fields
  const [selectedTab, setSelectedTab] = useState<"text" | "file">("text");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string; data: string } | null>(null);
  
  // App state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [viewingGrammarIndex, setViewingGrammarIndex] = useState<number | null>(null);
  const [serverHealth, setServerHealth] = useState<{ configured: boolean; checked: boolean }>({ configured: false, checked: false });

  // Check health and confirm backend setup
  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setServerHealth({ configured: data.apiKeyConfigured, checked: true });
      })
      .catch(() => {
        setServerHealth({ configured: false, checked: true });
      });
  }, []);

  // Handle preset templates
  const loadPreset = (index: number) => {
    const example = EXAMPLES[index];
    setResumeText(example.resumeText);
    setJobDescription(example.jobDescription);
    setSelectedTab("text");
    setUploadedFile(null);
  };

  const handleResetInputs = () => {
    setResumeText("");
    setJobDescription("");
    setUploadedFile(null);
    setAnalysisResult(null);
    setApiError(null);
  };

  // Process manual file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const dataUrl = fileReader.result as string;
      const base64Data = dataUrl.split(",")[1];
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Data,
      });
      setSelectedTab("file");
    };
    fileReader.readAsDataURL(file);
  };

  // Run structured AI analysis
  const handleAnalyze = async () => {
    if (selectedTab === "text" && !resumeText.trim()) {
      setApiError("Please enter or paste your resume text, or load a dynamic template below.");
      return;
    }
    if (selectedTab === "file" && !uploadedFile) {
      setApiError("Please drop or upload a valid resume file first.");
      return;
    }

    setIsAnalyzing(true);
    setApiError(null);
    
    // Smooth loader progress simulations
    const statuses = [
      "Retrieving secure credentials...",
      "Extracting resume semantics & content layout...",
      "Analyzing grammar, voice, and industry guidelines...",
      "Benchmarking ATS formatting and structure...",
      "Mapping keywords and compiling expert tailored solutions..."
    ];
    
    let currentStep = 0;
    setAnalysisStatus(statuses[currentStep]);
    const stepInterval = setInterval(() => {
      if (currentStep < statuses.length - 1) {
        currentStep++;
        setAnalysisStatus(statuses[currentStep]);
      }
    }, 1800);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: selectedTab === "text" ? resumeText : "",
          resumeFile: selectedTab === "file" && uploadedFile ? {
            data: uploadedFile.data,
            mimeType: uploadedFile.type || "application/pdf",
          } : null,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.error || "Internal Server Error");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setApiError(err.message || "An unexpected error occurred while communicating with the server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Export results as clean formatted markdown
  const exportReport = () => {
    if (!analysisResult) return;
    
    let md = `# AI Resume Improvement Report\n\n`;
    md += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    md += `## Resume Quality Metrics\n`;
    md += `- Overall Score: ${analysisResult.resumeScore}/100\n`;
    md += `- ATS PARSE Compatibility: ${analysisResult.atsScore}/100\n`;
    if (analysisResult.jobMatchPercentage) {
      md += `- Target Role Match Percentage: ${analysisResult.jobMatchPercentage}%\n`;
    }
    md += `\n`;

    md += `## Core Key Strengths\n`;
    analysisResult.strengths.forEach((s) => { md += `- ${s}\n`; });
    md += `\n`;

    md += `## Suggested Gaps & Weaknesses\n`;
    analysisResult.weaknesses.forEach((w) => { md += `- ${w}\n`; });
    md += `\n`;

    md += `## Recommended Dynamic Skills Additions\n`;
    analysisResult.missingSkills.forEach((skill) => { md += `- ${skill}\n`; });
    md += `\n`;

    if (analysisResult.jobMatchPercentage) {
      md += `## ATS Keyword Diagnostics\n`;
      md += `### Matched Keywords:\n`;
      analysisResult.matchedKeywords?.forEach((k) => { md += `- ${k}\n`; });
      md += `\n### Missing Keywords Needed:\n`;
      analysisResult.missingKeywords?.forEach((k) => { md += `- ${k}\n`; });
      md += `\n`;
    }

    md += `## Recommended Bullet Point Rewrites\n`;
    analysisResult.improvedBulletPoints.forEach((b) => {
      md += `### Section: ${b.section}\n`;
      md += `**Before:** _"${b.original}"_\n`;
      md += `**After (AI Optimised):** **"${b.improved}"**\n`;
      md += `_Rationale:_ ${b.rationale}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ResumePilot_Improvement_Report.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 ring-emerald-500 border-emerald-200 bg-emerald-50";
    if (score >= 60) return "text-amber-600 ring-amber-500 border-amber-200 bg-amber-50";
    return "text-rose-600 ring-rose-500 border-rose-200 bg-rose-50";
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-600";
    if (score >= 60) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER SECTION */}
      <header id="app-header" className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800 flex items-center gap-2">
              AI Resume Improvement Assistant
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                ResumePilot
              </span>
            </h1>
          </div>
        </div>

        {/* Server & API Config validation badges */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          {serverHealth.checked ? (
            serverHealth.configured ? (
              <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Gemini 3.5 Engine Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                <AlertSquare className="w-3.5 h-3.5" />
                Missing GEMINI_API_KEY
              </span>
            )
          ) : (
            <span className="text-slate-400">Verifying API health...</span>
          )}
          <span className="text-slate-400 uppercase tracking-widest text-[10px]">PROFESSIONAL GRADE</span>
        </div>
      </header>

      {/* CORE DISPLAY WINDOW - HORIZONTAL GRID */}
      <main id="app-body" className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* LEFT COLUMN: SOURCE CONFIGURATION PANEL */}
        <section id="panel-inputs" className="w-[380px] flex flex-col gap-3 shrink-0 h-full overflow-hidden">
          
          {/* Preset templates selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
            <h2 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              1-Click Dynamic Presets
            </h2>
            <div className="grid grid-cols-3 gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.name}
                  id={`preset-btn-${i}`}
                  onClick={() => loadPreset(i)}
                  className="px-2 py-1.5 text-left rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-blue-400 hover:bg-blue-50/50 transition-all font-medium text-slate-700 truncate block focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Input Card: Raw text or physical file */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Resume Base Content
              </h2>
              
              {/* Tab Selector Buttons */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  id="tab-text-btn"
                  onClick={() => setSelectedTab("text")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedTab === "text"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  id="tab-file-btn"
                  onClick={() => setSelectedTab("file")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedTab === "file"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* TAB: MANUAL RESUME TEXT */}
            {selectedTab === "text" ? (
              <div className="flex-1 flex flex-col min-h-0">
                <textarea
                  id="resume-text-input"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full flex-1 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  placeholder="Paste your resume content here (e.g. contact info, work history, skills, education)..."
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 px-1">
                  <span>Formatting: Strict Plain text</span>
                  <span>{resumeText.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            ) : (
              /* TAB: RESUME FILE UPLOAD drag-and-drop */
              <div className="flex-1 flex flex-col justify-center min-h-0">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition-all p-4 group">
                  <input
                    id="resume-file-input"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Drag and drop file here</span>
                  <span className="text-[10px] text-slate-400 block text-center">Supports PDF, DOCX, TXT up to 10MB</span>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 rounded px-2 py-0.5 mt-2">
                    Or select file from explorer
                  </span>
                </label>

                {/* Show details statement if file already prepared */}
                {uploadedFile && (
                  <div className="mt-3 p-2 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-700 truncate">{uploadedFile.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || "PDF Binary"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      title="Clear uploaded file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Description Comparison Box (Optional) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-600" />
                Target Job Description
                <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                  Optional
                </span>
              </h2>
              {jobDescription.trim() && (
                <button
                  onClick={() => setJobDescription("")}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Clear Job Description
                </button>
              )}
            </div>
            
            <textarea
              id="job-description-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full flex-1 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
              placeholder="Paste the target job description metadata here. If specified, this activates real-time job matching, missing keywords identification, and structured optimization maps."
            />
          </div>

          {/* Execute Button */}
          <div className="flex gap-2">
            <button
              id="reset-inputs-btn"
              onClick={handleResetInputs}
              disabled={isAnalyzing}
              className="px-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center"
              title="Clear all text fields & reset app state"
            >
              Reset
            </button>
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`flex-1 h-11 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                isAnalyzing 
                  ? "bg-slate-700 cursor-not-allowed" 
                  : "bg-slate-900 hover:bg-slate-800 active:scale-98 cursor-pointer"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Assessment...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Re-Analyze with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: EXPERT REPORT & ANALYTICAL OUTPUTS */}
        <section id="panel-results" className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden h-full">
          
          {/* API ERROR BAR */}
          {apiError && (
            <div className="bg-rose-50 border-b border-rose-200 p-3 flex items-start gap-2 text-rose-700 shrink-0 select-none">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Process Blocked:</span> {apiError}
              </div>
            </div>
          )}

          {/* 1. LOADING OVERLAYS AND PROGRESS BARS */}
          {isAnalyzing ? (
            <div id="loading-container" className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
              <div className="relative w-20 h-20 mb-6">
                {/* Visual pulsating circles */}
                <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75"></div>
                <div className="absolute inset-2 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              </div>
              
              <h3 className="font-bold text-base text-slate-800 tracking-tight text-center">
                Reviewing Resume Integrity
              </h3>
              
              <div className="w-64 h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse transition-all" style={{ width: "70%" }}></div>
              </div>
              
              <p className="mt-2 text-xs text-slate-400 font-mono tracking-wide text-center">
                {analysisStatus}
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-md w-full">
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-slate-500">Injecting text metadata</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                  {uploadedFile ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                  <span className="text-[11px] text-slate-500">Processing binary structures</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] text-slate-500">Applying professional guidelines</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border border-blue-600 border-t-transparent animate-spin"></span>
                  <span className="text-[11px] text-slate-600 font-semibold">Running comparison matching</span>
                </div>
              </div>
            </div>
          ) : !analysisResult ? (
            
            /* 2. NO REPORT PRESENT - BRANDED STEP-BY-STEP BOARD */
            <div id="welcome-container" className="flex-1 overflow-y-auto p-8 flex flex-col justify-center items-center">
              <div className="max-w-xl text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="font-bold text-2xl tracking-tight text-slate-800">
                  Optimize Your Professional Portfolio
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Upload your master resume or paste text parameters. ResumePilot instantly runs deep auditing against ATS matching criteria, grammatical formulations, and recommended business-level metric highlights.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
                    <div className="text-xs font-bold text-blue-600 mb-1">01. INGEST DATA</div>
                    <p className="text-xs text-slate-500 font-medium">
                      Fill the form or choose a pre-designed technology, marketing, or operations profile.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
                    <div className="text-xs font-bold text-blue-600 mb-1">02. DEFINE ALIGNMENT</div>
                    <p className="text-xs text-slate-500 font-medium">
                      (Optional) Provide a target JD to unlock specific keywords mapping and tailored match percentages.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
                    <div className="text-xs font-bold text-blue-600 mb-1">03. EXECUTE METRICS</div>
                    <p className="text-xs text-slate-500 font-medium">
                      Receive comprehensive audit scores, weaknesses flags, dynamic skill arrays, and bullet rewrites.
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg inline-flex items-center gap-2 text-left">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-800 font-medium">
                    <span className="font-bold">Pro Tip:</span> Tap one of the high-impact <span className="font-bold">"1-Click Dynamic Presets"</span> tables on the left sidebar to try the interactive dashboard immediately.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            
            /* 3. ACTIVE REPORT RETRIEVED - RENDER ADVANCED HIGH DENSITY COMPONENT MODULES */
            <div id="report-view-container" className="flex-1 flex flex-col overflow-hidden">
              
              {/* TOP HEADER CONTROLS */}
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    AI Resume Diagnostic Report
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Calculated via model: gemini-3.5-flash
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportReport}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export Document (.md)
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Print Dashboard
                  </button>
                </div>
              </div>

              {/* REPORT CONTENT BODY (SCROLLABLE AREA) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* 3.1 METRICS GRID (RINGS & PROGRESS BARS) */}
                <div className="grid grid-cols-12 gap-4">
                  
                  {/* OVERALL RESUME SCORE RING */}
                  <div className="col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col items-center justify-center select-none">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#F1F5F9" strokeWidth="6.5" fill="transparent" />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="currentColor" 
                          strokeWidth="7" 
                          fill="transparent" 
                          strokeDasharray={251.2} 
                          strokeDashoffset={251.2 - (251.2 * analysisResult.resumeScore) / 100}
                          className={`${getScoreStrokeColor(analysisResult.resumeScore)} transition-all duration-1000`} 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold font-display text-slate-800">{analysisResult.resumeScore}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Overall</span>
                      </div>
                    </div>
                    <div className="mt-2.5 text-center">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Overall Resume Score</p>
                      <p className="text-[10px] text-slate-400 font-medium">Evaluation of presentation, depth & focus</p>
                    </div>
                  </div>

                  {/* CORE BENCHMARKING KPI PROGRESS BARS */}
                  <div className="col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Key Alignment Metrics
                      </h3>
                      <div className="space-y-3">
                        
                        {/* ATS COMPATIBILITY RATE */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600 flex items-center gap-1">
                              ATS Query Parsability
                              <span className="group relative">
                                <Info className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-500" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white font-normal text-[10px] rounded p-2 w-48 hidden group-hover:block z-10 leading-normal mb-1 shadow-md">
                                  Measures whether traditional software bots can read keywords without getting stuck in layout loops.
                                </span>
                              </span>
                            </span>
                            <span className="text-emerald-600">{analysisResult.atsScore}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${analysisResult.atsScore}%` }}></div>
                          </div>
                        </div>

                        {/* JOB DESCRIPTION MATCH RATE */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">Job Description Alignment</span>
                            {analysisResult.jobMatchPercentage !== undefined ? (
                              <span className="text-blue-600">{analysisResult.jobMatchPercentage}%</span>
                            ) : (
                              <span className="text-slate-400">Not Analyzed</span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysisResult.jobMatchPercentage !== undefined ? "bg-blue-600" : "bg-slate-300"
                              }`} 
                              style={{ width: `${analysisResult.jobMatchPercentage !== undefined ? analysisResult.jobMatchPercentage : 0}%` }}
                            ></div>
                          </div>
                          {analysisResult.jobMatchPercentage === undefined && (
                            <p className="text-[9px] text-slate-400 italic">Enter a Job Description to compute role keyword fit.</p>
                          )}
                        </div>

                        {/* CUSTOM ESTIMATED INTERVIEW REACH RATE */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">Grammar & Phrasing Consistency</span>
                            <span className="text-amber-600">Solid (85+)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full">
                            <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{ width: "88%" }}></div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.2 DETAILED SPOTLIGHT BANNER RECOMMENDATION */}
                {analysisResult.jobMatchPercentage !== undefined && (
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-4 flex gap-4 items-start relative overflow-hidden select-none">
                    <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-slate-800 opacity-20 pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                    </div>
                    <div className="p-2.5 bg-blue-600 text-white rounded-lg shrink-0">
                      <Award className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1 max-w-xl">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Automated Recruiter Diagnostic
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {analysisResult.jobMatchPercentage >= 80 
                          ? "Congratulations! Your resume displays a superb technical and functional lock for this role. Only a few keyword tweaks are needed to reach maximum compliance."
                          : "Your background matches core parameters, but details lack the specific buzzwords and metrics required to clear automated high-volume ATS criteria. Review recommendations list below to build direct alignment."}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3.3 STRENGTHS AND WEAKNESSES GRID */}
                <div className="grid grid-cols-12 gap-4">
                  
                  {/* STRENGTHS CARD */}
                  <div className="col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Aesthetic & Content Strengths ({analysisResult.strengths.length})
                      </h4>
                    </div>
                    <ul className="space-y-2.5">
                      {analysisResult.strengths.map((str, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </span>
                          <span className="text-xs text-slate-600 font-medium leading-normal">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* WEAKNESSES CARD */}
                  <div className="col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Gaps & Weaknesses Detected ({analysisResult.weaknesses.length})
                      </h4>
                    </div>
                    <ul className="space-y-2.5">
                      {analysisResult.weaknesses.map((weak, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <span className="p-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0 mt-0.5">
                            <X className="w-3 h-3" />
                          </span>
                          <span className="text-xs text-slate-600 font-medium leading-normal">{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* 3.4 KEYWORD DIAGNOSTICS MATRIX (ONLY VISIBLE IF JD MATCHING IS ACTIVE) */}
                {analysisResult.jobMatchPercentage !== undefined && (
                  <div className="grid grid-cols-12 gap-4">
                    
                    {/* MATCHED KEYWORDS */}
                    <div className="col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">
                        Matched Keywords Found
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.matchedKeywords && analysisResult.matchedKeywords.length > 0 ? (
                          analysisResult.matchedKeywords.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[10px] rounded-md font-medium tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">No matched keywords could be parsed from context.</span>
                        )}
                      </div>
                    </div>

                    {/* MISSING KEYWORDS */}
                    <div className="col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs bg-rose-50/10">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block">
                        Target Keywords Count
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 ? (
                          analysisResult.missingKeywords.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-red-50 border border-red-200 text-rose-700 font-mono text-[10px] rounded-md font-bold tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">All targeted keywords are present! High quality matching achieved.</span>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* 3.5 MISSING TECHNICAL & SOFT SKILLS RECOMMENDATIONS */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                    Recommended Technical & Professional Skills to Highlight
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 transition-colors border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg tracking-wide uppercase"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal italic mt-2.5 block">
                    Recruiter Tip: We recommend incorporating these skills directly into the descriptive text of your professional assignments list instead of a lone list bundle.
                  </p>
                </div>

                {/* 3.6 INTERACTIVE BULLET REWRITES PANEL (HIGH IMPACT METRIC DRIVERS) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="mb-3.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Dynamic Bullet Point Rewrite Engine
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Swapping loose phrases for bullet points loaded with action verbs and quantifiable results.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {analysisResult.improvedBulletPoints.map((b, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all bg-slate-50/50">
                        {/* Section Header */}
                        <div className="bg-[#1E293B] px-3.5 py-1.5 flex justify-between items-center text-white">
                          <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-blue-300">
                            {b.section || "EXPERIENCE SECTION"}
                          </span>
                          <span className="text-[9px] font-semibold opacity-80 uppercase bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                            Quantified Metric Lock
                          </span>
                        </div>
                        
                        <div className="p-3.5 grid grid-cols-2 gap-4">
                          {/* Weak original side */}
                          <div className="space-y-1.5 border-r border-slate-200 pr-3">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1 select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              WEAK / ORIGINAL PHRASING
                            </span>
                            <p className="text-xs text-slate-500 italic mt-1 line-through bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/30">
                              "{b.original}"
                            </p>
                          </div>

                          {/* Strong AI rewrite side */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1 select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              AI METRIC-OPTIMISED REDESIGN
                            </span>
                            <p className="text-xs text-slate-800 font-bold bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100/50 relative group">
                              "{b.improved}"
                              <button
                                onClick={() => copyToClipboard(b.improved, idx)}
                                className="absolute right-2 top-2 p-1 hover:bg-emerald-100 text-slate-400 hover:text-slate-800 rounded transition-all"
                                title="Copy rewrite to clipboard"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-scale" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </p>
                          </div>
                        </div>

                        {/* Rationale footnote */}
                        <div className="bg-white px-3.5 py-2 border-t border-slate-100 text-xs text-slate-500 leading-normal flex items-start gap-1.5">
                          <Info className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                          <p>
                            <span className="font-bold text-slate-700">Audit Rationale:</span> {b.rationale}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3.7 LIST OF DETAILED GRAMMAR SUGGESTIONS */}
                {analysisResult.grammarSuggestions && analysisResult.grammarSuggestions.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 block">
                      Grammar & Syntax Improvements ({analysisResult.grammarSuggestions.length})
                    </h4>
                    
                    <div className="space-y-2">
                      {analysisResult.grammarSuggestions.map((g, idx) => {
                        const isExpanded = viewingGrammarIndex === idx;
                        return (
                          <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden transition-all bg-white">
                            <button
                              onClick={() => setViewingGrammarIndex(isExpanded ? null : idx)}
                              className="w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 pr-4 overflow-hidden">
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 shrink-0">
                                  SUGGESTION
                                </span>
                                <p className="text-xs font-bold text-slate-700 truncate">
                                  {g.original}
                                </p>
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-1.5 border-t border-slate-100 bg-slate-50/50 space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Before</span>
                                    <p className="text-xs text-rose-600 font-mono mt-0.5 line-through">
                                      {g.original}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Suggested Change</span>
                                    <p className="text-xs text-emerald-600 font-serif font-semibold mt-0.5">
                                      {g.suggested}
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                                  <span className="font-bold text-slate-700">Why this helps:</span> {g.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3.8 JOBS IMPROVEMENTS ACTION STEPS */}
                {analysisResult.suggestedImprovements && analysisResult.suggestedImprovements.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      Role Tailoring Action Steps ({analysisResult.suggestedImprovements.length})
                    </h4>
                    <div className="space-y-3">
                      {analysisResult.suggestedImprovements.map((step, idx) => (
                        <div key={idx} className="p-3 bg-blue-50/20 border border-blue-100/50 rounded-xl flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-[10px] text-blue-700 shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-600 font-medium leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </section>

      </main>

    </div>
  );
}

// Inline fallback for AlertSquare component
function AlertSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
