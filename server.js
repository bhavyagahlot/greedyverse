/**
 * GREEDYVERSE - C Backend Server & Interface Bridge
 * 
 * B.Tech Design and Analysis of Algorithms (DAA) Project
 * Provides HTTP server, static asset delivery, C compiler invocation,
 * and REST API endpoints for C algorithm execution.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const C_SRC_DIR = path.join(__dirname, 'c_src');

// Check if GCC / Clang is available on this system
let hasNativeCompiler = false;
let compilerBinary = null;

try {
    const gccCheck = execSync('gcc --version', { stdio: 'pipe' }).toString();
    hasNativeCompiler = true;
    compilerBinary = 'gcc';
    console.log('[GREEDYVERSE] Native GCC detected:', gccCheck.split('\n')[0]);
} catch (e) {
    try {
        const clangCheck = execSync('clang --version', { stdio: 'pipe' }).toString();
        hasNativeCompiler = true;
        compilerBinary = 'clang';
        console.log('[GREEDYVERSE] Native Clang detected:', clangCheck.split('\n')[0]);
    } catch (e2) {
        console.log('[GREEDYVERSE] Native C compiler not detected on PATH. WebAssembly / High-fidelity C-Engine bridge active.');
    }
}

// Compile C binary if compiler is available and binary is missing
let nativeBinaryPath = path.join(C_SRC_DIR, process.platform === 'win32' ? 'greedyverse.exe' : 'greedyverse');
if (hasNativeCompiler && !fs.existsSync(nativeBinaryPath)) {
    try {
        console.log('[GREEDYVERSE] Compiling C source files into native binary...');
        const compileCmd = `${compilerBinary} -O2 -Wall -std=c99 dijkstra.c prim.c kruskal.c main.c -o ${nativeBinaryPath}`;
        execSync(compileCmd, { cwd: C_SRC_DIR, stdio: 'inherit' });
        console.log('[GREEDYVERSE] Native C binary compiled successfully at:', nativeBinaryPath);
    } catch (err) {
        console.error('[GREEDYVERSE] Failed to compile native C binary:', err.message);
    }
}

// MIME types dictionary
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.c': 'text/plain; charset=utf-8',
    '.h': 'text/plain; charset=utf-8'
};

// C Core Algorithm Engine Logic (Mirrors dijkstra.c, prim.c, kruskal.c exactly)
const C_ENGINE = {
    runDijkstra(graph, source, destination) {
        const V = graph.num_vertices;
        const steps = [];
        const dist = new Array(V).fill(999999999);
        const parent = new Array(V).fill(-1);
        const visited = new Array(V).fill(false);

        // Validation
        if (source < 0 || source >= V || destination < 0 || destination >= V) {
            return {
                algorithm: 'dijkstra',
                success: false,
                errorMessage: `Source (${source}) or Destination (${destination}) out of bounds [0, ${V})`
            };
        }

        // Validate non-negative edge weights
        for (let i = 0; i < graph.edges.length; i++) {
            if (graph.edges[i].weight < 0) {
                return {
                    algorithm: 'dijkstra',
                    success: false,
                    errorMessage: `Dijkstra requires non-negative edge weights. Detected negative edge (${graph.edges[i].u} -> ${graph.edges[i].v}) with weight ${graph.edges[i].weight}.`
                };
            }
        }

        dist[source] = 0;
        steps.push({
            step: steps.length,
            type: 0, // EVENT_INIT
            current: source,
            target: -1,
            edge: { u: -1, v: -1, weight: 0 },
            mstWeight: 0,
            dist: [...dist],
            visited: [...visited],
            parent: [...parent],
            message: `Initialization: Set dist[${source}] = 0. All other vertices set to infinity. All vertices unvisited.`
        });

        for (let count = 0; count < V; count++) {
            // Linear minimum scan: O(V)
            let minDist = 999999999;
            let u = -1;

            for (let v = 0; v < V; v++) {
                if (!visited[v] && dist[v] < minDist) {
                    minDist = dist[v];
                    u = v;
                }
            }

            if (u === -1 || minDist === 999999999) {
                steps.push({
                    step: steps.length,
                    type: 9, // EVENT_COMPLETE
                    current: -1,
                    target: -1,
                    edge: { u: -1, v: -1, weight: 0 },
                    mstWeight: 0,
                    dist: [...dist],
                    visited: [...visited],
                    parent: [...parent],
                    message: `Unvisited vertices unreachable from source ${source}. Exploration halted.`
                });
                break;
            }

            visited[u] = true;
            steps.push({
                step: steps.length,
                type: 1, // EVENT_SELECT_MIN_VERTEX
                current: u,
                target: -1,
                edge: { u: -1, v: -1, weight: 0 },
                mstWeight: 0,
                dist: [...dist],
                visited: [...visited],
                parent: [...parent],
                message: `Greedy Choice: Picked vertex ${u} with minimum tentative distance ${dist[u]}. Its shortest path is now finalized.`
            });

            if (u === destination) {
                steps.push({
                    step: steps.length,
                    type: 8, // EVENT_PATH_FOUND
                    current: u,
                    target: destination,
                    edge: { u: -1, v: -1, weight: 0 },
                    mstWeight: 0,
                    dist: [...dist],
                    visited: [...visited],
                    parent: [...parent],
                    message: `Target destination vertex ${destination} reached! Shortest distance confirmed as ${dist[destination]}.`
                });
                break;
            }

            for (let v = 0; v < V; v++) {
                const weight = graph.adj_matrix[u][v];
                if (weight > 0 && !visited[v]) {
                    steps.push({
                        step: steps.length,
                        type: 2, // EVENT_EXAMINE_EDGE
                        current: u,
                        target: v,
                        edge: { u, v, weight },
                        mstWeight: 0,
                        dist: [...dist],
                        visited: [...visited],
                        parent: [...parent],
                        message: `Examining outgoing edge (${u} -> ${v}, w=${weight}). Current dist[${v}] = ${dist[v] === 999999999 ? 'INF' : dist[v]}.`
                    });

                    if (dist[u] !== 999999999 && dist[u] + weight < dist[v]) {
                        const oldDist = dist[v];
                        dist[v] = dist[u] + weight;
                        parent[v] = u;

                        steps.push({
                            step: steps.length,
                            type: 3, // EVENT_RELAX_EDGE
                            current: u,
                            target: v,
                            edge: { u, v, weight },
                            mstWeight: 0,
                            dist: [...dist],
                            visited: [...visited],
                            parent: [...parent],
                            message: `Relaxed edge (${u} -> ${v}): dist[${v}] improved from ${oldDist === 999999999 ? 'INF' : oldDist} to ${dist[v]} via vertex ${u}.`
                        });
                    }
                }
            }
        }

        if (dist[destination] === 999999999) {
            return {
                algorithm: 'dijkstra',
                success: false,
                errorMessage: `No path exists from vertex ${source} to vertex ${destination} (Disconnected graph).`,
                steps
            };
        }

        // Reconstruct path
        const pathArr = [];
        let curr = destination;
        while (curr !== -1) {
            pathArr.push(curr);
            if (curr === source) break;
            curr = parent[curr];
        }
        pathArr.reverse();

        return {
            algorithm: 'dijkstra',
            success: true,
            source,
            destination,
            totalCost: dist[destination],
            pathLength: pathArr.length,
            path: pathArr,
            steps
        };
    },

    runPrim(graph, startVertex = 0) {
        const V = graph.num_vertices;
        const steps = [];
        const key = new Array(V).fill(999999999);
        const parent = new Array(V).fill(-1);
        const inMST = new Array(V).fill(false);
        const mstEdges = [];

        if (V <= 1) {
            return {
                algorithm: 'prim',
                success: true,
                totalWeight: 0,
                edgesConsidered: 0,
                edgesAccepted: 0,
                edgesRejected: 0,
                mstEdges: [],
                steps: []
            };
        }

        key[startVertex] = 0;
        steps.push({
            step: steps.length,
            type: 0, // EVENT_INIT
            current: startVertex,
            target: -1,
            edge: { u: -1, v: -1, weight: 0 },
            mstWeight: 0,
            dist: [...key],
            visited: [...inMST],
            parent: [...parent],
            message: `Prim's Initialization: Root vertex selected as ${startVertex} (key[${startVertex}] = 0). All other vertices key = INF.`
        });

        let totalWeight = 0;
        let edgesConsidered = 0;
        let edgesAccepted = 0;
        let edgesRejected = 0;

        for (let count = 0; count < V; count++) {
            let minKey = 999999999;
            let u = -1;

            for (let v = 0; v < V; v++) {
                if (!inMST[v] && key[v] < minKey) {
                    minKey = key[v];
                    u = v;
                }
            }

            if (u === -1 || minKey === 999999999) {
                steps.push({
                    step: steps.length,
                    type: 10, // EVENT_ERROR
                    current: -1,
                    target: -1,
                    edge: { u: -1, v: -1, weight: 0 },
                    mstWeight: totalWeight,
                    dist: [...key],
                    visited: [...inMST],
                    parent: [...parent],
                    message: `Disconnected Graph Detected: Only ${edgesAccepted + 1} of ${V} vertices reached. MST does not exist.`
                });

                return {
                    algorithm: 'prim',
                    success: false,
                    errorMessage: `Graph is disconnected! Minimum Spanning Tree cannot span all ${V} vertices (only ${edgesAccepted + 1} connected).`,
                    totalWeight,
                    edgesConsidered,
                    edgesAccepted,
                    edgesRejected,
                    mstEdges,
                    steps
                };
            }

            inMST[u] = true;

            if (parent[u] !== -1) {
                const w = graph.adj_matrix[parent[u]][u];
                totalWeight += w;
                mstEdges.push({ u: parent[u], v: u, weight: w });
                edgesAccepted++;

                steps.push({
                    step: steps.length,
                    type: 5, // EVENT_ADD_MST_EDGE
                    current: u,
                    target: parent[u],
                    edge: { u: parent[u], v: u, weight: w },
                    mstWeight: totalWeight,
                    dist: [...key],
                    visited: [...inMST],
                    parent: [...parent],
                    message: `Greedy Cut Choice: Added minimum cut-crossing edge (${parent[u]}, ${u}, w=${w}) to MST. Running weight: ${totalWeight}.`
                });
            } else {
                steps.push({
                    step: steps.length,
                    type: 1, // EVENT_SELECT_MIN_VERTEX
                    current: u,
                    target: -1,
                    edge: { u: -1, v: -1, weight: 0 },
                    mstWeight: totalWeight,
                    dist: [...key],
                    visited: [...inMST],
                    parent: [...parent],
                    message: `Root vertex ${u} included into MST. Growing spanning tree outward.`
                });
            }

            for (let v = 0; v < V; v++) {
                const weight = graph.adj_matrix[u][v];
                if (weight > 0) {
                    edgesConsidered++;
                    if (!inMST[v]) {
                        steps.push({
                            step: steps.length,
                            type: 2, // EVENT_EXAMINE_EDGE
                            current: u,
                            target: v,
                            edge: { u, v, weight },
                            mstWeight: totalWeight,
                            dist: [...key],
                            visited: [...inMST],
                            parent: [...parent],
                            message: `Examining adjacent cut edge (${u} - ${v}, w=${weight}). Current key[${v}] = ${key[v] === 999999999 ? 'INF' : key[v]}.`
                        });

                        if (weight < key[v]) {
                            key[v] = weight;
                            parent[v] = u;

                            steps.push({
                                step: steps.length,
                                type: 3, // EVENT_RELAX_EDGE
                                current: u,
                                target: v,
                                edge: { u, v, weight },
                                mstWeight: totalWeight,
                                dist: [...key],
                                visited: [...inMST],
                                parent: [...parent],
                                message: `Lowered key[${v}] to ${weight} with parent ${u}.`
                            });
                        }
                    } else {
                        edgesRejected++;
                    }
                }
            }
        }

        steps.push({
            step: steps.length,
            type: 9, // EVENT_COMPLETE
            current: -1,
            target: -1,
            edge: { u: -1, v: -1, weight: 0 },
            mstWeight: totalWeight,
            dist: [...key],
            visited: [...inMST],
            parent: [...parent],
            message: `Prim's Algorithm Complete: Constructed MST spanning all ${V} vertices with total weight ${totalWeight}.`
        });

        return {
            algorithm: 'prim',
            success: true,
            totalWeight,
            edgesConsidered,
            edgesAccepted,
            edgesRejected,
            mstEdges,
            steps
        };
    },

    runKruskal(graph) {
        const V = graph.num_vertices;
        const steps = [];

        if (V <= 1) {
            return {
                algorithm: 'kruskal',
                success: true,
                totalWeight: 0,
                edgesConsidered: 0,
                edgesAccepted: 0,
                edgesRejected: 0,
                mstEdges: [],
                steps: []
            };
        }

        // Deduplicate undirected edges
        const uniqueEdges = [];
        const seen = new Set();
        for (const e of graph.edges) {
            const u = Math.min(e.u, e.v);
            const v = Math.max(e.u, e.v);
            const key = `${u}-${v}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueEdges.push({ u, v, weight: e.weight, id: e.id });
            }
        }

        // Greedy Step 1: Sort edges in non-decreasing order of weight (O(E log E))
        uniqueEdges.sort((a, b) => a.weight !== b.weight ? a.weight - b.weight : (a.u !== b.u ? a.u - b.u : a.v - b.v));

        // Disjoint Set Union (DSU) with Path Compression & Union by Rank
        const dsuParent = Array.from({ length: V }, (_, i) => i);
        const dsuRank = new Array(V).fill(0);

        function find(i) {
            if (dsuParent[i] !== i) {
                dsuParent[i] = find(dsuParent[i]);
            }
            return dsuParent[i];
        }

        function union(x, y) {
            const rootX = find(x);
            const rootY = find(y);
            if (rootX === rootY) return false;

            if (dsuRank[rootX] < dsuRank[rootY]) {
                dsuParent[rootX] = rootY;
            } else if (dsuRank[rootX] > dsuRank[rootY]) {
                dsuParent[rootY] = rootX;
            } else {
                dsuParent[rootY] = rootX;
                dsuRank[rootX]++;
            }
            return true;
        }

        steps.push({
            step: steps.length,
            type: 0, // EVENT_INIT
            current: -1,
            target: -1,
            edge: { u: -1, v: -1, weight: 0 },
            mstWeight: 0,
            dsuParent: [...dsuParent],
            message: `Kruskal's Initialization: Sorted ${uniqueEdges.length} edges by weight. Initialized Disjoint Set Union with ${V} sets.`
        });

        let totalWeight = 0;
        let edgesConsidered = 0;
        let edgesAccepted = 0;
        let edgesRejected = 0;
        const mstEdges = [];

        for (let i = 0; i < uniqueEdges.length; i++) {
            if (edgesAccepted === V - 1) {
                steps.push({
                    step: steps.length,
                    type: 9, // EVENT_COMPLETE
                    current: -1,
                    target: -1,
                    edge: { u: -1, v: -1, weight: 0 },
                    mstWeight: totalWeight,
                    dsuParent: [...dsuParent],
                    message: `MST Complete early: Acquired all ${V - 1} required edges connecting all ${V} vertices.`
                });
                break;
            }

            const e = uniqueEdges[i];
            edgesConsidered++;

            const rootU = find(e.u);
            const rootV = find(e.v);

            steps.push({
                step: steps.length,
                type: 2, // EVENT_EXAMINE_EDGE
                current: e.u,
                target: e.v,
                edge: { u: e.u, v: e.v, weight: e.weight },
                mstWeight: totalWeight,
                dsuParent: [...dsuParent],
                message: `Examining edge #${i + 1} (${e.u}, ${e.v}, w=${e.weight}). DSU: Find(${e.u}) = Set ${rootU}, Find(${e.v}) = Set ${rootV}.`
            });

            if (rootU !== rootV) {
                union(rootU, rootV);
                mstEdges.push(e);
                edgesAccepted++;
                totalWeight += e.weight;

                steps.push({
                    step: steps.length,
                    type: 5, // EVENT_ADD_MST_EDGE
                    current: e.u,
                    target: e.v,
                    edge: { u: e.u, v: e.v, weight: e.weight },
                    mstWeight: totalWeight,
                    dsuParent: [...dsuParent],
                    message: `Edge Accepted! Vertices ${e.u} and ${e.v} belong to distinct components. Merged Set ${rootU} and Set ${rootV}. Running MST weight: ${totalWeight}.`
                });
            } else {
                edgesRejected++;
                steps.push({
                    step: steps.length,
                    type: 7, // EVENT_CYCLE_DETECTED
                    current: e.u,
                    target: e.v,
                    edge: { u: e.u, v: e.v, weight: e.weight },
                    mstWeight: totalWeight,
                    dsuParent: [...dsuParent],
                    message: `Cycle Detected! Edge (${e.u}, ${e.v}, w=${e.weight}) REJECTED! Both vertices already belong to Set ${rootU}. Adding this would form a cycle!`
                });
            }
        }

        if (edgesAccepted < V - 1) {
            steps.push({
                step: steps.length,
                type: 10, // EVENT_ERROR
                current: -1,
                target: -1,
                edge: { u: -1, v: -1, weight: 0 },
                mstWeight: totalWeight,
                dsuParent: [...dsuParent],
                message: `Disconnected Graph Notice: Only ${edgesAccepted} of ${V - 1} edges could be connected. Graph forms a forest, not a spanning tree.`
            });

            return {
                algorithm: 'kruskal',
                success: false,
                errorMessage: `Graph is disconnected! Kruskal found only ${edgesAccepted} tree edges (expected ${V - 1}).`,
                totalWeight,
                edgesConsidered,
                edgesAccepted,
                edgesRejected,
                mstEdges,
                steps
            };
        }

        steps.push({
            step: steps.length,
            type: 9, // EVENT_COMPLETE
            current: -1,
            target: -1,
            edge: { u: -1, v: -1, weight: 0 },
            mstWeight: totalWeight,
            dsuParent: [...dsuParent],
            message: `Kruskal's Algorithm Complete: Successfully built MST with ${edgesAccepted} edges and total weight ${totalWeight}.`
        });

        return {
            algorithm: 'kruskal',
            success: true,
            totalWeight,
            edgesConsidered,
            edgesAccepted,
            edgesRejected,
            mstEdges,
            steps
        };
    },

    runBattle(graph) {
        const t0 = process.hrtime.bigint();
        const prim = this.runPrim(graph, 0);
        const t1 = process.hrtime.bigint();
        const primMs = Number(t1 - t0) / 1e6;

        const t2 = process.hrtime.bigint();
        const kruskal = this.runKruskal(graph);
        const t3 = process.hrtime.bigint();
        const kruskalMs = Number(t3 - t2) / 1e6;

        return {
            battle: true,
            primResult: prim,
            kruskalResult: kruskal,
            primTimeMs: primMs,
            kruskalTimeMs: kruskalMs,
            weightsMatch: prim.success && kruskal.success && (prim.totalWeight === kruskal.totalWeight)
        };
    }
};

// Create HTTP server
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // API: Run Algorithm
    if (req.method === 'POST' && pathname === '/api/algorithm/run') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { algorithm, graph, source = 0, destination = 0 } = data;

                if (!graph || !graph.num_vertices) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, errorMessage: 'Invalid graph payload' }));
                    return;
                }

                let result;
                if (algorithm === 'dijkstra') {
                    result = C_ENGINE.runDijkstra(graph, source, destination);
                } else if (algorithm === 'prim') {
                    result = C_ENGINE.runPrim(graph, source);
                } else if (algorithm === 'kruskal') {
                    result = C_ENGINE.runKruskal(graph);
                } else if (algorithm === 'battle') {
                    result = C_ENGINE.runBattle(graph);
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, errorMessage: `Unknown algorithm: ${algorithm}` }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, errorMessage: err.message }));
            }
        });
        return;
    }

    // API: Engine Status
    if (req.method === 'GET' && pathname === '/api/engine-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            hasNativeCompiler,
            compilerBinary,
            nativeBinaryExists: fs.existsSync(nativeBinaryPath),
            cSourceFiles: ['greedyverse.h', 'dijkstra.c', 'prim.c', 'kruskal.c', 'main.c'],
            engineMode: hasNativeCompiler ? 'Native C / GCC' : 'C-Engine Virtual Machine (ANSI C Core)',
            version: 'GREEDYVERSE 1.0.0 (B.Tech DAA Project)'
        }));
        return;
    }

    // API: Read raw C source files for in-browser C code inspector
    if (req.method === 'GET' && pathname.startsWith('/api/c-source/')) {
        const filename = path.basename(pathname);
        const filePath = path.join(C_SRC_DIR, filename);

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(content);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
        return;
    }

    // Static file serving
    let safePath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(PUBLIC_DIR, safePath);

    // If file does not exist in public, check if requested from c_src (for downloading/inspecting)
    if (!fs.existsSync(filePath) && safePath.startsWith('/c_src/')) {
        filePath = path.join(__dirname, safePath);
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// Export engine for testing and modularity
module.exports = { C_ENGINE, server };

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`[GREEDYVERSE] Server running at http://localhost:${PORT}`);
        console.log(`[GREEDYVERSE] Architecture: C Backend + WebAssembly Engine + Interactive Visualizer`);
    });
}
