import React, { useState, useEffect, forwardRef } from "react";

const Cell = forwardRef(({ value, onChange, isSubChartPosition, onNavigate, isCenter, isCenterCenter }, ref) => {
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (isChanged) {
      const timer = setTimeout(() => setIsChanged(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isChanged]);

  const cellClass = `
    border border-gray-300 transition-all duration-300 ease-in-out aspect-square flex items-center justify-center relative
    ${isCenterCenter ? "bg-indigo-200" : isCenter ? "bg-indigo-100" : isSubChartPosition ? "bg-green-100" : "hover:bg-gray-50"}
    ${isChanged ? "animate-pulse" : ""}
    relative
  `;

  return (
    <div ref={ref} className={cellClass}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full text-center text-sm focus:outline-none bg-transparent"
        disabled={isSubChartPosition}
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
