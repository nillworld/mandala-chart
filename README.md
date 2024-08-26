# Mandala Chart Web Application

## Overview

The Mandala Chart Web Application is an interactive tool for creating and exploring multi-level Mandala charts. It provides a visual way to organize ideas, goals, and plans in a hierarchical 9x9 grid structure. This application offers a unique approach to brainstorming and strategic planning.

## Features

- **Interactive 9x9 Grid**: A main chart with 9 cells, each expandable into its own 9x9 grid.
- **Multi-level Navigation**: Dive deeper into each cell to create sub-charts.
- **Visual Connections**: Clear visual cues showing relationships between central and surrounding cells.
- **Color-coded Sections**: Each 3x3 section is color-coded for easy distinction.
- **Hover Effects**: Highlight related cells on mouse hover for better understanding of connections.
- **Smooth Animations**: Engaging transitions when navigating between levels.
- **Data Persistence**: Save and load charts using local storage.
- **File Export/Import**: Save charts as JSON files and load them later.

## Technical Stack

- React.js
- Tailwind CSS for styling
- React Hooks for state management

## Getting Started

### Prerequisites

- Node.js (version 12 or higher)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:

   ```
   git clone [repository-url]
   ```

2. Navigate to the project directory:

   ```
   cd mandala-chart-app
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Start the development server:

   ```
   npm start
   ```

5. Open `http://localhost:3000` in your browser to view the app.

## Usage

1. **Creating a Chart**: Start by filling in the central cell of the main 9x9 grid.
2. **Expanding Cells**: Click the '+' button on any filled cell to dive into a sub-chart.
3. **Navigating Levels**: Use the breadcrumb navigation at the top to move between levels.
4. **Saving Work**: Use the 'Save' button to store your chart in local storage.
5. **Exporting/Importing**: Use 'Export to File' to save your work as a JSON file, and 'Import from File' to load it later.

## Contributing

Contributions to improve the Mandala Chart Web Application are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Inspired by traditional Mandala chart planning techniques
- Built with React and modern web technologies
