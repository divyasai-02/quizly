import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Lock,
  PlayCircle,
  Trophy,
  Users
} from "lucide-react";

export const professor = {
  name: "Prof. John Doe",
  subject: "Computer Science",
  email: "johndoe@university.edu",
  initials: "PJ"
};

export const stats = [
  { label: "Classes", value: "6", hint: "Total classes", icon: ClipboardList, tone: "purple" },
  { label: "Active Quizzes", value: "12", hint: "Live quizzes", icon: PlayCircle, tone: "green" },
  { label: "Drafts", value: "4", hint: "Unpublished", icon: FileQuestion, tone: "amber" },
  { label: "Completed", value: "18", hint: "Finished quizzes", icon: CheckCircle2, tone: "blue" },
  { label: "Closed Quizzes", value: "5", hint: "Archived quizzes", icon: Lock, tone: "pink" }
];

export const classes = [
  { code: "CS", name: "Computer Science 101", students: 48, quizzes: 8, activity: "2 days ago" },
  { code: "DS", name: "Data Structures", students: 36, quizzes: 6, activity: "5 days ago" },
  { code: "WD", name: "Web Development", students: 42, quizzes: 7, activity: "1 day ago" },
  { code: "DB", name: "Database Systems", students: 31, quizzes: 5, activity: "1 week ago" }
];

export const quizzes = [
  { id: "javascript-basics", name: "JavaScript Basics Quiz", className: "Web Development", questions: 20, duration: 15, status: "Scheduled", created: "May 19, 2024", icon: BookOpen },
  { id: "arrays-linked-lists", name: "Arrays and Linked Lists", className: "Data Structures", questions: 20, duration: 15, status: "Live", created: "May 21, 2024", icon: ClipboardList },
  { id: "oop-concepts", name: "OOP Concepts", className: "Computer Science 101", questions: 25, duration: 20, status: "Live", created: "May 18, 2024", icon: FileQuestion },
  { id: "sql-fundamentals", name: "SQL Fundamentals", className: "Database Systems", questions: 20, duration: 18, status: "Live", created: "May 17, 2024", icon: GraduationCap },
  { id: "recursion-quiz", name: "Recursion Quiz", className: "Computer Science 101", questions: 20, duration: 15, status: "Draft", created: "May 20, 2024", icon: BarChart3 }
];

export const quickActions = ["Create New Quiz", "Import Questions", "Question Bank", "Template Library"];

export const learners = [
  { rank: 1, name: "Arjun Mehta", tag: "Code Master", className: "CSE - A", xp: 9850, accuracy: 94, streak: 14, initials: "AM" },
  { rank: 2, name: "Diya Sharma", tag: "Logic Legend", className: "CSE - D", xp: 8610, accuracy: 91, streak: 13, initials: "DS" },
  { rank: 3, name: "Rohit Verma", tag: "Quick Thinker", className: "CSE - A", xp: 7420, accuracy: 90, streak: 12, initials: "RV" },
  { rank: 4, name: "Sneha Iyer", tag: "Problem Solver", className: "CSE - B", xp: 6250, accuracy: 92, streak: 12, initials: "SI" },
  { rank: 5, name: "Karan Patel", tag: "Quiz Wizard", className: "CSE - A", xp: 5980, accuracy: 89, streak: 9, initials: "KP" },
  { rank: 6, name: "Ananya Joshi", tag: "Brainiac", className: "CSE - C", xp: 5210, accuracy: 86, streak: 7, initials: "AJ" },
  { rank: 7, name: "Arjun Mehta (You)", tag: "Code Explorer", className: "CSE - A", xp: 4850, accuracy: 82, streak: 6, initials: "AM", current: true },
  { rank: 8, name: "Aditya Singh", tag: "Consistent", className: "CSE - E", xp: 4120, accuracy: 78, streak: 5, initials: "AS" },
  { rank: 9, name: "Meera Nair", tag: "Concept King", className: "CSE - F", xp: 3750, accuracy: 75, streak: 4, initials: "MN" },
  { rank: 10, name: "Vivaan Gupta", tag: "Rising Star", className: "CSE - B", xp: 3210, accuracy: 72, streak: 3, initials: "VG" }
];

export const analyticsClasses = [
  { name: "CSE - A", students: 72, score: 78, accuracy: 82, engagement: "High", tone: "purple" },
  { name: "CSE - B", students: 68, score: 65, accuracy: 68, engagement: "Medium", tone: "blue" },
  { name: "CSE - C", students: 70, score: 54, accuracy: 56, engagement: "Low", tone: "pink" },
  { name: "CSE - D", students: 63, score: 71, accuracy: 74, engagement: "High", tone: "green" },
  { name: "CSE - E", students: 61, score: 62, accuracy: 65, engagement: "Medium", tone: "amber" },
  { name: "CSE - F", students: 58, score: 48, accuracy: 51, engagement: "Low", tone: "purple" }
];

export const questionAnalysis = [
  { question: "Q1. JavaScript Output", correct: 82, incorrect: 18, time: "45 sec", difficulty: "Easy" },
  { question: "Q2. Variables in JS", correct: 71, incorrect: 29, time: "52 sec", difficulty: "Medium" },
  { question: "Q3. Functions", correct: 65, incorrect: 35, time: "68 sec", difficulty: "Medium" },
  { question: "Q4. Arrays", correct: 48, incorrect: 52, time: "74 sec", difficulty: "Hard" },
  { question: "Q5. Objects", correct: 32, incorrect: 68, time: "89 sec", difficulty: "Hard" }
];

export type QuizQuestion = {
  id: number | string;
  type: "MCQ Single Answer" | "Multiple Answer" | "Short Answer" | "True/False";
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  marks: number;
  negativeMarks: number;
  minutes: number;
  seconds: number;
  required: boolean;
  shuffle: boolean;
  sourceLabel?: "Manual" | "Question Bank" | "Template" | "AI Drafted";
};

export const sampleQuestions: QuizQuestion[] = [
  {
    id: 1,
    type: "MCQ Single Answer",
    text: "What is the output of console.log(typeof []) in JavaScript?",
    options: ["object", "array", "undefined", "function"],
    correct: 0,
    explanation: "In JavaScript, arrays are a special type of object. Therefore, typeof [] returns object.",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: "Manual"
  },
  {
    id: 2,
    type: "MCQ Single Answer",
    text: "Which company developed JavaScript?",
    options: ["Netscape", "Microsoft", "Sun Microsystems", "Oracle"],
    correct: 0,
    explanation: "JavaScript was created at Netscape by Brendan Eich.",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: "Manual"
  },
  {
    id: 3,
    type: "MCQ Single Answer",
    text: "What is the correct way to declare a variable in modern JavaScript?",
    options: ["var myVar = 10;", "let myVar = 10;", "const myVar = 10;", "All of the above"],
    correct: 3,
    explanation: "All are valid declarations, though let and const are preferred in modern code.",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: "Manual"
  },
  {
    id: 4,
    type: "MCQ Single Answer",
    text: "What is the purpose of the use strict directive in JavaScript?",
    options: ["Adds CSS", "Enables stricter parsing", "Creates arrays", "Runs code faster only"],
    correct: 1,
    explanation: "Strict mode catches common mistakes and prevents some unsafe actions.",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: "Manual"
  }
];

export const questionBank = [
  { topic: "JavaScript Output", type: "MCQ", difficulty: "Easy", used: 12 },
  { topic: "Array Methods", type: "MCQ", difficulty: "Medium", used: 9 },
  { topic: "Database Normalization", type: "Short Answer", difficulty: "Hard", used: 6 },
  { topic: "Operating Systems", type: "True/False", difficulty: "Medium", used: 8 }
];

export const templates = [
  { name: "Weekly Coding Check", questions: 15, duration: 20, subject: "Programming" },
  { name: "Unit Test Blueprint", questions: 25, duration: 40, subject: "Computer Science" },
  { name: "Rapid Revision Quiz", questions: 10, duration: 8, subject: "Any Subject" }
];
