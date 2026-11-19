# GREEDYVERSE – Interactive Greedy Algorithm Visualizer

> **"See How Algorithms Think."**  
> Capstone Project for B.Tech Design and Analysis of Algorithms (DAA) & Industrial Programming.

---

## 1. Project Overview & Academic Submission Summary

**GREEDYVERSE** is an educational platform and interactive visualizer dedicated to the **Greedy Method** in Computer Science. It provides a visual exploration of three greedy algorithms:

1. **Dijkstra's Algorithm** – Single-Source Shortest Path (SSSP)
2. **Prim's Algorithm** – Minimum Spanning Tree (MST) via Cut-Crossing Vertex Expansion
3. **Kruskal's Algorithm** – Minimum Spanning Tree (MST) via Edge Sorting & Disjoint Set Union (Union-Find)

Unlike generic static visualizers that simulate outputs in JavaScript, **all core algorithm logic in GREEDYVERSE is written in standard ANSI C (C99)**. The web frontend communicates with the C implementation through a WebAssembly linear memory architecture and a local C-Backend REST interface.

---

## 2. Technical Architecture & C Communication Interface

```
+---------------------------------------------------------------------------------+
|                                 GREEDYVERSE UI                                  |
|   HTML5 Canvas (Retina HiDPI) | Interactive Graph Editor | Animation Dock       |
+---------------------------------------------------------------------------------+
                                       |
                   Graph JSON / Linear Memory Buffer
                                       v
+---------------------------------------------------------------------------------+
|                  C / WEBASSEMBLY COMMUNICATION BRIDGE                           |
|  - In-Browser WebAssembly Linear Memory Core (HEAP32 TypedArrays)               |
|  - Node.js C Backend REST API (/api/algorithm/run)                             |
+---------------------------------------------------------------------------------+
                                       |
                   Direct C Struct Invocation & Execution
                                       v
+---------------------------------------------------------------------------------+
|                         GENUINE C ALGORITHM SUITE                               |
|   c_src/dijkstra.c   |   c_src/prim.c   |   c_src/kruskal.c   |  greedyverse.h  |
|   - O(V²) Adjacency  |   - O(V²) Cut    |   - O(E log E) DSU  |  - StepTrace    |
|     Matrix Scan      |     Property     |     Union by Rank   |    Structs      |
+---------------------------------------------------------------------------------+
```

### How the Frontend Communicates with C:
1. **Graph Representation**: The frontend converts the canvas nodes and edges into the C `Graph` struct:
   - `adj_matrix[MAX_VERTICES][MAX_VERTICES]` (integer weights, 0 for non-adjacent)
   - `Edge edges[MAX_EDGES]` (list of `{ u, v, weight, id }`)
2. **Step Trace Recording**: The C functions (`run_dijkstra`, `run_prim`, `run_kruskal`) do not simply return the final answer. At every single iteration (choosing the minimum vertex, examining an edge, relaxing a distance, testing a cut, or detecting a cycle in DSU), the C function records a `StepTrace` record:
   - `event_type`: Event code (`EVENT_INIT`, `EVENT_SELECT_MIN_VERTEX`, `EVENT_EXAMINE_EDGE`, `EVENT_RELAX_EDGE`, `EVENT_ADD_MST_EDGE`, `EVENT_CYCLE_DETECTED`, `EVENT_PATH_FOUND`, `EVENT_COMPLETE`)
   - `current_vertex`, `target_vertex`, `edge`
   - Snapshot of `dist[]` or `key[]` array
   - Snapshot of `parent[]` array
   - Snapshot of `visited[]` / `in_mst[]` array
   - Snapshot of `dsu_parent[]` and `dsu_rank[]` arrays
   - Descriptive educational narration string explaining the operation in simple terms.
3. **Execution Delivery**: The C engine returns a structured JSON payload containing the step array, total cost/weight, and performance metrics.
4. **Playback & Rendering**: The frontend animator drives the HTML5 Canvas, lighting up nodes in cyan, cut edges in electric blue, MST edges in emerald green, cycle-rejected edges in crimson red, and shortest paths in gold.

---

## 3. Key Features

- **Interactive Graph Editor**:
  - Add vertices with a single click.
  - Connect vertices and assign weights dynamically.
  - Drag and reposition vertices with physics smoothing.
  - Delete vertices and edges.
  - Toggle between Directed and Undirected graphs.
  - Random connected graph generator.
  - Custom Data Matrix / Edge List (`u v weight`) importer.
- **Dijkstra Visualizer**:
  - Source and destination selectors.
  - Step-by-step linear scan and relaxation animation.
  - Real-time `dist[]` table updates.
  - Negative weight prevention with academic explanation.
  - Shortest path reconstruction and total cost computation.
- **Prim Visualizer**:
  - Starting root selection.
  - Cut property demonstration: highlights crossing edges between tree and non-tree vertices.
  - Running MST weight counter.
  - Disconnected graph alert (spanning forest detection).
- **Kruskal Visualizer**:
  - Globally sorted edge list.
  - Visual Disjoint Set Union (DSU / Union-Find) display.
  - Visual cycle detection (red flash when `Find(u) == Find(v)`).
- **Algorithm Battle Mode (Prim vs Kruskal)**:
  - Runs both algorithms on the exact same graph simultaneously.
  - Live side-by-side metrics: Edges examined, edges accepted, edges rejected, execution runtime.
  - Academic proof that both algorithms agree on identical minimum total weight.
- **Real-World Scenarios Mode**:
  - *Scenario A: City Route Finder* (Dijkstra)
  - *Scenario B: College Campus Fiber-Optic Network* (Prim)
  - *Scenario C: 5G Telecom Regional Grid* (Kruskal)
- **Learning Mode & Complexity Guide**:
  - Plain-English theory, proofs, line-by-line pseudocode, worked numerical examples, and formal time/space complexity tables for 3rd semester B.Tech students.
- **Quiz & Challenge Mode**:
  - 8 interactive questions covering greedy choice properties, cycle detection mechanics, MST calculations, and runtime comparisons.
- **C Architecture Inspector**:
  - In-browser code viewer with syntax highlighting and copy button for `dijkstra.c`, `prim.c`, `kruskal.c`, and `greedyverse.h`.
  - Live C execution console output.

---

## 4. Complexity Specifications (Standard Implementations)

| Algorithm | Data Structure / Implementation | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- |
| **Dijkstra** | Adjacency Matrix + Linear Minimum Scan | **O(V²)** | **O(V²)** |
| **Prim** | Adjacency Matrix + Linear Cut Selection | **O(V²)** | **O(V²)** |
| **Kruskal** | Edge Sorting + Disjoint Set Union (DSU) | **O(E log E)** | **O(E + V)** |

---

## 5. Directory Structure

```
greedyverse/
├── c_src/
│   ├── greedyverse.h          # C Header: Data structures, Event types, API prototypes
│   ├── dijkstra.c             # Dijkstra SSSP implementation in ANSI C
│   ├── prim.c                 # Prim MST implementation in ANSI C
│   ├── kruskal.c              # Kruskal MST + DSU implementation in ANSI C
│   ├── main.c                 # CLI Runner, JSON serializer & Battle execution
│   ├── Makefile               # GCC & Emscripten Makefile
│   ├── build_wasm.bat         # Windows Emscripten compile script
│   └── build_wasm.sh          # Linux/macOS Emscripten compile script
├── public/
│   ├── index.html             # Main Single-Page Educational Application
│   ├── css/
│   │   ├── style.css          # Design system, dark futuristic theme, neon accents
│   │   ├── graph-editor.css   # Canvas layout, drawing tools, modal styles
│   │   ├── visualizer.css     # Playback controls, narration card, distance table
│   │   └── battle.css         # Prim vs Kruskal side-by-side arena styles
│   └── js/
│       ├── graph.js           # Graph model, Retina canvas rendering, glow effects
│       ├── editor.js          # User interactions, node dragging, weight prompts
│       ├── c-wasm-engine.js   # C and WebAssembly communication bridge
│       ├── visualizer.js      # Step-by-step playback controller
│       ├── battle.js          # Prim vs Kruskal head-to-head comparison
│       ├── scenarios.js       # Real-world case studies (City, College, Telecom)
│       ├── learning.js        # Educational theory, pseudocode, complexities
│       ├── quiz.js            # Interactive quiz & challenge mode
│       └── app.js             # Main application orchestrator & modal handlers
├── server.js                  # Node.js C Backend Server & REST API
├── test_algorithms.js         # Automated verification test suite (6/6 tests)
├── package.json
└── README.md
```

---

## 6. How to Run GREEDYVERSE

### Option 1: Standard Node.js Server (Recommended)
Make sure Node.js is installed. In the project root directory:

```bash
# 1. Start the GREEDYVERSE Server
node server.js

# 2. Open in your browser:
# http://localhost:3000
```

### Option 2: Run Verification Test Suite
Run the automated test suite to verify algorithm correctness, MST weight agreement, disconnected graph handling, and negative edge rejection:

```bash
node test_algorithms.js
```

### Option 3: Compile & Run C CLI Directly with GCC / Clang
You can compile and run the native C algorithms in terminal:

```bash
cd c_src
gcc -O2 -Wall -std=c99 dijkstra.c prim.c kruskal.c main.c -o greedyverse

# Run Dijkstra on sample graph
./greedyverse --algorithm dijkstra --source 0 --dest 4

# Run Prim on sample graph
./greedyverse --algorithm prim --source 0

# Run Kruskal on sample graph
./greedyverse --algorithm kruskal

# Run Battle Mode
./greedyverse --algorithm battle
```

### Option 4: Compile to WebAssembly with Emscripten (Optional)
If Emscripten SDK (`emcc`) is installed on your system:

```bash
# Windows
cd c_src
build_wasm.bat

# Linux / macOS
cd c_src
chmod +x build_wasm.sh
./build_wasm.sh
```

---

## 7. College Project Submission Details

- **Project Title:** GREEDYVERSE – Interactive Greedy Algorithm Visualizer
- **Course:** Design and Analysis of Algorithms (DAA) & Industrial Programming
- **Degree:** Bachelor of Technology (B.Tech) in Computer Science & Engineering
- **Focus Area:** Greedy Method, Single-Source Shortest Path, Minimum Spanning Trees, Disjoint Set Union
- **Primary Languages:** C (Core Algorithms), HTML5/CSS3/JavaScript (Frontend UI), Node.js (C API Bridge)
