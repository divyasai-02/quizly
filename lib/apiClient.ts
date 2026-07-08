import type { QuizQuestion } from "@/data/mockData";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const dashboardApi = {
  summary: () => request<{ stats: Array<{ label: string; value: string; hint: string; tone: string }>; classes: any[]; quizzes: any[] }>("/api/dashboard/summary")
};

export const classApi = {
  list: () => request<any[]>("/api/classes"),
  create: (data: { name: string; subject?: string; section?: string }) => request("/api/classes", { method: "POST", body: JSON.stringify(data) })
};

export const quizApi = {
  list: () => request<any[]>("/api/quizzes"),
  get: (id: string) => request<any>(`/api/quizzes/${id}`),
  create: (data: { title?: string; description?: string; subject?: string; topic?: string; difficulty?: string; questions: QuizQuestion[]; aiGenerated?: boolean; aiPrompt?: string }) =>
    request<any>("/api/quizzes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; description?: string; subject?: string; topic?: string; difficulty?: string; questions: QuizQuestion[] }) =>
    request<any>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  publish: (id: string) => request<any>(`/api/quizzes/${id}/publish`, { method: "POST" }),
  close: (id: string) => request<any>(`/api/quizzes/${id}/close`, { method: "POST" }),
  remove: (id: string) => request<any>(`/api/quizzes/${id}`, { method: "DELETE" }),
  instructions: (id: string) => request<any>(`/api/quizzes/${id}/instructions`)
};

export const attemptApi = {
  start: (quizId: string) => request<any>(`/api/quizzes/${quizId}/start`, { method: "POST" }),
  get: (attemptId: string) => request<any>(`/api/attempts/${attemptId}`),
  saveAnswers: (attemptId: string, answers: any[]) => request(`/api/attempts/${attemptId}/answers`, { method: "PUT", body: JSON.stringify({ answers }) }),
  submit: (attemptId: string, answers: any[], autoSubmitted = false) =>
    request<any>(`/api/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers, autoSubmitted }) }),
  results: (attemptId: string) => request<any>(`/api/attempts/${attemptId}/results`)
};

export const analyticsApi = {
  overview: () => request<any>("/api/analytics/overview")
};

export const leaderboardApi = {
  list: () => request<{ learners: any[] }>("/api/leaderboard")
};

export const questionBankApi = {
  list: () => request<any[]>("/api/question-bank"),
  get: (id: string) => request<any>(`/api/question-bank/${id}`),
  create: (data: any) => request<any>("/api/question-bank", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/question-bank/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<any>(`/api/question-bank/${id}`, { method: "DELETE" }),
  duplicate: (id: string) => request<any>(`/api/question-bank/${id}/duplicate`, { method: "POST" }),
  addToQuiz: (id: string, quizId: string) => request<any>(`/api/question-bank/${id}/add-to-quiz`, { method: "POST", body: JSON.stringify({ quizId }) })
};

export const templateApi = {
  list: () => request<{ templates: any[] }>("/api/templates"),
  get: (id: string) => request<{ template: any }>(`/api/templates/${id}`),
  createQuiz: (id: string) => request<{ id: string; redirectTo: string }>(`/api/templates/${id}/create-quiz`, { method: "POST" })
};

export const aiApi = {
  generateQuiz: (data: { prompt?: string; topic?: string; count?: number }) =>
    request<{ title: string; questions: QuizQuestion[] }>("/api/ai/generate-quiz", { method: "POST", body: JSON.stringify(data) }),
  improveQuestion: (text: string) => request<{ text: string; rationale: string }>("/api/ai/improve-question", { method: "POST", body: JSON.stringify({ text }) }),
  generateExplanation: (question: string, answer: string) =>
    request<{ explanation: string }>("/api/ai/generate-explanation", { method: "POST", body: JSON.stringify({ question, answer }) })
};
