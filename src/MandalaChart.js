import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Breadcrumb from "./Breadcrumb";
import Cell from "./Cell";
import MovingCells from "./MovingCells";

const createInitialChart = () => ({
  cells: Array(9)
    .fill()
    .map(() => Array(9).fill("")),
  subCharts: Array(9)
    .fill()
    .map(() => null),
});

const MandalaChart = () => {
  const [chart, setChart] = useState(createInitialChart);
  const [chartName, setChartName] = useState("New Mandala Chart");
  const [path, setPath] = useState([]);
  const [savedCharts, setSavedCharts] = useState([]);
  const [movingCells, setMovingCells] = useState([]);

  const cellRefs = useRef({});
  const fileInputRef = useRef(null);

  // localStorage에서 저장된 차트 목록 불러오기
  useEffect(() => {
    const loadSavedCharts = () => {
      const storedCharts = localStorage.getItem("mandalaCharts");
      if (storedCharts) {
        try {
          const parsedCharts = JSON.parse(storedCharts);
          setSavedCharts(Array.isArray(parsedCharts) ? parsedCharts : []);
        } catch (error) {
          console.error("Failed to parse saved charts:", error);
          setSavedCharts([]);
        }
      } else {
        setSavedCharts([]);
      }
    };

    loadSavedCharts();
  }, []);

  const centerMapping = useMemo(
    () => [
      { from: [3, 3], to: [1, 1] },
      { from: [3, 4], to: [1, 4] },
      { from: [3, 5], to: [1, 7] },
      { from: [4, 3], to: [4, 1] },
      { from: [4, 5], to: [4, 7] },
      { from: [5, 3], to: [7, 1] },
      { from: [5, 4], to: [7, 4] },
      { from: [5, 5], to: [7, 7] },
    ],
    []
  );

  const subChartPositions = useMemo(
    () => [
      [1, 1],
      [1, 4],
      [1, 7],
      [4, 1],
      [4, 7],
      [7, 1],
      [7, 4],
      [7, 7],
    ],
    []
  );

  const subChartAreas = useMemo(
    () => [
      { start: [0, 0], end: [2, 2] },
      { start: [0, 3], end: [2, 5] },
      { start: [0, 6], end: [2, 8] },
      { start: [3, 0], end: [5, 2] },
      { start: [3, 6], end: [5, 8] },
      { start: [6, 0], end: [8, 2] },
      { start: [6, 3], end: [8, 5] },
      { start: [6, 6], end: [8, 8] },
    ],
    []
  );

  const updateSubCenters = useCallback(
    (currentChart) => {
      const newChart = { ...currentChart, cells: currentChart.cells.map((row) => [...row]) };
      centerMapping.forEach(({ from, to }) => {
        newChart.cells[to[0]][to[1]] = currentChart.cells[from[0]][from[1]];
      });
      return newChart;
    },
    [centerMapping]
  );

  const getCurrentChart = useCallback(() => {
    let currentChart = chart;
    for (let index of path) {
      if (!currentChart.subCharts[index]) {
        currentChart.subCharts[index] = createInitialChart();
      }
      currentChart = currentChart.subCharts[index];
    }
    return currentChart;
  }, [chart, path]);

  const handleChange = useCallback(
    (row, col, value) => {
      setChart((prevChart) => {
        const updateChart = (chart, path, row, col, value) => {
          if (path.length === 0) {
            let newChart = { ...chart, cells: chart.cells.map((r) => [...r]) };
            newChart.cells[row][col] = value;
            if (row >= 3 && row < 6 && col >= 3 && col < 6) {
              newChart = updateSubCenters(newChart);
            }
            return newChart;
          } else {
            const [currentIndex, ...restPath] = path;
            const newSubCharts = [...chart.subCharts];
            if (!newSubCharts[currentIndex]) {
              newSubCharts[currentIndex] = createInitialChart();
            }
            newSubCharts[currentIndex] = updateChart(newSubCharts[currentIndex], restPath, row, col, value);
            return { ...chart, subCharts: newSubCharts };
          }
        };
        return updateChart(prevChart, path, row, col, value);
      });
    },
    [path, updateSubCenters]
  );

  const copyDataToSubChart = useCallback(
    (parentChart, subChartIndex) => {
      const newSubChart = createInitialChart();
      const area = subChartAreas[subChartIndex];
      for (let i = area.start[0]; i <= area.end[0]; i++) {
        for (let j = area.start[1]; j <= area.end[1]; j++) {
          const newRow = i - area.start[0] + 3;
          const newCol = j - area.start[1] + 3;
          newSubChart.cells[newRow][newCol] = parentChart.cells[i][j];
        }
      }
      return updateSubCenters(newSubChart);
    },
    [subChartAreas, updateSubCenters]
  );

  const getAdjacentCells = (row, col) => {
    const adjacent = [
      [row - 1, col - 1],
      [row - 1, col],
      [row - 1, col + 1],
      [row, col - 1],
      [row, col],
      [row, col + 1],
      [row + 1, col - 1],
      [row + 1, col],
      [row + 1, col + 1],
    ];
    return adjacent.filter(([r, c]) => r >= 0 && r < 9 && c >= 0 && c < 9);
  };

  const navigateToSubChart = useCallback(
    (index, row, col) => {
      const currentChart = getCurrentChart();
      const adjacentCells = getAdjacentCells(row, col);
      const cellsToAnimate = adjacentCells
        .map(([r, c]) => {
          const cellElement = cellRefs.current[`${r}-${c}`];
          if (cellElement) {
            const rect = cellElement.getBoundingClientRect();
            return {
              content: currentChart.cells[r][c],
              startPosition: {
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      if (cellsToAnimate.length === 9) {
        setMovingCells(cellsToAnimate);

        // 애니메이션 완료 후 실제 네비게이션 수행
        setTimeout(() => {
          setChart((prevChart) => {
            const updateChart = (chart, currentPath, targetIndex) => {
              if (currentPath.length === 0) {
                const newSubCharts = [...chart.subCharts];
                if (!newSubCharts[targetIndex]) {
                  newSubCharts[targetIndex] = copyDataToSubChart(chart, targetIndex);
                }
                return { ...chart, subCharts: newSubCharts };
              } else {
                const [currentIndex, ...restPath] = currentPath;
                const newSubCharts = [...chart.subCharts];
                if (!newSubCharts[currentIndex]) {
                  newSubCharts[currentIndex] = createInitialChart();
                }
                newSubCharts[currentIndex] = updateChart(newSubCharts[currentIndex], restPath, targetIndex);
                return { ...chart, subCharts: newSubCharts };
              }
            };

            const newChart = updateChart(prevChart, path, index);
            // console.log("Updated Chart:", newChart);
            // console.log("New SubChart:", newChart.subCharts[path[path.length - 1]]?.subCharts[index]);
            return newChart;
          });
          setPath((prevPath) => [...prevPath, index]);
          setMovingCells([]);
        }, 600); // 애니메이션 시간 + 약간의 여유
      } else {
        // 애니메이션 없이 바로 네비게이션
        setChart((prevChart) => {
          const updateChart = (chart, currentPath, targetIndex) => {
            if (currentPath.length === 0) {
              const newSubCharts = [...chart.subCharts];
              if (!newSubCharts[targetIndex]) {
                newSubCharts[targetIndex] = copyDataToSubChart(chart, targetIndex);
              }
              return { ...chart, subCharts: newSubCharts };
            } else {
              const [currentIndex, ...restPath] = currentPath;
              const newSubCharts = [...chart.subCharts];
              if (!newSubCharts[currentIndex]) {
                newSubCharts[currentIndex] = createInitialChart();
              }
              newSubCharts[currentIndex] = updateChart(newSubCharts[currentIndex], restPath, targetIndex);
              return { ...chart, subCharts: newSubCharts };
            }
          };

          const newChart = updateChart(prevChart, path, index);
          console.log("Updated Chart:", newChart);
          console.log("New SubChart:", newChart.subCharts[path[path.length - 1]]?.subCharts[index]);
          return newChart;
        });
        setPath((prevPath) => [...prevPath, index]);
      }
    },
    [getCurrentChart, path]
  );

  const renderCell = useCallback(
    (row, col) => {
      const currentChart = getCurrentChart();
      const isCenter = row >= 3 && row < 6 && col >= 3 && col < 6;
      const isCenterCenter = row === 4 && col === 4;
      const isSubChartPosition = subChartPositions.some(([r, c]) => r === row && c === col);
      const subChartIndex = subChartPositions.findIndex(([r, c]) => r === row && c === col);

      return (
        <Cell
          ref={(el) => (cellRefs.current[`${row}-${col}`] = el)}
          key={`${row}-${col}`}
          value={currentChart.cells[row][col]}
          onChange={(value) => handleChange(row, col, value)}
          isSubChartPosition={isSubChartPosition}
          onNavigate={() => navigateToSubChart(subChartIndex, row, col)}
          isCenter={isCenter}
          isCenterCenter={isCenterCenter}
        />
      );
    },
    [getCurrentChart, handleChange, navigateToSubChart, subChartPositions]
  );

  const render3x3Grid = useCallback(
    (startRow, startCol) => {
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {Array(3)
            .fill()
            .map((_, row) =>
              Array(3)
                .fill()
                .map((_, col) => renderCell(startRow + row, startCol + col))
            )}
        </div>
      );
    },
    [renderCell]
  );

  // Save chart to localStorage
  const saveToLocalStorage = useCallback(() => {
    const newChart = { name: chartName, data: chart, date: new Date().toISOString() };
    const updatedCharts = [...savedCharts, newChart];
    localStorage.setItem("mandalaCharts", JSON.stringify(updatedCharts));
    setSavedCharts(updatedCharts);
    alert("Chart has been saved to localStorage!");
  }, [chart, chartName, savedCharts]);

  // Load chart from localStorage
  const loadFromLocalStorage = useCallback((selectedChart) => {
    setChartName(selectedChart.name);
    setChart(selectedChart.data);
    setPath([]);
    alert("Chart has been loaded from localStorage!");
  }, []);

  // Delete chart from localStorage
  const deleteFromLocalStorage = useCallback(
    (index) => {
      const newSavedCharts = savedCharts.filter((_, i) => i !== index);
      localStorage.setItem("mandalaCharts", JSON.stringify(newSavedCharts));
      setSavedCharts(newSavedCharts);
      alert("Chart has been deleted from localStorage!");
    },
    [savedCharts]
  );

  // Function to save to file
  const saveToFile = useCallback(() => {
    const data = JSON.stringify({ name: chartName, data: chart }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chartName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [chart, chartName]);

  // Function to load from file
  const loadFromFile = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          if (content.name && content.data) {
            setChartName(content.name);
            setChart(content.data);
            setPath([]);
            alert("Chart successfully loaded!");
          } else {
            throw new Error("Invalid file format.");
          }
        } catch (error) {
          alert("An error occurred while reading the file: " + error.message);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  // Function to open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current.click();
  }, []);

  const getPathDisplay = useCallback(
    (chartData, currentPath) => {
      let current = chartData;
      return currentPath.map((index, depth) => {
        const area = subChartAreas[index];
        const content = current.cells[area.start[0] + 1][area.start[1] + 1];
        current = current.subCharts[index];
        return { index, content, depth };
      });
    },
    [subChartAreas]
  );

  const displayPath = useMemo(() => getPathDisplay(chart, path), [getPathDisplay, chart, path]);

  const handlePathClick = useCallback((targetDepth) => {
    setPath((prevPath) => prevPath.slice(0, targetDepth + 1));
  }, []);

  const navigateToRoot = useCallback(() => {
    setPath([]);
  }, []);

  const renderPathItem = useCallback(
    (item, index) => (
      <p className="mr-1">
        {">"}
        <span key={index} className="m-2 cursor-pointer text-blue-600 hover:underline" onClick={() => handlePathClick(index)}>
          {item.content || `Anonymous ${index + 1}`}
          {index < displayPath.length - 1}
        </span>
      </p>
    ),
    [handlePathClick]
  );

  useEffect(() => {
    // console.log("Current Chart:", getCurrentChart());
    // console.log("Current Path:", path);
  }, [getCurrentChart, path]);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">9x9 Multi-level Mandala Chart</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={chartName}
          onChange={(e) => setChartName(e.target.value)}
          className="border-2 border-indigo-300 rounded px-2 py-1"
          placeholder="Chart Name"
        />
        <button onClick={saveToLocalStorage} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">
          Temporary Save
        </button>
        <button onClick={saveToFile} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Save to File
        </button>
        <button onClick={openFileDialog} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Load from File
        </button>
        <input ref={fileInputRef} type="file" onChange={loadFromFile} accept=".json" style={{ display: "none" }} />
      </div>

      {/* Mandala Chart Grid */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-3xl shadow-lg bg-white p-6 rounded-xl">
        {Array(3)
          .fill()
          .map((_, row) =>
            Array(3)
              .fill()
              .map((_, col) => (
                <div key={`${row}-${col}`} className="border-2 border-gray-300 p-0.5">
                  {render3x3Grid(row * 3, col * 3)}
                </div>
              ))
          )}
      </div>
      {movingCells.length > 0 && <MovingCells cells={movingCells} onAnimationComplete={() => setMovingCells([])} />}
      <Breadcrumb path={path} displayPath={displayPath} navigateToRoot={navigateToRoot} handlePathClick={handlePathClick} />

      <div className="mt-10 mb-4 w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-2">Saved Charts List</h2>
        {savedCharts && savedCharts.length > 0 ? (
          savedCharts.map((savedChart, index) => (
            <div key={index} className="flex justify-between items-center mb-2 bg-white p-2 rounded shadow">
              <span>
                {savedChart.name} - {new Date(savedChart.date).toLocaleString()}
              </span>
              <div>
                <button onClick={() => loadFromLocalStorage(savedChart)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600">
                  Load
                </button>
                <button onClick={() => deleteFromLocalStorage(index)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No saved charts.</p>
        )}
      </div>
    </div>
  );
};

export default MandalaChart;
