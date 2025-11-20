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
  const chartRef = useRef(null);

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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const [zoomLevel, setZoomLevel] = useState(1.0);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1.0);
  };

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans overflow-auto">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 z-10 relative">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
          Mandala Chart
        </h1>
        <button
          onClick={toggleDarkMode}
          className="p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-300 group"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <svg className="w-6 h-6 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 24.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="mb-8 flex gap-3 flex-wrap justify-center items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-none border border-white/40 dark:border-slate-700/30 z-10 relative">
        <input
          type="text"
          value={chartName}
          onChange={(e) => setChartName(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 transition-all w-64 font-bold text-slate-700 dark:text-slate-200"
          placeholder="Chart Name"
        />
        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden sm:block"></div>
        <button
          onClick={saveToLocalStorage}
          className="bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-bold shadow-indigo-500/20"
        >
          Save
        </button>
        <button
          onClick={saveToFile}
          className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-bold shadow-emerald-500/20"
        >
          Export
        </button>
        <button
          onClick={openFileDialog}
          className="bg-blue-500 text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-bold shadow-blue-500/20"
        >
          Import
        </button>
        <input ref={fileInputRef} type="file" onChange={loadFromFile} accept=".json" style={{ display: "none" }} />
        
        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden sm:block"></div>
        
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-100/80 dark:bg-slate-700/50 rounded-xl p-1">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="px-3 text-sm font-bold text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomReset}
            className="ml-1 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Reset Zoom"
            title="Reset Zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mandala Chart Grid */}
      <div
        ref={chartRef}
        className="grid grid-cols-3 gap-2 w-full max-w-3xl shadow-2xl shadow-indigo-200/50 dark:shadow-none bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 transition-all duration-500 origin-top"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {Array(3)
          .fill()
          .map((_, row) =>
            Array(3)
              .fill()
              .map((_, col) => (
                <div key={`${row}-${col}`} className="relative">
                  {render3x3Grid(row * 3, col * 3)}
                </div>
              ))
          )}
      </div>
      {movingCells.length > 0 && (
        <MovingCells
          cells={movingCells}
          onAnimationComplete={() => setMovingCells([])}
          targetPosition={(() => {
            if (chartRef.current) {
              const rect = chartRef.current.getBoundingClientRect();
              return {
                top: rect.top + rect.height / 2,
                left: rect.left + rect.width / 2,
              };
            }
            return null;
          })()}
        />
      )}
      <Breadcrumb
        path={path}
        displayPath={displayPath}
        navigateToRoot={navigateToRoot}
        handlePathClick={handlePathClick}
        rootContent={chart.cells[4][4]}
      />

      <div className="mt-10 mb- w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Saved Charts List</h2>
        {savedCharts && savedCharts.length > 0 ? (
          <div className="grid gap-3">
            {savedCharts.map((savedChart, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {savedChart.name} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2">{new Date(savedChart.date).toLocaleString()}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadFromLocalStorage(savedChart)}
                    className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteFromLocalStorage(index)}
                    className="bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            No saved charts yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MandalaChart;
