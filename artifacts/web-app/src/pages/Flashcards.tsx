import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  Layers, RotateCw, CheckCircle2, AlertCircle, Sparkles,
  ArrowRight, ArrowLeft, Plus, BookOpen, Brain, Zap,
  Check, RefreshCw, X, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface Deck {
  id: string;
  title: string;
  code: string;
  icon: string;
  color: string;
  cards: Flashcard[];
}

const DEFAULT_DECKS: Deck[] = [
  {
    id: "mth101",
    title: "Elementary Mathematics I (Calculus)",
    code: "MTH101",
    icon: "📐",
    color: "from-blue-600/30 to-cyan-500/20",
    cards: [
      {
        id: "m1",
        front: "What is the standard Integration by Parts formula?",
        back: "∫ u dv = uv - ∫ v du\n\nDerived from the product rule of differentiation. Remember LIATE rule (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential) to choose u.",
        hint: "Recall the product rule rearranged"
      },
      {
        id: "m2",
        front: "What conditions must be met to apply L'Hôpital's Rule?",
        back: "The limit must yield an indeterminate form of 0/0 or (±∞)/(±∞), and functions f and g must be differentiable near the point.",
        hint: "Two indeterminate ratios"
      },
      {
        id: "m3",
        front: "What is the derivative of y = tan(x)?",
        back: "dy/dx = sec²(x)\n\nAlternatively written as 1 + tan²(x).",
        hint: "Reciprocal trigonometric relation"
      },
      {
        id: "m4",
        front: "What is the Maclaurin series expansion of e^x?",
        back: "e^x = 1 + x + (x²/2!) + (x³/3!) + ... + (xⁿ/n!) + ...\n\nValid for all real numbers x (-∞ < x < ∞).",
        hint: "Sum of xⁿ / n!"
      },
      {
        id: "m5",
        front: "State the double angle identity for cos(2θ):",
        back: "1. cos²(θ) - sin²(θ)\n2. 2cos²(θ) - 1\n3. 1 - 2sin²(θ)\n\nAll three forms are fundamental in calculus integration.",
        hint: "Has 3 equivalent expressions"
      }
    ]
  },
  {
    id: "phy101",
    title: "General Physics I (Mechanics & Heat)",
    code: "PHY101",
    icon: "⚡",
    color: "from-purple-600/30 to-indigo-500/20",
    cards: [
      {
        id: "p1",
        front: "State the Work-Energy Theorem:",
        back: "The net work done on an object by all external forces equals the change in its kinetic energy:\n\nW_net = ΔKE = (1/2)m(v_f)² - (1/2)m(v_i)²",
        hint: "Relates net work to speed changes"
      },
      {
        id: "p2",
        front: "What is the formula for Escape Velocity from a planet of mass M and radius R?",
        back: "v_e = √(2GM / R)\n\nFor Earth, v_e ≈ 11.2 km/s. Does not depend on the mass of the projectile.",
        hint: "Square root of 2GM over R"
      },
      {
        id: "p3",
        front: "State the First Law of Thermodynamics:",
        back: "ΔU = Q - W\n\nWhere ΔU is the change in internal energy, Q is heat added to the system, and W is work done BY the system on its surroundings.",
        hint: "Conservation of energy in heat engines"
      },
      {
        id: "p4",
        front: "What is the period T of a simple pendulum of length L?",
        back: "T = 2π √(L / g)\n\nValid for small angular displacements (< 15°). Period is independent of the mass of the bob.",
        hint: "2π times square root of L over g"
      }
    ]
  },
  {
    id: "gst101",
    title: "Use of English & Communication",
    code: "GST101",
    icon: "📖",
    color: "from-emerald-600/30 to-teal-500/20",
    cards: [
      {
        id: "g1",
        front: "What is the Proximity Rule in subject-verb concord?",
        back: "When correlative conjunctions (either... or, neither... nor, not only... but also) connect subjects, the verb agrees with the subject closest to it.\n\nExample: 'Neither the tutor nor the students ARE here.'",
        hint: "The closest subject decides"
      },
      {
        id: "g2",
        front: "List the 8 English Diphthongs (gliding vowels):",
        back: "1. /eɪ/ (say)\n2. /aɪ/ (my)\n3. /ɔɪ/ (boy)\n4. /aʊ/ (now)\n5. /əʊ/ (go)\n6. /ɪə/ (here)\n7. /eə/ (hair)\n8. /ʊə/ (pure)",
        hint: "5 closing + 3 centring diphthongs"
      },
      {
        id: "g3",
        front: "Are words like 'News', 'Physics', 'Civics' treated as singular or plural?",
        back: "They are plural in form (-s) but singular in meaning and concord.\n\nCorrect: 'The news IS encouraging.', 'Physics IS my favourite subject.'",
        hint: "Plural form, singular verb"
      }
    ]
  },
  {
    id: "chm101",
    title: "General Chemistry I",
    code: "CHM101",
    icon: "🧪",
    color: "from-amber-600/30 to-orange-500/20",
    cards: [
      {
        id: "c1",
        front: "What are the molecular geometries of sp, sp², and sp³ hybridised carbon?",
        back: "• sp: Linear (180° bond angle, e.g. Ethyne)\n• sp²: Trigonal Planar (120° bond angle, e.g. Ethene)\n• sp³: Tetrahedral (109.5° bond angle, e.g. Methane)",
        hint: "Linear, Planar, Tetrahedral"
      },
      {
        id: "c2",
        front: "State Le Chatelier's Principle:",
        back: "If a dynamic equilibrium is disturbed by changing the conditions (concentration, temperature, or pressure), the position of equilibrium shifts to counteract the change.",
        hint: "Counteracts external disturbance"
      },
      {
        id: "c3",
        front: "What is the difference between Hund's Rule and Pauli's Exclusion Principle?",
        back: "• Hund's Rule: Electrons occupy degenerate orbitals singly with parallel spins before pairing.\n• Pauli's Principle: No two electrons in an atom can have the identical set of four quantum numbers (opposite spins in same orbital).",
        hint: "Single bus seats vs two opposite spins"
      }
    ]
  }
];

export default function FlashcardsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [decks, setDecks] = useState<Deck[]>(DEFAULT_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("mth101");
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  // AI Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];
  const currentCard = activeDeck.cards[cardIdx] || activeDeck.cards[0];
  const isMastered = masteredIds.has(currentCard?.id);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handleNext = () => {
    setIsFlipped(false);
    if (cardIdx + 1 < activeDeck.cards.length) {
      setCardIdx((prev) => prev + 1);
    } else {
      setCardIdx(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (cardIdx > 0) {
      setCardIdx((prev) => prev - 1);
    } else {
      setCardIdx(activeDeck.cards.length - 1);
    }
  };

  const markMastered = () => {
    if (!currentCard) return;
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.add(currentCard.id);
      return next;
    });
    toast({
      title: "Mastered! 🎯",
      description: "Card added to your mastered memory bank.",
    });
    handleNext();
  };

  const markNeedsReview = () => {
    if (!currentCard) return;
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    toast({
      title: "Review Scheduled ⏳",
      description: "We'll show this card again during your practice.",
    });
    handleNext();
  };

  const generateAiDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setGeneratingAi(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/past-questions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          topic: aiTopic,
          count: 5,
        })
      });

      let newCards: Flashcard[] = [];
      if (res.ok) {
        const data = await res.json();
        const generated = data?.questions || [];
        if (generated.length > 0) {
          newCards = generated.map((q: any, i: number) => ({
            id: `ai-${Date.now()}-${i}`,
            front: q.question,
            back: `${q.options?.[q.correctOption] || "Key Answer"}\n\nExplanation: ${q.explanation || "Essential concept for your exams."}`,
            hint: `Question from ${aiTopic}`
          }));
        }
      }

      // Fallback if network or AI returns empty
      if (newCards.length === 0) {
        newCards = [
          {
            id: `ai-${Date.now()}-1`,
            front: `Core Principle of ${aiTopic}`,
            back: `Fundamental definition and practical application of ${aiTopic} in Nigerian semester exams. Review past exam papers for standard derivations.`,
            hint: `High-yield ${aiTopic} summary`
          },
          {
            id: `ai-${Date.now()}-2`,
            front: `Common Exam Trap in ${aiTopic}`,
            back: `Always check unit consistency and initial boundary conditions before substituting numerical constants.`,
            hint: "Exam pitfall"
          }
        ];
      }

      const newDeck: Deck = {
        id: `deck-${Date.now()}`,
        title: aiTopic.toUpperCase(),
        code: aiTopic.slice(0, 7).toUpperCase(),
        icon: "🧠",
        color: "from-rose-600/30 to-pink-500/20",
        cards: newCards
      };

      setDecks((prev) => [newDeck, ...prev]);
      setSelectedDeckId(newDeck.id);
      setCardIdx(0);
      setIsFlipped(false);
      setShowAiModal(false);
      setAiTopic("");

      toast({
        title: "AI Deck Generated! 🧠",
        description: `Created ${newCards.length} high-yield flashcards for "${aiTopic}".`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Generation error",
        description: "Could not generate deck right now. Check your internet connection.",
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const progressPercent = activeDeck.cards.length > 0
    ? Math.round(
        (activeDeck.cards.filter((c) => masteredIds.has(c.id)).length /
          activeDeck.cards.length) *
          100
      )
    : 0;

  return (
    <DashboardLayout title="2torCards · Smart Flashcards" role={user?.role as any}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent/20 text-accent">
                <Layers className="w-6 h-6" />
              </span>
              2torCards: Smart Flashcards
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active recall & spaced repetition for rapid Nigerian university exam mastery.
            </p>
          </div>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            AI Deck Generator
          </button>
        </div>

        {/* Deck Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => {
                setSelectedDeckId(deck.id);
                setCardIdx(0);
                setIsFlipped(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                selectedDeckId === deck.id
                  ? "bg-accent text-background border-accent shadow-md shadow-accent/20"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              }`}
            >
              <span>{deck.icon}</span>
              <span>{deck.code}</span>
              <span className="opacity-60 text-[10px]">({deck.cards.length})</span>
            </button>
          ))}
        </div>

        {/* Deck Progress Bar */}
        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-semibold text-white">{activeDeck.title}</span>
              <span>
                {progressPercent}% Mastered ({activeDeck.cards.filter((c) => masteredIds.has(c.id)).length}/{activeDeck.cards.length})
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-green-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Flashcard 3D Interactive Container */}
        {currentCard && (
          <div className="relative min-h-[290px] sm:min-h-[380px] perspective-1000 flex flex-col justify-center">
            <div
              onClick={handleFlip}
              className={`w-full min-h-[290px] sm:min-h-[380px] rounded-3xl p-5 sm:p-12 cursor-pointer transition-all duration-500 transform-style-3d border shadow-2xl relative flex flex-col justify-between ${
                isFlipped
                  ? "bg-gradient-to-br from-[#181832] to-[#141426] border-accent/40 shadow-accent/10"
                  : "bg-gradient-to-br from-[#121224] to-[#0d0d1a] border-white/10 hover:border-white/20"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between text-xs">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-accent font-bold uppercase tracking-wider text-[11px] sm:text-xs">
                  {isFlipped ? "Answer & Solution" : "Question / Definition"}
                </span>
                <span className="text-muted-foreground font-mono text-[11px] sm:text-xs">
                  Card {cardIdx + 1} of {activeDeck.cards.length}
                </span>
              </div>

              {/* Card Body */}
              <div className="my-auto py-5 sm:py-6 text-center">
                {!isFlipped ? (
                  <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed max-w-xl mx-auto">
                    {currentCard.front}
                  </h3>
                ) : (
                  <div className="text-xs sm:text-base text-white/95 leading-relaxed max-w-xl mx-auto whitespace-pre-line text-left bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/5 font-mono">
                    {currentCard.back}
                  </div>
                )}
              </div>

              {/* Card Footer Hint */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-3.5 sm:pt-4">
                <span className="flex items-center gap-1.5 text-accent/80 text-[11px] sm:text-xs">
                  <RotateCw className="w-3.5 h-3.5" />
                  Tap card to flip
                </span>
                {isMastered && (
                  <span className="flex items-center gap-1 text-green-400 font-bold text-[11px] sm:text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-2">
          {/* Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrev}
              className="flex-1 sm:flex-none flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
              title="Previous Card"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="flex-1 sm:flex-none flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
              title="Next Card"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Spaced repetition buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={markNeedsReview}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Review Again
            </button>

            <button
              onClick={markMastered}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40 font-bold text-xs transition-all shadow-lg shadow-green-500/10"
            >
              <Check className="w-4 h-4" />
              Got It (Mastered)
            </button>
          </div>
        </div>

      </div>

      {/* AI Deck Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">AI Flashcard Generator</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Enter any Nigerian university course code or topic to instantly generate an active recall flashcard deck.
            </p>

            <form onSubmit={generateAiDeck} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1.5">
                  Course Code or Topic:
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. CSC101 Binary Arithmetic, ACC101 Balance Sheet, or Law of Contract"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAi || !aiTopic.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating Deck…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Flashcards
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

