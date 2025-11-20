import React, { useState, useEffect } from "react";

const MovingCells = ({ cells = [], onAnimationComplete, targetPosition }) => {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (cells.length === 0) {
      setPositions([]);
      return;
    }

    // 초기 위치 설정
    setPositions(cells.map((cell) => cell.startPosition));

    // 애니메이션 시작
    const timer = setTimeout(() => {
      setPositions(
        cells.map(() => ({
          top: targetPosition ? `${targetPosition.top}px` : "50%",
          left: targetPosition ? `${targetPosition.left}px` : "50%",
          transform: "translate(-50%, -50%) scale(3)",
        }))
      );
    }, 50);

    return () => clearTimeout(timer);
  }, [cells, targetPosition]);

  if (cells.length === 0 || positions.length === 0) return null;

  return (
    <>
      {cells.map((cell, index) => {
        const position = positions[index] || cell.startPosition;
        const isTarget =
          targetPosition &&
          position.top === `${targetPosition.top}px` &&
          position.left === `${targetPosition.left}px`;
        const isDefaultTarget = !targetPosition && position.top === "50%";

        return (
          <div
            key={index}
            className="fixed bg-indigo-100 dark:bg-indigo-900/90 text-slate-900 dark:text-slate-100 p-2 rounded shadow-lg text-center transition-all duration-500 ease-in-out flex items-center justify-center font-medium"
            style={{
              ...position,
              opacity: isTarget || isDefaultTarget ? 0 : 1,
              width: cell.startPosition.width,
              height: cell.startPosition.height,
            }}
            onTransitionEnd={() => {
              if (index === cells.length - 1 && (isTarget || isDefaultTarget)) {
                onAnimationComplete();
              }
            }}
          >
            {cell.content}
          </div>
        );
      })}
    </>
  );
};

export default MovingCells;
