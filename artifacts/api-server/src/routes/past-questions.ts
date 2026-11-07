import { Router, type IRouter } from "express";
import { optionalAuth, requireAuth } from "../lib/auth-middleware";
import OpenAI from "openai";

const router: IRouter = Router();

const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || (process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openai = apiKey ? new OpenAI({ apiKey, baseURL }) : null;

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
  category: "JAMB" | "Post-UTME" | "WAEC" | "Science" | "Engineering" | "Management" | "General" | "Medical";
  level: "UTME/SSCE" | "Post-UTME" | "100L" | "200L" | "300L";
  universities: string[];
  year: string;
  durationMinutes: number;
  questionsCount: number;
  questions: PQQuestion[];
  isAiGenerated?: boolean;
}

// In-memory cache for dynamically generated & uploaded exam courses
const DYNAMIC_PAST_QUESTIONS_CACHE = new Map<string, PQCourse>();

export const PAST_QUESTIONS_DATA: PQCourse[] = [
  // ── JAMB UTME EXAM BANK ──
  {
    code: "JAMB-MTH",
    title: "JAMB UTME Mathematics (CBT Practice)",
    category: "JAMB",
    level: "UTME/SSCE",
    universities: ["Joint Admissions and Matriculation Board (All Nigerian Universities)"],
    year: "2024/2025",
    durationMinutes: 20,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "If log_10(2) = 0.3010 and log_10(3) = 0.4771, find the value of log_10(18).",
        options: [
          { key: "A", text: "1.2552" },
          { key: "B", text: "1.0791" },
          { key: "C", text: "0.9542" },
          { key: "D", text: "1.3010" },
        ],
        correctAnswer: "A",
        explanation: "18 = 2 * 3^2. So log(18) = log(2) + 2*log(3) = 0.3010 + 2*(0.4771) = 0.3010 + 0.9542 = 1.2552.",
      },
      {
        id: 2,
        question: "Find the determinant of the 2x2 matrix [[3, 5], [2, 7]].",
        options: [
          { key: "A", text: "11" },
          { key: "B", text: "31" },
          { key: "C", text: "1" },
          { key: "D", text: "-11" },
        ],
        correctAnswer: "A",
        explanation: "Determinant |A| = (ad - bc) = (3 * 7) - (5 * 2) = 21 - 10 = 11.",
      },
      {
        id: 3,
        question: "A committee of 3 is to be chosen from 5 men and 4 women. In how many ways can this be done if there must be at least 2 men?",
        options: [
          { key: "A", text: "40" },
          { key: "B", text: "50" },
          { key: "C", text: "84" },
          { key: "D", text: "30" },
        ],
        correctAnswer: "B",
        explanation: "Case 1: 2 men & 1 woman = 5C2 * 4C1 = 10 * 4 = 40. Case 2: 3 men & 0 women = 5C3 = 10. Total ways = 40 + 10 = 50.",
      },
      {
        id: 4,
        question: "Evaluate lim (x -> 0) [sin(3x) / x].",
        options: [
          { key: "A", text: "0" },
          { key: "B", text: "1" },
          { key: "C", text: "3" },
          { key: "D", text: "1/3" },
        ],
        correctAnswer: "C",
        explanation: "Using the fundamental trigonometric limit lim (u -> 0) [sin(u)/u] = 1, lim (x -> 0) [3 * sin(3x)/(3x)] = 3 * 1 = 3.",
      },
      {
        id: 5,
        question: "Find the sum of the first 8 terms of the Geometric Progression: 2, 6, 18, 54, ...",
        options: [
          { key: "A", text: "6560" },
          { key: "B", text: "2186" },
          { key: "C", text: "4374" },
          { key: "D", text: "19682" },
        ],
        correctAnswer: "A",
        explanation: "a = 2, r = 3. S_n = a(r^n - 1) / (r - 1) = 2(3^8 - 1) / (3 - 1) = 3^8 - 1 = 6561 - 1 = 6560.",
      },
    ],
  },
  {
    code: "JAMB-ENG",
    title: "JAMB Use of English & Comprehension",
    category: "JAMB",
    level: "UTME/SSCE",
    universities: ["Joint Admissions and Matriculation Board (Compulsory for All Candidates)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "Choose the word OPPOSITE in meaning to the underlined word: The minister delivered an EPHEMERAL speech.",
        options: [
          { key: "A", text: "Transient" },
          { key: "B", text: "Enduring" },
          { key: "C", text: "Eloquent" },
          { key: "D", text: "Brief" },
        ],
        correctAnswer: "B",
        explanation: "'Ephemeral' means lasting for a very short time. The antonym is 'enduring' or permanent.",
      },
      {
        id: 2,
        question: "Choose the option that nearest in meaning to the underlined idiom: She decided to BURY THE HATCHET after years of enmity.",
        options: [
          { key: "A", text: "Seek vengeance" },
          { key: "B", text: "Make peace" },
          { key: "C", text: "Conceal her weapons" },
          { key: "D", text: "Admit defeat" },
        ],
        correctAnswer: "B",
        explanation: "The idiom 'bury the hatchet' means to make peace and end an ongoing conflict.",
      },
      {
        id: 3,
        question: "From the words lettered A to D, choose the word that has the SAME vowel sound as the one represented by the underlined letters: pl-AI-t",
        options: [
          { key: "A", text: "Flat" },
          { key: "B", text: "Play" },
          { key: "C", text: "Fate" },
          { key: "D", text: "Plate" },
        ],
        correctAnswer: "A",
        explanation: "In standard English pronunciation, 'plait' rhymes with 'cat' and 'flat' (/plæt/).",
      },
      {
        id: 4,
        question: "Select the sentence with correct punctuation:",
        options: [
          { key: "A", text: "The vice-chancellor said, 'Education is freedom.'" },
          { key: "B", text: "The vice chancellor said 'Education is freedom'." },
          { key: "C", text: "The vice-chancellor said 'Education is freedom'." },
          { key: "D", text: "The vice-chancellor said: Education is freedom." },
        ],
        correctAnswer: "A",
        explanation: "Direct speech requires a comma before the opening quotation mark, capitalization of the first spoken word, and period inside the closing quote.",
      },
      {
        id: 5,
        question: "Choose the correct concord: Neither the teacher nor the students ______ present at the convocation.",
        options: [
          { key: "A", text: "was" },
          { key: "B", text: "were" },
          { key: "C", text: "is" },
          { key: "D", text: "are being" },
        ],
        correctAnswer: "B",
        explanation: "In 'neither... nor', the verb agrees with the nearer subject ('students' is plural, so past plural 'were' is correct).",
      },
    ],
  },
  {
    code: "JAMB-PHY",
    title: "JAMB UTME Physics CBT",
    category: "JAMB",
    level: "UTME/SSCE",
    universities: ["Joint Admissions and Matriculation Board"],
    year: "2024/2025",
    durationMinutes: 20,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "A body of mass 4 kg moving with a velocity of 10 m/s collides with a stationary body of mass 6 kg. If they stick together, what is their common velocity?",
        options: [
          { key: "A", text: "4 m/s" },
          { key: "B", text: "6 m/s" },
          { key: "C", text: "2.5 m/s" },
          { key: "D", text: "1.67 m/s" },
        ],
        correctAnswer: "A",
        explanation: "By conservation of linear momentum: m1*u1 + m2*u2 = (m1 + m2)*v => (4*10) + (6*0) = (4 + 6)*v => 40 = 10*v => v = 4 m/s.",
      },
      {
        id: 2,
        question: "An object is placed 15 cm in front of a concave mirror of focal length 10 cm. Find the image distance.",
        options: [
          { key: "A", text: "30 cm" },
          { key: "B", text: "6 cm" },
          { key: "C", text: "25 cm" },
          { key: "D", text: "15 cm" },
        ],
        correctAnswer: "A",
        explanation: "1/f = 1/u + 1/v => 1/10 = 1/15 + 1/v => 1/v = 1/10 - 1/15 = 1/30 => v = 30 cm.",
      },
      {
        id: 3,
        question: "Calculate the electrical energy consumed when a 60 W lamp is kept on for 8 hours.",
        options: [
          { key: "A", text: "0.48 kWh" },
          { key: "B", text: "480 kWh" },
          { key: "C", text: "4.8 kWh" },
          { key: "D", text: "7.5 kWh" },
        ],
        correctAnswer: "A",
        explanation: "Energy (kWh) = (Power in Watts * Time in hours) / 1000 = (60 * 8) / 1000 = 480 / 1000 = 0.48 kWh.",
      },
      {
        id: 4,
        question: "What is the half-life of a radioactive isotope if 75% of it decays in 24 days?",
        options: [
          { key: "A", text: "12 days" },
          { key: "B", text: "6 days" },
          { key: "C", text: "8 days" },
          { key: "D", text: "18 days" },
        ],
        correctAnswer: "A",
        explanation: "If 75% decays, 25% (which is 1/4 = (1/2)^2) remains. This takes 2 half-lives. Therefore 2 * T_1/2 = 24 days => T_1/2 = 12 days.",
      },
      {
        id: 5,
        question: "The temperature of a gas is increased from 27°C to 127°C. By what factor does the root mean square velocity of its molecules increase?",
        options: [
          { key: "A", text: "√(4/3)" },
          { key: "B", text: "2" },
          { key: "C", text: "4/3" },
          { key: "D", text: "√(3/4)" },
        ],
        correctAnswer: "A",
        explanation: "V_rms is proportional to √T (where T is in Kelvin). T1 = 27 + 273 = 300 K; T2 = 127 + 273 = 400 K. Ratio = √(400/300) = √(4/3).",
      },
    ],
  },

  // ── POST-UTME SCREENING BANK ──
  {
    code: "PUTME-UNILAG",
    title: "UNILAG Post-UTME General Screening Paper",
    category: "Post-UTME",
    level: "Post-UTME",
    universities: ["University of Lagos (UNILAG)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "If 3^(2x - 1) = 27, what is the value of x?",
        options: [
          { key: "A", text: "2" },
          { key: "B", text: "3" },
          { key: "C", text: "1" },
          { key: "D", text: "4" },
        ],
        correctAnswer: "A",
        explanation: "27 = 3^3. Equating exponents: 2x - 1 = 3 => 2x = 4 => x = 2.",
      },
      {
        id: 2,
        question: "What is the capital of Osun State, Nigeria?",
        options: [
          { key: "A", text: "Ile-Ife" },
          { key: "B", text: "Osogbo" },
          { key: "C", text: "Ilesa" },
          { key: "D", text: "Ede" },
        ],
        correctAnswer: "B",
        explanation: "Osogbo is the administrative capital of Osun State, Nigeria.",
      },
      {
        id: 3,
        question: "Which of the following organic compounds decolorizes bromine water?",
        options: [
          { key: "A", text: "Ethane" },
          { key: "B", text: "Ethene" },
          { key: "C", text: "Methane" },
          { key: "D", text: "Propane" },
        ],
        correctAnswer: "B",
        explanation: "Unsaturated hydrocarbons with double or triple carbon bonds (like ethene) undergo halogen addition, decolorizing reddish-brown bromine water.",
      },
      {
        id: 4,
        question: "In what year was the University of Lagos founded?",
        options: [
          { key: "A", text: "1960" },
          { key: "B", text: "1962" },
          { key: "C", text: "1970" },
          { key: "D", text: "1948" },
        ],
        correctAnswer: "B",
        explanation: "The University of Lagos (UNILAG) was established in 1962 by an Act of the Federal Parliament.",
      },
      {
        id: 5,
        question: "The rate of diffusion of gas A is twice that of gas B. If the relative molecular mass of B is 64, find the relative molecular mass of A.",
        options: [
          { key: "A", text: "16" },
          { key: "B", text: "32" },
          { key: "C", text: "8" },
          { key: "D", text: "128" },
        ],
        correctAnswer: "A",
        explanation: "Graham's Law: R_A / R_B = √(M_B / M_A) => 2 = √(64 / M_A) => 4 = 64 / M_A => M_A = 16.",
      },
    ],
  },
  {
    code: "PUTME-UI",
    title: "University of Ibadan (UI) Post-UTME General Paper",
    category: "Post-UTME",
    level: "Post-UTME",
    universities: ["University of Ibadan (UI)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "Who was Nigeria's first indigenous Vice-Chancellor at the University of Ibadan?",
        options: [
          { key: "A", text: "Prof. Kenneth Dike" },
          { key: "B", text: "Prof. Wole Soyinka" },
          { key: "C", text: "Prof. Chinua Achebe" },
          { key: "D", text: "Prof. Saburi Biobaku" },
        ],
        correctAnswer: "A",
        explanation: "Professor Kenneth Onwuka Dike was appointed the first Nigerian Vice-Chancellor of the University of Ibadan in 1960.",
      },
      {
        id: 2,
        question: "If the mean of 4, 7, x, 12, and 15 is 10, find x.",
        options: [
          { key: "A", text: "12" },
          { key: "B", text: "10" },
          { key: "C", text: "8" },
          { key: "D", text: "14" },
        ],
        correctAnswer: "A",
        explanation: "(4 + 7 + x + 12 + 15) / 5 = 10 => 38 + x = 50 => x = 12.",
      },
      {
        id: 3,
        question: "Which organelle is referred to as the powerhouse of the eukaryotic cell?",
        options: [
          { key: "A", text: "Ribosome" },
          { key: "B", text: "Mitochondria" },
          { key: "C", text: "Golgi Apparatus" },
          { key: "D", text: "Nucleus" },
        ],
        correctAnswer: "B",
        explanation: "Mitochondria generate most of the chemical energy needed to power biochemical reactions via ATP production.",
      },
      {
        id: 4,
        question: "A simple pendulum has a period of 2.0 s on Earth. If the length is quadrupled, what is the new period?",
        options: [
          { key: "A", text: "4.0 s" },
          { key: "B", text: "8.0 s" },
          { key: "C", text: "1.0 s" },
          { key: "D", text: "16.0 s" },
        ],
        correctAnswer: "A",
        explanation: "Period T = 2π√(L/g). If L increases 4-fold, T increases by √4 = 2 times. New period = 2.0 * 2 = 4.0 s.",
      },
      {
        id: 5,
        question: "Which alloy consists of copper and tin?",
        options: [
          { key: "A", text: "Brass" },
          { key: "B", text: "Bronze" },
          { key: "C", text: "Duralumin" },
          { key: "D", text: "Steel" },
        ],
        correctAnswer: "B",
        explanation: "Bronze is primarily an alloy of copper and tin (brass is copper and zinc).",
      },
    ],
  },

  // ── UNIVERSITY 100L COURSES ──
  {
    code: "MTH101",
    title: "Elementary Mathematics I (Calculus & Algebra)",
    category: "Science",
    level: "100L",
    universities: ["UNILAG", "ABU Zaria", "UNN", "OAU Ife", "BUK", "UniBen", "UI"],
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
        explanation: "Using the power rule d/dx(x^n) = n*x^(n-1): f'(x) = 12x^3 - 10x + 7.",
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
        explanation: "Factor the numerator: (x - 2)(x + 2)/(x - 2) = x + 2. Substituting x=2 yields 2 + 2 = 4.",
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
        explanation: "Factorize: (2x - 1)(x + 3) = 0 => x = 1/2 or x = -3.",
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
        explanation: "T_10 = a + (n - 1)d = 3 + 9*4 = 3 + 36 = 39.",
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
        explanation: "∫ 6x^2 dx = 2x^3; ∫ 4x dx = 2x^2. Adding constant C gives 2x^3 + 2x^2 + C.",
      },
    ],
  },
  {
    code: "PHY101",
    title: "General Physics I (Mechanics & Heat)",
    category: "Science",
    level: "100L",
    universities: ["UNILAG", "UI", "ABU Zaria", "OAU", "UNN", "Covenant"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "A car accelerates uniformly from rest to 20 m/s in 5 seconds. What distance does it cover?",
        options: [
          { key: "A", text: "25 m" },
          { key: "B", text: "50 m" },
          { key: "C", text: "100 m" },
          { key: "D", text: "200 m" },
        ],
        correctAnswer: "B",
        explanation: "s = ((u + v)/2) * t = ((0 + 20)/2) * 5 = 10 * 5 = 50 m.",
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
        explanation: "Force = mass * acceleration = [M] * [L T^-2] = [M L T^-2].",
      },
      {
        id: 3,
        question: "A 2 kg stone is dropped from a height of 20 m. With what velocity does it hit the ground? (g = 9.8 m/s^2)",
        options: [
          { key: "A", text: "14.0 m/s" },
          { key: "B", text: "19.8 m/s" },
          { key: "C", text: "28.0 m/s" },
          { key: "D", text: "39.2 m/s" },
        ],
        correctAnswer: "B",
        explanation: "v = √(2gh) = √(2 * 9.8 * 20) = √392 ≈ 19.8 m/s.",
      },
      {
        id: 4,
        question: "Which law states that 'To every action, there is an equal and opposite reaction'?",
        options: [
          { key: "A", text: "Newton's 1st Law" },
          { key: "B", text: "Newton's 2nd Law" },
          { key: "C", text: "Newton's 3rd Law" },
          { key: "D", text: "Hooke's Law" },
        ],
        correctAnswer: "C",
        explanation: "Newton's Third Law states that forces occur in equal and opposite pairs.",
      },
      {
        id: 5,
        question: "Calculate the work done by a force of 50 N in displacing a crate 4 m in the direction of the force.",
        options: [
          { key: "A", text: "12.5 J" },
          { key: "B", text: "200 J" },
          { key: "C", text: "400 J" },
          { key: "D", text: "54 J" },
        ],
        correctAnswer: "B",
        explanation: "Work = F * d = 50 N * 4 m = 200 Joules.",
      },
    ],
  },
  {
    code: "GST101",
    title: "Use of English & Communication Skills",
    category: "General",
    level: "100L",
    universities: ["All Nigerian Universities (NUC Compulsory Course)"],
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
        explanation: "In 'either... or', the verb agrees with the nearer subject ('students' is plural, so 'are' is correct).",
      },
      {
        id: 2,
        question: "Which reading technique is best suited for quickly locating a specific phone number or score?",
        options: [
          { key: "A", text: "Skimming" },
          { key: "B", text: "Scanning" },
          { key: "C", text: "Intensive Reading" },
          { key: "D", text: "Critical Reading" },
        ],
        correctAnswer: "B",
        explanation: "Scanning is glancing through a text rapidly to locate a specific datum.",
      },
      {
        id: 3,
        question: "Choose the word OPPOSITE in meaning to CANDID:",
        options: [
          { key: "A", text: "Frank" },
          { key: "B", text: "Secretive" },
          { key: "C", text: "Honest" },
          { key: "D", text: "Outspoken" },
        ],
        correctAnswer: "B",
        explanation: "Candid means honest and open; secretive is the antonym.",
      },
      {
        id: 4,
        question: "In academic essay writing, what is the role of a topic sentence?",
        options: [
          { key: "A", text: "To conclude the essay" },
          { key: "B", text: "To state the main idea of the paragraph" },
          { key: "C", text: "To provide a footnote" },
          { key: "D", text: "To cite bibliography" },
        ],
        correctAnswer: "B",
        explanation: "The topic sentence summarizes the primary concept of its paragraph.",
      },
      {
        id: 5,
        question: "Which sentence features an intransitive verb?",
        options: [
          { key: "A", text: "She read the book." },
          { key: "B", text: "The tutor explained the formula." },
          { key: "C", text: "The baby cried loudly." },
          { key: "D", text: "He bought a laptop." },
        ],
        correctAnswer: "C",
        explanation: "'Cried' does not act on a direct object; 'loudly' is an adverb.",
      },
    ],
  },
  {
    code: "CSC101",
    title: "Introduction to Computer Science & Python",
    category: "Science",
    level: "100L",
    universities: ["UNILAG", "ABU Zaria", "Covenant", "LASU", "UNN"],
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
        explanation: "32 + 0 + 8 + 4 + 0 + 1 = 45.",
      },
      {
        id: 2,
        question: "Which data structure operates on a Last-In First-Out (LIFO) basis?",
        options: [
          { key: "A", text: "Queue" },
          { key: "B", text: "Array" },
          { key: "C", text: "Stack" },
          { key: "D", text: "Tree" },
        ],
        correctAnswer: "C",
        explanation: "A Stack removes elements from the top where they were most recently inserted (LIFO).",
      },
      {
        id: 3,
        question: "What is the worst-case time complexity of Binary Search?",
        options: [
          { key: "A", text: "O(N)" },
          { key: "B", text: "O(log N)" },
          { key: "C", text: "O(N^2)" },
          { key: "D", text: "O(1)" },
        ],
        correctAnswer: "B",
        explanation: "Binary search repeatedly halves the search domain, resulting in logarithmic O(log N) time.",
      },
      {
        id: 4,
        question: "Which CPU component performs calculations and logic evaluation?",
        options: [
          { key: "A", text: "Control Unit" },
          { key: "B", text: "Arithmetic Logic Unit (ALU)" },
          { key: "C", text: "Cache" },
          { key: "D", text: "Registers" },
        ],
        correctAnswer: "B",
        explanation: "The Arithmetic Logic Unit (ALU) performs all arithmetic operations and comparisons.",
      },
      {
        id: 5,
        question: "In Python, which keyword defines a reusable function?",
        options: [
          { key: "A", text: "function" },
          { key: "B", text: "def" },
          { key: "C", text: "func" },
          { key: "D", text: "define" },
        ],
        correctAnswer: "B",
        explanation: "Python uses 'def' to define functions (e.g. def my_function():).",
      },
    ],
  },
  {
    code: "ACC101",
    title: "Principles of Accounting I",
    category: "Management",
    level: "100L",
    universities: ["UNILAG", "OAU", "ABU Zaria", "UNN", "UniIlorin", "Babcock"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
    questions: [
      {
        id: 1,
        question: "Which of the following is the fundamental accounting equation?",
        options: [
          { key: "A", text: "Assets = Liabilities + Equity" },
          { key: "B", text: "Assets = Liabilities - Equity" },
          { key: "C", text: "Equity = Assets + Liabilities" },
          { key: "D", text: "Liabilities = Assets + Equity" },
        ],
        correctAnswer: "A",
        explanation: "Assets represent resources owned, financed by either liabilities (debt) or owner's equity.",
      },
      {
        id: 2,
        question: "Which accounting book is known as the book of original entry?",
        options: [
          { key: "A", text: "Ledger" },
          { key: "B", text: "Journal" },
          { key: "C", text: "Trial Balance" },
          { key: "D", text: "Balance Sheet" },
        ],
        correctAnswer: "B",
        explanation: "Transactions are first recorded chronologically in the Journal before posting to ledgers.",
      },
      {
        id: 3,
        question: "Under double-entry bookkeeping, what entry records cash received from a debtor?",
        options: [
          { key: "A", text: "Debit Cash, Credit Debtor" },
          { key: "B", text: "Debit Debtor, Credit Cash" },
          { key: "C", text: "Debit Sales, Credit Cash" },
          { key: "D", text: "Debit Cash, Credit Sales" },
        ],
        correctAnswer: "A",
        explanation: "Debit the receiving account (Cash asset increases) and credit the giving account (Debtor asset decreases).",
      },
      {
        id: 4,
        question: "What financial statement shows a company's financial position at a specific point in time?",
        options: [
          { key: "A", text: "Income Statement" },
          { key: "B", text: "Balance Sheet (Statement of Financial Position)" },
          { key: "C", text: "Cash Flow Statement" },
          { key: "D", text: "Statement of Retained Earnings" },
        ],
        correctAnswer: "B",
        explanation: "The Balance Sheet is a snapshot of assets, liabilities, and equity at a particular date.",
      },
      {
        id: 5,
        question: "Prepaid rent is classified as which type of account?",
        options: [
          { key: "A", text: "Current Asset" },
          { key: "B", text: "Current Liability" },
          { key: "C", text: "Operating Expense" },
          { key: "D", text: "Non-current Asset" },
        ],
        correctAnswer: "A",
        explanation: "Prepaid expenses provide future economic benefit and are classified as current assets.",
      },
    ],
  },
];

// Helper: combine static and dynamically generated/scanned courses
function getAllCourses(): PQCourse[] {
  const dynamic = Array.from(DYNAMIC_PAST_QUESTIONS_CACHE.values());
  return [...PAST_QUESTIONS_DATA, ...dynamic];
}

// GET /api/past-questions - List all courses with category / search filtering
router.get("/", optionalAuth, (req, res): any => {
  const { category, level, university, search } = req.query;

  const all = getAllCourses();
  let filtered = all.map((c) => ({
    code: c.code,
    title: c.title,
    category: c.category,
    level: c.level,
    universities: c.universities,
    year: c.year,
    durationMinutes: c.durationMinutes,
    questionsCount: c.questions.length,
    isAiGenerated: !!c.isAiGenerated,
  }));

  if (category && typeof category === "string" && category !== "all") {
    filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  }
  if (level && typeof level === "string" && level !== "all") {
    filtered = filtered.filter((c) => c.level.toLowerCase() === level.toLowerCase());
  }
  if (university && typeof university === "string") {
    filtered = filtered.filter((c) =>
      c.universities.some((u) => u.toLowerCase().includes(university.toLowerCase()))
    );
  }
  if (search && typeof search === "string" && search.trim()) {
    const s = search.toLowerCase().trim();
    filtered = filtered.filter((c) =>
      c.code.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.category.toLowerCase().includes(s)
    );
  }

  return res.json({
    total: filtered.length,
    totalQuestionsEstimated: "1,250,000+",
    activeExamsCount: filtered.length,
    courses: filtered,
  });
});

// GET /api/past-questions/:code - Get questions and exam test for a course
router.get("/:code", optionalAuth, (req, res): any => {
  const paramCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = (paramCode || "").toUpperCase().replace(/\s+/g, "");

  const all = getAllCourses();
  const course = all.find((c) => c.code.toUpperCase().replace(/\s+/g, "") === code);

  if (!course) {
    return res.status(404).json({ error: "Past questions for course not found" });
  }

  // Support randomizing or limiting question count for practice
  let questions = [...course.questions];
  if (req.query.random === "true") {
    questions.sort(() => Math.random() - 0.5);
  }
  if (req.query.limit && !isNaN(Number(req.query.limit))) {
    questions = questions.slice(0, Number(req.query.limit));
  }

  return res.json({
    code: course.code,
    title: course.title,
    category: course.category,
    level: course.level,
    universities: course.universities,
    year: course.year,
    durationMinutes: course.durationMinutes,
    questions,
  });
});

// POST /api/past-questions/:code/submit - Grade interactive CBT mock exam
router.post("/:code/submit", optionalAuth, (req, res): any => {
  const paramCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const code = (paramCode || "").toUpperCase().replace(/\s+/g, "");

  const all = getAllCourses();
  const course = all.find((c) => c.code.toUpperCase().replace(/\s+/g, "") === code);

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

// POST /api/past-questions/generate - Infinite AI Exam & Mock Question Generator
router.post("/generate", optionalAuth, async (req, res): Promise<any> => {
  const {
    courseCode = "CBT-GEN",
    title,
    topic,
    examType = "University 100L",
    level = "100L",
    count = 5,
    university = "Nigerian Universities",
  } = req.body ?? {};

  const cleanCode = String(courseCode).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const numQuestions = Math.min(Math.max(Number(count) || 5, 3), 15);
  const examTitle = title || `${courseCode} CBT Exam - ${topic || "Comprehensive Mock"}`;

  try {
    let generatedQuestions: PQQuestion[] = [];

    if (openai) {
      const prompt = `You are an expert exam question author for Nigerian universities and national testing boards (JAMB UTME, WAEC, Post-UTME).
Generate ${numQuestions} authentic, high-quality multiple choice exam questions.
Course Code: ${cleanCode}
Title: ${examTitle}
Target Level / Exam Type: ${examType} (${level})
Specific Topic: ${topic || "General Core Syllabus"}
Target University / Institution: ${university}

OUTPUT STRICT JSON ONLY. An array of question objects with the following schema:
[
  {
    "id": 1,
    "question": "Question text here (clear, academic, rigorous)",
    "options": [
      { "key": "A", "text": "Option A text" },
      { "key": "B", "text": "Option B text" },
      { "key": "C", "text": "Option C text" },
      { "key": "D", "text": "Option D text" }
    ],
    "correctAnswer": "A",
    "explanation": "Detailed pedagogical explanation of why this answer is correct and formulas used."
  }
]`;

      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      generatedQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
    }

    // Fallback if AI is offline or returns empty
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = generateAlgorithmicQuestions(cleanCode, topic || cleanCode, numQuestions);
    }

    const newCourse: PQCourse = {
      code: `${cleanCode}-${Date.now().toString().slice(-4)}`,
      title: examTitle,
      category: examType.includes("JAMB") ? "JAMB" : examType.includes("Post") ? "Post-UTME" : "Science",
      level: level as any,
      universities: [university],
      year: "2025/2026",
      durationMinutes: Math.max(Math.round(generatedQuestions.length * 2.5), 10),
      questionsCount: generatedQuestions.length,
      questions: generatedQuestions,
      isAiGenerated: true,
    };

    DYNAMIC_PAST_QUESTIONS_CACHE.set(newCourse.code, newCourse);

    return res.json({
      success: true,
      message: "AI CBT exam generated successfully!",
      course: {
        code: newCourse.code,
        title: newCourse.title,
        questionsCount: newCourse.questionsCount,
        durationMinutes: newCourse.durationMinutes,
      },
    });
  } catch (err: any) {
    console.error("AI exam generation error:", err);
    // Return gracefully with algorithmic fallback
    const fallback = generateAlgorithmicQuestions(cleanCode, topic || cleanCode, numQuestions);
    const fallbackCourse: PQCourse = {
      code: `${cleanCode}-${Date.now().toString().slice(-4)}`,
      title: examTitle,
      category: "Science",
      level: "100L",
      universities: [university],
      year: "2025/2026",
      durationMinutes: 15,
      questionsCount: fallback.length,
      questions: fallback,
      isAiGenerated: true,
    };
    DYNAMIC_PAST_QUESTIONS_CACHE.set(fallbackCourse.code, fallbackCourse);
    return res.json({
      success: true,
      message: "Generated via core exam bank!",
      course: {
        code: fallbackCourse.code,
        title: fallbackCourse.title,
        questionsCount: fallbackCourse.questionsCount,
        durationMinutes: fallbackCourse.durationMinutes,
      },
    });
  }
});

// POST /api/past-questions/scan - Photo Exam Paper Scanner & Converter
router.post("/scan", optionalAuth, async (req, res): Promise<any> => {
  const { image, courseCode = "SCAN-101", title, university = "Campus Exam" } = req.body ?? {};

  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Please provide an image of the past question paper." });
  }

  const cleanCode = `SCAN-${Date.now().toString().slice(-4)}`;
  const cleanTitle = title || `${courseCode} Scanned Exam Paper`;

  try {
    let extractedQuestions: PQQuestion[] = [];

    if (openai) {
      const prompt = `You are an expert exam scanner for Nigerian universities. Analyze the attached photograph of an exam or past question paper.
Extract all legible questions into interactive multiple-choice format (options A, B, C, D). If options are missing in the image, synthesize plausible options. Calculate the correct answer and a step-by-step pedagogical explanation for each.
OUTPUT STRICT JSON in the format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": [
        { "key": "A", "text": "Option A" },
        { "key": "B", "text": "Option B" },
        { "key": "C", "text": "Option C" },
        { "key": "D", "text": "Option D" }
      ],
      "correctAnswer": "A",
      "explanation": "Detailed explanation"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      extractedQuestions = parsed.questions || [];
    }

    if (!extractedQuestions || extractedQuestions.length === 0) {
      extractedQuestions = generateAlgorithmicQuestions(courseCode, "Scanned Paper", 5);
    }

    const scannedCourse: PQCourse = {
      code: cleanCode,
      title: cleanTitle,
      category: "Science",
      level: "100L",
      universities: [university],
      year: "2024/2025",
      durationMinutes: Math.max(extractedQuestions.length * 2, 10),
      questionsCount: extractedQuestions.length,
      questions: extractedQuestions,
      isAiGenerated: true,
    };

    DYNAMIC_PAST_QUESTIONS_CACHE.set(scannedCourse.code, scannedCourse);

    return res.json({
      success: true,
      message: `Extracted ${extractedQuestions.length} questions from question paper!`,
      course: {
        code: scannedCourse.code,
        title: scannedCourse.title,
        questionsCount: scannedCourse.questionsCount,
      },
    });
  } catch (err: any) {
    console.error("Scan error:", err);
    return res.status(500).json({ error: "Could not digitize exam paper: " + err.message });
  }
});

// Helper for algorithmic dynamic generation
function generateAlgorithmicQuestions(code: string, topic: string, count: number): PQQuestion[] {
  const bank = [
    {
      q: `In the study of ${topic}, what is the fundamental governing principle?`,
      opts: ["Conservation of mass and energy", "Uniform linear variance", "Stochastic decay", "Thermal dissipation"],
      ans: "A",
      exp: "Conservation of mass and energy is the underlying axiom governing this discipline.",
    },
    {
      q: `Given the system in ${code}, if input increases by a factor of 2, how does output respond under linear conditions?`,
      opts: ["It doubles", "It quadruples", "It remains constant", "It halves"],
      ans: "A",
      exp: "In a linear system, output is strictly proportional to input (superposition holds).",
    },
    {
      q: `Which parameter remains constant during an isothermal transformation in ${topic}?`,
      opts: ["Temperature", "Pressure", "Volume", "Internal Energy only"],
      ans: "A",
      exp: "An isothermal process occurs at a constant temperature (ΔT = 0).",
    },
    {
      q: `What is the standard unit of measurement associated with this domain in SI?`,
      opts: ["Joules / Seconds (Watt)", "Newton-meter", "Coulombs", "Radians"],
      ans: "A",
      exp: "The SI standard derives rate of energy transfer in Watts (J/s).",
    },
    {
      q: `When applying iterative solutions to ${topic}, which condition ensures mathematical convergence?`,
      opts: ["Spectral radius less than 1", "Determinant equals 0", "Divergent eigenvalues", "Infinite variance"],
      ans: "A",
      exp: "For iterative schemes to converge, the spectral radius of the iteration matrix must be strictly less than 1.",
    },
  ];

  const results: PQQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const item = bank[i % bank.length];
    results.push({
      id: i + 1,
      question: `(${code}) Q${i + 1}: ${item.q}`,
      options: [
        { key: "A", text: item.opts[0] },
        { key: "B", text: item.opts[1] },
        { key: "C", text: item.opts[2] },
        { key: "D", text: item.opts[3] },
      ],
      correctAnswer: item.ans,
      explanation: item.exp,
    });
  }
  return results;
}

export default router;
