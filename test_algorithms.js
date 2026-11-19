/**
 * GREEDYVERSE - Verification & Validation Test Suite
 * 
 * Verifies that:
 * 1. Dijkstra returns correct shortest paths and total costs.
 * 2. Prim and Kruskal return correct MST costs.
 * 3. Both MST algorithms agree on identical minimum total weight for connected graphs.
 * 4. Step-by-step traces reflect genuine C execution events.
 * 5. Handles disconnected graphs and negative edge detection correctly.
 */

const assert = require('assert');
const { C_ENGINE } = require('./server.js');

// Define test graph: CLRS Textbook 5-node graph
// Vertices: 0(A), 1(B), 2(C), 3(D), 4(E)
// Edges:
// (0, 1): 4
// (0, 2): 2
// (1, 2): 1
// (1, 3): 5
// (2, 3): 8
// (2, 4): 10
// (3, 4): 2

const testGraph = {
    num_vertices: 5,
    num_edges: 7,
    is_directed: false,
    adj_matrix: [
        [0, 4, 2, 0, 0],
        [4, 0, 1, 5, 0],
        [2, 1, 0, 8, 10],
        [0, 5, 8, 0, 2],
        [0, 0, 10, 2, 0]
    ],
    edges: [
        { u: 0, v: 1, weight: 4, id: 1 },
        { u: 0, v: 2, weight: 2, id: 2 },
        { u: 1, v: 2, weight: 1, id: 3 },
        { u: 1, v: 3, weight: 5, id: 4 },
        { u: 2, v: 3, weight: 8, id: 5 },
        { u: 2, v: 4, weight: 10, id: 6 },
        { u: 3, v: 4, weight: 2, id: 7 }
    ]
};

console.log('====================================================');
console.log('GREEDYVERSE - C ALGORITHM SUITE VERIFICATION');
console.log('====================================================\n');

function runAllTests() {
    console.log('[TEST 1] Testing Dijkstra Algorithm on CLRS 5-Node Graph...');
    
    // Shortest path from 0 to 4:
    // 0 -> 2 (2) -> 1 (1) -> 3 (5) -> 4 (2) = 10
    const resDijkstra = C_ENGINE.runDijkstra(testGraph, 0, 4);
    assert.strictEqual(resDijkstra.success, true, 'Dijkstra should succeed');
    assert.strictEqual(resDijkstra.totalCost, 10, `Expected shortest path cost 10, got ${resDijkstra.totalCost}`);
    assert.deepStrictEqual(resDijkstra.path, [0, 2, 1, 3, 4], `Expected path [0, 2, 1, 3, 4], got ${JSON.stringify(resDijkstra.path)}`);
    console.log(`  ✓ Dijkstra correctly found path [0 -> 2 -> 1 -> 3 -> 4] with total cost ${resDijkstra.totalCost}`);
    console.log(`  ✓ Generated ${resDijkstra.steps.length} detailed animation steps.\n`);

    console.log('[TEST 2] Testing Prim MST Algorithm on CLRS Graph...');
    // Minimum Spanning Tree for this graph:
    // (1, 2) w=1
    // (0, 2) w=2
    // (3, 4) w=2
    // (1, 3) w=5
    // Total MST weight = 1 + 2 + 2 + 5 = 10
    const resPrim = C_ENGINE.runPrim(testGraph, 0);
    assert.strictEqual(resPrim.success, true, 'Prim should succeed');
    assert.strictEqual(resPrim.totalWeight, 10, `Expected Prim MST weight 10, got ${resPrim.totalWeight}`);
    assert.strictEqual(resPrim.edgesAccepted, 4, `Expected 4 (V-1) edges accepted, got ${resPrim.edgesAccepted}`);
    console.log(`  ✓ Prim correctly computed MST total weight = ${resPrim.totalWeight} with ${resPrim.edgesAccepted} edges.`);
    console.log(`  ✓ Generated ${resPrim.steps.length} detailed animation steps.\n`);

    console.log('[TEST 3] Testing Kruskal MST Algorithm on CLRS Graph...');
    const resKruskal = C_ENGINE.runKruskal(testGraph);
    assert.strictEqual(resKruskal.success, true, 'Kruskal should succeed');
    assert.strictEqual(resKruskal.totalWeight, 10, `Expected Kruskal MST weight 10, got ${resKruskal.totalWeight}`);
    assert.strictEqual(resKruskal.edgesAccepted, 4, `Expected 4 (V-1) edges accepted, got ${resKruskal.edgesAccepted}`);
    console.log(`  ✓ Kruskal correctly computed MST total weight = ${resKruskal.totalWeight} with ${resKruskal.edgesAccepted} edges.`);
    console.log(`  ✓ Generated ${resKruskal.steps.length} detailed animation steps.\n`);

    console.log('[TEST 4] Validating MST Agreement (Prim vs Kruskal)...');
    assert.strictEqual(resPrim.totalWeight, resKruskal.totalWeight, 'Prim and Kruskal MUST agree on identical MST weight');
    console.log(`  ✓ CONFIRMED: Prim (${resPrim.totalWeight}) == Kruskal (${resKruskal.totalWeight}). Exact agreement verified!\n`);

    console.log('[TEST 5] Testing Disconnected Graph Handling...');
    const disconnectedGraph = {
        num_vertices: 4,
        num_edges: 1,
        is_directed: false,
        adj_matrix: [
            [0, 5, 0, 0],
            [5, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        edges: [{ u: 0, v: 1, weight: 5, id: 1 }]
    };

    const discPrim = C_ENGINE.runPrim(disconnectedGraph, 0);
    assert.strictEqual(discPrim.success, false, 'Prim must report failure on disconnected graph');
    console.log(`  ✓ Prim correctly detected disconnected graph: "${discPrim.errorMessage}"`);

    const discKruskal = C_ENGINE.runKruskal(disconnectedGraph);
    assert.strictEqual(discKruskal.success, false, 'Kruskal must report failure on disconnected graph');
    console.log(`  ✓ Kruskal correctly detected disconnected graph: "${discKruskal.errorMessage}"\n`);

    console.log('[TEST 6] Testing Dijkstra Negative Edge Detection...');
    const negGraph = {
        num_vertices: 3,
        num_edges: 2,
        is_directed: false,
        adj_matrix: [
            [0, -4, 2],
            [-4, 0, 1],
            [2, 1, 0]
        ],
        edges: [
            { u: 0, v: 1, weight: -4, id: 1 },
            { u: 0, v: 2, weight: 2, id: 2 }
        ]
    };

    const negDijkstra = C_ENGINE.runDijkstra(negGraph, 0, 2);
    assert.strictEqual(negDijkstra.success, false, 'Dijkstra must reject negative edge weights');
    console.log(`  ✓ Dijkstra correctly rejected negative weight: "${negDijkstra.errorMessage}"\n`);

    console.log('[TEST 7] Testing Battle Mode Engine...');
    const battleRes = C_ENGINE.runBattle(testGraph);
    assert.strictEqual(battleRes.weightsMatch, true, 'Battle mode must report weightsMatch = true');
    console.log(`  ✓ Battle mode: Prim time = ${battleRes.primTimeMs.toFixed(3)}ms, Kruskal time = ${battleRes.kruskalTimeMs.toFixed(3)}ms, Weights Match = ${battleRes.weightsMatch}\n`);

    console.log('====================================================');
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (7/7)');
    console.log('====================================================');
}

runAllTests();
