"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, LoaderCircle, Sparkles, Upload, Wand2, X } from "lucide-react";
import { Badge, ToggleSwitch } from "@/components/ui";
import { aiApi } from "@/lib/apiClient";
import type {
  AiAgentMode,
  AiBloomLevel,
  AiDifficulty,
  AiDraftQuestion,
  AiProviderMetadata,
  AiQuestionType,
  AiTone,
  AiQuizGenerationOutput,
  ParsedMaterialResult
} from "@/lib/services/aiQuizGenerationService";

const GENERATION_STEPS = [
  "Reading material...",
  "Identifying key concepts...",
  "Drafting questions...",
  "Writing explanations...",
  "Checking difficulty balance..."
];

const QUESTION_TYPES: AiQuestionType[] = ["MCQ Single", "MCQ Multiple", "True/False", "Short Answer", "Fill in the Blank"];
const DIFFICULTIES: AiDifficulty[] = ["Easy", "Medium", "Hard", "Mixed"];
const BLOOM_LEVELS: AiBloomLevel[] = ["Recall", "Understanding", "Application", "Analysis"];
const TONES: AiTone[] = ["Simple", "Exam-focused", "Conceptual", "Placement prep"];
const SUPPORTED_UPLOAD_TYPES = ".txt,.md,.markdown,.pdf,.docx,.pptx";

type Props = {
  open: boolean;
  mode: AiAgentMode;
  onClose: () => void;
  initialTopic?: string;
  initialSubject?: string;
  initialClassId?: string;
  initialDifficulty?: AiDifficulty;
  initialQuestionCount?: number;
  initialTone?: AiTone;
  initialOpenTab?: "topic" | "notes" | "upload";
  classOptions?: Array<{ value: string; label: string }>;
  subjectOptions?: string[];
  onInsertQuestions?: (questions: AiDraftQuestion[], options: { alsoSaveToQuestionBank: boolean }) => Promise<void> | void;
  onSaveQuestionsToBank?: (questions: AiDraftQuestion[]) => Promise<void> | void;
  insertButtonLabel?: string;
};

function typeTone(type: AiDraftQuestion["type"]) {
  if (type === "MCQ Multiple") return "blue";
  if (type === "True/False") return "green";
  if (type === "Fill in the Blank") return "pink";
  return "purple";
}

function difficultyTone(difficulty: string) {
  if (difficulty === "Easy") return "green";
  if (difficulty === "Hard") return "pink";
  return "amber";
}

function derivePreview(notes: string) {
  return Array.from(
    new Set(
      notes
        .split(/[^a-z0-9+#.]+/i)
        .map((value) => value.trim())
        .filter((value) => value.length >= 5)
    )
  ).slice(0, 8);
}

function getProviderStatus(provider?: AiProviderMetadata) {
  if (!provider) {
    return {
      label: "Provider selected after generation",
      tone: "amber" as const
    };
  }

  if (provider.usedFallback) {
    return {
      label: "Claude unavailable - mock fallback used",
      tone: "amber" as const
    };
  }

  if (provider.provider === "claude") {
    return {
      label: "Claude connected",
      tone: "green" as const
    };
  }

  return {
    label: "Mock AI mode",
    tone: "blue" as const
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parserLabel(parser: ParsedMaterialResult["parser"]) {
  if (parser === "txt") return "TXT parser";
  if (parser === "markdown") return "Markdown parser";
  if (parser === "pdf") return "PDF parser";
  if (parser === "docx") return "Word parser";
  if (parser === "pptx") return "PowerPoint parser";
  return "Unsupported";
}

export function AiQuizAgentPanel({
  open,
  mode,
  onClose,
  initialTopic = "",
  initialSubject = "Computer Science",
  initialClassId = "",
  initialDifficulty = mode === "analytics-remedial" ? "Easy" : "Mixed",
  initialQuestionCount = mode === "analytics-remedial" ? 5 : 8,
  initialTone = mode === "analytics-remedial" ? "Exam-focused" : "Conceptual",
  initialOpenTab = "topic",
  classOptions = [],
  subjectOptions = ["Computer Science", "Programming", "DBMS", "Networks", "Operating Systems", "Aptitude"],
  onInsertQuestions,
  onSaveQuestionsToBank,
  insertButtonLabel
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"topic" | "notes" | "upload">(initialOpenTab === "upload" ? "upload" : initialOpenTab === "notes" ? "notes" : "topic");
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState(initialSubject);
  const [classId, setClassId] = useState(initialClassId);
  const [pastedNotes, setPastedNotes] = useState("");
  const [parsedMaterial, setParsedMaterial] = useState<ParsedMaterialResult | null>(null);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [questionTypes, setQuestionTypes] = useState<AiQuestionType[]>(["MCQ Single", "MCQ Multiple", "True/False"]);
  const [difficulty, setDifficulty] = useState<AiDifficulty>(initialDifficulty);
  const [bloomLevel, setBloomLevel] = useState<AiBloomLevel>("Understanding");
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [tone, setTone] = useState<AiTone>(initialTone);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [alsoSaveToBank, setAlsoSaveToBank] = useState(false);
  const [result, setResult] = useState<AiQuizGenerationOutput | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setError(null);
    setSuccess(null);
    setStatusText("");
    setEditingId(null);
    setSelectedIds([]);
    setParsedMaterial(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open]);

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    setActiveTab(initialOpenTab === "upload" ? "upload" : initialOpenTab === "notes" ? "notes" : "topic");
  }, [initialOpenTab]);

  useEffect(() => {
    if (!loading) return;
    let step = 0;
    setStatusText(GENERATION_STEPS[0]);
    const handle = window.setInterval(() => {
      step = (step + 1) % GENERATION_STEPS.length;
      setStatusText(GENERATION_STEPS[step]);
    }, 750);
    return () => window.clearInterval(handle);
  }, [loading]);

  const previewSource = parsedMaterial?.extractedText ?? pastedNotes;
  const previewKeywords = useMemo(() => derivePreview(previewSource), [previewSource]);
  const draftQuestions = result?.questions ?? [];
  const tooShortNotes = pastedNotes.trim().length > 0 && pastedNotes.trim().length < 80;
  const activeModeLabel = mode === "question-bank" ? "question bank" : mode === "analytics-remedial" ? "remedial quiz" : "quiz builder";
  const primaryInsertLabel = insertButtonLabel ?? (mode === "question-bank" ? "Save selected to Question Bank" : "Insert selected");
  const providerStatus = getProviderStatus(result?.provider);

  function toggleQuestionType(type: AiQuestionType) {
    setQuestionTypes((current) => current.includes(type) ? current.filter((value) => value !== type) : [...current, type]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function updateDraftQuestion(tempId: string, changes: Partial<AiDraftQuestion>) {
    setResult((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((question) => question.tempId === tempId ? { ...question, ...changes } : question)
      };
    });
  }

  function updateDraftOption(tempId: string, optionId: string, text: string) {
    setResult((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((question) => question.tempId === tempId
          ? { ...question, options: question.options.map((option) => option.id === optionId ? { ...option, text } : option) }
          : question)
      };
    });
  }

  function getPayload() {
    if (!topic.trim() && !pastedNotes.trim() && !parsedMaterial?.extractedText.trim()) {
      throw new Error("Add a topic, paste notes, or upload material before generating AI drafts.");
    }
    if (questionCount < 1 || questionCount > 30) {
      throw new Error("Question count must be between 1 and 30.");
    }
    if (marksPerQuestion <= 0) {
      throw new Error("Marks per question must be positive.");
    }
    if (!questionTypes.length) {
      throw new Error("Select at least one question type.");
    }

    return {
      mode,
      topic,
      pastedNotes,
      materialText: parsedMaterial?.extractedText,
      materialMetadata: parsedMaterial
        ? {
            materialId: parsedMaterial.materialId,
            fileName: parsedMaterial.fileName,
            fileType: parsedMaterial.fileType,
            fileSize: parsedMaterial.fileSize,
            extractedCharCount: parsedMaterial.extractedCharCount,
            parser: parsedMaterial.parser,
            confidence: parsedMaterial.confidence,
            previewText: parsedMaterial.previewText
          }
        : undefined,
      subject,
      classId: classId || undefined,
      questionCount,
      questionTypes,
      difficulty,
      bloomLevel,
      marksPerQuestion,
      negativeMarking,
      tone,
      avoidQuestionBankDuplicates: avoidDuplicates
    };
  }

  async function handleGenerate() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = getPayload();
      const output = mode === "analytics-remedial"
        ? await aiApi.generateRemedialQuiz(payload)
        : await aiApi.generateQuiz(payload);
      setResult(output);
      setSelectedIds(output.questions.map((question) => question.tempId));
      setStatusText("Draft ready for professor review.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate(question: AiDraftQuestion, index: number) {
    setError(null);
    setSuccess(null);
    try {
      const next = await aiApi.regenerateQuestion({ ...getPayload(), questionIndex: index, topic: `${topic || question.topicTag} ${question.topicTag}`.trim() });
      updateDraftQuestion(question.tempId, next);
      setSuccess("Question regenerated. Please review before accepting.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Question regeneration failed.");
    }
  }

  async function handleInsert(questions: AiDraftQuestion[]) {
    if (!questions.length) {
      setError("Select at least one AI draft before inserting or saving.");
      return;
    }

    setError(null);
    setSuccess(null);
    await onInsertQuestions?.(questions, { alsoSaveToQuestionBank: alsoSaveToBank });
    setSuccess(mode === "question-bank" ? "AI-drafted questions saved to Question Bank." : `Inserted ${questions.length} AI draft question${questions.length === 1 ? "" : "s"} into the ${activeModeLabel}.`);
  }

  async function handleSaveToBank(questions: AiDraftQuestion[]) {
    if (!onSaveQuestionsToBank) return;
    if (!questions.length) {
      setError("Select at least one AI draft before saving to Question Bank.");
      return;
    }

    setError(null);
    setSuccess(null);
    await onSaveQuestionsToBank(questions);
    setSuccess("AI-drafted questions saved to Question Bank.");
  }

  async function handleUpload(file: File) {
    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const parsed = await aiApi.parseMaterial(file);
      setParsedMaterial(parsed);
      setActiveTab("upload");
      setSuccess(`${parsed.fileName} was parsed successfully. Review the preview, then generate AI drafts.`);
    } catch (uploadError) {
      setParsedMaterial(null);
      setError(uploadError instanceof Error ? uploadError.message : "Material upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function clearMaterial() {
    setParsedMaterial(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSuccess("Uploaded material cleared.");
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-agent-title">
      <div className="modal-card ai-agent-modal pad">
        <div className="section-head">
          <div>
            <h2 id="ai-agent-title">AI Quiz-Generation Agent</h2>
            <p className="muted">Draft questions from a topic, notes, or uploaded material. Professor review required.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge tone="amber">AI-drafted · Review before publishing</Badge>
            <Badge tone={providerStatus.tone}>{providerStatus.label}</Badge>
            <button className="icon-button" onClick={onClose} type="button" aria-label="Close AI panel"><X size={16} /></button>
          </div>
        </div>

        <div className="ai-agent-layout">
          <section className="grid">
            <div className="ai-agent-tabs">
              {[
                { id: "topic", label: "Topic Prompt" },
                { id: "notes", label: "Paste Notes" },
                { id: "upload", label: "Upload Material" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`ai-chip ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "topic" ? (
              <div className="soft-panel pad-sm grid">
                <label>
                  <strong>Topic prompt</strong>
                  <input className="input" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="JavaScript closures and hoisting" />
                </label>
                <div className="grid grid-2">
                  <label>
                    <strong>Subject</strong>
                    <select className="select" value={subject} onChange={(event) => setSubject(event.target.value)}>
                      {subjectOptions.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <strong>Target class</strong>
                    <select className="select" value={classId} onChange={(event) => setClassId(event.target.value)}>
                      <option value="">General / not selected</option>
                      {classOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div className="soft-panel pad-sm grid">
                <label>
                  <strong>Pasted notes</strong>
                  <textarea className="textarea" value={pastedNotes} onChange={(event) => setPastedNotes(event.target.value)} placeholder="Paste lecture notes, revision bullets, or textbook excerpts here..." />
                </label>
                <div className="ai-meta-row">
                  <span className="muted small">{pastedNotes.length} characters</span>
                  {tooShortNotes ? <span className="small" style={{ color: "var(--pink)", fontWeight: 700 }}>Add a bit more detail for stronger drafting.</span> : null}
                </div>
                <div className="card pad-sm">
                  <strong>Parsed preview</strong>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {previewKeywords.length
                      ? previewKeywords.map((keyword) => <Badge key={keyword} tone="blue">{keyword}</Badge>)
                      : <span className="muted small">Key terms will appear here once notes are pasted.</span>}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "upload" ? (
              <div className="soft-panel pad-sm grid">
                <input
                  ref={fileInputRef}
                  accept={SUPPORTED_UPLOAD_TYPES}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  type="file"
                />

                <div className="notice ai-privacy-copy">
                  Uploaded material is parsed to draft questions. Files are not permanently stored in this MVP. Do not upload confidential or sensitive student data.
                </div>

                <div className="card pad-sm grid">
                  <div className="section-head">
                    <div>
                      <strong>Supported now</strong>
                      <div className="muted small">TXT, MD, PDF, DOCX, PPTX up to 5MB</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge tone="green">TXT</Badge>
                      <Badge tone="green">MD</Badge>
                      <Badge tone="green">MARKDOWN</Badge>
                      <Badge tone="green">PDF</Badge>
                      <Badge tone="green">DOCX</Badge>
                      <Badge tone="green">PPTX</Badge>
                    </div>
                  </div>
                </div>

                {!parsedMaterial ? (
                  <div className="ai-upload-card">
                    <Upload size={26} />
                    <strong>Upload material for parsing</strong>
                    <p className="muted">Choose a text, PDF, Word, or PowerPoint file to extract text, preview it, and use it for AI drafting.</p>
                    <button className="btn primary" onClick={openFilePicker} type="button" disabled={uploading}>
                      {uploading ? "Parsing..." : "Choose File"}
                    </button>
                  </div>
                ) : (
                  <div className="card pad grid">
                    <div className="section-head">
                      <div>
                        <h3>{parsedMaterial.fileName}</h3>
                        <p className="muted small">Review the extracted text before using it for quiz generation.</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge tone="blue">{parserLabel(parsedMaterial.parser)}</Badge>
                        <Badge tone="green">{parsedMaterial.confidence} confidence</Badge>
                        <Badge tone="amber">{formatFileSize(parsedMaterial.fileSize)}</Badge>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge tone="purple">{parsedMaterial.fileType || "text/plain"}</Badge>
                      <Badge tone="blue">{parsedMaterial.extractedCharCount} characters</Badge>
                    </div>

                    <div className="soft-panel pad-sm">
                      <strong>Extracted text preview</strong>
                      <p className="muted small" style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{parsedMaterial.previewText}</p>
                    </div>

                    <div className="card pad-sm">
                      <strong>Parsed preview keywords</strong>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        {previewKeywords.length
                          ? previewKeywords.map((keyword) => <Badge key={keyword} tone="blue">{keyword}</Badge>)
                          : <span className="muted small">Keywords will appear here when enough text is extracted.</span>}
                      </div>
                    </div>

                    {parsedMaterial.warnings.length ? (
                      <div className="grid">
                        {parsedMaterial.warnings.map((warning) => (
                          <div className="row-item" key={warning} style={{ padding: 10 }}>
                            <AlertTriangle size={16} color="var(--amber)" />
                            <span className="small">{warning}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        className="btn primary"
                        onClick={() => {
                          setActiveTab("upload");
                          setSuccess("Uploaded material will be used when you generate AI drafts.");
                        }}
                        type="button"
                      >
                        Use This Material for Generation
                      </button>
                      <button className="btn" onClick={openFilePicker} type="button" disabled={uploading}>Replace File</button>
                      <button className="btn ghost" onClick={clearMaterial} type="button">Clear Material</button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="card pad grid">
              <div className="section-head">
                <h3>Generation controls</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge tone="purple"><Wand2 size={14} /> Guided AI drafting</Badge>
                  <Badge tone={providerStatus.tone}>{providerStatus.label}</Badge>
                </div>
              </div>

              <div className="grid grid-3">
                <label>
                  <strong>Number of questions</strong>
                  <input className="input" type="number" min={1} max={30} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value) || 1)} />
                </label>
                <label>
                  <strong>Difficulty</strong>
                  <select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value as AiDifficulty)}>
                    {DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <strong>Bloom level</strong>
                  <select className="select" value={bloomLevel} onChange={(event) => setBloomLevel(event.target.value as AiBloomLevel)}>
                    {BLOOM_LEVELS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <strong>Marks per question</strong>
                  <input className="input" type="number" min={1} value={marksPerQuestion} onChange={(event) => setMarksPerQuestion(Number(event.target.value) || 1)} />
                </label>
                <label>
                  <strong>Tone</strong>
                  <select className="select" value={tone} onChange={(event) => setTone(event.target.value as AiTone)}>
                    {TONES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <div className="soft-panel pad-sm">
                  <strong>Negative marking</strong>
                  <div className="ai-meta-row">
                    <span className="muted small">Mark generated questions with a penalty-ready setting.</span>
                    <ToggleSwitch checked={negativeMarking} onClick={() => setNegativeMarking((value) => !value)} />
                  </div>
                </div>
              </div>

              <div className="grid">
                <strong>Question types</strong>
                <div className="ai-chip-wrap">
                  {QUESTION_TYPES.map((item) => (
                    <button key={item} className={`ai-chip ${questionTypes.includes(item) ? "active" : ""}`} onClick={() => toggleQuestionType(item)} type="button">
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-2">
                <div className="soft-panel pad-sm">
                  <div className="ai-meta-row">
                    <div>
                      <strong>Avoid near-duplicates from Question Bank</strong>
                      <div className="muted small">Uses the current demo question bank as a drafting guardrail.</div>
                    </div>
                    <ToggleSwitch checked={avoidDuplicates} onClick={() => setAvoidDuplicates((value) => !value)} />
                  </div>
                </div>
                {mode === "quiz-builder" ? (
                  <div className="soft-panel pad-sm">
                    <div className="ai-meta-row">
                      <div>
                        <strong>Also save accepted questions to Question Bank</strong>
                        <div className="muted small">Useful when AI drafts should be reusable later.</div>
                      </div>
                      <ToggleSwitch checked={alsoSaveToBank} onClick={() => setAlsoSaveToBank((value) => !value)} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="notice ai-privacy-copy">
                Pasted or uploaded material is used only to draft questions. Files are parsed for quiz drafting and are not permanently stored in this MVP. AI-drafted content requires professor review before publishing.
              </div>

              {error ? <div className="notice" style={{ borderColor: "#ffcad8", background: "#fff1f6", color: "#a41f5a" }}>{error}</div> : null}
              {success ? <div className="notice" style={{ borderColor: "#ccefdc", background: "#effcf4", color: "#12643d" }}>{success}</div> : null}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {loading || uploading ? <LoaderCircle size={15} className="spin" /> : <Sparkles size={15} />}
                  {uploading
                    ? "Parsing uploaded material..."
                    : loading
                      ? statusText
                      : `Draft into ${activeModeLabel} mode with review guardrails.`}
                </div>
                <button className="btn primary" onClick={handleGenerate} type="button" disabled={loading || uploading}>
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid">
            <div className="card pad">
              <div className="section-head">
                <div>
                  <h3>Draft review</h3>
                  <p className="muted small">AI output never auto-publishes. Professor acceptance is required.</p>
                </div>
                {result ? <Badge tone="blue">{result.questions.length} drafts</Badge> : null}
              </div>

              {result ? (
                <div className="grid">
                  <div className="soft-panel pad-sm">
                    <strong>{result.summary}</strong>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <Badge tone={providerStatus.tone}>{providerStatus.label}</Badge>
                      {result.coverage.map((item) => <Badge key={item}>{item}</Badge>)}
                      <Badge tone="amber">{result.estimatedDifficulty}</Badge>
                      <Badge tone="green">{result.suggestedTimeMinutes} min suggested</Badge>
                    </div>
                    {result.warnings.length ? (
                      <div className="grid" style={{ marginTop: 12 }}>
                        {result.warnings.map((warning) => (
                          <div className="row-item" key={warning} style={{ padding: 10 }}>
                            <AlertTriangle size={16} color="var(--amber)" />
                            <span className="small">{warning}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="ai-batch-bar">
                    <label className="small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === draftQuestions.length} onChange={() => setSelectedIds(selectedIds.length === draftQuestions.length ? [] : draftQuestions.map((item) => item.tempId))} />
                      Select all
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => handleInsert(draftQuestions.filter((item) => selectedIds.includes(item.tempId)))} type="button">{primaryInsertLabel}</button>
                      {mode !== "question-bank" && onSaveQuestionsToBank ? <button className="btn" onClick={() => handleSaveToBank(draftQuestions.filter((item) => selectedIds.includes(item.tempId)))} type="button">Save selected to Question Bank</button> : null}
                      <button className="btn ghost" onClick={() => { setResult(null); setSelectedIds([]); }} type="button">Discard all</button>
                    </div>
                  </div>

                  <div className="grid" style={{ maxHeight: 720, overflow: "auto", paddingRight: 4 }}>
                    {draftQuestions.map((question, index) => {
                      const selected = selectedIds.includes(question.tempId);
                      const editing = editingId === question.tempId;
                      return (
                        <article className="card pad ai-question-card" key={question.tempId}>
                          <div className="section-head">
                            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <input type="checkbox" checked={selected} onChange={() => toggleSelected(question.tempId)} />
                              <strong>Question {index + 1}</strong>
                            </label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <Badge tone={typeTone(question.type)}>{question.type}</Badge>
                              <Badge tone={difficultyTone(question.difficulty)}>{question.difficulty}</Badge>
                              <Badge tone="blue">{question.topicTag}</Badge>
                              <Badge tone="amber">{Math.round(question.confidence * 100)}% confidence</Badge>
                            </div>
                          </div>

                          {editing ? (
                            <div className="grid">
                              <textarea className="textarea" value={question.text} onChange={(event) => updateDraftQuestion(question.tempId, { text: event.target.value })} />
                              {question.options.length ? (
                                <div className="grid">
                                  {question.options.map((option) => (
                                    <input key={option.id} className="input" value={option.text} onChange={(event) => updateDraftOption(question.tempId, option.id, event.target.value)} />
                                  ))}
                                </div>
                              ) : null}
                              <textarea className="textarea" value={question.explanation} onChange={(event) => updateDraftQuestion(question.tempId, { explanation: event.target.value })} />
                            </div>
                          ) : (
                            <div className="grid">
                              <strong>{question.text}</strong>
                              <div className="muted small">{question.source}</div>
                              {question.options.length ? (
                                <div className="grid">
                                  {question.options.map((option) => {
                                    const correct = question.correctOptionIds?.includes(option.id) || (question.correctAnswer && option.text === question.correctAnswer);
                                    return (
                                      <div className="row-item" key={option.id} style={{ padding: 10 }}>
                                        <span>{option.text}</span>
                                        <span className="spacer" />
                                        {correct ? <Badge tone="green">Correct answer</Badge> : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="soft-panel pad-sm">
                                  <strong>Accepted answer</strong>
                                  <p className="muted small">{question.correctAnswer}</p>
                                </div>
                              )}
                              <div className="soft-panel pad-sm">
                                <strong>Explanation</strong>
                                <p className="muted small">{question.explanation}</p>
                              </div>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Badge tone="purple">Marks: {question.marks}</Badge>
                                <Badge tone="amber">AI-drafted</Badge>
                                {question.source === "Based on uploaded material" ? <Badge tone="blue"><FileText size={14} /> Uploaded material</Badge> : null}
                              </div>
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button className="btn primary" onClick={() => handleInsert([question])} type="button">
                              {mode === "question-bank" ? "Accept & Save" : "Accept & Insert"}
                            </button>
                            <button className="btn" onClick={() => setEditingId(editing ? null : question.tempId)} type="button">
                              {editing ? "Done Editing" : "Edit"}
                            </button>
                            <button className="btn" onClick={() => handleRegenerate(question, index)} type="button">Regenerate</button>
                            <button className="btn ghost" onClick={() => setResult((current) => current ? { ...current, questions: current.questions.filter((item) => item.tempId !== question.tempId) } : current)} type="button">Discard</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="ai-empty-state">
                  <CheckCircle2 size={20} color="var(--purple)" />
                  <div>
                    <strong>No AI drafts yet</strong>
                    <p className="muted small">Generate from a topic prompt, pasted notes, or uploaded material to begin the review workflow.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
