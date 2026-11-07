export interface Question {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface CoursePQ {
  code: string;
  title: string;
  category: "JAMB" | "Post-UTME" | "WAEC" | "Science" | "Engineering" | "Management" | "General";
  level: "UTME/SSCE" | "Post-UTME" | "100L" | "200L" | "300L";
  universities: string[];
  year: string;
  durationMinutes: number;
  questionsCount: number;
  isAiGenerated?: boolean;
}

export const DEFAULT_QUESTIONS_MAP: Record<string, Question[]> = {
  "JAMB-MTH": [
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
      explanation: "Using lim (u -> 0) [sin(u)/u] = 1, lim (x -> 0) [3 * sin(3x)/(3x)] = 3 * 1 = 3.",
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
  "JAMB-ENG": [
    {
      id: 1,
      question: "Choose the word OPPOSITE in meaning to EPHEMERAL:",
      options: [
        { key: "A", text: "Transient" },
        { key: "B", text: "Enduring" },
        { key: "C", text: "Eloquent" },
        { key: "D", text: "Brief" },
      ],
      correctAnswer: "B",
      explanation: "'Ephemeral' means lasting for a very brief time. The antonym is 'enduring' or permanent.",
    },
    {
      id: 2,
      question: "Choose the nearest in meaning to: She decided to BURY THE HATCHET after years of enmity.",
      options: [
        { key: "A", text: "Seek vengeance" },
        { key: "B", text: "Make peace" },
        { key: "C", text: "Conceal weapons" },
        { key: "D", text: "Admit defeat" },
      ],
      correctAnswer: "B",
      explanation: "The idiom 'bury the hatchet' means to make peace and reconcile.",
    },
    {
      id: 3,
      question: "Choose the word with the SAME vowel sound as: pl-AI-t",
      options: [
        { key: "A", text: "Flat" },
        { key: "B", text: "Play" },
        { key: "C", text: "Fate" },
        { key: "D", text: "Plate" },
      ],
      correctAnswer: "A",
      explanation: "'Plait' is pronounced /plæt/ rhyming with 'cat' and 'flat'.",
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
      explanation: "Direct speech requires a comma before the opening quotation mark and period inside closing quote.",
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
      explanation: "In 'neither... nor', the verb agrees with the nearer subject ('students' is plural -> 'were').",
    },
  ],
  "JAMB-PHY": [
    {
      id: 1,
      question: "A body of mass 4 kg moving with velocity 10 m/s collides with a stationary body of mass 6 kg. If they stick together, find their common velocity.",
      options: [
        { key: "A", text: "4 m/s" },
        { key: "B", text: "6 m/s" },
        { key: "C", text: "2.5 m/s" },
        { key: "D", text: "1.67 m/s" },
      ],
      correctAnswer: "A",
      explanation: "m1*u1 + m2*u2 = (m1 + m2)*v => 4*10 + 0 = 10*v => v = 4 m/s.",
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
      explanation: "1/f = 1/u + 1/v => 1/10 = 1/15 + 1/v => 1/v = 1/30 => v = 30 cm.",
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
      explanation: "Energy = (60 * 8) / 1000 = 480 / 1000 = 0.48 kWh.",
    },
    {
      id: 4,
      question: "What is the half-life of a radioactive isotope if 75% decays in 24 days?",
      options: [
        { key: "A", text: "12 days" },
        { key: "B", text: "6 days" },
        { key: "C", text: "8 days" },
        { key: "D", text: "18 days" },
      ],
      correctAnswer: "A",
      explanation: "If 75% decays, 25% (1/4 = (1/2)^2) remains. This takes 2 half-lives: 2 * T_1/2 = 24 => T_1/2 = 12 days.",
    },
    {
      id: 5,
      question: "The temperature of a gas is increased from 27°C to 127°C. By what factor does the root mean square velocity of molecules increase?",
      options: [
        { key: "A", text: "√(4/3)" },
        { key: "B", text: "2" },
        { key: "C", text: "4/3" },
        { key: "D", text: "√(3/4)" },
      ],
      correctAnswer: "A",
      explanation: "V_rms is proportional to √T (Kelvin). T1 = 300 K, T2 = 400 K. Ratio = √(400/300) = √(4/3).",
    },
  ],
  "PUTME-UNILAG": [
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
      explanation: "27 = 3^3. 2x - 1 = 3 => 2x = 4 => x = 2.",
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
      explanation: "Osogbo is the administrative capital of Osun State.",
    },
    {
      id: 3,
      question: "Which organic compound decolorizes bromine water?",
      options: [
        { key: "A", text: "Ethane" },
        { key: "B", text: "Ethene" },
        { key: "C", text: "Methane" },
        { key: "D", text: "Propane" },
      ],
      correctAnswer: "B",
      explanation: "Unsaturated alkenes like ethene decolorize bromine water via electrophilic addition.",
    },
    {
      id: 4,
      question: "In what year was the University of Lagos (UNILAG) founded?",
      options: [
        { key: "A", text: "1960" },
        { key: "B", text: "1962" },
        { key: "C", text: "1970" },
        { key: "D", text: "1948" },
      ],
      correctAnswer: "B",
      explanation: "UNILAG was established in 1962 by an Act of Federal Parliament.",
    },
    {
      id: 5,
      question: "The rate of diffusion of gas A is twice that of gas B. If the molecular mass of B is 64, find molecular mass of A.",
      options: [
        { key: "A", text: "16" },
        { key: "B", text: "32" },
        { key: "C", text: "8" },
        { key: "D", text: "128" },
      ],
      correctAnswer: "A",
      explanation: "R_A / R_B = √(M_B / M_A) => 2 = √(64 / M_A) => 4 = 64 / M_A => M_A = 16.",
    },
  ],
  "PUTME-UI": [
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
      explanation: "Prof. Kenneth Onwuka Dike was appointed first Nigerian Vice-Chancellor of UI in 1960.",
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
      explanation: "(38 + x) / 5 = 10 => 38 + x = 50 => x = 12.",
    },
    {
      id: 3,
      question: "Which organelle is referred to as the powerhouse of the cell?",
      options: [
        { key: "A", text: "Ribosome" },
        { key: "B", text: "Mitochondria" },
        { key: "C", text: "Golgi Body" },
        { key: "D", text: "Nucleus" },
      ],
      correctAnswer: "B",
      explanation: "Mitochondria produce ATP through cellular respiration.",
    },
    {
      id: 4,
      question: "A pendulum has a period of 2.0 s. If length is quadrupled, what is the new period?",
      options: [
        { key: "A", text: "4.0 s" },
        { key: "B", text: "8.0 s" },
        { key: "C", text: "1.0 s" },
        { key: "D", text: "16.0 s" },
      ],
      correctAnswer: "A",
      explanation: "T = 2π√(L/g). Increasing L 4-fold increases T by √4 = 2. New T = 2.0 * 2 = 4.0 s.",
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
      explanation: "Bronze is copper and tin (brass is copper and zinc).",
    },
  ],
  "MTH101": [
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
      explanation: "d/dx(3x^4) = 12x^3, d/dx(-5x^2) = -10x, d/dx(7x) = 7. f'(x) = 12x^3 - 10x + 7.",
    },
    {
      id: 2,
      question: "Evaluate lim (x -> 2) of (x^2 - 4) / (x - 2).",
      options: [
        { key: "A", text: "0" },
        { key: "B", text: "2" },
        { key: "C", text: "4" },
        { key: "D", text: "Undefined" },
      ],
      correctAnswer: "C",
      explanation: "(x - 2)(x + 2)/(x - 2) = x + 2. Substituting x=2 yields 2 + 2 = 4.",
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
      explanation: "(2x - 1)(x + 3) = 0 => x = 1/2 or x = -3.",
    },
    {
      id: 4,
      question: "Find the 10th term of the A.P.: 3, 7, 11, 15, ...",
      options: [
        { key: "A", text: "35" },
        { key: "B", text: "39" },
        { key: "C", text: "43" },
        { key: "D", text: "38" },
      ],
      correctAnswer: "B",
      explanation: "T_10 = a + 9d = 3 + 9*4 = 3 + 36 = 39.",
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
      explanation: "∫ 6x^2 dx = 2x^3; ∫ 4x dx = 2x^2. Result = 2x^3 + 2x^2 + C.",
    },
  ],
  "PHY101": [
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
      question: "Which law states: 'To every action, there is an equal and opposite reaction'?",
      options: [
        { key: "A", text: "Newton's 1st Law" },
        { key: "B", text: "Newton's 2nd Law" },
        { key: "C", text: "Newton's 3rd Law" },
        { key: "D", text: "Hooke's Law" },
      ],
      correctAnswer: "C",
      explanation: "Newton's 3rd Law of Motion governs equal and opposite force interactions.",
    },
    {
      id: 5,
      question: "Calculate the work done by a force of 50 N in moving an object 4 m in the direction of the force.",
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
  "GST101": [
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
      explanation: "In 'either... or', the verb agrees with the closer subject ('students' is plural -> 'are').",
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
      explanation: "Scanning involves rapidly looking over text to find specific isolated facts.",
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
      explanation: "Candid means frank and outspoken; secretive is the direct antonym.",
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
      explanation: "A topic sentence introduces the central proposition of its paragraph.",
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
      explanation: "Intransitive verbs do not take direct objects; 'cried' has no object.",
    },
  ],
  "CSC101": [
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
      explanation: "A Stack removes elements from the top where they were most recently added (LIFO).",
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
      explanation: "Binary search repeatedly divides the search interval in half, resulting in O(log N).",
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
      explanation: "The Arithmetic Logic Unit (ALU) performs arithmetic calculations and comparisons.",
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
      explanation: "Python uses 'def' to define functions.",
    },
  ],
  "ACC101": [
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
      explanation: "Assets owned are financed either through debt (liabilities) or capital (equity).",
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
      explanation: "Transactions are first recorded in the Journal chronologically before posting.",
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
      explanation: "Debit receiving asset (Cash) and credit reducing asset (Debtor).",
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
      explanation: "The Balance Sheet is a snapshot of assets, liabilities, and equity at a specific date.",
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
      explanation: "Prepaid rent provides future economic benefit and is a Current Asset.",
    },
  ],
};

export const DEFAULT_COURSES_BANK: CoursePQ[] = [
  {
    code: "JAMB-MTH",
    title: "JAMB UTME Mathematics (CBT Practice)",
    category: "JAMB",
    level: "UTME/SSCE",
    universities: ["Joint Admissions and Matriculation Board (All Nigerian Universities)"],
    year: "2024/2025",
    durationMinutes: 20,
    questionsCount: 5,
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
  },
  {
    code: "PUTME-UNILAG",
    title: "UNILAG Post-UTME General Screening Paper",
    category: "Post-UTME",
    level: "Post-UTME",
    universities: ["University of Lagos (UNILAG)"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
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
  },
  {
    code: "MTH101",
    title: "Elementary Mathematics I (Calculus & Algebra)",
    category: "Science",
    level: "100L",
    universities: ["UNILAG", "ABU Zaria", "UNN", "OAU Ife", "BUK", "UI", "UniBen"],
    year: "2024/2025",
    durationMinutes: 15,
    questionsCount: 5,
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
  },
];

export function gradeExamLocally(code: string, questions: Question[], userAnswers: Record<number, string>, timeSpentSeconds: number) {
  let correctCount = 0;
  const review = questions.map((q) => {
    const selected = userAnswers[q.id] || null;
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

  const total = questions.length;
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
    remark = "Fair score, but you need more practice on difficult topics.";
  }

  return {
    courseCode: code,
    score: correctCount,
    total,
    percentage,
    grade,
    remark,
    timeSpentSeconds,
    review,
  };
}

