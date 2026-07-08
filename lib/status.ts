export type QuizStatusValue = "DRAFT" | "PUBLISHED" | "CLOSED" | "Draft" | "Live" | "Closed" | string;

export function quizStatusLabel(status: QuizStatusValue) {
  switch (status) {
    case "PUBLISHED":
    case "Live":
      return "Live";
    case "CLOSED":
    case "Closed":
      return "Closed";
    case "DRAFT":
    case "Draft":
    default:
      return "Draft";
  }
}

export function quizStatusTone(status: QuizStatusValue) {
  const label = quizStatusLabel(status);
  if (label === "Live") return "green";
  if (label === "Closed") return "pink";
  return "amber";
}

export function isLiveQuiz(status: QuizStatusValue) {
  return quizStatusLabel(status) === "Live";
}
