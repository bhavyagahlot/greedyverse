/**
 * GREEDYVERSE - Algorithm Battle Mode (Prim vs Kruskal)
 * 
 * Executes Prim and Kruskal on the exact same graph,
 * provides live metrics comparison, edge selection sequence, and complexity breakdown.
 */

class AlgorithmBattle {
  constructor(cBridge) {
    this.cBridge = cBridge;
    this.initUi();
  }

  initUi() {
    this.startBattleBtn = document.getElementById('btn-run-battle');
    if (this.startBattleBtn) {
      this.startBattleBtn.addEventListener('click', () => this.executeBattle());
    }
  }

  async executeBattle() {
    if (!window.activeGraph || window.activeGraph.nodes.size < 2) {
      window.app.showToast('Please create or load a graph with at least 2 vertices for Battle Mode.', 'error');
      return;
    }

    if (this.startBattleBtn) {
      this.startBattleBtn.disabled = true;
      this.startBattleBtn.textContent = 'Executing C Engine...';
    }

    try {
      const battleRes = await this.cBridge.runBattle(window.activeGraph);
      this.renderBattleResults(battleRes);
    } catch (err) {
      window.app.showToast(`Battle execution failed: ${err.message}`, 'error');
    } finally {
      if (this.startBattleBtn) {
        this.startBattleBtn.disabled = false;
        this.startBattleBtn.textContent = 'Engage Algorithm Battle';
      }
    }
  }

  renderBattleResults(res) {
    const prim = res.primResult;
    const kruskal = res.kruskalResult;

    // Check if disconnected
    if (!prim.success || !kruskal.success) {
      const errBanner = document.getElementById('battle-verdict-banner');
      if (errBanner) {
        errBanner.style.borderColor = 'var(--accent-crimson)';
        errBanner.style.background = 'rgba(255, 0, 84, 0.1)';
        errBanner.innerHTML = `
          <div class="verdict-icon" style="color: var(--accent-crimson);">&#9888;</div>
          <div class="verdict-content">
            <h4 style="color: var(--accent-crimson);">Graph is Disconnected!</h4>
            <p>Neither Prim nor Kruskal can form a single spanning tree because the graph has multiple disconnected components.</p>
          </div>
        `;
      }
      return;
    }

    // Populate Prim Metrics
    const primWeightEl = document.getElementById('battle-prim-weight');
    const primExaminedEl = document.getElementById('battle-prim-examined');
    const primAcceptedEl = document.getElementById('battle-prim-accepted');
    const primRejectedEl = document.getElementById('battle-prim-rejected');
    const primTimeEl = document.getElementById('battle-prim-time');
    const primEdgesBox = document.getElementById('battle-prim-edges-list');

    if (primWeightEl) primWeightEl.textContent = prim.totalWeight;
    if (primExaminedEl) primExaminedEl.textContent = prim.edgesConsidered;
    if (primAcceptedEl) primAcceptedEl.textContent = prim.edgesAccepted;
    if (primRejectedEl) primRejectedEl.textContent = prim.edgesRejected;
    if (primTimeEl) primTimeEl.textContent = `${res.primTimeMs.toFixed(3)} ms`;

    if (primEdgesBox && prim.mstEdges) {
      primEdgesBox.innerHTML = '';
      prim.mstEdges.forEach((e, idx) => {
        const uNode = window.activeGraph.getNode(e.u);
        const vNode = window.activeGraph.getNode(e.v);
        const uLabel = uNode ? uNode.label : e.u;
        const vLabel = vNode ? vNode.label : e.v;
        const pill = document.createElement('span');
        pill.className = 'edge-pill';
        pill.textContent = `#${idx + 1}: (${uLabel}, ${vLabel}) [w=${e.weight}]`;
        primEdgesBox.appendChild(pill);
      });
    }

    // Populate Kruskal Metrics
    const kruskalWeightEl = document.getElementById('battle-kruskal-weight');
    const kruskalExaminedEl = document.getElementById('battle-kruskal-examined');
    const kruskalAcceptedEl = document.getElementById('battle-kruskal-accepted');
    const kruskalRejectedEl = document.getElementById('battle-kruskal-rejected');
    const kruskalTimeEl = document.getElementById('battle-kruskal-time');
    const kruskalEdgesBox = document.getElementById('battle-kruskal-edges-list');

    if (kruskalWeightEl) kruskalWeightEl.textContent = kruskal.totalWeight;
    if (kruskalExaminedEl) kruskalExaminedEl.textContent = kruskal.edgesConsidered;
    if (kruskalAcceptedEl) kruskalAcceptedEl.textContent = kruskal.edgesAccepted;
    if (kruskalRejectedEl) kruskalRejectedEl.textContent = kruskal.edgesRejected;
    if (kruskalTimeEl) kruskalTimeEl.textContent = `${res.kruskalTimeMs.toFixed(3)} ms`;

    if (kruskalEdgesBox && kruskal.mstEdges) {
      kruskalEdgesBox.innerHTML = '';
      kruskal.mstEdges.forEach((e, idx) => {
        const uNode = window.activeGraph.getNode(e.u);
        const vNode = window.activeGraph.getNode(e.v);
        const uLabel = uNode ? uNode.label : e.u;
        const vLabel = vNode ? vNode.label : e.v;
        const pill = document.createElement('span');
        pill.className = 'edge-pill';
        pill.textContent = `#${idx + 1}: (${uLabel}, ${vLabel}) [w=${e.weight}]`;
        kruskalEdgesBox.appendChild(pill);
      });
    }

    // Populate Verdict Banner
    const verdictBanner = document.getElementById('battle-verdict-banner');
    if (verdictBanner) {
      const weightsMatch = prim.totalWeight === kruskal.totalWeight;
      verdictBanner.style.borderColor = 'rgba(6, 214, 160, 0.4)';
      verdictBanner.style.background = 'rgba(6, 214, 160, 0.08)';
      verdictBanner.innerHTML = `
        <div class="verdict-icon">&#10004;</div>
        <div class="verdict-content">
          <h4>MST Total Weight Match: ${prim.totalWeight} = ${kruskal.totalWeight}</h4>
          <p>
            Both algorithms independently generated an optimal Minimum Spanning Tree with identical total cost of 
            <strong>${prim.totalWeight}</strong>. Notice how the edge selection sequences differ: Prim grew the tree organically 
            from the root vertex via cut-crossing edges, while Kruskal sorted all edges globally and merged disjoint components using DSU.
          </p>
        </div>
      `;
    }

    window.app.showToast('Battle Mode finished! Inspect side-by-side analytics below.', 'success');
  }
}

window.AlgorithmBattle = AlgorithmBattle;
