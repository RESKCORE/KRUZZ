import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";

interface SlideToContinueProps {
  label?: string;
  successLabel?: string;
  onComplete: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function SlideToContinue({
  label = "Slide to Continue",
  successLabel = "Entering Investigation...",
  onComplete,
  className = "",
  icon,
}: SlideToContinueProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(160);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);

  // Compute max drag distance based on track width minus handle width and padding
  useEffect(() => {
    const updateMaxDrag = () => {
      if (containerRef.current) {
        const trackWidth = containerRef.current.offsetWidth;
        const handleWidth = 40; // 40px handle (size-10)
        const padding = 8; // 4px padding on each side
        setMaxDrag(Math.max(0, trackWidth - handleWidth - padding));
      }
    };

    updateMaxDrag();
    window.addEventListener("resize", updateMaxDrag);
    return () => window.removeEventListener("resize", updateMaxDrag);
  }, []);

  // Opacity of label text fades as handle approaches completion
  const textOpacity = useTransform(x, [0, maxDrag * 0.6], [1, 0.15]);
  // Progress fill width
  const progressWidth = useTransform(x, (val) => `${val + 40}px`);

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentX = x.get();
    const threshold = maxDrag * 0.65;

    if (currentX >= threshold) {
      // Snap to end and trigger complete
      setIsCompleted(true);
      animate(x, maxDrag, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });

      setTimeout(() => {
        onComplete();
      }, 350);
    } else {
      // Spring back to start
      animate(x, 0, {
        type: "spring",
        stiffness: 400,
        damping: 30,
      });
    }
  };

  const handleTriggerKeyboard = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    animate(x, maxDrag, {
      type: "spring",
      stiffness: 300,
      damping: 25,
    });
    setTimeout(() => {
      onComplete();
    }, 350);
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isCompleted ? 100 : 0}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTriggerKeyboard();
        }
      }}
      className={`relative h-12 w-full select-none rounded-full bg-[#121212] p-1 border border-white/[0.08] overflow-hidden focus:outline-none focus:border-[#ccff00]/40 transition-colors ${className}`}
    >
      {/* Dynamic Progress Fill */}
      <motion.div
        style={{ width: progressWidth }}
        className="absolute inset-y-1 left-1 rounded-full bg-gradient-to-r from-[#ccff00]/10 to-[#ccff00]/25 pointer-events-none"
      />

      {/* Label Text with Subtle Shimmer */}
      <motion.div
        style={{ opacity: textOpacity }}
        className="absolute inset-0 flex items-center justify-center pl-8 pointer-events-none"
      >
        <span className="font-semibold text-xs text-[#f5f5f5] tracking-wide flex items-center gap-1.5">
          {isCompleted ? successLabel : label}
          {!isCompleted && (
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-[#ccff00] font-mono font-bold"
            >
              →
            </motion.span>
          )}
        </span>
      </motion.div>

      {/* Draggable Handle */}
      <motion.div
        drag={isCompleted ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative z-10 size-10 rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] text-[#080808] font-bold flex items-center justify-center transition-transform ${
          isDragging ? "cursor-grabbing scale-105" : "cursor-grab hover:scale-105"
        }`}
      >
        {isCompleted ? (
          <Check className="size-5 stroke-[2.5]" />
        ) : (
          (icon ?? <ChevronRight className="size-5 stroke-[2.5]" />)
        )}
      </motion.div>
    </div>
  );
}
