/**
 * GREEDYVERSE - Kruskal's Algorithm Implementation in C
 * 
 * Standard Complexity: O(E log E) using edge sorting and Disjoint Set Union (DSU).
 * Greedy Principle: Sort all edges globally by weight. Repeatedly pick the smallest
 * edge that connects two distinct disjoint components without creating a cycle.
 */

#include "greedyverse.h"

/* Disjoint Set Union (DSU) operations */
void dsu_init(DSU* dsu, int n) {
    for (int i = 0; i < n; i++) {
        dsu->parent[i] = i;
        dsu->rank[i] = 0;
    }
}

/* Find with Path Compression */
int dsu_find(DSU* dsu, int i) {
    if (dsu->parent[i] != i) {
        dsu->parent[i] = dsu_find(dsu, dsu->parent[i]);
    }
    return dsu->parent[i];
}

/* Union by Rank */
bool dsu_union(DSU* dsu, int x, int y) {
    int rootX = dsu_find(dsu, x);
    int rootY = dsu_find(dsu, y);

    if (rootX == rootY) {
        return false; /* Same set: would form a cycle */
    }

    if (dsu->rank[rootX] < dsu->rank[rootY]) {
        dsu->parent[rootX] = rootY;
    } else if (dsu->rank[rootX] > dsu->rank[rootY]) {
        dsu->parent[rootY] = rootX;
    } else {
        dsu->parent[rootY] = rootX;
        dsu->rank[rootX]++;
    }
    return true;
}

/* Comparator for qsort: Ascending order by edge weight */
static int edge_compare(const void* a, const void* b) {
    const Edge* ea = (const Edge*)a;
    const Edge* eb = (const Edge*)b;
    if (ea->weight != eb->weight) {
        return ea->weight - eb->weight;
    }
    /* Tie-breaker by vertex indices for deterministic execution */
    if (ea->u != eb->u) return ea->u - eb->u;
    return ea->v - eb->v;
}

MSTResult run_kruskal(const Graph* g) {
    MSTResult result;
    memset(&result, 0, sizeof(MSTResult));
    result.start_vertex = 0;
    result.success = false;

    int V = g->num_vertices;
    int E = g->num_edges;

    /* Validation: Vertex bounds */
    if (V <= 0 || V > MAX_VERTICES) {
        snprintf(result.error_message, sizeof(result.error_message),
                 "Invalid graph size: %d vertices (must be between 1 and %d).", V, MAX_VERTICES);
        return result;
    }

    /* Single vertex graph */
    if (V == 1) {
        result.success = true;
        result.total_weight = 0;
        result.mst_edge_count = 0;
        char msg[384];
        snprintf(msg, sizeof(msg), "Single vertex graph: MST consists of vertex 0 with total weight 0.");
        step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                    0, -1, -1, -1, 0,
                    NULL, NULL, NULL, 0, NULL, NULL, msg);
        return result;
    }

    /* Copy unique undirected edges */
    Edge sorted_edges[MAX_EDGES];
    int edge_count = 0;

    for (int i = 0; i < E; i++) {
        int u = g->edges[i].u;
        int v = g->edges[i].v;
        int w = g->edges[i].weight;

        /* For undirected graphs, store each undirected pair once with u < v */
        if (!g->is_directed) {
            if (u > v) { int t = u; u = v; v = t; }
            bool already_exists = false;
            for (int j = 0; j < edge_count; j++) {
                if (sorted_edges[j].u == u && sorted_edges[j].v == v) {
                    already_exists = true;
                    break;
                }
            }
            if (!already_exists && edge_count < MAX_EDGES) {
                sorted_edges[edge_count].u = u;
                sorted_edges[edge_count].v = v;
                sorted_edges[edge_count].weight = w;
                sorted_edges[edge_count].id = g->edges[i].id;
                edge_count++;
            }
        } else {
            if (edge_count < MAX_EDGES) {
                sorted_edges[edge_count] = g->edges[i];
                edge_count++;
            }
        }
    }

    /* Greedy Step 1: Sort all edges in non-decreasing order of weight (O(E log E)) */
    qsort(sorted_edges, edge_count, sizeof(Edge), edge_compare);

    /* Initialize Disjoint Set Union (DSU) */
    DSU dsu;
    dsu_init(&dsu, V);

    char msg[384];
    snprintf(msg, sizeof(msg),
             "Kruskal's Initialization: Extracted and sorted %d unique edges in non-decreasing order of weight. Initialized Disjoint Set Union (DSU) with %d single-element sets.",
             edge_count, V);
    step_record(result.steps, &result.num_steps, EVENT_INIT,
                -1, -1, -1, -1, 0,
                NULL, NULL, NULL, 0, dsu.parent, dsu.rank, msg);

    int total_weight = 0;
    int edges_accepted = 0;
    int edges_considered = 0;
    int edges_rejected = 0;

    /* Greedy Step 2: Iterate through sorted edges and apply cycle detection */
    for (int i = 0; i < edge_count; i++) {
        /* If we have already selected V - 1 edges, the MST is complete */
        if (edges_accepted == V - 1) {
            snprintf(msg, sizeof(msg),
                     "MST Condition Met: Found required %d (V-1) tree edges. All %d vertices are now connected.",
                     edges_accepted, V);
            step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                        -1, -1, -1, -1, 0,
                        NULL, NULL, NULL, total_weight, dsu.parent, dsu.rank, msg);
            break;
        }

        Edge e = sorted_edges[i];
        edges_considered++;

        int rootU = dsu_find(&dsu, e.u);
        int rootV = dsu_find(&dsu, e.v);

        snprintf(msg, sizeof(msg),
                 "Considering edge #%d: (%d, %d) with weight %d. Querying DSU sets: Find(%d) = Set %d, Find(%d) = Set %d.",
                 i + 1, e.u, e.v, e.weight, e.u, rootU, e.v, rootV);
        step_record(result.steps, &result.num_steps, EVENT_EXAMINE_EDGE,
                    e.u, e.v, e.u, e.v, e.weight,
                    NULL, NULL, NULL, total_weight, dsu.parent, dsu.rank, msg);

        if (rootU != rootV) {
            /* Vertices belong to different connected components: NO cycle */
            dsu_union(&dsu, rootU, rootV);
            result.mst_edges[edges_accepted] = e;
            edges_accepted++;
            total_weight += e.weight;

            snprintf(msg, sizeof(msg),
                     "Edge Accepted! Vertices %d and %d belong to different components (Set %d and Set %d). No cycle formed. Merged sets with Union(%d, %d). Running MST weight: %d.",
                     e.u, e.v, rootU, rootV, rootU, rootV, total_weight);
            step_record(result.steps, &result.num_steps, EVENT_ADD_MST_EDGE,
                        e.u, e.v, e.u, e.v, e.weight,
                        NULL, NULL, NULL, total_weight, dsu.parent, dsu.rank, msg);
        } else {
            /* Both vertices already in the same component: Adding would form a CYCLE! */
            edges_rejected++;
            snprintf(msg, sizeof(msg),
                     "Cycle Detected! Edge (%d, %d) REJECTED! Both vertices already belong to Set %d. Adding this edge would form a closed cycle in the tree.",
                     e.u, e.v, rootU);
            step_record(result.steps, &result.num_steps, EVENT_CYCLE_DETECTED,
                        e.u, e.v, e.u, e.v, e.weight,
                        NULL, NULL, NULL, total_weight, dsu.parent, dsu.rank, msg);
        }
    }

    result.total_weight = total_weight;
    result.mst_edge_count = edges_accepted;
    result.edges_considered = edges_considered;
    result.edges_accepted = edges_accepted;
    result.edges_rejected = edges_rejected;

    /* Validate if graph was connected */
    if (edges_accepted < V - 1) {
        result.success = false;
        snprintf(result.error_message, sizeof(result.error_message),
                 "Graph is disconnected! Kruskal found only %d edges (expected %d for a connected graph). Result is a Spanning Forest, not a spanning tree.",
                 edges_accepted, V - 1);
        snprintf(msg, sizeof(msg),
                 "Disconnected Graph Notice: Examined all %d edges, but only %d edges could be connected. Minimum Spanning Tree does not exist.",
                 edge_count, edges_accepted);
        step_record(result.steps, &result.num_steps, EVENT_ERROR,
                    -1, -1, -1, -1, 0,
                    NULL, NULL, NULL, total_weight, dsu.parent, dsu.rank, msg);
        return result;
    }

    result.success = true;
    snprintf(msg, sizeof(msg),
             "Kruskal's Algorithm Complete: Successfully constructed Minimum Spanning Tree with %d edges and total weight of %d.",
             edges_accepted, total_weight);
    step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                -1, -1, -1, -1, 0,
                NULL, NULL, NULL, total_weight, dsu.parent, dsu.rank, msg);

    return result;
}
