import React, { useState, useEffect } from "react";

const MovingCells = ({ cells = [], onAnimationComplete }) => {
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
      setPositions(cells.map(() => ({ top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(3)" })));
    }, 50);

    return () => clearTimeout(timer);
  }, [cells]);

  if (cells.length === 0 || positions.length === 0) return null;

  return (
    <>
      {cells.map((cell, index) => {
        const position = positions[index] || cell.startPosition;
        return (
          <div
            key={index}
            className="fixed bg-blue-200 p-2 rounded shadow text-center transition-all duration-500 ease-in-out"
            style={{
              ...position,
              opacity: position.top === "50%" ? 0 : 1,
              width: cell.startPosition.width,
              height: cell.startPosition.height,
            }}
            onTransitionEnd={() => {
              if (index === cells.length - 1 && position.top === "50%") {
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
