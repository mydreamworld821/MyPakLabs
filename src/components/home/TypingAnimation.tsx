import { useMemo, useState, useEffect } from "react";

interface TypingAnimationProps {
  words: string[];
  className?: string;
}

const TypingAnimation = ({ words, className = "" }: TypingAnimationProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Reserve space for the longest word to prevent layout shifts (CLS)
  const maxWordLength = useMemo(
    () => (words?.length ? Math.max(...words.map((w) => (w ?? "").length)) : 0),
    [words]
  );

  useEffect(() => {
    if (words.length === 0) return;

    const currentWord = words[currentWordIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = isDeleting ? 50 : 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentWord.slice(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span
      className={className}
      style={
        maxWordLength
          ? ({ display: "inline-block", minWidth: `${maxWordLength}ch` } as const)
          : undefined
      }
    >
      {currentText}
      <span className="animate-cursor-blink" aria-hidden="true">
        |
      </span>
    </span>
  );
};

export default TypingAnimation;
