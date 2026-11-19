/**
 * GREEDYVERSE - Interactive Graph Editor Controller
 * 
 * Manages canvas user events, tool states (select/drag, add node, add edge, delete),
 * weight editing dialogs, and graph import/export.
 */

class GraphEditor {
  constructor(graph, renderer, options = {}) {
    this.graph = graph;
    this.renderer = renderer;
    this.canvas = renderer.canvas;

    this.mode = 'select'; // 'select' | 'add-node' | 'add-edge' | 'delete'
    this.selectedNode = null;
    this.edgeStartNode = null;
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.hoveredItem = null;

    this.onGraphChanged = options.onGraphChanged || (() => {});
    this.initEventListeners();
    this.initWeightModal();
  }

  setMode(mode) {
    this.mode = mode;
    this.edgeStartNode = null;
    this.selectedNode = null;
    this.graph.resetVisualStates();
    this.renderer.render();

    // Update cursor
    if (mode === 'add-node') this.canvas.style.cursor = 'cell';
    else if (mode === 'add-edge') this.canvas.style.cursor = 'crosshair';
    else if (mode === 'delete') this.canvas.style.cursor = 'not-allowed';
    else this.canvas.style.cursor = 'default';

    // Update hint text
    const hintEl = document.getElementById('canvas-mode-hint');
    if (hintEl) {
      if (mode === 'select') hintEl.textContent = 'Drag nodes to reposition. Click edge to edit weight.';
      else if (mode === 'add-node') hintEl.textContent = 'Click anywhere on canvas to drop a new node.';
      else if (mode === 'add-edge') hintEl.textContent = 'Click first node, then click second node to connect.';
      else if (mode === 'delete') hintEl.textContent = 'Click any node or edge to delete it.';
    }
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  initEventListeners() {
    const c = this.canvas;

    c.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    c.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    c.addEventListener('click', (e) => this.handleClick(e));

    // Touch support for tablets & mobile
    c.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleMouseDown(e);
    }, { passive: false });
    c.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleMouseMove(e);
    }, { passive: false });
    window.addEventListener('touchend', () => this.handleMouseUp());
  }

  handleMouseDown(e) {
    const { x, y } = this.getCanvasCoords(e);
    const node = this.renderer.getNodeAt(x, y);

    if (this.mode === 'select' && node) {
      this.draggedNode = node;
      this.dragOffset = { x: node.x - x, y: node.y - y };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  handleMouseMove(e) {
    const { x, y } = this.getCanvasCoords(e);

    if (this.draggedNode) {
      // Keep within canvas bounds
      const pad = this.draggedNode.radius + 5;
      this.draggedNode.x = Math.max(pad, Math.min(this.renderer.width - pad, x + this.dragOffset.x));
      this.draggedNode.y = Math.max(pad, Math.min(this.renderer.height - pad, y + this.dragOffset.y));
      this.renderer.render();
      return;
    }

    // Hover detection for cursor styling
    if (this.mode === 'select') {
      const node = this.renderer.getNodeAt(x, y);
      const edge = this.renderer.getEdgeAt(x, y);
      if (node) this.canvas.style.cursor = 'grab';
      else if (edge) this.canvas.style.cursor = 'pointer';
      else this.canvas.style.cursor = 'default';
    }
  }

  handleMouseUp() {
    if (this.draggedNode) {
      this.draggedNode = null;
      this.canvas.style.cursor = 'grab';
      this.notifyChange();
    }
  }

  handleClick(e) {
    const { x, y } = this.getCanvasCoords(e);
    const node = this.renderer.getNodeAt(x, y);
    const edge = this.renderer.getEdgeAt(x, y);

    if (this.mode === 'add-node') {
      if (!node) {
        this.graph.addNode(x, y);
        this.renderer.render();
        this.notifyChange();
      }
    } else if (this.mode === 'add-edge') {
      if (node) {
        if (!this.edgeStartNode) {
          this.edgeStartNode = node;
          node.isSelected = true;
          this.renderer.render();
        } else if (this.edgeStartNode.id !== node.id) {
          const u = this.edgeStartNode.id;
          const v = node.id;
          this.edgeStartNode.isSelected = false;
          this.edgeStartNode = null;

          // Open prompt for edge weight
          this.promptEdgeWeight(u, v, x, y, 4);
        } else {
          // Deselect if clicked same node
          node.isSelected = false;
          this.edgeStartNode = null;
          this.renderer.render();
        }
      } else {
        if (this.edgeStartNode) {
          this.edgeStartNode.isSelected = false;
          this.edgeStartNode = null;
          this.renderer.render();
        }
      }
    } else if (this.mode === 'delete') {
      if (node) {
        this.graph.removeNode(node.id);
        this.renderer.render();
        this.notifyChange();
      } else if (edge) {
        this.graph.removeEdge(edge.id);
        this.renderer.render();
        this.notifyChange();
      }
    } else if (this.mode === 'select') {
      if (edge) {
        const u = this.graph.getNode(edge.u);
        const v = this.graph.getNode(edge.v);
        const midX = (u.x + v.x) / 2;
        const midY = (u.y + v.y) / 2;
        this.promptEdgeWeight(edge.u, edge.v, midX, midY, edge.weight, edge.id);
      }
    }
  }

  initWeightModal() {
    this.weightPrompt = document.getElementById('weight-prompt-dialog');
    this.weightInput = document.getElementById('weight-prompt-input');
    this.weightConfirmBtn = document.getElementById('weight-prompt-ok');
    this.weightCancelBtn = document.getElementById('weight-prompt-cancel');

    if (!this.weightConfirmBtn) return;

    this.weightConfirmBtn.addEventListener('click', () => this.confirmWeight());
    this.weightCancelBtn.addEventListener('click', () => this.hideWeightPrompt());
    this.weightInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.confirmWeight();
      if (e.key === 'Escape') this.hideWeightPrompt();
    });
  }

  promptEdgeWeight(u, v, px, py, defaultWeight = 4, edgeId = null) {
    this.pendingEdge = { u, v, edgeId };
    if (!this.weightPrompt) return;

    this.weightPrompt.classList.add('show');
    // Position dialog near the edge
    const canvasRect = this.canvas.getBoundingClientRect();
    const left = Math.min(canvasRect.width - 150, Math.max(10, px - 60));
    const top = Math.min(canvasRect.height - 80, Math.max(10, py - 40));
    this.weightPrompt.style.left = `${left}px`;
    this.weightPrompt.style.top = `${top}px`;

    this.weightInput.value = defaultWeight;
    this.weightInput.focus();
    this.weightInput.select();
  }

  confirmWeight() {
    if (!this.pendingEdge) return;
    const val = parseInt(this.weightInput.value, 10);
    const weight = isNaN(val) ? 1 : val;

    if (this.pendingEdge.edgeId) {
      const edge = this.graph.getEdge(this.pendingEdge.edgeId);
      if (edge) edge.weight = weight;
    } else {
      this.graph.addEdge(this.pendingEdge.u, this.pendingEdge.v, weight);
    }

    this.hideWeightPrompt();
    this.renderer.render();
    this.notifyChange();
  }

  hideWeightPrompt() {
    if (this.weightPrompt) this.weightPrompt.classList.remove('show');
    this.pendingEdge = null;
    this.renderer.render();
  }

  generateRandomGraph(vertexCount = 6, edgeProbability = 0.45) {
    this.graph.clear();
    const width = this.renderer.width || 650;
    const height = this.renderer.height || 420;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 60;

    const nodes = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i * 2 * Math.PI) / vertexCount;
      const jitterX = (Math.random() - 0.5) * 30;
      const jitterY = (Math.random() - 0.5) * 30;
      const x = cx + radius * Math.cos(angle) + jitterX;
      const y = cy + radius * Math.sin(angle) + jitterY;
      nodes.push(this.graph.addNode(x, y));
    }

    // Ensure connectivity: generate a random spanning tree first
    const connected = [0];
    const remaining = Array.from({ length: vertexCount - 1 }, (_, i) => i + 1);

    while (remaining.length > 0) {
      const rIdx = Math.floor(Math.random() * remaining.length);
      const nextNode = remaining.splice(rIdx, 1)[0];
      const cNode = connected[Math.floor(Math.random() * connected.length)];
      const w = Math.floor(Math.random() * 9) + 1;
      this.graph.addEdge(nodes[cNode].id, nodes[nextNode].id, w);
      connected.push(nextNode);
    }

    // Add extra random edges based on probability
    for (let i = 0; i < vertexCount; i++) {
      for (let j = i + 1; j < vertexCount; j++) {
        if (Math.random() < edgeProbability) {
          const w = Math.floor(Math.random() * 12) + 1;
          this.graph.addEdge(nodes[i].id, nodes[j].id, w);
        }
      }
    }

    this.renderer.render();
    this.notifyChange();
  }

  notifyChange() {
    this.onGraphChanged(this.graph);
  }
}

window.GraphEditor = GraphEditor;
