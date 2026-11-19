/**
 * GREEDYVERSE - Main Application Controller
 * 
 * Orchestrates navigation, UI views, graph editor, algorithm execution,
 * C-Source Inspector modal, and user notifications.
 */

class GreedyverseApp {
  constructor() {
    this.currentTab = 'home';
    this.currentAlgorithm = 'dijkstra';
    this.initGraph();
    this.initNavigation();
    this.initModals();
    this.initAlgorithmControls();

    // Auto-load default textbook graph
    this.graph.loadSampleGraph('default');
    this.renderer.render();
    this.updateNodeSelectors();
  }

  initGraph() {
    this.canvas = document.getElementById('graph-canvas');
    this.graph = new Graph(false); // Default undirected
    window.activeGraph = this.graph;

    this.renderer = new CanvasRenderer(this.canvas, this.graph);
    this.editor = new GraphEditor(this.graph, this.renderer, {
      onGraphChanged: () => {
        this.updateNodeSelectors();
        this.updateStatsBar();
      }
    });

    this.visualizer = new AlgorithmVisualizer(this.graph, this.renderer);
    this.scenarioManager = new ScenarioManager(this.graph, this.renderer, this.visualizer);
    this.battleEngine = new AlgorithmBattle(window.greedyCBridge);
    this.learningEngine = new LearningEngine();
    this.quizEngine = new QuizEngine();

    // Graph editor toolbar buttons
    const toolSelect = document.getElementById('tool-select');
    const toolAddNode = document.getElementById('tool-add-node');
    const toolAddEdge = document.getElementById('tool-add-edge');
    const toolDelete = document.getElementById('tool-delete');
    const toolClear = document.getElementById('tool-clear');
    const toolRandom = document.getElementById('tool-random');
    const toolDirectedToggle = document.getElementById('toggle-directed');

    const tools = [toolSelect, toolAddNode, toolAddEdge, toolDelete];
    tools.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          tools.forEach(t => t && t.classList.remove('active'));
          btn.classList.add('active');
          const mode = btn.dataset.mode;
          this.editor.setMode(mode);
        });
      }
    });

    if (toolClear) {
      toolClear.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas?')) {
          this.graph.clear();
          this.renderer.render();
          this.updateNodeSelectors();
          this.updateStatsBar();
          this.showToast('Graph cleared.', 'info');
        }
      });
    }

    if (toolRandom) {
      toolRandom.addEventListener('click', () => {
        this.editor.generateRandomGraph(6, 0.45);
        this.updateNodeSelectors();
        this.updateStatsBar();
        this.showToast('Generated random connected graph.', 'success');
      });
    }

    if (toolDirectedToggle) {
      toolDirectedToggle.addEventListener('change', (e) => {
        const isDir = e.target.checked;
        this.graph.isDirected = isDir;
        for (const edge of this.graph.edges) {
          edge.isDirected = isDir;
        }
        this.renderer.render();
        if (isDir && (this.currentAlgorithm === 'prim' || this.currentAlgorithm === 'kruskal')) {
          this.showToast('Note: Prim and Kruskal are designed for undirected graphs. Edges will be treated symmetrically in C core.', 'info');
        }
      });
    }
  }

  initNavigation() {
    // Navigation bar links
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Landing page CTA buttons
    const ctaExplore = document.getElementById('cta-explore-algorithms');
    if (ctaExplore) {
      ctaExplore.addEventListener('click', () => this.switchTab('dijkstra'));
    }

    const cardDijkstra = document.getElementById('home-card-dijkstra');
    const cardPrim = document.getElementById('home-card-prim');
    const cardKruskal = document.getElementById('home-card-kruskal');

    if (cardDijkstra) cardDijkstra.addEventListener('click', () => this.switchTab('dijkstra'));
    if (cardPrim) cardPrim.addEventListener('click', () => this.switchTab('prim'));
    if (cardKruskal) cardKruskal.addEventListener('click', () => this.switchTab('kruskal'));

    // Engine badge click -> open C Source & Architecture Inspector
    const engineBadge = document.getElementById('engine-status-badge');
    if (engineBadge) {
      engineBadge.addEventListener('click', () => this.openCInspectorModal());
    }

    // View C Source button on visualizer sidebar
    const btnViewC = document.getElementById('btn-view-c-code');
    if (btnViewC) {
      btnViewC.addEventListener('click', () => this.openCInspectorModal());
    }
  }

  switchTab(tabKey) {
    this.currentTab = tabKey;

    // Update active nav link
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.tab === tabKey) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Hide all view containers
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));

    // Check if target is one of the visualizer algorithm tabs
    if (tabKey === 'dijkstra' || tabKey === 'prim' || tabKey === 'kruskal') {
      const visualizerView = document.getElementById('view-visualizer');
      if (visualizerView) visualizerView.classList.add('active');
      this.setAlgorithm(tabKey);
      this.renderer.initCanvasSize();
    } else {
      const targetView = document.getElementById(`view-${tabKey}`);
      if (targetView) targetView.classList.add('active');

      if (tabKey === 'learning') {
        this.learningEngine.renderContent(this.currentAlgorithm || 'dijkstra');
      } else if (tabKey === 'battle') {
        this.battleEngine.executeBattle();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setAlgorithm(algo) {
    this.currentAlgorithm = algo;

    const algoTitle = document.getElementById('active-algo-title');
    const algoBadge = document.getElementById('active-algo-badge');
    const dijkstraOptions = document.getElementById('dijkstra-specific-controls');
    const primOptions = document.getElementById('prim-specific-controls');
    const kruskalOptions = document.getElementById('kruskal-specific-controls');
    const metricLabel1 = document.getElementById('metric-label-1');
    const metricLabel2 = document.getElementById('metric-label-2');

    if (algo === 'dijkstra') {
      if (algoTitle) algoTitle.textContent = "Dijkstra's Shortest Path";
      if (algoBadge) algoBadge.textContent = "O(V²) Greedy SSSP";
      if (dijkstraOptions) dijkstraOptions.style.display = 'flex';
      if (primOptions) primOptions.style.display = 'none';
      if (kruskalOptions) kruskalOptions.style.display = 'none';
      if (metricLabel1) metricLabel1.textContent = "Path Total Cost";
      if (metricLabel2) metricLabel2.textContent = "Settled Vertices";
    } else if (algo === 'prim') {
      if (algoTitle) algoTitle.textContent = "Prim's Minimum Spanning Tree";
      if (algoBadge) algoBadge.textContent = "O(V²) Greedy MST";
      if (dijkstraOptions) dijkstraOptions.style.display = 'none';
      if (primOptions) primOptions.style.display = 'flex';
      if (kruskalOptions) kruskalOptions.style.display = 'none';
      if (metricLabel1) metricLabel1.textContent = "MST Total Weight";
      if (metricLabel2) metricLabel2.textContent = "Tree Edges Added";
    } else if (algo === 'kruskal') {
      if (algoTitle) algoTitle.textContent = "Kruskal's MST (DSU)";
      if (algoBadge) algoBadge.textContent = "O(E log E) Disjoint Sets";
      if (dijkstraOptions) dijkstraOptions.style.display = 'none';
      if (primOptions) primOptions.style.display = 'none';
      if (kruskalOptions) kruskalOptions.style.display = 'flex';
      if (metricLabel1) metricLabel1.textContent = "MST Total Weight";
      if (metricLabel2) metricLabel2.textContent = "Tree Edges Accepted";
    }

    // Reset visual highlights
    this.graph.resetVisualStates();
    this.renderer.render();
  }

  initAlgorithmControls() {
    const runBtn = document.getElementById('btn-run-algorithm');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const srcSelect = document.getElementById('dijkstra-source-select');
        const dstSelect = document.getElementById('dijkstra-dest-select');
        const primStartSelect = document.getElementById('prim-start-select');

        const src = srcSelect ? parseInt(srcSelect.value, 10) : 0;
        const dst = dstSelect ? parseInt(dstSelect.value, 10) : 0;
        const primStart = primStartSelect ? parseInt(primStartSelect.value, 10) : 0;

        if (this.currentAlgorithm === 'dijkstra') {
          this.runAlgorithm('dijkstra', src, dst);
        } else if (this.currentAlgorithm === 'prim') {
          this.runAlgorithm('prim', primStart);
        } else if (this.currentAlgorithm === 'kruskal') {
          this.runAlgorithm('kruskal');
        }
      });
    }

    // Preset selector in visualizer
    const presetSelect = document.getElementById('graph-preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          this.graph.loadSampleGraph(val);
          this.renderer.render();
          this.updateNodeSelectors();
          this.updateStatsBar();
          this.showToast(`Loaded preset graph: ${val.toUpperCase()}`, 'info');
        }
      });
    }
  }

  async runAlgorithm(algo, p1 = 0, p2 = 0) {
    if (this.graph.nodes.size === 0) {
      this.showToast('Graph is empty. Please add nodes and edges first.', 'error');
      return;
    }

    // Validate Dijkstra negative edges upfront
    if (algo === 'dijkstra') {
      const negEdge = this.graph.edges.find(e => e.weight < 0);
      if (negEdge) {
        this.showToast(`Dijkstra requires non-negative edge weights. Negative edge (${negEdge.u} -> ${negEdge.v}, w=${negEdge.weight}) detected.`, 'error');
        return;
      }
    }

    const runBtn = document.getElementById('btn-run-algorithm');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.textContent = 'Running C Core...';
    }

    try {
      let result;
      if (algo === 'dijkstra') {
        result = await window.greedyCBridge.runDijkstra(this.graph, p1, p2);
      } else if (algo === 'prim') {
        result = await window.greedyCBridge.runPrim(this.graph, p1);
      } else if (algo === 'kruskal') {
        result = await window.greedyCBridge.runKruskal(this.graph);
      }

      this.visualizer.loadExecution(algo, result);

      if (result.success) {
        this.showToast(`${algo.toUpperCase()} execution completed. Press Play or Step Next to animate.`, 'success');
      }
    } catch (err) {
      this.showToast(`Algorithm execution failed: ${err.message}`, 'error');
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.textContent = 'Run Algorithm';
      }
    }
  }

  updateNodeSelectors() {
    const srcSelect = document.getElementById('dijkstra-source-select');
    const dstSelect = document.getElementById('dijkstra-dest-select');
    const primStartSelect = document.getElementById('prim-start-select');

    const selects = [srcSelect, dstSelect, primStartSelect];
    selects.forEach(sel => {
      if (!sel) return;
      const prevVal = sel.value;
      sel.innerHTML = '';
      for (const node of this.graph.nodes.values()) {
        const opt = document.createElement('option');
        opt.value = node.id;
        opt.textContent = `${node.label} (ID: ${node.id})`;
        sel.appendChild(opt);
      }
      if (prevVal && this.graph.getNode(parseInt(prevVal, 10))) {
        sel.value = prevVal;
      }
    });

    // Default destination to last node if possible
    if (dstSelect && dstSelect.options.length > 1) {
      dstSelect.selectedIndex = dstSelect.options.length - 1;
    }
  }

  updateStatsBar() {
    const nodeCountEl = document.getElementById('canvas-stat-nodes');
    const edgeCountEl = document.getElementById('canvas-stat-edges');
    if (nodeCountEl) nodeCountEl.textContent = this.graph.nodes.size;
    if (edgeCountEl) edgeCountEl.textContent = this.graph.edges.length;
  }

  initModals() {
    // Modal Close buttons
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('open');
      });
    });

    // Click outside modal box to close
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // C Inspector tab switcher
    const cTabs = document.querySelectorAll('.c-modal-tab-btn');
    cTabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        cTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filename = e.currentTarget.dataset.file;
        await this.loadCSourceIntoModal(filename);
      });
    });

    // Copy C Source button
    const copyBtn = document.getElementById('btn-copy-c-source');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeEl = document.getElementById('c-source-code-view');
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent);
          this.showToast('C Source Code copied to clipboard!', 'success');
        }
      });
    }

    // Custom Data Matrix modal opener
    const btnMatrix = document.getElementById('tool-matrix-editor');
    if (btnMatrix) {
      btnMatrix.addEventListener('click', () => this.openMatrixModal());
    }

    const btnMatrixApply = document.getElementById('btn-matrix-apply');
    if (btnMatrixApply) {
      btnMatrixApply.addEventListener('click', () => this.applyMatrixInput());
    }
  }

  async openCInspectorModal() {
    const modal = document.getElementById('c-inspector-modal');
    if (!modal) return;
    modal.classList.add('open');

    // Default to dijkstra.c
    const activeTab = document.querySelector('.c-modal-tab-btn.active');
    const filename = activeTab ? activeTab.dataset.file : 'dijkstra.c';
    await this.loadCSourceIntoModal(filename);
  }

  async loadCSourceIntoModal(filename) {
    const codeEl = document.getElementById('c-source-code-view');
    const titleEl = document.getElementById('c-modal-current-file');
    if (titleEl) titleEl.textContent = filename;
    if (codeEl) codeEl.textContent = '/* Fetching C source from backend filesystem... */';

    const source = await window.greedyCBridge.fetchCSource(filename);
    if (codeEl) codeEl.textContent = source;
  }

  openMatrixModal() {
    const modal = document.getElementById('matrix-modal');
    if (!modal) return;
    modal.classList.add('open');

    // Populate edge list textarea with current graph
    const ta = document.getElementById('edge-list-textarea');
    if (ta) {
      const lines = [];
      for (const e of this.graph.edges) {
        const uNode = this.graph.getNode(e.u);
        const vNode = this.graph.getNode(e.v);
        lines.push(`${uNode ? uNode.label : e.u} ${vNode ? vNode.label : e.v} ${e.weight}`);
      }
      ta.value = lines.join('\n');
    }
  }

  applyMatrixInput() {
    const ta = document.getElementById('edge-list-textarea');
    if (!ta || !ta.value.trim()) return;

    const lines = ta.value.trim().split('\n');
    this.graph.clear();

    const labelToNode = new Map();
    const width = this.renderer.width || 650;
    const height = this.renderer.height || 420;
    const cx = width / 2;
    const cy = height / 2;

    // First collect unique vertex labels
    const labels = new Set();
    const parsedEdges = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const u = parts[0];
        const v = parts[1];
        const w = parseInt(parts[2], 10) || 1;
        labels.add(u);
        labels.add(v);
        parsedEdges.push({ u, v, w });
      }
    }

    const labelArr = Array.from(labels);
    const count = labelArr.length;
    const radius = Math.min(cx, cy) - 60;

    labelArr.forEach((lbl, i) => {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const node = this.graph.addNode(x, y, lbl);
      labelToNode.set(lbl, node);
    });

    for (const e of parsedEdges) {
      const uNode = labelToNode.get(e.u);
      const vNode = labelToNode.get(e.v);
      if (uNode && vNode) {
        this.graph.addEdge(uNode.id, vNode.id, e.w);
      }
    }

    const modal = document.getElementById('matrix-modal');
    if (modal) modal.classList.remove('open');

    this.renderer.render();
    this.updateNodeSelectors();
    this.updateStatsBar();
    this.showToast(`Imported custom graph with ${count} vertices and ${parsedEdges.length} edges.`, 'success');
  }

  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Fallback embedded C sources for in-browser C inspector (used if server is offline)
window.BUNDLED_C_SOURCES = {
  'greedyverse.h': `/* GREEDYVERSE C Header (greedyverse.h) */
#define MAX_VERTICES 64
#define MAX_EDGES 512
#define INF 999999999

typedef struct { int u, v, weight, id; } Edge;
typedef struct { int num_vertices, num_edges; bool is_directed; int adj_matrix[MAX_VERTICES][MAX_VERTICES]; Edge edges[MAX_EDGES]; } Graph;
typedef struct { int step_index, event_type, current_vertex, target_vertex, edge_u, edge_v, edge_weight; int dist[MAX_VERTICES], parent[MAX_VERTICES]; bool visited[MAX_VERTICES]; int mst_weight, dsu_parent[MAX_VERTICES]; char message[384]; } StepTrace;
DijkstraResult run_dijkstra(const Graph* g, int source, int destination);
MSTResult run_prim(const Graph* g, int start_vertex);
MSTResult run_kruskal(const Graph* g);`,

  'dijkstra.c': `/* Dijkstra Algorithm Implementation in ANSI C (O(V^2)) */
#include "greedyverse.h"

DijkstraResult run_dijkstra(const Graph* g, int source, int destination) {
    int V = g->num_vertices;
    int dist[MAX_VERTICES], parent[MAX_VERTICES];
    bool visited[MAX_VERTICES];
    for (int i = 0; i < V; i++) { dist[i] = INF; parent[i] = -1; visited[i] = false; }
    dist[source] = 0;

    for (int count = 0; count < V; count++) {
        int minDist = INF, u = -1;
        for (int v = 0; v < V; v++) {
            if (!visited[v] && dist[v] < minDist) { minDist = dist[v]; u = v; }
        }
        if (u == -1 || minDist == INF) break;
        visited[u] = true;
        if (u == destination) break;

        for (int v = 0; v < V; v++) {
            int weight = g->adj_matrix[u][v];
            if (weight > 0 && !visited[v]) {
                if (dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    parent[v] = u;
                }
            }
        }
    }
}`,

  'prim.c': `/* Prim's MST Algorithm Implementation in ANSI C (O(V^2)) */
#include "greedyverse.h"

MSTResult run_prim(const Graph* g, int start_vertex) {
    int V = g->num_vertices;
    int key[MAX_VERTICES], parent[MAX_VERTICES];
    bool in_mst[MAX_VERTICES];
    for (int i = 0; i < V; i++) { key[i] = INF; parent[i] = -1; in_mst[i] = false; }
    key[start_vertex] = 0;

    for (int count = 0; count < V; count++) {
        int minKey = INF, u = -1;
        for (int v = 0; v < V; v++) {
            if (!in_mst[v] && key[v] < minKey) { minKey = key[v]; u = v; }
        }
        if (u == -1 || minKey == INF) break;
        in_mst[u] = true;

        for (int v = 0; v < V; v++) {
            int weight = g->adj_matrix[u][v];
            if (weight > 0 && !in_mst[v] && weight < key[v]) {
                key[v] = weight;
                parent[v] = u;
            }
        }
    }
}`,

  'kruskal.c': `/* Kruskal's MST with Disjoint Set Union in ANSI C (O(E log E)) */
#include "greedyverse.h"

int dsu_find(DSU* dsu, int i) {
    if (dsu->parent[i] != i) dsu->parent[i] = dsu_find(dsu, dsu->parent[i]);
    return dsu->parent[i];
}

bool dsu_union(DSU* dsu, int x, int y) {
    int rootX = dsu_find(dsu, x), rootY = dsu_find(dsu, y);
    if (rootX == rootY) return false;
    if (dsu->rank[rootX] < dsu->rank[rootY]) dsu->parent[rootX] = rootY;
    else if (dsu->rank[rootX] > dsu->rank[rootY]) dsu->parent[rootY] = rootX;
    else { dsu->parent[rootY] = rootX; dsu->rank[rootX]++; }
    return true;
}`
};

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GreedyverseApp();
});
