/**
 * GREEDYVERSE - Step-by-Step Algorithm Visualizer & Animation Controller
 * 
 * Drives interactive playback, stepping, narration updates, and state table reflections.
 */

class AlgorithmVisualizer {
  constructor(graph, renderer) {
    this.graph = graph;
    this.renderer = renderer;

    this.steps = [];
    this.currentStepIdx = 0;
    this.isPlaying = false;
    this.playbackInterval = null;
    this.speed = 1.0; // 1x = 1000ms per step
    this.algorithmName = 'dijkstra';
    this.finalResult = null;

    this.initUiElements();
  }

  initUiElements() {
    this.playPauseBtn = document.getElementById('btn-play-pause');
    this.nextBtn = document.getElementById('btn-step-next');
    this.prevBtn = document.getElementById('btn-step-prev');
    this.resetBtn = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedValue = document.getElementById('speed-value');

    this.stepCounter = document.getElementById('step-counter-text');
    this.stepProgressFill = document.getElementById('step-progress-fill');
    this.narrationTitle = document.getElementById('narration-title');
    this.narrationBadge = document.getElementById('narration-badge');
    this.narrationText = document.getElementById('narration-text');

    this.metricValue1 = document.getElementById('metric-value-1');
    this.metricValue2 = document.getElementById('metric-value-2');

    if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.stepNext());
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.stepPrev());
    if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());

    if (this.speedSlider) {
      this.speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.speed = val;
        if (this.speedValue) this.speedValue.textContent = `${val.toFixed(1)}x`;
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    }
  }

  loadExecution(algorithmName, result) {
    this.pause();
    this.algorithmName = algorithmName;
    this.finalResult = result;
    this.steps = result.steps || [];
    this.currentStepIdx = 0;

    if (!result.success && result.errorMessage) {
      this.showToast(result.errorMessage, 'error');
    }

    this.updateControlsState();
    this.renderCurrentStep();
    this.renderStateTableHeaders();
  }

  togglePlayPause() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    if (this.steps.length === 0) return;
    if (this.currentStepIdx >= this.steps.length - 1) {
      this.currentStepIdx = 0; // Loop around if reached end
    }
    this.isPlaying = true;
    this.updatePlayPauseIcon();

    const delay = Math.max(150, 1000 / this.speed);
    this.playbackInterval = setInterval(() => {
      if (this.currentStepIdx < this.steps.length - 1) {
        this.stepNext();
      } else {
        this.pause();
      }
    }, delay);
  }

  pause() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.updatePlayPauseIcon();
  }

  stepNext() {
    if (this.currentStepIdx < this.steps.length - 1) {
      this.currentStepIdx++;
      this.renderCurrentStep();
      this.updateControlsState();
    }
  }

  stepPrev() {
    if (this.currentStepIdx > 0) {
      this.currentStepIdx--;
      this.renderCurrentStep();
      this.updateControlsState();
    }
  }

  reset() {
    this.pause();
    this.currentStepIdx = 0;
    this.renderCurrentStep();
    this.updateControlsState();
  }

  updatePlayPauseIcon() {
    if (!this.playPauseBtn) return;
    if (this.isPlaying) {
      this.playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause symbol
      this.playPauseBtn.title = 'Pause Animation';
    } else {
      this.playPauseBtn.innerHTML = '&#9654;'; // Play symbol
      this.playPauseBtn.title = 'Play Animation';
    }
  }

  updateControlsState() {
    const total = this.steps.length;
    if (this.prevBtn) this.prevBtn.disabled = this.currentStepIdx <= 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentStepIdx >= total - 1;
    if (this.playPauseBtn) this.playPauseBtn.disabled = total === 0;

    if (this.stepCounter) {
      this.stepCounter.textContent = total > 0 ? `Step ${this.currentStepIdx + 1} / ${total}` : 'Step 0 / 0';
    }
    if (this.stepProgressFill) {
      const pct = total > 1 ? (this.currentStepIdx / (total - 1)) * 100 : (total === 1 ? 100 : 0);
      this.stepProgressFill.style.width = `${pct}%`;
    }
  }

  renderCurrentStep() {
    if (this.steps.length === 0) return;
    const step = this.steps[this.currentStepIdx];
    const isFinalStep = this.currentStepIdx === this.steps.length - 1;

    // Reset all visual state flags
    this.graph.resetVisualStates();

    // Replay state from start up to current step
    for (let i = 0; i <= this.currentStepIdx; i++) {
      const s = this.steps[i];

      // Highlight visited vertices
      if (s.visited) {
        s.visited.forEach((v, idx) => {
          const node = this.graph.getNode(idx);
          if (node && v) {
            if (this.algorithmName === 'prim') node.isInMST = true;
            else node.isVisited = true;
          }
        });
      }

      // Accepted edges
      if (s.type === 5 /* EVENT_ADD_MST_EDGE */) {
        const edge = this.findGraphEdge(s.edge.u, s.edge.v);
        if (edge) edge.isAccepted = true;
      }
    }

    // Apply transient highlights for the CURRENT step
    if (step.current !== -1) {
      const currNode = this.graph.getNode(step.current);
      if (currNode) currNode.isCurrent = true;
    }

    if (step.edge && step.edge.u !== -1 && step.edge.v !== -1) {
      const activeEdge = this.findGraphEdge(step.edge.u, step.edge.v);
      if (activeEdge) {
        if (step.type === 2 /* EXAMINE */) activeEdge.isExamined = true;
        else if (step.type === 3 /* RELAX */) activeEdge.isExamined = true;
        else if (step.type === 5 /* ADD_MST */) activeEdge.isAccepted = true;
        else if (step.type === 7 /* CYCLE */) activeEdge.isRejected = true;
      }
    }

    // If final step of Dijkstra, highlight the complete shortest path in Gold
    if (isFinalStep && this.algorithmName === 'dijkstra' && this.finalResult.path) {
      const p = this.finalResult.path;
      for (let i = 0; i < p.length - 1; i++) {
        const edge = this.findGraphEdge(p[i], p[i + 1]);
        if (edge) edge.isShortestPath = true;
        const n = this.graph.getNode(p[i]);
        if (n) n.isTarget = true;
      }
      const lastNode = this.graph.getNode(p[p.length - 1]);
      if (lastNode) lastNode.isTarget = true;
    }

    // Render Canvas
    this.renderer.render();

    // Update Narration Box
    this.updateNarration(step);

    // Update Distance / Key Array Table
    this.updateStateTable(step);

    // Update DSU Visualizer (for Kruskal)
    this.updateDsuDisplay(step);

    // Update HUD Metrics
    this.updateMetrics(step);
  }

  findGraphEdge(u, v) {
    return this.graph.edges.find(e => 
      (e.u === u && e.v === v) || (!this.graph.isDirected && (e.u === v && e.v === u))
    );
  }

  updateNarration(step) {
    if (!this.narrationText) return;

    const eventNames = {
      0: 'Initialization',
      1: 'Greedy Minimum Selected',
      2: 'Examining Edge',
      3: 'Edge Relaxation',
      4: 'Vertex Finalized',
      5: 'Edge Added to MST',
      6: 'Edge Rejected',
      7: 'Cycle Detected!',
      8: 'Shortest Path Reached',
      9: 'Algorithm Complete',
      10: 'Graph Disconnected Alert'
    };

    if (this.narrationTitle) {
      this.narrationTitle.textContent = eventNames[step.type] || 'Execution Step';
    }
    if (this.narrationBadge) {
      this.narrationBadge.textContent = `Event #${step.type}`;
    }
    this.narrationText.textContent = step.message || 'Processing algorithm event.';
  }

  updateMetrics(step) {
    if (this.algorithmName === 'dijkstra') {
      if (this.metricValue1) {
        const dest = this.finalResult ? this.finalResult.destination : 0;
        const cost = step.dist && step.dist[dest] !== undefined ? (step.dist[dest] === -1 || step.dist[dest] === 999999999 ? 'INF' : step.dist[dest]) : '0';
        this.metricValue1.textContent = cost;
      }
      if (this.metricValue2) {
        const visitedCount = step.visited ? step.visited.filter(Boolean).length : 0;
        this.metricValue2.textContent = `${visitedCount} / ${this.graph.nodes.size}`;
      }
    } else {
      // Prim or Kruskal
      if (this.metricValue1) {
        this.metricValue1.textContent = step.mstWeight !== undefined ? step.mstWeight : '0';
      }
      if (this.metricValue2) {
        const accepted = this.steps.slice(0, this.currentStepIdx + 1).filter(s => s.type === 5).length;
        this.metricValue2.textContent = `${accepted} / ${Math.max(0, this.graph.nodes.size - 1)}`;
      }
    }
  }

  renderStateTableHeaders() {
    const tableHead = document.getElementById('state-table-head');
    const tableBody = document.getElementById('state-table-body');
    if (!tableHead || !tableBody) return;

    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <th>Vertex</th>
      <th>${this.algorithmName === 'dijkstra' ? 'Shortest Dist' : (this.algorithmName === 'prim' ? 'Key (Weight)' : 'Set ID')}</th>
      <th>Parent / Via</th>
      <th>Status</th>
    `;
    tableHead.appendChild(tr);

    for (const node of this.graph.nodes.values()) {
      const row = document.createElement('tr');
      row.id = `state-row-${node.id}`;
      row.innerHTML = `
        <td><strong>${node.label} (${node.id})</strong></td>
        <td id="state-val-${node.id}">INF</td>
        <td id="state-parent-${node.id}">-</td>
        <td id="state-status-${node.id}"><span class="badge">Unvisited</span></td>
      `;
      tableBody.appendChild(row);
    }
  }

  updateStateTable(step) {
    for (const node of this.graph.nodes.values()) {
      const valCell = document.getElementById(`state-val-${node.id}`);
      const parentCell = document.getElementById(`state-parent-${node.id}`);
      const statusCell = document.getElementById(`state-status-${node.id}`);
      const row = document.getElementById(`state-row-${node.id}`);

      if (!valCell) continue;

      if (row) {
        if (step.current === node.id) row.classList.add('active-row');
        else row.classList.remove('active-row');
      }

      if (this.algorithmName === 'kruskal') {
        if (step.dsuParent && step.dsuParent[node.id] !== undefined) {
          valCell.textContent = `Set ${step.dsuParent[node.id]}`;
          parentCell.textContent = `Parent ${step.dsuParent[node.id]}`;
          statusCell.innerHTML = `<span style="color: #c77dff;">DSU Node</span>`;
        }
      } else {
        if (step.dist && step.dist[node.id] !== undefined) {
          const d = step.dist[node.id];
          valCell.textContent = (d === -1 || d === 999999999) ? 'INF' : d;
        }

        if (step.parent && step.parent[node.id] !== undefined) {
          const p = step.parent[node.id];
          if (p !== -1) {
            const pNode = this.graph.getNode(p);
            parentCell.textContent = pNode ? `${pNode.label} (${p})` : p;
          } else {
            parentCell.textContent = '-';
          }
        }

        if (statusCell && step.visited) {
          const isDone = step.visited[node.id];
          if (isDone) {
            statusCell.innerHTML = `<span style="color: #06d6a0;">${this.algorithmName === 'prim' ? 'In Tree' : 'Finalized'}</span>`;
          } else {
            statusCell.innerHTML = `<span style="color: #94a3b8;">Unvisited</span>`;
          }
        }
      }
    }
  }

  updateDsuDisplay(step) {
    const dsuContainer = document.getElementById('dsu-visualizer-panel');
    if (!dsuContainer) return;

    if (this.algorithmName !== 'kruskal' || !step.dsuParent) {
      dsuContainer.style.display = 'none';
      return;
    }

    dsuContainer.style.display = 'block';
    const chipsBox = document.getElementById('dsu-chips-container');
    if (!chipsBox) return;

    chipsBox.innerHTML = '';
    // Group vertices by parent root
    const sets = new Map();
    for (let i = 0; i < step.dsuParent.length; i++) {
      const p = step.dsuParent[i];
      if (!sets.has(p)) sets.set(p, []);
      const n = this.graph.getNode(i);
      sets.get(p).push(n ? n.label : i);
    }

    for (const [root, members] of sets.entries()) {
      const chip = document.createElement('div');
      chip.className = 'dsu-chip';
      const rootNode = this.graph.getNode(root);
      const rootLabel = rootNode ? rootNode.label : root;
      chip.innerHTML = `<strong>Set ${rootLabel}:</strong> { ${members.join(', ')} }`;
      chipsBox.appendChild(chip);
    }
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
    }, 4500);
  }
}

window.AlgorithmVisualizer = AlgorithmVisualizer;
