/**
 * GREEDYVERSE - Learning Mode Educational Content
 * 
 * Tailored for 3rd-Semester B.Tech DAA & Industrial Programming students.
 * Provides theory, formal greedy proofs, pseudocode, complexities, and worked numerical examples.
 */

const LEARNING_CONTENT = {
  dijkstra: {
    title: "Dijkstra's Shortest Path Algorithm",
    category: "Single-Source Shortest Path (SSSP)",
    tagline: "Locally optimal distance choices lead to globally optimal shortest paths.",
    sections: [
      {
        heading: "1. What is Dijkstra's Algorithm?",
        content: `Dijkstra's algorithm, published by Edsger W. Dijkstra in 1959, finds the shortest path from a designated single source vertex to all other vertices in a weighted graph with non-negative edge weights.`
      },
      {
        heading: "2. Why is it Greedy?",
        content: `Dijkstra demonstrates the <strong>Greedy-Choice Property</strong>: at every step, it extracts the unvisited vertex with the minimum tentative distance. Because all edge weights are strictly non-negative, any alternative path to this vertex must traverse additional edges of non-negative weight, meaning its distance can never be improved later. Hence, the local greedy choice is immediately finalized as globally optimal.`
      },
      {
        heading: "3. Time & Space Complexity",
        content: `
          <table class="complexity-table">
            <thead>
              <tr><th>Implementation</th><th>Time Complexity</th><th>Space Complexity</th><th>Best Use Case</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Adjacency Matrix + Linear Scan</strong></td>
                <td><code>O(V²)</code></td>
                <td><code>O(V²)</code></td>
                <td>Dense graphs (E ≈ V²); simple to implement</td>
              </tr>
              <tr>
                <td><strong>Adjacency List + Min-Heap</strong></td>
                <td><code>O((V + E) log V)</code></td>
                <td><code>O(V + E)</code></td>
                <td>Sparse graphs (E ≪ V²)</td>
              </tr>
              <tr>
                <td><strong>Fibonacci Heap</strong></td>
                <td><code>O(E + V log V)</code></td>
                <td><code>O(V + E)</code></td>
                <td>Theoretical optimum</td>
              </tr>
            </tbody>
          </table>
          <p><em>Standard Academic Note:</em> In our C implementation, we utilize an Adjacency Matrix with a linear minimum scan, providing guaranteed <code>O(V²)</code> time complexity.</p>
        `
      },
      {
        heading: "4. Step-by-Step Pseudocode",
        content: `
          <pre class="code-block"><code>DIJKSTRA(Graph G, Source s):
1.  FOR each vertex v in G.V:
2.      dist[v] = INFINITY
3.      parent[v] = NIL
4.      visited[v] = FALSE
5.  dist[s] = 0
6.
7.  FOR count = 1 to |G.V|:
8.      u = vertex in (G.V - visited) with minimum dist[u]
9.      IF dist[u] == INFINITY:
10.         BREAK   // Remaining vertices are unreachable
11.     visited[u] = TRUE
12.
13.     FOR each neighbor v of u:
14.         IF not visited[v] and dist[u] + weight(u, v) < dist[v]:
15.             dist[v] = dist[u] + weight(u, v)
16.             parent[v] = u
17. RETURN dist, parent</code></pre>
        `
      },
      {
        heading: "5. Critical Limitation: Negative Weights",
        content: `
          <div class="note-box alert">
            <strong>Why Dijkstra fails with negative weights:</strong>
            The greedy assumption assumes that adding an edge to a path can never decrease the path's total length. If negative edges exist, a path that initially appeared longer could later use a negative edge to become shorter, violating the greedy choice property. For graphs with negative weights, the <em>Bellman-Ford algorithm</em> (Dynamic Programming) must be used instead.
          </div>
        `
      }
    ]
  },

  prim: {
    title: "Prim's Minimum Spanning Tree Algorithm",
    category: "Minimum Spanning Tree (MST)",
    tagline: "Grow the tree vertex-by-vertex via the minimum cut-crossing edge.",
    sections: [
      {
        heading: "1. What is Prim's Algorithm?",
        content: `Prim's algorithm (discovered by Jarník in 1930 and independently by Robert Prim in 1957) builds a Minimum Spanning Tree for a connected, undirected weighted graph. It maintains a single tree component and grows it outward until all vertices are included.`
      },
      {
        heading: "2. Why is it Greedy? (The Cut Property)",
        content: `Prim's algorithm relies on the <strong>Cut Property</strong> of Minimum Spanning Trees. Consider a partition (cut) of vertices into two sets: vertices already in the MST (S) and vertices outside the MST (V \\ S). At each iteration, the algorithm greedily selects the lightest edge crossing the cut (S, V \\ S). By the Cut Property theorem, this minimum edge must belong to the graph's Minimum Spanning Tree.`
      },
      {
        heading: "3. Time & Space Complexity",
        content: `
          <table class="complexity-table">
            <thead>
              <tr><th>Implementation</th><th>Time Complexity</th><th>Space Complexity</th><th>Graph Preference</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Adjacency Matrix + Linear Scan</strong></td>
                <td><code>O(V²)</code></td>
                <td><code>O(V²)</code></td>
                <td>Dense graphs (E ≈ V²)</td>
              </tr>
              <tr>
                <td><strong>Adjacency List + Binary Heap</strong></td>
                <td><code>O(E log V)</code></td>
                <td><code>O(V + E)</code></td>
                <td>Sparse graphs</td>
              </tr>
            </tbody>
          </table>
          <p><em>Standard Academic Note:</em> Our C core uses an Adjacency Matrix with linear scan, delivering <code>O(V²)</code> time complexity.</p>
        `
      },
      {
        heading: "4. Step-by-Step Pseudocode",
        content: `
          <pre class="code-block"><code>PRIM(Graph G, Root r):
1.  FOR each vertex v in G.V:
2.      key[v] = INFINITY
3.      parent[v] = NIL
4.      inMST[v] = FALSE
5.  key[r] = 0
6.
7.  FOR count = 1 to |G.V|:
8.      u = vertex in (G.V - inMST) with minimum key[u]
9.      IF key[u] == INFINITY:
10.         REPORT "Graph is disconnected! MST does not exist."
11.     inMST[u] = TRUE
12.
13.     FOR each neighbor v of u:
14.         IF weight(u, v) > 0 and not inMST[v] and weight(u, v) < key[v]:
15.             key[v] = weight(u, v)
16.             parent[v] = u
17. RETURN parent, key</code></pre>
        `
      }
    ]
  },

  kruskal: {
    title: "Kruskal's Minimum Spanning Tree Algorithm",
    category: "Minimum Spanning Tree (MST)",
    tagline: "Sort edges globally and merge disjoint sets using Union-Find.",
    sections: [
      {
        heading: "1. What is Kruskal's Algorithm?",
        content: `Published by Joseph Kruskal in 1956, this algorithm treats each vertex as an independent tree (a forest of singletons). It sorts all edges globally in non-decreasing order of weight and greedily accepts the smallest edge that connects two distinct trees without creating a cycle.`
      },
      {
        heading: "2. Why is it Greedy?",
        content: `Kruskal makes a global greedy choice: at every step, it examines the cheapest available edge in the entire graph. If adding that edge connects two previously disconnected components, it is immediately added to the MST. If both endpoints are already in the same component, adding the edge would produce a closed cycle, so it is permanently rejected.`
      },
      {
        heading: "3. Disjoint Set Union (DSU / Union-Find)",
        content: `To check whether two vertices belong to the same component in nearly constant time, Kruskal uses <strong>Disjoint Set Union (DSU)</strong> with two key optimizations:
          <ul>
            <li><strong>Path Compression:</strong> During <code>find(u)</code>, the parent pointers along the lookup path are updated directly to point to the root.</li>
            <li><strong>Union by Rank:</strong> During <code>union(u, v)</code>, the tree with smaller depth is attached under the root of the tree with greater depth.</li>
          </ul>
          Together, these achieve an amortized time per operation of <code>O(α(V))</code>, where α is the inverse Ackermann function (α(V) < 5 for all practical universe sizes).`
      },
      {
        heading: "4. Time & Space Complexity",
        content: `
          <table class="complexity-table">
            <thead>
              <tr><th>Phase</th><th>Operation</th><th>Time Complexity</th></tr>
            </thead>
            <tbody>
              <tr><td>Sorting</td><td>Quicksort / Mergesort all E edges</td><td><code>O(E log E)</code></td></tr>
              <tr><td>Cycle Detection</td><td>E Find & V-1 Union operations</td><td><code>O(E · α(V))</code></td></tr>
              <tr><td><strong>Overall Time</strong></td><td>Dominated by edge sorting</td><td><code>O(E log E)</code></td></tr>
              <tr><td><strong>Overall Space</strong></td><td>DSU parent & rank arrays + sorted edge list</td><td><code>O(E + V)</code></td></tr>
            </tbody>
          </table>
          <p>Because <code>E ≤ V²</code>, <code>log E ≤ 2 log V</code>, so <code>O(E log E)</code> is asymptotically equivalent to <code>O(E log V)</code>.</p>
        `
      },
      {
        heading: "5. Step-by-Step Pseudocode",
        content: `
          <pre class="code-block"><code>KRUSKAL(Graph G):
1.  MST = empty set
2.  Initialize DSU with |G.V| disjoint sets
3.  SORT G.E in non-decreasing order of weight
4.
5.  FOR each edge (u, v) in sorted G.E:
6.      IF |MST| == |G.V| - 1:
7.          BREAK
8.      rootU = DSU.Find(u)
9.      rootV = DSU.Find(v)
10.     IF rootU != rootV:
11.         MST.Add(u, v)
12.         DSU.Union(rootU, rootV)
13.     ELSE:
14.         REJECT (u, v)  // Would create a cycle!
15.
16. IF |MST| < |G.V| - 1:
17.     REPORT "Graph is disconnected! Formed Spanning Forest."
18. RETURN MST</code></pre>
        `
      }
    ]
  }
};

class LearningEngine {
  constructor() {
    this.currentAlgo = 'dijkstra';
    this.initUi();
  }

  initUi() {
    const tabs = document.querySelectorAll('.learning-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const algo = e.currentTarget.dataset.algo;
        this.renderContent(algo);
      });
    });
  }

  renderContent(algoKey) {
    this.currentAlgo = algoKey;
    const data = LEARNING_CONTENT[algoKey];
    const container = document.getElementById('learning-content-display');
    if (!container || !data) return;

    let html = `
      <div class="learning-article-header">
        <span class="algo-badge-pill">${data.category}</span>
        <h2>${data.title}</h2>
        <p class="tagline">${data.tagline}</p>
      </div>
      <div class="learning-sections-body">
    `;

    for (const sec of data.sections) {
      html += `
        <div class="learning-section-card">
          <h3>${sec.heading}</h3>
          <div>${sec.content}</div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  }
}

window.LEARNING_CONTENT = LEARNING_CONTENT;
window.LearningEngine = LearningEngine;
