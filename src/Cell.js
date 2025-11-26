import React, { useState, useEffect, forwardRef, useRef } from "react";

const Cell = forwardRef(({ value, onChange, isSubChartPosition, onNavigate, isCenter, isCenterCenter }, ref) => {
  const [isChanged, setIsChanged] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isChanged) {
      const timer = setTimeout(() => setIsChanged(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isChanged]);

  const adjustStyle = () => {
    const element = textareaRef.current;
    if (!element) return;

    // Reset to defaults to calculate correctly
    element.style.height = 'auto';
    element.style.fontSize = '16px';

    const maxHeight = element.parentElement.clientHeight;
    let currentFontSize = 16;

    // Reduce font size if content overflows
    while (
      (element.scrollHeight > maxHeight || element.scrollWidth > element.clientWidth) &&
      currentFontSize > 8
    ) {
      currentFontSize -= 0.5;
      element.style.fontSize = `${currentFontSize}px`;
    }

    // Set final height (clamped to max height)
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
  };

  useEffect(() => {
    adjustStyle();
  }, [value]);

  const cellClass = `
    transition-all duration-300 ease-in-out aspect-square flex items-center justify-center relative overflow-hidden
    ${
      isCenterCenter
        ? "bg-emerald-200 dark:bg-emerald-900/70 shadow-lg z-10 border-2 border-white/10"
        : isCenter
        ? "bg-emerald-50 dark:bg-emerald-800/30 border border-gray-300 dark:border-slate-700"
        : isSubChartPosition
        ? "bg-emerald-100 dark:bg-emerald-700/40 border border-emerald-100 dark:border-emerald-800/30"
        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80"
    }
    ${isChanged ? "animate-pulse ring-2 ring-indigo-400" : ""}
    ${!isCenterCenter ? "hover:shadow-md hover:z-10" : ""}
  `;

  return (
    <div ref={ref} className={cellClass}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-center bg-transparent resize-none border-none outline-none focus:ring-0 overflow-hidden flex items-center justify-center p-1 leading-tight
        ${
          isCenterCenter
            ? "placeholder-white/70 font-extrabold tracking-tight drop-shadow-sm"
            : isSubChartPosition || (isCenter && !isCenterCenter)
            ? "text-slate-800 dark:text-slate-100 font-bold"
            : "text-slate-600 dark:text-slate-300 font-medium"
        }`}
        style={{
          fontSize: "14px",
          lineHeight: "1.2",
          maxHeight: "100%",
        }}
        disabled={isSubChartPosition}
        rows={1}
      />
      {isSubChartPosition && value !== "" && (
        <button
          onClick={onNavigate}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-blue-500 bg-opacity-0 hover:bg-opacity-20 transition-all duration-300"
        >
          <span className="text-blue-600 font-bold text-xl"></span>
        </button>
      )}
    </div>
  );
});

export default Cell;
