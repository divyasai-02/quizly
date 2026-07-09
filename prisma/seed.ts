import { PrismaClient, QuestionType, QuizStatus, UserRole, AttemptStatus, AIInsightType } from "@prisma/client";

const prisma = new PrismaClient();

const professorId = "prof-john";
const studentIds = ["student-arjun", "student-diya", "student-rohit"];

type SeedQuestion = {
  text: string;
  explanation: string;
  options: string[];
  correct: number[];
  type?: QuestionType;
  topicTag?: string;
  difficulty?: string;
};

const quizFixtures: Array<{
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  difficulty: string;
  timeLimitMinutes: number;
  passingMarks: number;
  status: QuizStatus;
  questions: SeedQuestion[];
}> = [
  {
    id: "javascript-basics",
    title: "JavaScript Basics Quiz",
    description: "This quiz will test your knowledge on the basics of JavaScript programming.",
    subject: "Web Development",
    topic: "JavaScript",
    difficulty: "Easy",
    timeLimitMinutes: 15,
    passingMarks: 2,
    status: QuizStatus.PUBLISHED,
    questions: [
      {
        text: "What is the output of console.log(typeof []) in JavaScript?",
        explanation: "In JavaScript, arrays are a special type of object. Therefore, typeof [] returns object.",
        options: ["object", "array", "undefined", "function"],
        correct: [0],
        topicTag: "Type checking"
      },
      {
        text: "Which company developed JavaScript?",
        explanation: "JavaScript was created at Netscape by Brendan Eich.",
        options: ["Netscape", "Microsoft", "Sun Microsystems", "Oracle"],
        correct: [0],
        topicTag: "History"
      },
      {
        text: "What is the correct way to declare a variable in modern JavaScript?",
        explanation: "All are valid declarations, though let and const are preferred in modern code.",
        options: ["var myVar = 10;", "let myVar = 10;", "const myVar = 10;", "All of the above"],
        correct: [3],
        topicTag: "Declarations"
      },
      {
        text: "What is the purpose of the use strict directive in JavaScript?",
        explanation: "Strict mode catches common mistakes and prevents some unsafe actions.",
        options: ["Adds CSS", "Enables stricter parsing", "Creates arrays", "Runs code faster only"],
        correct: [1],
        topicTag: "Strict mode"
      }
    ]
  },
  {
    id: "dbms-fundamentals",
    title: "DBMS Fundamentals",
    description: "Core database concepts for quick revision.",
    subject: "Database Systems",
    topic: "DBMS",
    difficulty: "Medium",
    timeLimitMinutes: 18,
    passingMarks: 1,
    status: QuizStatus.PUBLISHED,
    questions: [
      { text: "Which normal form removes partial dependency?", explanation: "Second normal form removes partial dependency.", options: ["1NF", "2NF", "3NF", "BCNF"], correct: [1], topicTag: "Normalization" },
      { text: "SQL stands for?", explanation: "SQL means Structured Query Language.", options: ["Structured Query Language", "Simple Query Logic", "System Query Language", "Sequential Query Link"], correct: [0], topicTag: "SQL Basics" }
    ]
  },
  {
    id: "operating-systems",
    title: "Operating Systems Quiz",
    description: "Processes, memory, and scheduling basics.",
    subject: "Computer Science",
    topic: "Operating Systems",
    difficulty: "Medium",
    timeLimitMinutes: 20,
    passingMarks: 1,
    status: QuizStatus.PUBLISHED,
    questions: [
      { text: "Round Robin scheduling is best known for using what?", explanation: "Round Robin uses a fixed time quantum.", options: ["Priority queue", "Time quantum", "Shortest burst", "Disk blocks"], correct: [1], topicTag: "Scheduling" },
      { text: "A deadlock needs mutual exclusion.", explanation: "Mutual exclusion is one Coffman condition.", options: ["True", "False"], correct: [0], type: QuestionType.TRUE_FALSE, topicTag: "Deadlocks" }
    ]
  },
  {
    id: "aptitude-draft",
    title: "Aptitude Practice Set",
    description: "Quantitative aptitude warm-up.",
    subject: "Aptitude",
    topic: "Numbers",
    difficulty: "Easy",
    timeLimitMinutes: 10,
    passingMarks: 1,
    status: QuizStatus.DRAFT,
    questions: [
      { text: "What is 15% of 200?", explanation: "15 percent of 200 is 30.", options: ["20", "25", "30", "35"], correct: [2], topicTag: "Percentages" }
    ]
  }
];

async function main() {
  await prisma.attemptSelectedOption.deleteMany();
  await prisma.attemptAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.questionBankItem.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.classroomStudent.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { id: professorId, name: "Prof. John Doe", email: "johndoe@university.edu", passwordHash: "demo-auth-placeholder", role: UserRole.PROFESSOR },
      { id: "student-arjun", name: "Arjun Mehta", email: "arjun@student.edu", passwordHash: "demo-auth-placeholder", role: UserRole.STUDENT },
      { id: "student-diya", name: "Diya Sharma", email: "diya@student.edu", passwordHash: "demo-auth-placeholder", role: UserRole.STUDENT },
      { id: "student-rohit", name: "Rohit Verma", email: "rohit@student.edu", passwordHash: "demo-auth-placeholder", role: UserRole.STUDENT },
      { id: "admin-demo", name: "Admin", email: "admin@quizly.test", passwordHash: "demo-auth-placeholder", role: UserRole.ADMIN }
    ]
  });

  const cse = await prisma.classroom.create({
    data: { id: "class-cse-a", name: "CSE - A", subject: "Computer Science", section: "A", professorId, joinCode: "CSEA24" }
  });
  const web = await prisma.classroom.create({
    data: { id: "class-web", name: "Web Development", subject: "Web Development", section: "WD", professorId, joinCode: "WEB24" }
  });

  await prisma.classroomStudent.createMany({
    data: studentIds.flatMap((studentId) => [
      { classroomId: cse.id, studentId },
      { classroomId: web.id, studentId }
    ])
  });

  for (const fixture of quizFixtures) {
    const quiz = await prisma.quiz.create({
      data: {
        id: fixture.id,
        title: fixture.title,
        description: fixture.description,
        subject: fixture.subject,
        topic: fixture.topic,
        difficulty: fixture.difficulty,
        status: fixture.status,
        professorId,
        classroomId: fixture.subject === "Web Development" ? web.id : cse.id,
        timeLimitMinutes: fixture.timeLimitMinutes,
        passingMarks: fixture.passingMarks,
        totalMarks: fixture.questions.length,
        aiGenerated: fixture.id === "aptitude-draft",
        aiPrompt: fixture.id === "aptitude-draft" ? "Generate aptitude practice questions" : null,
        publishedAt: fixture.status === QuizStatus.PUBLISHED ? new Date() : null
      }
    });

    for (const [orderIndex, question] of fixture.questions.entries()) {
      await prisma.question.create({
        data: {
          quizId: quiz.id,
          type: question.type ?? QuestionType.MCQ_SINGLE,
          text: question.text,
          explanation: question.explanation,
          marks: 1,
          negativeMarks: 0,
          timeLimitSeconds: 60,
          required: true,
          shuffleOptions: false,
          orderIndex,
          difficulty: question.difficulty ?? fixture.difficulty,
          topicTag: question.topicTag ?? fixture.topic,
          options: {
            create: question.options.map((text, index) => ({
              text,
              orderIndex: index,
              isCorrect: question.correct.includes(index)
            }))
          }
        }
      });
    }
  }

  const publishedQuizzes = await prisma.quiz.findMany({
    where: { status: QuizStatus.PUBLISHED },
    include: { questions: { include: { options: true }, orderBy: { orderIndex: "asc" } } },
    orderBy: { createdAt: "asc" }
  });

  const attemptPlans: Record<string, Record<string, Array<number | null>>> = {
    "student-arjun": {
      "javascript-basics": [0, 0, 3, 2],
      "dbms-fundamentals": [1, 2],
      "operating-systems": [1, 0]
    },
    "student-diya": {
      "javascript-basics": [0, 1, 3, 1],
      "dbms-fundamentals": [0, 0],
      "operating-systems": [1, null]
    },
    "student-rohit": {
      "javascript-basics": [2, null, 1, 0],
      "dbms-fundamentals": [0, 3],
      "operating-systems": [0, 1]
    }
  };

  for (const [studentIndex, studentId] of studentIds.entries()) {
    for (const [quizIndex, quiz] of publishedQuizzes.entries()) {
      const plan = attemptPlans[studentId]?.[quiz.id];
      if (!plan) continue;

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId,
          status: AttemptStatus.SUBMITTED,
          startedAt: new Date(Date.now() - (quizIndex + 2 + studentIndex) * 86400000 - (quiz.timeLimitMinutes * 60 * 1000)),
          submittedAt: new Date(Date.now() - (quizIndex + 2 + studentIndex) * 86400000),
          timeTakenSeconds: Math.max(240, quiz.timeLimitMinutes * 45 + studentIndex * 60),
          score: 0,
          percentage: 0,
          passed: false
        }
      });

      let score = 0;
      for (const [questionIndex, question] of quiz.questions.entries()) {
        const answerIndex = plan[questionIndex];
        const selectedOption = answerIndex === null || answerIndex === undefined ? null : question.options[answerIndex] ?? null;
        const isCorrect = !!selectedOption?.isCorrect;
        score += isCorrect ? question.marks : 0;
        await prisma.attemptAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: question.id,
            isCorrect: answerIndex === null ? false : isCorrect,
            marksAwarded: isCorrect ? question.marks : 0,
            markedForReview: answerIndex === null,
            answeredAt: answerIndex === null ? null : new Date(),
            selectedOptions: selectedOption ? { create: [{ optionId: selectedOption.id }] } : undefined
          }
        });
      }

      const percentage = quiz.totalMarks > 0 ? (score / quiz.totalMarks) * 100 : 0;
      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          score,
          percentage,
          passed: score >= quiz.passingMarks
        }
      });
    }
  }

  await prisma.questionBankItem.createMany({
    data: [
      { professorId, subject: "Java", topic: "OOP Basics", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "Which keyword is used to create an object in Java?", explanation: "The new keyword creates objects.", marks: 1, optionsJson: JSON.stringify([{ text: "class", isCorrect: false }, { text: "new", isCorrect: true }, { text: "this", isCorrect: false }, { text: "extends", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "Java", topic: "Inheritance", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "Which keyword is used to inherit a class in Java?", explanation: "Java uses extends for inheritance.", marks: 1, optionsJson: JSON.stringify([{ text: "inherits", isCorrect: false }, { text: "extends", isCorrect: true }, { text: "implements", isCorrect: false }, { text: "super", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "Java", topic: "Interfaces", difficulty: "Medium", type: QuestionType.TRUE_FALSE, text: "An interface in Java can include default methods.", explanation: "Modern Java supports default methods on interfaces.", marks: 1, optionsJson: JSON.stringify([{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]), aiGenerated: true },
      { professorId, subject: "DBMS", topic: "Normalization", difficulty: "Medium", type: QuestionType.MCQ_SINGLE, text: "Which normal form removes transitive dependency?", explanation: "3NF removes transitive dependency.", marks: 1, optionsJson: JSON.stringify([{ text: "1NF", isCorrect: false }, { text: "2NF", isCorrect: false }, { text: "3NF", isCorrect: true }, { text: "BCNF", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "DBMS", topic: "Keys", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "Which key uniquely identifies a record in a table?", explanation: "A primary key uniquely identifies each record.", marks: 1, optionsJson: JSON.stringify([{ text: "Foreign key", isCorrect: false }, { text: "Primary key", isCorrect: true }, { text: "Join key", isCorrect: false }, { text: "Sparse key", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "DBMS", topic: "SQL", difficulty: "Hard", type: QuestionType.MCQ_SINGLE, text: "Which clause filters grouped records after aggregation?", explanation: "HAVING filters grouped records after GROUP BY.", marks: 2, optionsJson: JSON.stringify([{ text: "WHERE", isCorrect: false }, { text: "HAVING", isCorrect: true }, { text: "ORDER BY", isCorrect: false }, { text: "LIMIT", isCorrect: false }]), aiGenerated: true },
      { professorId, subject: "OS", topic: "Scheduling", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "Round Robin scheduling uses which concept?", explanation: "Round Robin allocates CPU time using a time quantum.", marks: 1, optionsJson: JSON.stringify([{ text: "Semaphore", isCorrect: false }, { text: "Time quantum", isCorrect: true }, { text: "Page frame", isCorrect: false }, { text: "Interrupt vector", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "OS", topic: "Deadlock", difficulty: "Medium", type: QuestionType.TRUE_FALSE, text: "Circular wait is one of the necessary conditions for deadlock.", explanation: "Circular wait is a Coffman condition for deadlock.", marks: 1, optionsJson: JSON.stringify([{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "OS", topic: "Memory Management", difficulty: "Hard", type: QuestionType.MCQ_SINGLE, text: "Which technique commonly suffers from external fragmentation?", explanation: "Segmentation can suffer from external fragmentation.", marks: 2, optionsJson: JSON.stringify([{ text: "Paging", isCorrect: false }, { text: "Segmentation", isCorrect: true }, { text: "Spooling", isCorrect: false }, { text: "Demand paging", isCorrect: false }]), aiGenerated: true },
      { professorId, subject: "CN", topic: "OSI Model", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "How many layers are in the OSI model?", explanation: "The OSI model contains seven layers.", marks: 1, optionsJson: JSON.stringify([{ text: "5", isCorrect: false }, { text: "6", isCorrect: false }, { text: "7", isCorrect: true }, { text: "8", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "CN", topic: "Transport Layer", difficulty: "Easy", type: QuestionType.TRUE_FALSE, text: "TCP is connection-oriented.", explanation: "TCP establishes a connection before data transfer.", marks: 1, optionsJson: JSON.stringify([{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "CN", topic: "DNS", difficulty: "Medium", type: QuestionType.MCQ_SINGLE, text: "Which protocol resolves domain names to IP addresses?", explanation: "DNS translates domain names into IP addresses.", marks: 1, optionsJson: JSON.stringify([{ text: "HTTP", isCorrect: false }, { text: "DNS", isCorrect: true }, { text: "ARP", isCorrect: false }, { text: "SMTP", isCorrect: false }]), aiGenerated: true },
      { professorId, subject: "Aptitude", topic: "Percentages", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "What is 25% of 240?", explanation: "25 percent of 240 is 60.", marks: 1, optionsJson: JSON.stringify([{ text: "40", isCorrect: false }, { text: "50", isCorrect: false }, { text: "60", isCorrect: true }, { text: "75", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "Aptitude", topic: "Ratio", difficulty: "Easy", type: QuestionType.MCQ_SINGLE, text: "Simplify the ratio 24:36.", explanation: "24:36 simplifies to 2:3.", marks: 1, optionsJson: JSON.stringify([{ text: "2:3", isCorrect: true }, { text: "3:4", isCorrect: false }, { text: "4:5", isCorrect: false }, { text: "1:2", isCorrect: false }]), aiGenerated: false },
      { professorId, subject: "Aptitude", topic: "Number System", difficulty: "Medium", type: QuestionType.MCQ_SINGLE, text: "Which of the following is a prime number?", explanation: "29 is prime because it has no positive divisors other than 1 and itself.", marks: 1, optionsJson: JSON.stringify([{ text: "21", isCorrect: false }, { text: "27", isCorrect: false }, { text: "29", isCorrect: true }, { text: "35", isCorrect: false }]), aiGenerated: true },
      { professorId, subject: "DBMS", topic: "Transactions", difficulty: "Medium", type: QuestionType.SHORT_ANSWER, text: "What does the ACID property 'A' stand for?", explanation: "A stands for Atomicity.", marks: 2, optionsJson: JSON.stringify([]), aiGenerated: false },
      { professorId, subject: "Java", topic: "Collections", difficulty: "Medium", type: QuestionType.SHORT_ANSWER, text: "Name the interface implemented by ArrayList for ordered collections.", explanation: "ArrayList implements the List interface.", marks: 2, optionsJson: JSON.stringify([]), aiGenerated: false }
    ]
  });

  await prisma.aIInsight.createMany({
    data: [
      {
        quizId: "javascript-basics",
        userId: professorId,
        classroomId: web.id,
        type: AIInsightType.TEACHER_ANALYTICS,
        inputJson: JSON.stringify({ scope: "class performance" }),
        outputJson: JSON.stringify({ summary: "Students are strong on declarations but need more practice on strict mode.", confidence: 82, warnings: ["Small sample size"] })
      },
      {
        quizId: "dbms-fundamentals",
        userId: professorId,
        classroomId: cse.id,
        type: AIInsightType.REMEDIAL_GENERATION,
        inputJson: JSON.stringify({ topic: "SQL Basics", questionCount: 5 }),
        outputJson: JSON.stringify({
          summary: "Generated a short SQL recovery set for the weaker DBMS cohort.",
          confidence: 79,
          warnings: ["Contains advanced SQL terminology"],
          questions: [
            { text: "Which clause filters grouped rows?", difficulty: "Hard" },
            { text: "What does SQL expand to?", difficulty: "Easy" },
            { text: "Which command retrieves rows?", difficulty: "Easy" }
          ]
        })
      },
      {
        quizId: "operating-systems",
        userId: professorId,
        classroomId: cse.id,
        type: AIInsightType.QUIZ_GENERATION,
        inputJson: JSON.stringify({ topic: "Scheduling", mode: "quiz-builder" }),
        outputJson: JSON.stringify({
          summary: "Drafted an OS scheduling quiz with mixed difficulty.",
          confidence: 91,
          questions: [
            { text: "Round Robin uses a time quantum.", difficulty: "Easy" },
            { text: "Which algorithm risks starvation?", difficulty: "Medium" },
            { text: "Compare SJF and RR.", difficulty: "Hard" }
          ]
        })
      },
      {
        userId: professorId,
        type: AIInsightType.QUESTION_IMPROVEMENT,
        inputJson: JSON.stringify({ text: "Explain normalization.", tone: "Conceptual" }),
        outputJson: JSON.stringify({ text: "Explain how normalization reduces redundancy and anomalies.", rationale: "Clarified the learning objective.", confidence: 88 })
      }
    ]
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
