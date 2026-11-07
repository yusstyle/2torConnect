import { Router, type IRouter } from "express";
import { optionalAuth } from "../lib/auth-middleware";

const router: IRouter = Router();

export interface PQQuestion {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface PQCourse {
  code: string;
  title: string;
  category: "Science" | "Engineering" | "Management" | "General" | "Humanities";
  level: "100L" | "200L" | "300L";
  universities: string[];
  year: string;
  durationMinutes: number;
  questionsCount: number;
  questions: PQQuestion[];
}

export const PAST_QUESTIONS_DATA: PQCourse[] = [
  {
    code: "MTH101",
    title: "Elementary Mathematics I (Calculus & Algebra)",
    category: "Science",
    level: "100L",
    universities: ["University of Lagos (UNILAG)", "Ahmadu Bello University (ABU)", "University of Nigeria (UNN)", "Obafemi Awolowo University (OAU)", "Bayero University Kano (BUK)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "Find the derivative of f(x) = 3x^4 - 5x^2 + 7x - 9 with respect to x.",
        options: [
          { key: "A", text: "12x^3 - 10x + 7" },
          { key: "B", text: "12x^3 - 5x + 7" },
          { key: "C", text: "7x^3 - 10x + 7" },
          { key: "D", text: "12x^4 - 10x^2 + 7" },
        ],
        correctAnswer: "A",
        explanation: "Using the power rule d/dx(x^n) = n*x^(n-1): d/dx(3x^4) = 12x^3, d/dx(-5x^2) = -10x, d/dx(7x) = 7, d/dx(-9) = 0. Therefore, f'(x) = 12x^3 - 10x + 7.",
      },
      {
        id: 2,
        question: "Evaluate the limit as x approaches 2 of (x^2 - 4) / (x - 2).",
        options: [
          { key: "A", text: "0" },
          { key: "B", text: "2" },
          { key: "C", text: "4" },
          { key: "D", text: "Undefined" },
        ],
        correctAnswer: "C",
        explanation: "Factor the numerator: x^2 - 4 = (x - 2)(x + 2). Cancel (x - 2): lim(x -> 2) (x + 2) = 2 + 2 = 4.",
      },
      {
        id: 3,
        question: "Solve the quadratic equation 2x^2 + 5x - 3 = 0.",
        options: [
          { key: "A", text: "x = 1/2 or x = -3" },
          { key: "B", text: "x = -1/2 or x = 3" },
          { key: "C", text: "x = 2 or x = -3/2" },
          { key: "D", text: "x = 1 or x = -6" },
        ],
        correctAnswer: "A",
        explanation: "Factorize: 2x^2 + 6x - x - 3 = 2x(x + 3) - 1(x + 3) = (2x - 1)(x + 3) = 0. Thus, x = 1/2 or x = -3.",
      },
      {
        id: 4,
        question: "Find the 10th term of the Arithmetic Progression (A.P.): 3, 7, 11, 15, ...",
        options: [
          { key: "A", text: "35" },
          { key: "B", text: "39" },
          { key: "C", text: "43" },
          { key: "D", text: "38" },
        ],
        correctAnswer: "B",
        explanation: "First term a = 3, common difference d = 7 - 3 = 4. The nth term formula is T_n = a + (n - 1)d. T_10 = 3 + (10 - 1)*4 = 3 + 36 = 39.",
      },
      {
        id: 5,
        question: "Integrate ∫ (6x^2 + 4x) dx.",
        options: [
          { key: "A", text: "2x^3 + 2x^2 + C" },
          { key: "B", text: "3x^3 + 2x^2 + C" },
          { key: "C", text: "12x + 4 + C" },
          { key: "D", text: "6x^3 + 4x^2 + C" },
        ],
        correctAnswer: "A",
        explanation: "∫ 6x^2 dx = 6*(x^3 / 3) = 2x^3. ∫ 4x dx = 4*(x^2 / 2) = 2x^2. Adding constant of integration gives 2x^3 + 2x^2 + C.",
      },
    ],
  },
  {
    code: "PHY101",
    title: "General Physics I (Mechanics & Properties of Matter)",
    category: "Science",
    level: "100L",
    universities: ["University of Lagos (UNILAG)", "University of Ibadan (UI)", "Ahmadu Bello University (ABU)", "Obafemi Awolowo University (OAU)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "A car accelerates uniformly from rest to a speed of 20 m/s in 5 seconds. What distance does it cover in this time?",
        options: [
          { key: "A", text: "25 m" },
          { key: "B", text: "50 m" },
          { key: "C", text: "100 m" },
          { key: "D", text: "200 m" },
        ],
        correctAnswer: "B",
        explanation: "Distance s = ((u + v) / 2) * t = ((0 + 20) / 2) * 5 = 10 * 5 = 50 meters.",
      },
      {
        id: 2,
        question: "What are the fundamental SI dimensions of Force?",
        options: [
          { key: "A", text: "[M L T^-1]" },
          { key: "B", text: "[M L T^-2]" },
          { key: "C", text: "[M L^2 T^-2]" },
          { key: "D", text: "[M L^-1 T^-2]" },
        ],
        correctAnswer: "B",
        explanation: "Force = mass * acceleration = kg * m/s^2. In dimensional symbols: [M] * [L] * [T^-2] = [M L T^-2].",
      },
      {
        id: 3,
        question: "A 2 kg stone is dropped from a height of 20 m. Neglecting air resistance, with what velocity does it hit the ground? (g = 9.8 m/s^2)",
        options: [
          { key: "A", text: "14.0 m/s" },
          { key: "B", text: "19.8 m/s" },
          { key: "C", text: "28.0 m/s" },
          { key: "D", text: "39.2 m/s" },
        ],
        correctAnswer: "B",
        explanation: "v^2 = u^2 + 2gh = 0 + 2 * 9.8 * 20 = 392. v = sqrt(392) ≈ 19.8 m/s.",
      },
      {
        id: 4,
        question: "Which of the following defines Newton's Third Law of Motion?",
        options: [
          { key: "A", text: "F = ma" },
          { key: "B", text: "An object stays at rest unless acted on by an external net force" },
          { key: "C", text: "To every action, there is an equal and opposite reaction" },
          { key: "D", text: "Momentum is conserved only in elastic collisions" },
        ],
        correctAnswer: "C",
        explanation: "Newton's Third Law states that whenever one body exerts a force on a second body, the second body exerts an equal and opposite force on the first.",
      },
      {
        id: 5,
        question: "The work done by a force of 50 N in moving an object through a displacement of 4 m in the direction of the force is:",
        options: [
          { key: "A", text: "12.5 J" },
          { key: "B", text: "200 J" },
          { key: "C", text: "400 J" },
          { key: "D", text: "54 J" },
        ],
        correctAnswer: "B",
        explanation: "Work = Force * Displacement * cos(θ). Here θ = 0° (in the direction of force), so cos(0) = 1. Work = 50 N * 4 m = 200 Joules.",
      },
    ],
  },
  {
    code: "GST101",
    title: "Use of English & Communication Skills",
    category: "General",
    level: "100L",
    universities: ["All Nigerian Universities (NUC Approved)"],
    year: "2024/2025",
    durationMinutes: 10,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "Identify the sentence with correct subject-verb agreement:",
        options: [
          { key: "A", text: "Either the tutor or the students is responsible." },
          { key: "B", text: "Either the tutor or the students are responsible." },
          { key: "C", text: "Neither the books nor the pen were on the table." },
          { key: "D", text: "The team of doctors are in the theatre." },
        ],
        correctAnswer: "B",
        explanation: "When subjects are joined by 'either... or', the verb agrees with the closer subject. 'students' is plural, so 'are responsible' is correct.",
      },
      {
        id: 2,
        question: "Which reading technique is best suited for quickly locating a specific telephone number or exam score in a list?",
        options: [
          { key: "A", text: "Skimming" },
          { key: "B", text: "Scanning" },
          { key: "C", text: "Intensive Reading" },
          { key: "D", text: "Critical Reading" },
        ],
        correctAnswer: "B",
        explanation: "Scanning involves rapidly running your eyes over text looking specifically for isolated facts, numbers, or keywords.",
      },
      {
        id: 3,
        question: "Choose the word opposite in meaning to CANDID:",
        options: [
          { key: "A", text: "Frank" },
          { key: "B", text: "Secretive" },
          { key: "C", text: "Honest" },
          { key: "D", text: "Outspoken" },
        ],
        correctAnswer: "B",
        explanation: "Candid means straightforward, open, and frank. The antonym is deceptive or secretive.",
      },
      {
        id: 4,
        question: "In academic essay writing, what is the primary role of the topic sentence?",
        options: [
          { key: "A", text: "To conclude the essay with a moral lesson" },
          { key: "B", text: "To state the main idea of the paragraph" },
          { key: "C", text: "To provide a citation or footnote" },
          { key: "D", text: "To link the bibliography to the introduction" },
        ],
        correctAnswer: "B",
        explanation: "A topic sentence introduces and synthesizes the central point of a specific paragraph.",
      },
      {
        id: 5,
        question: "Which of the following contains an intransitive verb?",
        options: [
          { key: "A", text: "She read the textbook." },
          { key: "B", text: "The lecturer explained the formula." },
          { key: "C", text: "The baby cried loudly." },
          { key: "D", text: "He purchased a new laptop." },
        ],
        correctAnswer: "C",
        explanation: "An intransitive verb does not take a direct object. 'cried' does not act upon an object ('loudly' is an adverb modifying cried).",
      },
    ],
  },
  {
    code: "CSC101",
    title: "Introduction to Computer Science & Problem Solving",
    category: "Science",
    level: "100L",
    universities: ["University of Lagos (UNILAG)", "Ahmadu Bello University (ABU)", "Covenant University", "Lagos State University (LASU)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "Convert the binary number (101101)_2 to decimal (base 10):",
        options: [
          { key: "A", text: "41" },
          { key: "B", text: "45" },
          { key: "C", text: "47" },
          { key: "D", text: "53" },
        ],
        correctAnswer: "B",
        explanation: "1*2^5 + 0*2^4 + 1*2^3 + 1*2^2 + 0*2^1 + 1*2^0 = 32 + 0 + 8 + 4 + 0 + 1 = 45.",
      },
      {
        id: 2,
        question: "Which data structure follows the Last-In, First-Out (LIFO) principle?",
        options: [
          { key: "A", text: "Queue" },
          { key: "B", text: "Array" },
          { key: "C", text: "Stack" },
          { key: "D", text: "Linked List" },
        ],
        correctAnswer: "C",
        explanation: "A Stack operates on LIFO (Last In First Out), where elements are pushed and popped from the top.",
      },
      {
        id: 3,
        question: "What is the time complexity of searching a sorted array of N elements using Binary Search?",
        options: [
          { key: "A", text: "O(N)" },
          { key: "B", text: "O(log N)" },
          { key: "C", text: "O(N^2)" },
          { key: "D", text: "O(1)" },
        ],
        correctAnswer: "B",
        explanation: "Binary search divides the search interval in half with each comparison, yielding O(log N) worst-case time complexity.",
      },
      {
        id: 4,
        question: "Which component of the Central Processing Unit (CPU) performs arithmetic and logical comparisons?",
        options: [
          { key: "A", text: "Control Unit (CU)" },
          { key: "B", text: "Arithmetic Logic Unit (ALU)" },
          { key: "C", text: "Cache Memory" },
          { key: "D", text: "Registers" },
        ],
        correctAnswer: "B",
        explanation: "The Arithmetic Logic Unit (ALU) is responsible for all computational, arithmetic, and logical evaluation tasks.",
      },
      {
        id: 5,
        question: "In Python, which built-in function returns the number of items in a list or sequence?",
        options: [
          { key: "A", text: "size()" },
          { key: "B", text: "count()" },
          { key: "C", text: "len()" },
          { key: "D", text: "length()" },
        ],
        correctAnswer: "C",
        explanation: "The len() function returns the total count of elements in a container (list, tuple, string, dictionary).",
      },
    ],
  },
];

// GET /api/past-questions - List all past question courses
router.get("/", optionalAuth, (req, res) => {
  const { category, level, university } = req.query;

  let filtered = PAST_QUESTIONS_DATA.map((c) => ({
    code: c.code,
    title: c.title,
    category: c.category,
    level: c.level,
    universities: c.universities,
    year: c.year,
    durationMinutes: c.durationMinutes,
    questionsCount: c.questionsCount,
  }));

  if (category && typeof category === "string") {
    filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  }
  if (level && typeof level === "string") {
    filtered = filtered.filter((c) => c.level.toLowerCase() === level.toLowerCase());
  }
  if (university && typeof university === "string") {
    filtered = filtered.filter((c) =>
      c.universities.some((u) => u.toLowerCase().includes(university.toLowerCase()))
    );
  }

  res.json({
    total: filtered.length,
    courses: filtered,
  });
});

// GET /api/past-questions/:code - Get questions and exam test for a course
router.get("/:code", optionalAuth, (req, res): any => {
  const paramCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = (paramCode || "").toUpperCase().replace(/\s+/g, "");
  const course = PAST_QUESTIONS_DATA.find((c) => c.code.toUpperCase() === code);

  if (!course) {
    return res.status(404).json({ error: "Past questions for course not found" });
  }

  return res.json({
    code: course.code,
    title: course.title,
    category: course.category,
    level: course.level,
    universities: course.universities,
    year: course.year,
    durationMinutes: course.durationMinutes,
    questions: course.questions,
  });
});

// POST /api/past-questions/:code/submit - Grade interactive CBT mock exam
router.post("/:code/submit", optionalAuth, (req, res): any => {
  const paramCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = (paramCode || "").toUpperCase().replace(/\s+/g, "");
  const course = PAST_QUESTIONS_DATA.find((c) => c.code.toUpperCase() === code);

  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  const { answers, timeSpentSeconds } = req.body ?? {};
  const userAnswers: Record<string, string> = answers || {};

  let correctCount = 0;
  const review = course.questions.map((q) => {
    const selected = userAnswers[String(q.id)] || null;
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      id: q.id,
      question: q.question,
      selectedAnswer: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const total = course.questions.length;
  const percentage = Math.round((correctCount / total) * 100);

  let grade = "F";
  let remark = "Need more study. Book a 2torConnect tutor for one-on-one revision!";
  if (percentage >= 70) {
    grade = "A";
    remark = "Outstanding performance! First class material!";
  } else if (percentage >= 60) {
    grade = "B";
    remark = "Great result! Strong understanding of key concepts.";
  } else if (percentage >= 50) {
    grade = "C";
    remark = "Good effort! A quick tutor session will push you to an A.";
  } else if (percentage >= 45) {
    grade = "D";
    remark = "Fair score, but you need more practice on the difficult topics.";
  }

  return res.json({
    courseCode: course.code,
    score: correctCount,
    total,
    percentage,
    grade,
    remark,
    timeSpentSeconds: timeSpentSeconds || 0,
    review,
  });
});

export default router;
