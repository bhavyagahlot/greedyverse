/**
 * GREEDYVERSE - Graph Data Structure & Canvas Renderer
 * 
 * Provides crisp Retina/HiDPI HTML5 canvas rendering, glowing nodes/edges,
 * selection waves, weight badges, and geometry calculations.
 */

class GraphNode {
  constructor(id, label, x, y) {
    this.id = id;
    this.label = label || String(id);
    this.x = x;
    this.y = y;
    this.radius = 22;
    
    // Visualization state flags
    this.isCurrent = false;
    this.isVisited = false;
    this.isInMST = false;
    this.isTarget = false;
    this.isSelected = false;
  }
}

class GraphEdge {
  constructor(id, u, v, weight = 1, isDirected = false) {
    this.id = id;
    this.u = u; // Source node ID
    this.v = v; // Target node ID
    this.weight = parseInt(weight, 10);
    this.isDirected = isDirected;

    // Visualization state flags
    this.isExamined = false;
    this.isAccepted = false;
    this.isRejected = false;
    this.isShortestPath = false;
    this.isSelected = false;
  }
}

class Graph {
  constructor(isDirected = false) {
    this.nodes = new Map();
    this.edges = [];
    this.isDirected = isDirected;
    this.nextNodeId = 0;
    this.nextEdgeId = 1;
  }

  clear() {
    this.nodes.clear();
    this.edges = [];
    this.nextNodeId = 0;
    this.nextEdgeId = 1;
  }

  addNode(x, y, label = null) {
    const id = this.nextNodeId++;
    const nodeLabel = label || String.fromCharCode(65 + (id % 26)) + (id >= 26 ? Math.floor(id / 26) : '');
    const node = new GraphNode(id, nodeLabel, x, y);
    this.nodes.set(id, node);
    return node;
  }

  removeNode(id) {
    this.nodes.delete(id);
    // Remove all associated edges
    this.edges = this.edges.filter(e => e.u !== id && e.v !== id);
  }

  addEdge(u, v, weight = 1) {
    if (!this.nodes.has(u) || !this.nodes.has(v)) return null;
    if (u === v) return null; // Prevent self-loops in basic visualizer

    // Check for existing duplicate edge
    const existing = this.edges.find(e => 
      (this.isDirected ? (e.u === u && e.v === v) : 
        ((e.u === u && e.v === v) || (e.u === v && e.v === u)))
    );
    if (existing) {
      existing.weight = parseInt(weight, 10);
      return existing;
    }

    const edge = new GraphEdge(this.nextEdgeId++, u, v, weight, this.isDirected);
    this.edges.push(edge);
    return edge;
  }

  removeEdge(id) {
    this.edges = this.edges.filter(e => e.id !== id);
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getEdge(id) {
    return this.edges.find(e => e.id === id);
  }

  resetVisualStates() {
    for (const node of this.nodes.values()) {
      node.isCurrent = false;
      node.isVisited = false;
      node.isInMST = false;
      node.isTarget = false;
      node.isSelected = false;
    }
    for (const edge of this.edges) {
      edge.isExamined = false;
      edge.isAccepted = false;
      edge.isRejected = false;
      edge.isShortestPath = false;
      edge.isSelected = false;
    }
  }

  // Exports data into the standardized C Graph structure format
  toCGraph() {
    const nodeIds = Array.from(this.nodes.keys()).sort((a, b) => a - b);
    const idToIndex = new Map();
    nodeIds.forEach((id, idx) => idToIndex.set(id, idx));

    const V = nodeIds.length;
    const adj_matrix = Array.from({ length: V }, () => new Array(V).fill(0));
    const cEdges = [];

    for (const edge of this.edges) {
      const uIdx = idToIndex.get(edge.u);
      const vIdx = idToIndex.get(edge.v);
      if (uIdx !== undefined && vIdx !== undefined) {
        adj_matrix[uIdx][vIdx] = edge.weight;
        if (!this.isDirected) {
          adj_matrix[vIdx][uIdx] = edge.weight;
        }
        cEdges.push({
          u: uIdx,
          v: vIdx,
          weight: edge.weight,
          id: edge.id
        });
      }
    }

    return {
      num_vertices: V,
      num_edges: cEdges.length,
      is_directed: this.isDirected,
      adj_matrix,
      edges: cEdges,
      nodeMap: idToIndex,
      indexToNodeId: nodeIds
    };
  }

  // Pre-configured textbook graph (CLRS 5-6 node graph)
  loadSampleGraph(type = 'default') {
    this.clear();
    const w = 680, h = 420;

    if (type === 'default' || type === 'clrs') {
      const n0 = this.addNode(120, 160, 'A'); // 0
      const n1 = this.addNode(280, 80,  'B'); // 1
      const n2 = this.addNode(280, 300, 'C'); // 2
      const n3 = this.addNode(460, 80,  'D'); // 3
      const n4 = this.addNode(460, 300, 'E'); // 4
      const n5 = this.addNode(600, 190, 'F'); // 5

      this.addEdge(n0.id, n1.id, 4);
      this.addEdge(n0.id, n2.id, 2);
      this.addEdge(n1.id, n2.id, 1);
      this.addEdge(n1.id, n3.id, 5);
      this.addEdge(n2.id, n3.id, 8);
      this.addEdge(n2.id, n4.id, 10);
      this.addEdge(n3.id, n4.id, 2);
      this.addEdge(n3.id, n5.id, 6);
      this.addEdge(n4.id, n5.id, 3);
    } else if (type === 'dense') {
      const radius = 170;
      const cx = 350, cy = 210;
      const count = 6;
      const nodes = [];
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        nodes.push(this.addNode(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
      }
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const weight = Math.floor(Math.abs(Math.sin(i * 3 + j) * 12)) + 1;
          this.addEdge(nodes[i].id, nodes[j].id, weight);
        }
      }
    }
  }
}

class CanvasRenderer {
  constructor(canvas, graph) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.graph = graph;
    this.dpr = window.devicePixelRatio || 1;
    this.pulseAngle = 0;
    this.initCanvasSize();
    window.addEventListener('resize', () => this.initCanvasSize());
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.render();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Subtle background grid
    this.drawGrid(ctx);

    // Draw all edges
    for (const edge of this.graph.edges) {
      this.drawEdge(ctx, edge);
    }

    // Draw all nodes
    for (const node of this.graph.nodes.values()) {
      this.drawNode(ctx, node);
    }
  }

  drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEdge(ctx, edge) {
    const u = this.graph.getNode(edge.u);
    const v = this.graph.getNode(edge.v);
    if (!u || !v) return;

    ctx.save();

    let strokeColor = 'rgba(100, 116, 139, 0.35)'; // Default subtle slate
    let lineWidth = 2.5;
    let glow = null;

    if (edge.isShortestPath) {
      strokeColor = '#ffd166'; // Gold
      lineWidth = 4.5;
      glow = 'rgba(255, 209, 102, 0.8)';
    } else if (edge.isAccepted) {
      strokeColor = '#06d6a0'; // Emerald Green
      lineWidth = 4;
      glow = 'rgba(6, 214, 160, 0.8)';
    } else if (edge.isExamined) {
      strokeColor = '#3a86ff'; // Electric Blue
      lineWidth = 3.5;
      glow = 'rgba(58, 134, 255, 0.7)';
    } else if (edge.isRejected) {
      strokeColor = '#ff0054'; // Crimson Red
      lineWidth = 3;
      glow = 'rgba(255, 0, 84, 0.7)';
    } else if (edge.isSelected) {
      strokeColor = '#00f5d4';
      lineWidth = 3.5;
    }

    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12;
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Arrowhead for directed graphs
    if (edge.isDirected) {
      this.drawArrowhead(ctx, u, v, strokeColor);
    }

    // Draw Edge Weight Badge
    this.drawEdgeWeightBadge(ctx, u, v, edge);

    ctx.restore();
  }

  drawArrowhead(ctx, u, v, color) {
    const headlen = 12;
    const angle = Math.atan2(v.y - u.y, v.x - u.x);
    // Offset back by node radius
    const targetX = v.x - (v.radius + 3) * Math.cos(angle);
    const targetY = v.y - (v.radius + 3) * Math.sin(angle);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(targetX - headlen * Math.cos(angle - Math.PI / 6), targetY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(targetX - headlen * Math.cos(angle + Math.PI / 6), targetY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  drawEdgeWeightBadge(ctx, u, v, edge) {
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const text = String(edge.weight);

    ctx.font = '600 12px "Fira Code", monospace';
    const textWidth = ctx.measureText(text).width;
    const padX = 8, padY = 4;
    const boxW = Math.max(22, textWidth + padX * 2);
    const boxH = 18;

    // Badge Background Glass Capsule
    ctx.fillStyle = 'rgba(13, 19, 34, 0.9)';
    ctx.strokeStyle = edge.isAccepted ? '#06d6a0' : (edge.isShortestPath ? '#ffd166' : 'rgba(255, 255, 255, 0.15)');
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH, 9);
    ctx.fill();
    ctx.stroke();

    // Weight Text
    ctx.fillStyle = edge.isAccepted ? '#06d6a0' : (edge.isShortestPath ? '#ffd166' : '#cbd5e1');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY + 0.5);
  }

  drawNode(ctx, node) {
    ctx.save();

    let fillColor = '#1e293b'; // Default surface
    let strokeColor = 'rgba(255, 255, 255, 0.2)';
    let glow = null;

    if (node.isCurrent) {
      fillColor = '#00f5d4'; // Bright Cyan
      strokeColor = '#ffffff';
      glow = 'rgba(0, 245, 212, 0.85)';
    } else if (node.isVisited || node.isInMST) {
      fillColor = '#9d4edd'; // Purple
      strokeColor = '#c77dff';
      glow = 'rgba(157, 78, 221, 0.6)';
    } else if (node.isTarget) {
      fillColor = '#ffd166'; // Gold
      strokeColor = '#ffffff';
      glow = 'rgba(255, 209, 102, 0.8)';
    } else if (node.isSelected) {
      strokeColor = '#00f5d4';
      glow = 'rgba(0, 245, 212, 0.5)';
    }

    // Outer glow ring if highlighted
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Node Body
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.shadowBlur = 0; // reset
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Node Label Text
    ctx.font = '700 13px "Outfit", sans-serif';
    ctx.fillStyle = (node.isCurrent || node.isTarget) ? '#070a13' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y);

    ctx.restore();
  }

  getNodeAt(x, y) {
    for (const node of this.graph.nodes.values()) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= node.radius + 6) {
        return node;
      }
    }
    return null;
  }

  getEdgeAt(x, y) {
    for (const edge of this.graph.edges) {
      const u = this.graph.getNode(edge.u);
      const v = this.graph.getNode(edge.v);
      if (!u || !v) continue;

      const dist = this.distToSegment({ x, y }, u, v);
      if (dist <= 8) {
        return edge;
      }
    }
    return null;
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }
}

window.Graph = Graph;
window.CanvasRenderer = CanvasRenderer;
