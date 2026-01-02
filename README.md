# Disassembly Optimization System Webapp

A web application for optimizing disassembly processes using 3D models, knowledge graphs, and optimization algorithms.

## Features

- **3D Model Viewer**: Interactive 3D visualization of products (kettle, gearbox) using GLTF models
- **Knowledge Graph**: Visual representation of part relationships and disassembly paths
- **Disassembly Optimization**: Algorithm-based path optimization for efficient disassembly
- **Interactive Controls**: Select products, parts, and view optimized disassembly sequences
- **Animation**: Play disassembly sequences with component highlighting

## Project Structure

```
disassembly-optimizer/
├── backend/              # Flask API server
│   ├── app.py           # Main Flask application
│   ├── neo4j_client.py  # Neo4j database connection
│   ├── algorithms/      # Disassembly optimization algorithms
│   └── requirements.txt
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/   # API services
│   │   └── App.js
│   └── package.json
├── data/                # Data files
│   ├── gltf/           # GLTF 3D model files
│   ├── metadata/       # Metadata JSON files
│   └── csv/            # CSV files from Neo4j
└── README.md

```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- Neo4j database (local or cloud)
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set environment variables (create `.env` file):
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
FLASK_ENV=development
FLASK_PORT=5000
```

5. Run backend server:
```bash
python app.py
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm start
```

## Data Files to Import

Place your files in the following directories:

1. **GLTF Models**: Place `.gltf` and `.bin` files in `data/gltf/`
   - `kettle.gltf` / `kettle.bin`
   - `gearbox.gltf` / `gearbox.bin`

2. **Metadata JSON**: Place metadata files in `data/metadata/`
   - `kettle_metadata.json`
   - `gearbox_metadata.json`

3. **CSV Files**: Place Neo4j exported CSV files in `data/csv/`
   - `kettle_graph.csv`
   - `gearbox_graph.csv`

## Deployment to Heroku

1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables in Heroku dashboard
5. Deploy: `git push heroku main`

## GitHub Integration

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create repository on GitHub
3. Link and push:
```bash
git remote add origin https://github.com/yourusername/disassembly-optimizer.git
git push -u origin main
```

## License

MIT

