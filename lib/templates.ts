import type { QuestionBankInput } from "@/lib/questionBank";

export type QuizTemplate = {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  estimatedDuration: number;
  questionCount: number;
  tags: string[];
  description: string;
  questions: QuestionBankInput[];
};

const mcq = (text: string, explanation: string, options: Array<{ text: string; isCorrect: boolean }>, extras?: Partial<QuestionBankInput>): QuestionBankInput => ({
  type: "MCQ_SINGLE",
  text,
  explanation,
  marks: extras?.marks ?? 1,
  subject: extras?.subject,
  topic: extras?.topic,
  difficulty: extras?.difficulty,
  aiGenerated: false,
  options
});

const tf = (text: string, explanation: string, correct: boolean, extras?: Partial<QuestionBankInput>): QuestionBankInput => ({
  type: "TRUE_FALSE",
  text,
  explanation,
  marks: extras?.marks ?? 1,
  subject: extras?.subject,
  topic: extras?.topic,
  difficulty: extras?.difficulty,
  aiGenerated: false,
  options: [
    { text: "True", isCorrect: correct },
    { text: "False", isCorrect: !correct }
  ]
});

export const quizTemplates: QuizTemplate[] = [
  {
    id: "java-basics-10",
    title: "Java Basics 10-question quiz",
    subject: "Java",
    difficulty: "Easy",
    estimatedDuration: 15,
    questionCount: 10,
    tags: ["Core", "OOP", "Syntax"],
    description: "A lightweight fundamentals check for Java syntax, classes, and core OOP concepts.",
    questions: [
      mcq("Which keyword is used to inherit a class in Java?", "Java uses extends for class inheritance.", [{ text: "inherits", isCorrect: false }, { text: "extends", isCorrect: true }, { text: "implements", isCorrect: false }, { text: "super", isCorrect: false }], { subject: "Java", topic: "Inheritance", difficulty: "Easy" }),
      mcq("Which method is the entry point of a Java application?", "The JVM starts with main.", [{ text: "run()", isCorrect: false }, { text: "start()", isCorrect: false }, { text: "main()", isCorrect: true }, { text: "init()", isCorrect: false }], { subject: "Java", topic: "Basics", difficulty: "Easy" }),
      tf("A Java interface can contain default methods.", "Interfaces may contain default methods.", true, { subject: "Java", topic: "Interfaces", difficulty: "Medium" })
    ]
  },
  {
    id: "dbms-fundamentals-template",
    title: "DBMS Fundamentals",
    subject: "DBMS",
    difficulty: "Medium",
    estimatedDuration: 18,
    questionCount: 12,
    tags: ["Normalization", "SQL", "Keys"],
    description: "Useful for checking schema design, SQL understanding, and relational fundamentals.",
    questions: [
      mcq("Which key uniquely identifies a row in a table?", "Primary keys uniquely identify rows.", [{ text: "Foreign key", isCorrect: false }, { text: "Primary key", isCorrect: true }, { text: "Candidate relation", isCorrect: false }, { text: "Composite schema", isCorrect: false }], { subject: "DBMS", topic: "Keys", difficulty: "Easy" }),
      mcq("Which normal form removes transitive dependency?", "3NF removes transitive dependency.", [{ text: "1NF", isCorrect: false }, { text: "2NF", isCorrect: false }, { text: "3NF", isCorrect: true }, { text: "4NF", isCorrect: false }], { subject: "DBMS", topic: "Normalization", difficulty: "Medium" }),
      tf("BCNF is stricter than 3NF.", "BCNF is a stronger version of 3NF.", true, { subject: "DBMS", topic: "Normalization", difficulty: "Medium" })
    ]
  },
  {
    id: "os-concepts",
    title: "OS Concepts",
    subject: "OS",
    difficulty: "Medium",
    estimatedDuration: 20,
    questionCount: 12,
    tags: ["Scheduling", "Memory", "Deadlock"],
    description: "Covers process scheduling, synchronization, and memory management.",
    questions: [
      mcq("Round Robin scheduling is associated with which concept?", "Round Robin uses time quantum.", [{ text: "Stack frame", isCorrect: false }, { text: "Time quantum", isCorrect: true }, { text: "Cache locality", isCorrect: false }, { text: "Page fault", isCorrect: false }], { subject: "OS", topic: "Scheduling", difficulty: "Easy" }),
      tf("Deadlock requires circular wait as one of its conditions.", "Circular wait is one of Coffman's conditions.", true, { subject: "OS", topic: "Deadlock", difficulty: "Medium" })
    ]
  },
  {
    id: "computer-networks",
    title: "Computer Networks",
    subject: "CN",
    difficulty: "Medium",
    estimatedDuration: 18,
    questionCount: 10,
    tags: ["OSI", "TCP/IP", "Routing"],
    description: "A compact networking assessment for transport, OSI, and basic routing concepts.",
    questions: [
      mcq("How many layers are there in the OSI model?", "The OSI model has seven layers.", [{ text: "5", isCorrect: false }, { text: "6", isCorrect: false }, { text: "7", isCorrect: true }, { text: "8", isCorrect: false }], { subject: "CN", topic: "OSI Model", difficulty: "Easy" }),
      tf("TCP is connection-oriented.", "TCP establishes and maintains a connection.", true, { subject: "CN", topic: "Transport Layer", difficulty: "Easy" })
    ]
  },
  {
    id: "aptitude-practice",
    title: "Aptitude Practice",
    subject: "Aptitude",
    difficulty: "Easy",
    estimatedDuration: 12,
    questionCount: 10,
    tags: ["Quant", "Speed", "Revision"],
    description: "Short placement-style aptitude practice with percentages, ratios, and number logic.",
    questions: [
      mcq("What is 25% of 240?", "25 percent of 240 is 60.", [{ text: "40", isCorrect: false }, { text: "50", isCorrect: false }, { text: "60", isCorrect: true }, { text: "70", isCorrect: false }], { subject: "Aptitude", topic: "Percentages", difficulty: "Easy" }),
      mcq("Simplify the ratio 24:36.", "24:36 simplifies to 2:3.", [{ text: "2:3", isCorrect: true }, { text: "3:4", isCorrect: false }, { text: "4:5", isCorrect: false }, { text: "1:2", isCorrect: false }], { subject: "Aptitude", topic: "Ratio", difficulty: "Easy" })
    ]
  },
  {
    id: "mixed-placement-readiness",
    title: "Mixed Placement Readiness",
    subject: "Mixed",
    difficulty: "Medium",
    estimatedDuration: 25,
    questionCount: 15,
    tags: ["Mixed", "Placement", "Readiness"],
    description: "A mixed drill spanning aptitude, DBMS, OS, and networking for placement prep.",
    questions: [
      mcq("Which SQL clause is used to filter grouped records?", "HAVING filters grouped rows.", [{ text: "WHERE", isCorrect: false }, { text: "HAVING", isCorrect: true }, { text: "ORDER BY", isCorrect: false }, { text: "LIMIT", isCorrect: false }], { subject: "DBMS", topic: "SQL", difficulty: "Medium" }),
      mcq("Which protocol translates domain names to IP addresses?", "DNS resolves names to IP addresses.", [{ text: "HTTP", isCorrect: false }, { text: "FTP", isCorrect: false }, { text: "DNS", isCorrect: true }, { text: "SSH", isCorrect: false }], { subject: "CN", topic: "DNS", difficulty: "Easy" })
    ]
  },
  {
    id: "quick-revision-quiz",
    title: "Quick Revision Quiz",
    subject: "Mixed",
    difficulty: "Easy",
    estimatedDuration: 8,
    questionCount: 6,
    tags: ["Revision", "Fast", "Daily"],
    description: "A short-form rapid recap template designed for daily revision moments.",
    questions: [
      tf("A foreign key can reference a primary key in another table.", "Foreign keys reference keys in another table.", true, { subject: "DBMS", topic: "Keys", difficulty: "Easy" }),
      tf("HTTP is a transport layer protocol.", "HTTP is an application layer protocol.", false, { subject: "CN", topic: "Application Layer", difficulty: "Easy" })
    ]
  },
  {
    id: "chapter-end-assessment",
    title: "Chapter-End Assessment",
    subject: "Computer Science",
    difficulty: "Hard",
    estimatedDuration: 30,
    questionCount: 20,
    tags: ["Assessment", "Summative", "Chapter"],
    description: "A longer assessment structure meant for end-of-unit validation and revision planning.",
    questions: [
      mcq("Which memory management technique suffers from external fragmentation?", "Variable-sized contiguous allocation can lead to external fragmentation.", [{ text: "Paging", isCorrect: false }, { text: "Segmentation", isCorrect: true }, { text: "Demand loading", isCorrect: false }, { text: "Spooling", isCorrect: false }], { subject: "OS", topic: "Memory Management", difficulty: "Hard" }),
      mcq("Which join returns all matching rows plus unmatched rows from both tables?", "Full outer join returns matches and non-matches from both sides.", [{ text: "Inner join", isCorrect: false }, { text: "Left join", isCorrect: false }, { text: "Right join", isCorrect: false }, { text: "Full outer join", isCorrect: true }], { subject: "DBMS", topic: "SQL Joins", difficulty: "Hard" })
    ]
  }
];

export function listTemplates() {
  return quizTemplates.map((template) => ({
    id: template.id,
    title: template.title,
    subject: template.subject,
    difficulty: template.difficulty,
    estimatedDuration: template.estimatedDuration,
    questionCount: template.questionCount,
    tags: template.tags,
    description: template.description
  }));
}

export function getTemplateById(id: string) {
  return quizTemplates.find((template) => template.id === id) ?? null;
}

export function buildTemplateQuizData(template: QuizTemplate, professorId: string) {
  return {
    title: template.title,
    description: template.description,
    subject: template.subject,
    topic: template.tags[0] ?? "General",
    difficulty: template.difficulty,
    professorId,
    timeLimitMinutes: template.estimatedDuration,
    totalMarks: template.questions.reduce((sum, question) => sum + (question.marks ?? 1), 0),
    passingMarks: Math.max(1, Math.ceil(template.questions.length / 2)),
    aiGenerated: false,
    aiPrompt: `Created from template: ${template.title}`,
    questions: {
      create: template.questions.map((question, orderIndex) => ({
        type: question.type as any,
        text: question.text!,
        explanation: question.explanation,
        marks: question.marks ?? 1,
        negativeMarks: 0,
        timeLimitSeconds: 60,
        required: true,
        shuffleOptions: false,
        orderIndex,
        aiGenerated: false,
        sourceLabel: "Template",
        difficulty: question.difficulty ?? template.difficulty,
        topicTag: question.topic ?? template.tags[0] ?? "General",
        options: {
          create: (question.options ?? []).map((option, index) => ({
            text: option.text!,
            isCorrect: !!option.isCorrect,
            orderIndex: index
          }))
        }
      }))
    }
  };
}
