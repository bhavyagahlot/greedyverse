/**
 * GREEDYVERSE - Interactive Quiz & Challenge Engine
 * 
 * Tests students on Greedy Choice Properties, Time Complexities,
 * Cycle Detection, and Edge Weight Scenarios.
 */

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What is the critical constraint on edge weights for Dijkstra's Algorithm to guarantee correct shortest paths?",
    options: [
      "All edge weights must be strictly integers.",
      "All edge weights must be non-negative (weight ≥ 0).",
      "The graph must have no cycles.",
      "All edge weights must be distinct."
    ],
    correctIndex: 1,
    explanation: "Dijkstra's greedy choice relies on the fact that once a vertex is finalized, adding more edges can never decrease its distance. If negative edge weights exist, a longer-looking path could become shorter later, breaking the greedy guarantee."
  },
  {
    id: 2,
    question: "Which data structure enables Kruskal's algorithm to perform cycle detection and set merges in near-constant amortized time O(α(V))?",
    options: [
      "Red-Black Tree",
      "Disjoint Set Union (DSU / Union-Find)",
      "Min-Priority Queue",
      "Adjacency Matrix"
    ],
    correctIndex: 1,
    explanation: "Disjoint Set Union (DSU) with Path Compression and Union by Rank achieves O(α(V)) amortized time per operation, allowing Kruskal to efficiently check if two vertices are in the same component."
  },
  {
    id: 3,
    question: "For a connected undirected graph with 7 vertices and 12 edges, exactly how many edges will its Minimum Spanning Tree contain?",
    options: [
      "12 edges",
      "7 edges",
      "6 edges",
      "5 edges"
    ],
    correctIndex: 2,
    explanation: "A spanning tree on V vertices always contains exactly V - 1 edges. With 7 vertices, the MST must contain exactly 7 - 1 = 6 edges."
  },
  {
    id: 4,
    question: "What is the standard time complexity of Prim's algorithm when implemented with an Adjacency Matrix and linear scan for minimum key?",
    options: [
      "O(V²)",
      "O(E log V)",
      "O(V log V)",
      "O(E + V)"
    ],
    correctIndex: 0,
    explanation: "With an adjacency matrix, finding the minimum key takes O(V) across V iterations, and updating neighbor keys takes O(V) per iteration, resulting in O(V²) total time."
  },
  {
    id: 5,
    question: "Kruskal is examining edge (A, C, w=5). Current DSU find operations return Find(A) = 2 and Find(C) = 2. What will Kruskal do?",
    options: [
      "Accept the edge because its weight is small.",
      "Reject the edge because both vertices already belong to the same component, forming a cycle.",
      "Update key[C] = 5.",
      "Halt the algorithm with an error."
    ],
    correctIndex: 1,
    explanation: "When Find(u) == Find(v), both endpoints are already connected within the same connected component. Adding the edge would create a cycle, so Kruskal rejects it."
  },
  {
    id: 6,
    question: "Can Prim's algorithm and Kruskal's algorithm select different edges on the same graph?",
    options: [
      "No, they must always select the exact same edge set.",
      "Yes, if there are equal edge weights, but the total MST weight is always identical.",
      "Yes, and their total MST weights will also be different.",
      "Only if the graph is directed."
    ],
    correctIndex: 1,
    explanation: "Both algorithms are mathematically guaranteed to output an optimal MST with the exact same total weight. However, when edges have identical weights or different tie-breaking orders, the specific subset of edges selected can vary."
  },
  {
    id: 7,
    question: "For a very dense graph where E ≈ V², which algorithm is theoretically faster when using standard textbook matrix/DSU implementations?",
    options: [
      "Kruskal's algorithm (O(E log E))",
      "Prim's algorithm with Adjacency Matrix (O(V²))",
      "Both have identical O(V³) complexity",
      "Dijkstra's algorithm"
    ],
    correctIndex: 1,
    explanation: "In a dense graph, E ≈ V². Kruskal requires sorting E edges, taking O(V² log(V²)) = O(V² log V). Prim with an adjacency matrix runs in O(V²), making Prim faster for dense graphs."
  },
  {
    id: 8,
    question: "What happens if you run Prim's or Kruskal's algorithm on a graph that is disconnected (has 2 or more isolated components)?",
    options: [
      "It automatically connects the disconnected components with zero-weight dummy edges.",
      "It throws an unhandled segmentation fault.",
      "It cannot form a Minimum Spanning Tree spanning all vertices; it produces a Spanning Forest with fewer than V - 1 edges.",
      "It loops indefinitely."
    ],
    correctIndex: 2,
    explanation: "A spanning tree by definition must span all vertices in a single connected tree. On a disconnected graph, no spanning tree exists. The result is a Spanning Forest with strictly fewer than V - 1 edges."
  }
];

class QuizEngine {
  constructor() {
    this.currentQuestionIdx = 0;
    this.score = 0;
    this.userAnswers = [];
    this.initUi();
  }

  initUi() {
    this.container = document.getElementById('quiz-container');
    this.renderQuestion();
  }

  renderQuestion() {
    if (!this.container) return;

    if (this.currentQuestionIdx >= QUIZ_QUESTIONS.length) {
      this.renderResults();
      return;
    }

    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];
    const total = QUIZ_QUESTIONS.length;

    this.container.innerHTML = `
      <div class="quiz-card glass-panel" style="padding: 2rem; max-width: 720px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-mono);">
          <span>Question ${this.currentQuestionIdx + 1} of ${total}</span>
          <span>Score: ${this.score} / ${this.currentQuestionIdx}</span>
        </div>
        <div class="progress-track" style="margin-bottom: 1.5rem;">
          <div class="progress-fill" style="width: ${((this.currentQuestionIdx) / total) * 100}%;"></div>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.35rem; margin-bottom: 1.5rem;">${q.question}</h3>
        <div class="quiz-options-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${q.options.map((opt, i) => `
            <button class="btn btn-ghost quiz-opt-btn" data-index="${i}" style="text-align: left; justify-content: flex-start; padding: 0.85rem 1.25rem;">
              <strong style="margin-right: 0.5rem; color: var(--neon-cyan);">${String.fromCharCode(65 + i)}.</strong> ${opt}
            </button>
          `).join('')}
        </div>
        <div id="quiz-feedback-box" style="margin-top: 1.5rem; display: none;"></div>
      </div>
    `;

    const buttons = this.container.querySelectorAll('.quiz-opt-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedIdx = parseInt(e.currentTarget.dataset.index, 10);
        this.handleAnswer(selectedIdx, buttons);
      });
    });
  }

  handleAnswer(selectedIdx, buttons) {
    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];
    const isCorrect = selectedIdx === q.correctIndex;
    if (isCorrect) this.score++;

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) {
        btn.style.borderColor = 'var(--accent-emerald)';
        btn.style.background = 'rgba(6, 214, 160, 0.2)';
        btn.style.color = '#a7f3d0';
      } else if (idx === selectedIdx && !isCorrect) {
        btn.style.borderColor = 'var(--accent-crimson)';
        btn.style.background = 'rgba(255, 0, 84, 0.2)';
        btn.style.color = '#fecdd3';
      }
    });

    const fb = document.getElementById('quiz-feedback-box');
    if (fb) {
      fb.style.display = 'block';
      fb.className = `alert-box ${isCorrect ? 'success' : 'alert'}`;
      fb.innerHTML = `
        <div style="font-weight: 700; color: ${isCorrect ? 'var(--accent-emerald)' : 'var(--accent-crimson)'}; margin-bottom: 0.35rem;">
          ${isCorrect ? '&#10004; Correct!' : '&#10008; Incorrect'}
        </div>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 1rem;">${q.explanation}</p>
        <button class="btn btn-primary btn-sm" id="btn-quiz-next">
          ${this.currentQuestionIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question &rarr;' : 'View Final Score'}
        </button>
      `;

      document.getElementById('btn-quiz-next').addEventListener('click', () => {
        this.currentQuestionIdx++;
        this.renderQuestion();
      });
    }
  }

  renderResults() {
    const total = QUIZ_QUESTIONS.length;
    const pct = Math.round((this.score / total) * 100);

    let grade = 'Master of Greedy Algorithms';
    if (pct < 60) grade = 'Greedy Apprentice';
    else if (pct < 85) grade = 'Algorithm Practitioner';

    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 3rem 2rem; max-width: 650px; margin: 0 auto; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">&#127891;</div>
        <h2 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 0.5rem;">Quiz Completed!</h2>
        <p style="color: var(--neon-cyan); font-weight: 700; font-size: 1.25rem; margin-bottom: 1rem;">${grade}</p>
        <div style="font-size: 2.75rem; font-family: var(--font-mono); font-weight: 800; color: #fff; margin-bottom: 1.5rem;">
          ${this.score} / ${total} <span style="font-size: 1.25rem; color: var(--text-muted);">(${pct}%)</span>
        </div>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 2rem; font-size: 0.95rem;">
          You have mastered core Greedy Method principles: Dijkstra's relaxation, Prim's cut-crossing selection, and Kruskal's DSU cycle detection.
        </p>
        <button class="btn btn-primary" id="btn-quiz-retake">
          Retake Challenge
        </button>
      </div>
    `;

    document.getElementById('btn-quiz-retake').addEventListener('click', () => {
      this.currentQuestionIdx = 0;
      this.score = 0;
      this.renderQuestion();
    });
  }
}

window.QuizEngine = QuizEngine;
