"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Sparkles, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { questionBankApi, quizApi } from "@/lib/apiClient";

const blankForm = {
  subject: "",
  topic: "",
  difficulty: "Easy",
  type: "MCQ_SINGLE",
  text: "",
  explanation: "",
  marks: 1,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false }
  ],
  aiGenerated: false
};

export default function QuestionBankPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [draftQuizzes, setDraftQuizzes] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: "", subject: "All", topic: "All", difficulty: "All", type: "All", source: "All" });
  const [editing, setEditing] = useState<any | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddToQuiz, setShowAddToQuiz] = useState<any | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState<string | null>(null);

  function loadData() {
    questionBankApi.list().then(setRows).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Failed to load question bank."));
    quizApi.list().then((items) => setDraftQuizzes(items.filter((item) => item.status === "Draft"))).catch(() => setDraftQuizzes([]));
  }

  useEffect(() => {
    loadData();
  }, []);

  const subjects = useMemo(() => ["All", ...new Set((rows ?? []).map((item) => item.subject))], [rows]);
  const topics = useMemo(() => ["All", ...new Set((rows ?? []).map((item) => item.topic))], [rows]);

  const filteredRows = useMemo(() => {
    return (rows ?? []).filter((item) => {
      const search = filters.search.trim().toLowerCase();
      if (search && ![item.text, item.topic, item.subject].some((value) => String(value).toLowerCase().includes(search))) return false;
      if (filters.subject !== "All" && item.subject !== filters.subject) return false;
      if (filters.topic !== "All" && item.topic !== filters.topic) return false;
      if (filters.difficulty !== "All" && item.difficulty !== filters.difficulty) return false;
      if (filters.type !== "All" && item.typeLabel !== filters.type) return false;
      if (filters.source === "AI Generated" && !item.aiGenerated) return false;
      if (filters.source === "Manual" && item.aiGenerated) return false;
      return true;
    });
  }, [filters, rows]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setShowForm(true);
  }

  function openEdit(item: any) {
    setEditing(item);
    setForm({
      subject: item.subject,
      topic: item.topic,
      difficulty: item.difficulty,
      type: item.type,
      text: item.text,
      explanation: item.explanation,
      marks: item.marks,
      options: item.options,
      aiGenerated: item.aiGenerated
    });
    setShowForm(true);
  }

  async function submitForm() {
    setError(null);
    try {
      if (editing) {
        await questionBankApi.update(editing.id, form);
      } else {
        await questionBankApi.create(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(blankForm);
      loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save question.");
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm("Delete this question bank item?")) return;
    await questionBankApi.remove(id);
    loadData();
  }

  async function duplicateItem(id: string) {
    await questionBankApi.duplicate(id);
    loadData();
  }

  async function addToQuiz() {
    if (!showAddToQuiz?.id || !selectedQuizId) return;
    await questionBankApi.addToQuiz(showAddToQuiz.id, selectedQuizId);
    setShowAddToQuiz(null);
    setSelectedQuizId("");
  }

  return (
    <AppShell title="Question Bank" subtitle="Build a reusable, searchable library of professor-approved questions.">
      <div className="content grid">
        <div className="section-head">
          <div>
            <h2>Reusable Question Library</h2>
            <p className="muted">Search, preview, edit, duplicate, and insert reusable questions into draft quizzes.</p>
          </div>
          <div className="toolbar-inline">
            <button className="btn primary" onClick={openCreate} type="button"><Plus size={17} />Add Question</button>
            <button className="btn" disabled type="button"><Upload size={17} />Import CSV/JSON</button>
            <button className="btn ghost" disabled type="button"><Sparkles size={17} />Generate with AI</button>
          </div>
        </div>

        {error ? <div className="notice">{error}</div> : null}

        <section className="card pad">
          <div className="toolbar-inline">
            <input className="input" placeholder="Search by question text or topic" value={filters.search} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} />
            <select className="select" value={filters.subject} onChange={(event) => setFilters((value) => ({ ...value, subject: event.target.value }))}>{subjects.map((value) => <option key={value}>{value}</option>)}</select>
            <select className="select" value={filters.topic} onChange={(event) => setFilters((value) => ({ ...value, topic: event.target.value }))}>{topics.map((value) => <option key={value}>{value}</option>)}</select>
            <select className="select" value={filters.difficulty} onChange={(event) => setFilters((value) => ({ ...value, difficulty: event.target.value }))}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
            <select className="select" value={filters.type} onChange={(event) => setFilters((value) => ({ ...value, type: event.target.value }))}><option>All</option><option>MCQ Single Answer</option><option>Multiple Answer</option><option>Short Answer</option><option>True/False</option></select>
            <select className="select" value={filters.source} onChange={(event) => setFilters((value) => ({ ...value, source: event.target.value }))}><option>All</option><option>Manual</option><option>AI Generated</option></select>
          </div>
        </section>

        {!rows ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <section className="card">
            <table className="table">
              <thead><tr><th>Question</th><th>Subject</th><th>Topic</th><th>Difficulty</th><th>Type</th><th>Marks</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredRows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.text}</strong>
                      <div className="muted small">{item.explanation || "No explanation added yet."}</div>
                    </td>
                    <td>{item.subject}</td>
                    <td>{item.topic}</td>
                    <td><Badge tone={item.difficulty === "Easy" ? "green" : item.difficulty === "Hard" ? "pink" : "amber"}>{item.difficulty}</Badge></td>
                    <td><Badge tone="blue">{item.typeLabel}</Badge></td>
                    <td>{item.marks}</td>
                    <td>{item.createdLabel}</td>
                    <td>
                      <div className="table-actions">
                        <button className="linkish" onClick={() => setPreview(item)} type="button">Preview</button>
                        <button className="linkish" onClick={() => openEdit(item)} type="button">Edit</button>
                        <button className="linkish" onClick={() => duplicateItem(item.id)} type="button">Duplicate</button>
                        <button className="linkish" onClick={() => setShowAddToQuiz(item)} type="button">Add to Quiz</button>
                        <button className="linkish" onClick={() => removeItem(item.id)} type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRows.length ? <div className="card pad" style={{ margin: 18 }}><strong>No questions match these filters.</strong><p className="muted">Try a broader search or add a new question to the bank.</p></div> : null}
          </section>
        )}
      </div>

      {showForm ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bank-form-title">
          <div className="modal-card pad grid">
            <div className="section-head">
              <h2 id="bank-form-title">{editing ? "Edit Question Bank Item" : "Add Question Bank Item"}</h2>
              <button className="btn" onClick={() => setShowForm(false)} type="button">Close</button>
            </div>
            <div className="grid grid-2">
              <label><strong>Subject</strong><input className="input" value={form.subject} onChange={(event) => setForm((value) => ({ ...value, subject: event.target.value }))} /></label>
              <label><strong>Topic</strong><input className="input" value={form.topic} onChange={(event) => setForm((value) => ({ ...value, topic: event.target.value }))} /></label>
              <label><strong>Difficulty</strong><select className="select" value={form.difficulty} onChange={(event) => setForm((value) => ({ ...value, difficulty: event.target.value }))}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
              <label><strong>Type</strong><select className="select" value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value }))}><option value="MCQ_SINGLE">MCQ Single Answer</option><option value="MCQ_MULTIPLE">Multiple Answer</option><option value="TRUE_FALSE">True/False</option><option value="SHORT_ANSWER">Short Answer</option></select></label>
            </div>
            <label><strong>Question Text</strong><textarea className="textarea" value={form.text} onChange={(event) => setForm((value) => ({ ...value, text: event.target.value }))} /></label>
            <label><strong>Explanation</strong><textarea className="textarea" value={form.explanation} onChange={(event) => setForm((value) => ({ ...value, explanation: event.target.value }))} /></label>
            <label><strong>Marks</strong><input className="input" type="number" value={form.marks} onChange={(event) => setForm((value) => ({ ...value, marks: Number(event.target.value) }))} /></label>
            <div className="grid">
              <strong>Options</strong>
              {form.options.map((option, index) => (
                <div className="option-row" key={index}>
                  <input type="radio" checked={option.isCorrect} onChange={() => setForm((value) => ({ ...value, options: value.options.map((item, optionIndex) => ({ ...item, isCorrect: optionIndex === index })) }))} />
                  <input className="input" value={option.text} onChange={(event) => setForm((value) => ({ ...value, options: value.options.map((item, optionIndex) => optionIndex === index ? { ...item, text: event.target.value } : item) }))} />
                </div>
              ))}
              <button className="linkish" onClick={() => setForm((value) => ({ ...value, options: [...value.options, { text: "", isCorrect: false }] }))} type="button">Add Option</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn" onClick={() => setShowForm(false)} type="button">Cancel</button>
              <button className="btn primary" onClick={submitForm} type="button">Save Question</button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bank-preview-title">
          <div className="modal-card pad grid">
            <div className="section-head">
              <h2 id="bank-preview-title">Question Preview</h2>
              <button className="btn" onClick={() => setPreview(null)} type="button">Close</button>
            </div>
            <div className="grid">
              <strong>{preview.text}</strong>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Badge>{preview.subject}</Badge>
                <Badge tone="blue">{preview.topic}</Badge>
                <Badge tone={preview.difficulty === "Easy" ? "green" : preview.difficulty === "Hard" ? "pink" : "amber"}>{preview.difficulty}</Badge>
              </div>
              <div className="grid">
                {preview.options.map((option: any) => (
                  <div className="row-item" key={option.text}>
                    <span>{option.text}</span>
                    <span className="spacer" />
                    {option.isCorrect ? <Badge tone="green">Correct</Badge> : null}
                  </div>
                ))}
              </div>
              <div className="soft-panel pad-sm"><strong>Explanation</strong><p className="muted small">{preview.explanation || "No explanation added."}</p></div>
            </div>
          </div>
        </div>
      ) : null}

      {showAddToQuiz ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-to-quiz-title">
          <div className="modal-card pad grid">
            <div className="section-head">
              <h2 id="add-to-quiz-title">Add to Draft Quiz</h2>
              <button className="btn" onClick={() => setShowAddToQuiz(null)} type="button">Close</button>
            </div>
            {draftQuizzes.length ? (
              <>
                <select className="select" value={selectedQuizId} onChange={(event) => setSelectedQuizId(event.target.value)}>
                  <option value="">Select a draft quiz</option>
                  {draftQuizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
                </select>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button className="btn" onClick={() => setShowAddToQuiz(null)} type="button">Cancel</button>
                  <button className="btn primary" onClick={addToQuiz} type="button" disabled={!selectedQuizId}>Add to Quiz</button>
                </div>
              </>
            ) : (
              <div className="grid">
                <div className="notice">No draft quizzes are available yet. Create one first, then return here to insert bank questions.</div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <a className="btn primary" href="/professor/create-quiz">Create Draft Quiz</a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
