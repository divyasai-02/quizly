import type { QuizQuestion } from "@/data/mockData";
import type { NotificationItem, NotificationListResponse } from "@/lib/notificationTypes";
import type {
  AiAgentMode,
  AiBloomLevel,
  AiDifficulty,
  AiDraftQuestion,
  AiExplanationOutput,
  AiUploadedMaterialMetadata,
  ParsedMaterialResult,
  AiQuestionImprovementOutput,
  AiQuestionType,
  AiQuizGenerationOutput,
  AiTone
} from "@/lib/services/aiQuizGenerationService";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
  create: (data: { name: string; subject?: string; section?: string }) => request<any>("/api/classes", { method: "POST", body: JSON.stringify(data) })
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
  duplicate: (id: string) => request<any>(`/api/quizzes/${id}/duplicate`, { method: "POST" }),
  remove: (id: string) => request<any>(`/api/quizzes/${id}`, { method: "DELETE" }),
  instructions: (id: string) => request<any>(`/api/quizzes/${id}/instructions`)
};

export const attemptApi = {
  start: (quizId: string) => request<any>(`/api/quizzes/${quizId}/start`, { method: "POST" }),
  get: (attemptId: string) => request<any>(`/api/attempts/${attemptId}`),
  review: (attemptId: string) => request<any>(`/api/attempts/${attemptId}/review`),
  saveAnswers: (attemptId: string, answers: any[]) => request(`/api/attempts/${attemptId}/answers`, { method: "PUT", body: JSON.stringify({ answers }) }),
  submit: (attemptId: string, answers: any[], autoSubmitted = false) =>
    request<any>(`/api/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers, autoSubmitted }) }),
  results: (attemptId: string) => request<any>(`/api/attempts/${attemptId}/results`)
};

export const studentApi = {
  dashboard: () => request<any>("/api/student/dashboard"),
  learningSummary: () => request<any>("/api/student/learning-summary"),
  attempts: () => request<any[]>("/api/student/attempts"),
  studyRoom: () => request<any>("/api/student/study-room"),
  practice: (topic: string) => request<any>(`/api/student/practice?topic=${encodeURIComponent(topic)}`),
  submitPractice: (questions: any[], answers: Array<{ questionId: string; selectedOptionIds?: string[] }>) =>
    request<any>("/api/student/practice/submit", { method: "POST", body: JSON.stringify({ questions, answers }) })
};

export const analyticsApi = {
  overview: () => request<any>("/api/analytics/overview")
};

export const reportsApi = {
  summary: (params = "") => request<any>(`/api/reports/summary${params}`),
  quizResults: (params = "") => request<any>(`/api/reports/quiz-results${params}`),
  studentProgress: (params = "") => request<any>(`/api/reports/student-progress${params}`),
  questionDifficulty: (params = "") => request<any>(`/api/reports/question-difficulty${params}`)
};

export const leaderboardApi = {
  list: () => request<{ learners: any[] }>("/api/leaderboard")
};

export const questionBankApi = {
  list: () => request<any[]>("/api/question-bank"),
  get: (id: string) => request<any>(`/api/question-bank/${id}`),
  create: (data: any) => request<any>("/api/question-bank", { method: "POST", body: JSON.stringify(data) }),
  importFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ imported: number; items: any[] }>("/api/question-bank/import", { method: "POST", body: formData });
  },
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

export const adminApi = {
  summary: () => request<any>("/api/admin/summary"),
  users: () => request<any>("/api/admin/users"),
  updateUser: (id: string, data: { action: "changeRole" | "deactivate" | "reactivate"; role?: string }) =>
    request<any>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  classes: () => request<any>("/api/admin/classes"),
  updateClass: (id: string, data: { name?: string; subject?: string; section?: string; professorId?: string }) =>
    request<any>(`/api/admin/classes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  subjects: () => request<any>("/api/admin/subjects"),
  updateSubject: (subject: string, data: { action: "rename" | "merge"; targetSubject?: string }) =>
    request<any>(`/api/admin/subjects/${encodeURIComponent(subject)}`, { method: "PATCH", body: JSON.stringify(data) }),
  aiGenerations: () => request<any>("/api/admin/ai-generations"),
  updateAiGeneration: (id: string, data: { action: "approve" | "flag" | "hide" | "restore"; note?: string }) =>
    request<any>(`/api/admin/ai-generations/${id}`, { method: "PATCH", body: JSON.stringify(data) })
};

export const notificationsApi = {
  list: (limit?: number) => request<NotificationListResponse>(`/api/notifications${limit ? `?limit=${limit}` : ""}`),
  markRead: (id: string) => request<NotificationItem>(`/api/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request<NotificationListResponse>("/api/notifications/read-all", { method: "POST" })
};

export const aiApi = {
  parseMaterial: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ParsedMaterialResult>("/api/ai/parse-material", { method: "POST", body: formData });
  },
  generateQuiz: (data: {
    mode: AiAgentMode;
    topic?: string;
    pastedNotes?: string;
    materialText?: string;
    materialMetadata?: AiUploadedMaterialMetadata;
    subject?: string;
    classId?: string;
    questionCount?: number;
    questionTypes?: AiQuestionType[];
    difficulty?: AiDifficulty;
    bloomLevel?: AiBloomLevel;
    marksPerQuestion?: number;
    negativeMarking?: boolean;
    tone?: AiTone;
    avoidQuestionBankDuplicates?: boolean;
  }) =>
    request<AiQuizGenerationOutput>("/api/ai/generate-quiz", { method: "POST", body: JSON.stringify(data) }),
  regenerateQuestion: (data: {
    mode: AiAgentMode;
    topic?: string;
    pastedNotes?: string;
    materialText?: string;
    materialMetadata?: AiUploadedMaterialMetadata;
    subject?: string;
    classId?: string;
    questionCount?: number;
    questionTypes?: AiQuestionType[];
    difficulty?: AiDifficulty;
    bloomLevel?: AiBloomLevel;
    marksPerQuestion?: number;
    negativeMarking?: boolean;
    tone?: AiTone;
    avoidQuestionBankDuplicates?: boolean;
    questionIndex?: number;
  }) =>
    request<AiDraftQuestion>("/api/ai/regenerate-question", { method: "POST", body: JSON.stringify(data) }),
  generateRemedialQuiz: (data: {
    topic?: string;
    pastedNotes?: string;
    materialText?: string;
    materialMetadata?: AiUploadedMaterialMetadata;
    subject?: string;
    classId?: string;
    questionCount?: number;
    questionTypes?: AiQuestionType[];
    difficulty?: AiDifficulty;
    bloomLevel?: AiBloomLevel;
    marksPerQuestion?: number;
    negativeMarking?: boolean;
    tone?: AiTone;
    avoidQuestionBankDuplicates?: boolean;
  }) =>
    request<AiQuizGenerationOutput>("/api/ai/generate-remedial-quiz", { method: "POST", body: JSON.stringify(data) }),
  improveQuestion: (text: string, tone?: AiTone) =>
    request<AiQuestionImprovementOutput>("/api/ai/improve-question", { method: "POST", body: JSON.stringify({ text, tone }) }),
  generateExplanation: (question: string, answer: string) =>
    request<AiExplanationOutput>("/api/ai/generate-explanation", { method: "POST", body: JSON.stringify({ question, answer }) })
};
