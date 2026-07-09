"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bold,
  BookOpen,
  CheckCircle2,
  Code,
  Copy,
  Eye,
  Image as ImageIcon,
  Import,
  Italic,
  Link as LinkIcon,
  List,
  Plus,
  Sparkles,
  Trash2,
  Underline,
  Wand2
} from "lucide-react";
import { AiQuizAgentPanel } from "@/components/ai/AiQuizAgentPanel";
import { AppShell } from "@/components/AppShell";
import { Badge, ToggleSwitch } from "@/components/ui";
import { type QuizQuestion, sampleQuestions } from "@/data/mockData";
import { aiApi, questionBankApi, quizApi } from "@/lib/apiClient";
import { mapAiDraftToQuestionBankItem, mapAiDraftToQuizQuestion, type AiDraftQuestion, type AiDifficulty } from "@/lib/services/aiQuizGenerationService";

const draftKey = "quizly-draft";

type InitialAiState = {
  open?: boolean;
  mode?: "quiz-builder" | "analytics-remedial";
  topic?: string;
  subject?: string;
  difficulty?: AiDifficulty;
  questionCount?: number;
  tone?: "Simple" | "Exam-focused" | "Conceptual" | "Placement prep";
};

function createQuestion(id: number): QuizQuestion {
  return {
    id,
    type: "MCQ Single Answer",
    text: "New question text",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct: 0,
    correctAnswers: [0],
    explanation: "",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: "Manual"
  };
}

function mapBankItemToQuestion(item: any): QuizQuestion {
  const correctAnswers = Math.max(0, (item.options ?? []).findIndex((option: any) => option.isCorrect));
  const multipleCorrect = (item.options ?? []).map((option: any, index: number) => option.isCorrect ? index : -1).filter((value: number) => value >= 0);
  return {
    id: `bank-${item.id}-${Date.now()}`,
    type: item.typeLabel ?? "MCQ Single Answer",
    text: item.text,
    options: (item.options ?? []).map((option: any) => option.text),
    correct: correctAnswers,
    correctAnswers: multipleCorrect.length ? multipleCorrect : [correctAnswers],
    explanation: item.explanation ?? "",
    marks: item.marks ?? 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: item.aiGenerated ? "AI Drafted" : "Question Bank"
  };
}

function getQuestionTone(sourceLabel?: string) {
  if (sourceLabel === "Template") return "blue";
  if (sourceLabel === "Question Bank") return "green";
  if (sourceLabel === "AI Drafted") return "amber";
  return "purple";
}

function normalizedCorrectAnswers(question: QuizQuestion) {
  if (question.type === "Multiple Answer") {
    return question.correctAnswers?.length ? question.correctAnswers : [question.correct];
  }
  return [question.correct];
}

export function QuizBuilderPage({ quizId, initialAiState }: { quizId?: string; initialAiState?: InitialAiState }) {
  const router = useRouter();
  const [title, setTitle] = useState("New Quiz Draft");
  const [goal, setGoal] = useState("Define what this quiz should assess and what students should learn from it.");
  const [subject, setSubject] = useState(initialAiState?.subject ?? "Computer Science");
  const [topic, setTopic] = useState(initialAiState?.topic ?? "General");
  const [difficulty, setDifficulty] = useState<AiDifficulty>(initialAiState?.difficulty ?? "Easy");
  const [questions, setQuestions] = useState<QuizQuestion[]>(sampleQuestions);
  const [active, setActive] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(quizId ?? null);
  const [saved, setSaved] = useState(initialAiState?.open ? "AI panel is ready for review" : "Ready to define quiz goal");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(!!initialAiState?.open);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const question = questions[active];

  useEffect(() => {
    if (quizId) {
      quizApi.get(quizId)
        .then((quiz) => {
          setTitle(quiz.title);
          setGoal(quiz.description || "Editing draft quiz details.");
          setSubject(quiz.subject ?? "Computer Science");
          setTopic(quiz.topic ?? "General");
          setDifficulty(quiz.difficulty ?? "Easy");
          setQuestions((quiz.questionsList?.length ? quiz.questionsList : sampleQuestions).map((item: QuizQuestion) => ({
            ...item,
            correctAnswers: item.correctAnswers?.length ? item.correctAnswers : [item.correct],
            sourceLabel: item.sourceLabel ?? "Manual"
          })));
          setDraftId(quiz.id);
          setSaved("Editing backend draft");
        })
        .catch((error) => setSaved(error instanceof Error ? error.message : "Failed to load draft."));
      return;
    }

    const stored = window.localStorage.getItem(draftKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as QuizQuestion[];
        setQuestions(parsed.map((item) => ({ ...item, correctAnswers: item.correctAnswers?.length ? item.correctAnswers : [item.correct] })));
        setSaved("Loaded local draft");
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }
  }, [quizId]);

  useEffect(() => {
    if (quizId) return;
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(draftKey, JSON.stringify(questions));
      setSaved("Auto-saved locally");
    }, 350);
    return () => window.clearTimeout(handle);
  }, [questions, quizId]);

  useEffect(() => {
    if (!showBankPicker) return;
    questionBankApi.list().then(setBankItems).catch(() => setBankItems([]));
  }, [showBankPicker]);

  const totals = useMemo(
    () => ({
      marks: questions.reduce((sum, item) => sum + item.marks, 0),
      time: questions.reduce((sum, item) => sum + item.minutes, 0)
    }),
    [questions]
  );

  const filteredBankItems = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();
    if (!query) return bankItems;
    return bankItems.filter((item) =>
      [item.text, item.topic, item.subject, item.difficulty, item.typeLabel].some((value) => String(value).toLowerCase().includes(query))
    );
  }, [bankItems, bankSearch]);

  function updateQuestion(next: Partial<QuizQuestion>) {
    setQuestions((items) => items.map((item, index) => (index === active ? { ...item, ...next } : item)));
    setSaved("Saving...");
  }

  function updateOption(index: number, value: string) {
    updateQuestion({ options: question.options.map((option, optionIndex) => (optionIndex === index ? value : option)) });
  }

  function addQuestion() {
    const next = createQuestion(Date.now());
    setQuestions((items) => [...items, next]);
    setActive(questions.length);
  }

  function duplicateQuestion() {
    const clone = { ...question, id: Date.now(), text: `${question.text} (copy)` };
    setQuestions((items) => [...items.slice(0, active + 1), clone, ...items.slice(active + 1)]);
    setActive(active + 1);
  }

  function deleteQuestion() {
    if (questions.length <= 1) {
      setValidationErrors(["A quiz needs at least one question."]);
      return;
    }
    setQuestions((items) => items.filter((_, index) => index !== active));
    setActive((index) => Math.max(0, index - 1));
    setSaved("Question removed");
  }

  function validateForPublish() {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Add a quiz title before saving or publishing.");
    if (!goal.trim()) errors.push("Describe the quiz goal so AI recommendations have context.");
    if (!questions.length) errors.push("Add at least one question.");
    questions.forEach((item, index) => {
      if (!item.text.trim()) errors.push(`Question ${index + 1} needs question text.`);
      if (item.marks <= 0) errors.push(`Question ${index + 1} must have positive marks.`);
      if (!item.options.length) errors.push(`Question ${index + 1} needs at least one answer option or accepted answer.`);
      if (item.options.some((option) => !option.trim())) errors.push(`Question ${index + 1} has an empty option.`);
      if (!normalizedCorrectAnswers(item).length || normalizedCorrectAnswers(item).some((answer) => answer < 0 || answer >= item.options.length)) {
        errors.push(`Question ${index + 1} needs a valid correct answer.`);
      }
    });
    setValidationErrors(errors);
    return errors;
  }

  async function saveDraft() {
    const errors = validateForPublish().filter((error) => !error.includes("goal"));
    if (errors.length) return draftId ?? "local-draft";
    setSaved("Saving...");
    setIsBusy(true);
    try {
      const payload = { title, description: goal, subject, topic, difficulty, questions };
      const quiz = draftId ? await quizApi.update(draftId, payload) : await quizApi.create({ ...payload, aiGenerated: questions.some((item) => item.sourceLabel === "AI Drafted"), aiPrompt: goal });
      setDraftId(quiz.id);
      if (!quizId) {
        router.replace(`/professor/quizzes/${quiz.id}/edit`);
      }
      setSaved(draftId ? "Draft updated" : "Draft saved. Redirected into draft editor.");
      return quiz.id as string;
    } catch (error) {
      if (!quizId) {
        window.localStorage.setItem(draftKey, JSON.stringify(questions));
      }
      setSaved(error instanceof Error ? `Local fallback: ${error.message}` : "Saved locally");
      return draftId ?? "local-draft";
    } finally {
      setIsBusy(false);
    }
  }

  async function publishQuiz() {
    const errors = validateForPublish();
    if (errors.length) {
      setSaved("Fix validation issues before publishing");
      return;
    }
    const id = await saveDraft();
    if (!id || id === "local-draft") return;
    try {
      await quizApi.publish(id);
      setSaved("Published");
      setValidationErrors([]);
    } catch (error) {
      setSaved(error instanceof Error ? error.message : "Publish failed");
      setValidationErrors([error instanceof Error ? error.message : "Publish failed. Check required fields and correct answers."]);
    }
  }

  function importSelectedBankQuestions() {
    const selected = filteredBankItems.filter((item) => selectedBankIds.includes(item.id)).map(mapBankItemToQuestion);
    if (!selected.length) return;
    setQuestions((items) => [...items, ...selected]);
    setSelectedBankIds([]);
    setShowBankPicker(false);
    setActive(questions.length);
    setSaved(`${selected.length} question${selected.length === 1 ? "" : "s"} imported from the bank`);
  }

  async function handleInsertAiQuestions(drafts: AiDraftQuestion[], options: { alsoSaveToQuestionBank: boolean }) {
    const mapped = drafts.map(mapAiDraftToQuizQuestion);
    setQuestions((items) => [...items, ...mapped]);
    setActive(questions.length);
    setShowAiPanel(false);
    setSaved(draftId ? "AI drafts inserted into the quiz builder." : "AI drafts inserted into local quiz state. Save draft when ready.");
    if (options.alsoSaveToQuestionBank) {
      await Promise.all(drafts.map((draft) => questionBankApi.create(mapAiDraftToQuestionBankItem(draft, { subject, topic: draft.topicTag, difficulty: draft.difficulty }))));
      setSaved("AI drafts inserted and copied into Question Bank.");
    }
  }

  async function handleSaveAiQuestionsToBank(drafts: AiDraftQuestion[]) {
    await Promise.all(drafts.map((draft) => questionBankApi.create(mapAiDraftToQuestionBankItem(draft, { subject, topic: draft.topicTag, difficulty: draft.difficulty }))));
    setSaved("Selected AI drafts saved to Question Bank.");
  }

  async function handleGenerateExplanation() {
    try {
      const answer = question.options[question.correct] ?? question.options[0] ?? "";
      const response = await aiApi.generateExplanation(question.text, answer);
      updateQuestion({ explanation: response.explanation });
      setHelperMessage("AI explanation generated. Review it before publishing.");
    } catch (error) {
      setHelperMessage(error instanceof Error ? error.message : "Failed to generate explanation.");
    }
  }

  function toggleCorrectAnswer(index: number) {
    if (question.type === "Multiple Answer") {
      const current = new Set(normalizedCorrectAnswers(question));
      if (current.has(index)) {
        current.delete(index);
      } else {
        current.add(index);
      }
      const next = Array.from(current).sort((a, b) => a - b);
      updateQuestion({ correct: next[0] ?? 0, correctAnswers: next });
      return;
    }

    updateQuestion({ correct: index, correctAnswers: [index] });
  }

  if (!question) {
    return null;
  }

  return (
    <AppShell title={draftId ? "Edit Draft Quiz" : "Create New Quiz"} subtitle="Build reusable quizzes from manual authoring, templates, question bank imports, and reviewed AI drafts.">
      <div className="stepper">
        {["Define quiz goal", "Author and import", "Review and publish"].map((step, index) => (
          <div className={`step ${index === 0 ? "done" : ""} ${index === 1 ? "active" : ""}`} key={step}>
            <div className="step-num">{index + 1}</div>
            <div><strong>{step}</strong><br /><span className="muted small">{index === 0 ? "Set intent" : index === 1 ? "Combine manual, bank, template, and AI content" : "Validate before students see it"}</span></div>
          </div>
        ))}
      </div>

      <div className="wizard">
        <section className="card question-list">
          <div className="section-head" style={{ padding: "16px 16px 0" }}>
            <h3>Questions ({questions.length})</h3>
            <button className="icon-button" onClick={addQuestion} aria-label="Add question" type="button"><Plus size={18} /></button>
          </div>
          {questions.map((item, index) => (
            <button className={`question-row ${index === active ? "active" : ""}`} key={item.id} onClick={() => setActive(index)} type="button">
              <strong>{index + 1}</strong>
              <span style={{ textAlign: "left" }}>
                <strong className="small">{item.text}</strong>
                <br />
                <span className="muted small">{item.sourceLabel ?? "Manual"} · {item.marks} Mark</span>
              </span>
              <Badge tone={getQuestionTone(item.sourceLabel)}>{item.sourceLabel ?? "Manual"}</Badge>
            </button>
          ))}
          <div style={{ padding: 16 }} className="grid">
            <button className="btn full" onClick={addQuestion} type="button"><Plus size={17} />Add Question</button>
            <button className="btn full" onClick={() => setShowBankPicker(true)} type="button"><Import size={17} />Import from Question Bank</button>
            <button className="btn full ghost" onClick={() => setShowAiPanel(true)} type="button"><Sparkles size={17} />Generate with AI</button>
          </div>
        </section>

        <section className="card pad">
          <div className="soft-panel" style={{ padding: 16, marginBottom: 18 }}>
            <Badge tone={draftId ? "amber" : "purple"}>{draftId ? "Editing draft" : "New quiz draft"}</Badge>
            <div className="grid grid-2" style={{ marginTop: 12 }}>
              <label><strong>Quiz title</strong><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label><strong>Quiz goal</strong><input className="input" value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
              <label><strong>Subject</strong><input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
              <label><strong>Topic</strong><input className="input" value={topic} onChange={(event) => setTopic(event.target.value)} /></label>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value as AiDifficulty)} style={{ maxWidth: 180 }}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
                <option>Mixed</option>
              </select>
              <Link className="btn" href="/professor/templates"><BookOpen size={17} />Use Template</Link>
              <button className="btn ghost" onClick={() => setShowAiPanel(true)} type="button"><Sparkles size={17} />Generate with AI</button>
            </div>
            <p className="muted small">Use the question bank for reusable items, templates for faster starts, and AI drafts as a professor-reviewed teaching assistant workflow.</p>
          </div>
          {validationErrors.length ? (
            <div className="notice" style={{ marginBottom: 18 }}>
              <strong>Before publishing:</strong>
              <ul>
                {validationErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          ) : null}
          {helperMessage ? <div className="notice" style={{ marginBottom: 18 }}>{helperMessage}</div> : null}
          <div className="section-head">
            <h3>Question {active + 1}</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone={getQuestionTone(question.sourceLabel)}>{question.sourceLabel ?? "Manual"}</Badge>
              <select className="select" value={question.type} onChange={(event) => updateQuestion({ type: event.target.value as QuizQuestion["type"] })}>
                <option>MCQ Single Answer</option>
                <option>Multiple Answer</option>
                <option>Short Answer</option>
                <option>True/False</option>
                <option>Fill in the Blank</option>
              </select>
              <button className="icon-button" aria-label="Delete question" onClick={deleteQuestion} disabled={questions.length <= 1} type="button"><Trash2 size={17} color="var(--pink)" /></button>
            </div>
          </div>

          <label><strong>Question Text *</strong></label>
          <div className="editor-toolbar">
            {[Bold, Italic, Underline, List, Code, LinkIcon, ImageIcon].map((Icon, index) => (
              <button className="linkish" disabled title="Rich text controls coming soon" key={index} type="button"><Icon size={17} /></button>
            ))}
          </div>
          <textarea className="textarea" value={question.text} onChange={(event) => updateQuestion({ text: event.target.value, sourceLabel: question.sourceLabel ?? "Manual" })} />
          <button className="btn" style={{ marginTop: 10 }} disabled title="Coming soon" type="button"><ImageIcon size={17} />Add image - Coming soon</button>

          <div className="section-head" style={{ marginTop: 18 }}>
            <h3>{question.type === "Short Answer" || question.type === "Fill in the Blank" ? "Accepted Answer *" : "Options *"}</h3>
            {question.type === "Multiple Answer" ? <Badge tone="blue">Select more than one correct answer if needed</Badge> : null}
          </div>
          <div className="grid">
            {question.options.map((option, index) => {
              const selected = normalizedCorrectAnswers(question).includes(index);
              return (
                <div className={`option-row ${selected ? "correct" : ""}`} key={`${question.id}-${index}`}>
                  <button className="radio-dot" onClick={() => toggleCorrectAnswer(index)} aria-label={`Mark option ${index + 1} correct`} type="button" />
                  <input className="input" value={option} onChange={(event) => updateOption(index, event.target.value)} />
                  {selected ? <Badge tone="green">Correct answer</Badge> : null}
                  <button className="icon-button" aria-label="Remove option" onClick={() => updateQuestion({ options: question.options.filter((_, optionIndex) => optionIndex !== index), correct: 0, correctAnswers: [0] })} type="button">
                    <Trash2 size={15} color="var(--pink)" />
                  </button>
                </div>
              );
            })}
          </div>
          <button className="linkish" style={{ marginTop: 14 }} onClick={() => updateQuestion({ options: [...question.options, question.type === "Short Answer" || question.type === "Fill in the Blank" ? "Accepted answer" : `Option ${question.options.length + 1}`] })} type="button">
            <Plus size={16} /> Add Option
          </button>

          <div className="section-head" style={{ marginTop: 18 }}>
            <h3>Explanation (Optional)</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={handleGenerateExplanation} type="button"><Wand2 size={16} />Generate explanation</button>
              <button className="btn" disabled type="button">Improve wording - Coming soon</button>
              <button className="btn" disabled type="button">Make easier - Coming soon</button>
              <button className="btn" disabled type="button">Make harder - Coming soon</button>
            </div>
          </div>
          <textarea className="textarea" value={question.explanation} onChange={(event) => updateQuestion({ explanation: event.target.value })} />

          <div className="section-head" style={{ marginTop: 18 }}>
            <button className="btn" onClick={duplicateQuestion} type="button"><Copy size={17} />Duplicate Question</button>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn" disabled={active === 0} onClick={() => setActive(Math.max(0, active - 1))} type="button">Previous</button>
              <button className="btn primary" onClick={() => setActive(Math.min(questions.length - 1, active + 1))} type="button">Next</button>
            </div>
          </div>
        </section>

        <aside className="grid">
          <section className="card pad">
            <h3>Question Settings</h3>
            <label className="small">Marks *</label>
            <div style={{ display: "flex", maxWidth: 150 }}>
              <button className="btn" onClick={() => updateQuestion({ marks: Math.max(1, question.marks - 1) })} type="button">-</button>
              <input className="input" value={question.marks} readOnly style={{ textAlign: "center" }} />
              <button className="btn" onClick={() => updateQuestion({ marks: question.marks + 1 })} type="button">+</button>
            </div>
            <label className="small">Negative Marks</label>
            <input className="input" type="number" value={question.negativeMarks} onChange={(event) => updateQuestion({ negativeMarks: Number(event.target.value) })} />
            <label className="small">Time Limit (Optional)</label>
            <div style={{ display: "flex", gap: 12 }}>
              <input className="input" type="number" value={question.minutes} onChange={(event) => updateQuestion({ minutes: Number(event.target.value) })} />
              <input className="input" type="number" value={question.seconds} onChange={(event) => updateQuestion({ seconds: Number(event.target.value) })} />
            </div>
            <div className="settings-row"><div><strong>Required</strong><br /><span className="muted small">Student must answer this question</span></div><ToggleSwitch checked={question.required} onClick={() => updateQuestion({ required: !question.required })} /></div>
            <div className="settings-row"><div><strong>Shuffle Options</strong><br /><span className="muted small">Shuffle options for this question</span></div><ToggleSwitch checked={question.shuffle} onClick={() => updateQuestion({ shuffle: !question.shuffle })} /></div>
          </section>

          <section className="card pad soft-panel">
            <h3>Authoring Tips</h3>
            <ul className="muted small">
              <li>Pull reusable questions from the bank when possible.</li>
              <li>Use templates for rapid draft creation.</li>
              <li>Keep explanations clear so review flows stay helpful.</li>
              <li>AI drafts remain editable and never auto-publish.</li>
            </ul>
          </section>

          <section className="card pad">
            <h3>Quiz Progress</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="ring" style={{ "--value": `${Math.min(100, questions.length * 10)}%` } as React.CSSProperties}>
                <div className="ring-inner"><strong>{questions.length}<br /><span className="small">Questions</span></strong></div>
              </div>
              <div className="grid">
                <span>Total Marks <strong>{totals.marks}</strong></span>
                <span>Total Questions <strong>{questions.length}</strong></span>
                <span>Total Time <strong>{totals.time} min</strong></span>
                <span>AI Drafts <strong>{questions.filter((item) => item.sourceLabel === "AI Drafted").length}</strong></span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="bottom-actions">
        <CheckCircle2 color="var(--green)" />
        <div className="spacer"><strong>{saved}</strong><br /><span className="muted small">Draft and publish flow stays compatible with the existing quiz system</span></div>
        <button className="btn" onClick={saveDraft} disabled={isBusy} type="button">{isBusy ? "Saving..." : "Save Draft"}</button>
        <button className="btn primary" onClick={publishQuiz} disabled={isBusy} type="button"><Eye size={17} />Publish Quiz</button>
        <Link className="btn" href={`/quiz/${draftId ?? "javascript-basics"}/instructions`}>Preview Quiz</Link>
      </div>

      {showBankPicker ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bank-picker-title">
          <div className="modal-card pad grid">
            <div className="section-head">
              <div>
                <h2 id="bank-picker-title">Import from Question Bank</h2>
                <p className="muted">Search and select one or more reusable questions to insert into this draft.</p>
              </div>
              <button className="btn" onClick={() => setShowBankPicker(false)} type="button">Close</button>
            </div>
            <input className="input" placeholder="Search by text, topic, subject, or difficulty" value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} />
            <div className="grid" style={{ maxHeight: 360, overflow: "auto" }}>
              {filteredBankItems.map((item) => {
                const checked = selectedBankIds.includes(item.id);
                return (
                  <label className="row-item selectable-row" key={item.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelectedBankIds((items) => checked ? items.filter((value) => value !== item.id) : [...items, item.id])}
                    />
                    <div>
                      <strong>{item.text}</strong>
                      <div className="muted small">{item.subject} · {item.topic} · {item.typeLabel} · {item.marks} mark</div>
                    </div>
                    <span className="spacer" />
                    <Badge tone={item.aiGenerated ? "amber" : "green"}>{item.aiGenerated ? "AI" : "Manual"}</Badge>
                  </label>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn" onClick={() => setShowBankPicker(false)} type="button">Cancel</button>
              <button className="btn primary" onClick={importSelectedBankQuestions} type="button" disabled={!selectedBankIds.length}>Import Selected</button>
            </div>
          </div>
        </div>
      ) : null}

      <AiQuizAgentPanel
        open={showAiPanel}
        mode={initialAiState?.mode ?? "quiz-builder"}
        onClose={() => setShowAiPanel(false)}
        initialTopic={topic !== "General" ? topic : initialAiState?.topic}
        initialSubject={subject}
        initialDifficulty={initialAiState?.difficulty ?? difficulty}
        initialQuestionCount={initialAiState?.questionCount}
        initialTone={initialAiState?.tone}
        onInsertQuestions={handleInsertAiQuestions}
        onSaveQuestionsToBank={handleSaveAiQuestionsToBank}
      />
    </AppShell>
  );
}
