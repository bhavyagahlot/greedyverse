/**
 * GREEDYVERSE - Real-World Scenarios Mode
 * 
 * Provides preset interactive case studies:
 * 1. City Route Finder (Dijkstra)
 * 2. College Network Planner (Prim)
 * 3. Telecom Network Designer (Kruskal)
 */

const SCENARIOS = {
  city: {
    id: 'city',
    title: 'City Route Finder',
    algorithm: 'dijkstra',
    tagline: 'Emergency Medical Logistics & Smart Navigation',
    description: 'Find the lowest-latency delivery route between Metropolis and Gotham through interconnected highways and transit bridges.',
    source: 0, // Metropolis
    destination: 5, // Gotham
    setup(graph) {
      graph.clear();
      graph.isDirected = false;

      const n0 = graph.addNode(130, 210, 'Metropolis'); // 0
      const n1 = graph.addNode(280, 100, 'Cyber City'); // 1
      const n2 = graph.addNode(280, 320, 'Silicon Valley'); // 2
      const n3 = graph.addNode(470, 100, 'Neo Tokyo'); // 3
      const n4 = graph.addNode(470, 320, 'Cloud Port'); // 4
      const n5 = graph.addNode(620, 210, 'Gotham'); // 5

      graph.addEdge(n0.id, n1.id, 7); // Metropolis - Cyber City: 7km
      graph.addEdge(n0.id, n2.id, 9); // Metropolis - Silicon Valley: 9km
      graph.addEdge(n1.id, n2.id, 10);
      graph.addEdge(n1.id, n3.id, 15);
      graph.addEdge(n2.id, n4.id, 11);
      graph.addEdge(n3.id, n4.id, 6);
      graph.addEdge(n3.id, n5.id, 9);
      graph.addEdge(n4.id, n5.id, 8);
      graph.addEdge(n1.id, n4.id, 14); // Cross highway
    }
  },

  college: {
    id: 'college',
    title: 'College Campus Fiber Network',
    algorithm: 'prim',
    tagline: 'Campus IT Infrastructure Cabling Optimization',
    description: 'Design the minimum-cost underground fiber-optic layout connecting all university departments starting from the Central Server Room.',
    startVertex: 0, // Server Room
    setup(graph) {
      graph.clear();
      graph.isDirected = false;

      const n0 = graph.addNode(360, 200, 'Server Center'); // 0
      const n1 = graph.addNode(180, 100, 'CS Dept'); // 1
      const n2 = graph.addNode(540, 100, 'Library'); // 2
      const n3 = graph.addNode(160, 310, 'Admin Block'); // 3
      const n4 = graph.addNode(560, 310, 'Engg Hall'); // 4
      const n5 = graph.addNode(360, 360, 'Research Lab'); // 5
      const n6 = graph.addNode(360, 50,  'Sports Arena'); // 6

      graph.addEdge(n0.id, n1.id, 3);
      graph.addEdge(n0.id, n2.id, 4);
      graph.addEdge(n0.id, n3.id, 5);
      graph.addEdge(n0.id, n4.id, 6);
      graph.addEdge(n0.id, n5.id, 2);
      graph.addEdge(n0.id, n6.id, 8);

      graph.addEdge(n1.id, n6.id, 7);
      graph.addEdge(n2.id, n6.id, 5);
      graph.addEdge(n1.id, n3.id, 4);
      graph.addEdge(n2.id, n4.id, 3);
      graph.addEdge(n3.id, n5.id, 6);
      graph.addEdge(n4.id, n5.id, 4);
    }
  },

  telecom: {
    id: 'telecom',
    title: '5G Telecom Backbone Grid',
    algorithm: 'kruskal',
    tagline: 'High-Capacity Microwave Link Topology',
    description: 'Interconnect 7 regional wireless broadcast towers with minimal total microwave link equipment expense while avoiding redundant transmission loops.',
    setup(graph) {
      graph.clear();
      graph.isDirected = false;

      const n0 = graph.addNode(140, 120, 'Tower Alpha'); // 0
      const n1 = graph.addNode(320, 70,  'Tower Beta');  // 1
      const n2 = graph.addNode(520, 100, 'Tower Gamma'); // 2
      const n3 = graph.addNode(150, 300, 'Tower Delta'); // 3
      const n4 = graph.addNode(340, 240, 'Tower Epsilon');//4
      const n5 = graph.addNode(530, 290, 'Tower Zeta');  // 5
      const n6 = graph.addNode(650, 190, 'Tower Eta');   // 6

      graph.addEdge(n0.id, n1.id, 6);
      graph.addEdge(n0.id, n3.id, 5);
      graph.addEdge(n1.id, n4.id, 2);
      graph.addEdge(n1.id, n2.id, 7);
      graph.addEdge(n3.id, n4.id, 3);
      graph.addEdge(n4.id, n5.id, 8);
      graph.addEdge(n2.id, n5.id, 4);
      graph.addEdge(n2.id, n6.id, 3);
      graph.addEdge(n5.id, n6.id, 5);
      graph.addEdge(n3.id, n5.id, 9);
    }
  }
};

class ScenarioManager {
  constructor(graph, renderer, visualizer) {
    this.graph = graph;
    this.renderer = renderer;
    this.visualizer = visualizer;
  }

  loadScenario(key) {
    const sc = SCENARIOS[key];
    if (!sc) return;

    sc.setup(this.graph);
    this.renderer.render();

    // Switch to visualizer view and load algorithm
    window.app.switchTab(sc.algorithm);

    // Update scenario title / banner
    window.app.showToast(`Loaded Scenario: ${sc.title}`, 'success');

    // Auto-trigger run
    setTimeout(() => {
      window.app.runAlgorithm(sc.algorithm, sc.source || sc.startVertex || 0, sc.destination || 0);
    }, 200);
  }
}

window.SCENARIOS = SCENARIOS;
window.ScenarioManager = ScenarioManager;
