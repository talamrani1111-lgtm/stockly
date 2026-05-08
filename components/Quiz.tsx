"use client";
import { useState, useEffect } from "react";
import { X, ChevronRight, RotateCcw } from "lucide-react";
import clsx from "clsx";
import quizData from "@/lib/quizData";

type Props = {
  lessonId: string;
  lessonTitle: { he: string; en: string };
  lang: "he" | "en";
  isRTL: boolean;
  onClose: () => void;
  onComplete: (score: number, total: number) => void;
};

const LABELS_HE = ["א", "ב", "ג", "ד"];
const LABELS_EN = ["A", "B", "C", "D"];

function getEmoji(score: number, total: number): string {
  const ratio = score / total;
  if (ratio === 1) return "🎯";
  if (ratio >= 0.75) return "⭐";
  return "📚";
}

function getEncouragementMessage(
  score: number,
  total: number,
  lang: "he" | "en"
): string {
  const ratio = score / total;
  if (ratio === 1) {
    return lang === "he"
      ? "מושלם! ידע מלא — אתה מומחה!"
      : "Perfect! Full marks — you're an expert!";
  }
  if (ratio >= 0.75) {
    return lang === "he"
      ? "כל הכבוד! תוצאה מצוינת!"
      : "Well done! Excellent result!";
  }
  if (ratio >= 0.5) {
    return lang === "he"
      ? "לא רע! קרא את השיעור שוב ותנסה שוב."
      : "Not bad! Review the lesson and try again.";
  }
  return lang === "he"
    ? "כדאי לקרוא את השיעור שוב לפני ניסיון נוסף."
    : "It's worth re-reading the lesson before trying again.";
}

export default function Quiz({
  lessonId,
  lessonTitle,
  lang,
  isRTL,
  onClose,
  onComplete,
}: Props) {
  const lessonQuiz = quizData.find((q) => q.lessonId === lessonId);
  const questions = lessonQuiz?.questions ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade-in on mount and question transition
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [currentIndex, showResults]);

  if (questions.length === 0) return null;

  const question = questions[currentIndex];
  const labels = isRTL ? LABELS_HE : LABELS_EN;
  const isAnswered = selectedOption !== null;
  const score = answers.filter((a, i) => a === questions[i]?.correct).length;

  function handleSelectOption(idx: number) {
    if (isAnswered) return;
    setSelectedOption(idx);
    const updated = [...answers];
    updated[currentIndex] = idx;
    setAnswers(updated);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setSelectedOption(null);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Show results
      setVisible(false);
      setTimeout(() => {
        setShowResults(true);
        onComplete(score + (selectedOption === question.correct ? 1 : 0), questions.length);
      }, 200);
    }
  }

  function handleTryAgain() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers(Array(questions.length).fill(null));
    setShowResults(false);
  }

  const finalScore = answers.filter(
    (a, i) => a === questions[i]?.correct
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          "relative w-full max-w-sm rounded-2xl bg-brand-card shadow-card overflow-hidden",
          "border border-white/10",
          "transition-all duration-300",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">
              {lang === "he" ? "בוחן" : "Quiz"}
            </p>
            <h2 className="text-base font-bold text-white mt-0.5">
              {lessonTitle[lang]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {!showResults ? (
          <div
            className={clsx(
              "px-5 pt-4 pb-5 transition-all duration-300",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            {/* Progress */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/40">
                {lang === "he"
                  ? `שאלה ${currentIndex + 1} מתוך ${questions.length}`
                  : `Question ${currentIndex + 1} of ${questions.length}`}
              </span>
              <span className="text-xs text-brand-accent font-semibold">
                {Math.round(((currentIndex) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all duration-500"
                style={{
                  width: `${(currentIndex / questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question */}
            <p className="text-white font-semibold text-base leading-snug mb-4">
              {question.question[lang]}
            </p>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {question.options.map((option, idx) => {
                const isCorrect = idx === question.correct;
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={clsx(
                      "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-start transition-all duration-200",
                      "border text-sm font-medium",
                      !isAnswered && "hover:border-brand-accent/60 hover:bg-white/5 active:scale-[0.98]",
                      !isAnswered && "border-white/15 bg-white/5 text-white",
                      isAnswered && !isSelected && !isCorrect && "border-white/10 bg-white/3 text-white/40",
                      isAnswered && isCorrect && "border-brand-green bg-brand-green/15 text-brand-green",
                      isAnswered && isSelected && !isCorrect && "border-brand-red bg-brand-red/15 text-brand-red"
                    )}
                  >
                    <span
                      className={clsx(
                        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        !isAnswered && "bg-white/10 text-white/60",
                        isAnswered && isCorrect && "bg-brand-green text-white",
                        isAnswered && isSelected && !isCorrect && "bg-brand-red text-white",
                        isAnswered && !isSelected && !isCorrect && "bg-white/5 text-white/30"
                      )}
                    >
                      {labels[idx]}
                    </span>
                    <span className="flex-1">{option[lang]}</span>
                    {isAnswered && isCorrect && (
                      <span className="text-brand-green text-base">✓</span>
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <span className="text-brand-red text-base">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {isAnswered && (
              <div
                className={clsx(
                  "mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed transition-all duration-300",
                  selectedOption === question.correct
                    ? "bg-brand-green/10 border border-brand-green/30 text-brand-green"
                    : "bg-brand-red/10 border border-brand-red/30 text-brand-red"
                )}
              >
                <p className="font-semibold mb-1">
                  {selectedOption === question.correct
                    ? lang === "he" ? "✓ נכון!" : "✓ Correct!"
                    : lang === "he" ? "✗ לא נכון" : "✗ Incorrect"}
                </p>
                <p className="text-white/70 text-xs leading-relaxed">
                  {question.explanation[lang]}
                </p>
              </div>
            )}

            {/* Next button */}
            {isAnswered && (
              <button
                onClick={handleNext}
                className={clsx(
                  "mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 px-5",
                  "bg-brand-accent hover:bg-brand-accentDark transition-colors",
                  "text-white font-semibold text-sm"
                )}
              >
                <span>
                  {currentIndex < questions.length - 1
                    ? lang === "he" ? "שאלה הבאה" : "Next Question"
                    : lang === "he" ? "לתוצאות" : "See Results"}
                </span>
                <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
              </button>
            )}
          </div>
        ) : (
          /* Results screen */
          <div
            className={clsx(
              "px-5 pt-6 pb-6 flex flex-col items-center text-center transition-all duration-300",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <div className="text-5xl mb-3">
              {getEmoji(finalScore, questions.length)}
            </div>

            <h3 className="text-white font-bold text-lg mb-1">
              {lang === "he" ? "תוצאות הבוחן" : "Quiz Results"}
            </h3>

            {/* Score circle */}
            <div className="my-4 w-24 h-24 rounded-full border-4 border-brand-accent flex flex-col items-center justify-center shadow-glow">
              <span className="text-3xl font-extrabold text-white leading-none">
                {finalScore}
              </span>
              <span className="text-xs text-white/50 font-medium">
                / {questions.length}
              </span>
            </div>

            {/* XP badge */}
            <div className="flex items-center gap-2 bg-brand-yellow/15 border border-brand-yellow/30 rounded-full px-4 py-1.5 mb-4">
              <span className="text-brand-yellow text-sm font-bold">⚡</span>
              <span className="text-brand-yellow text-sm font-semibold">
                +{finalScore * 10} XP
              </span>
            </div>

            <p className="text-white/60 text-sm leading-relaxed mb-6">
              {getEncouragementMessage(finalScore, questions.length, lang)}
            </p>

            {/* Per-question summary */}
            <div className="w-full flex justify-center gap-2 mb-6">
              {answers.map((ans, i) => (
                <div
                  key={i}
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    ans === questions[i]?.correct
                      ? "bg-brand-green/20 text-brand-green border border-brand-green/40"
                      : "bg-brand-red/20 text-brand-red border border-brand-red/40"
                  )}
                >
                  {ans === questions[i]?.correct ? "✓" : "✗"}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleTryAgain}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors border border-white/15"
              >
                <RotateCcw size={14} />
                <span>{lang === "he" ? "נסה שוב" : "Try Again"}</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl py-3 bg-brand-accent hover:bg-brand-accentDark text-white font-semibold text-sm transition-colors"
              >
                {lang === "he" ? "סגור" : "Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
