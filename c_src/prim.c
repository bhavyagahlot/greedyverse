/**
 * GREEDYVERSE - Prim's Algorithm Implementation in C
 * 
 * Standard Complexity: O(V^2) using Adjacency Matrix and linear minimum selection.
 * Greedy Principle: At every step, choose the minimum-weight cut-crossing edge
 * that connects a vertex in the growing MST to an unincluded vertex.
 */

#include "greedyverse.h"

MSTResult run_prim(const Graph* g, int start_vertex) {
    MSTResult result;
    memset(&result, 0, sizeof(MSTResult));
    result.start_vertex = start_vertex;
    result.success = false;

    int V = g->num_vertices;

    /* Validation: Graph must have at least 1 vertex */
    if (V <= 0 || V > MAX_VERTICES) {
        snprintf(result.error_message, sizeof(result.error_message),
                 "Invalid graph size: %d vertices (must be between 1 and %d).", V, MAX_VERTICES);
        return result;
    }

    /* Validation: Graph with 1 vertex has trivial MST of 0 edges */
    if (V == 1) {
        result.success = true;
        result.total_weight = 0;
        result.mst_edge_count = 0;
        char msg[384];
        snprintf(msg, sizeof(msg), "Single vertex graph: MST consists of vertex %d with total weight 0.", start_vertex);
        step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                    start_vertex, -1, -1, -1, 0,
                    NULL, NULL, NULL, 0, NULL, NULL, msg);
        return result;
    }

    /* Validation: Start vertex range */
    if (start_vertex < 0 || start_vertex >= V) {
        snprintf(result.error_message, sizeof(result.error_message),
                 "Start vertex %d out of bounds [0, %d).", start_vertex, V);
        return result;
    }

    int key[MAX_VERTICES];
    int parent[MAX_VERTICES];
    bool in_mst[MAX_VERTICES];

    for (int i = 0; i < V; i++) {
        key[i] = INF;
        parent[i] = -1;
        in_mst[i] = false;
    }

    /* Start from selected vertex */
    key[start_vertex] = 0;

    char msg[384];
    snprintf(msg, sizeof(msg),
             "Prim's Initialization: Set starting vertex to %d (key[%d] = 0). All other vertices set to key = INF, in_mst = false.",
             start_vertex, start_vertex);
    step_record(result.steps, &result.num_steps, EVENT_INIT,
                start_vertex, -1, -1, -1, 0,
                key, parent, in_mst, 0, NULL, NULL, msg);

    int total_weight = 0;
    int edges_accepted = 0;
    int edges_considered = 0;
    int edges_rejected = 0;

    /* Prim's loop: Include V vertices in MST */
    for (int count = 0; count < V; count++) {
        /* Greedy choice: Find vertex u not yet in MST with minimum key value */
        int min_key = INF;
        int u = -1;

        for (int v = 0; v < V; v++) {
            if (!in_mst[v] && key[v] < min_key) {
                min_key = key[v];
                u = v;
            }
        }

        /* If no vertex can be reached, the graph is disconnected */
        if (u == -1 || min_key == INF) {
            snprintf(msg, sizeof(msg),
                     "Disconnected Graph Alert: Cannot reach remaining vertices. Only %d of %d vertices connected. MST does not exist.",
                     edges_accepted + 1, V);
            step_record(result.steps, &result.num_steps, EVENT_ERROR,
                        -1, -1, -1, -1, 0,
                        key, parent, in_mst, total_weight, NULL, NULL, msg);

            result.success = false;
            snprintf(result.error_message, sizeof(result.error_message),
                     "Graph is disconnected! Minimum Spanning Tree cannot span all %d vertices (only %d vertices reached).",
                     V, edges_accepted + 1);
            result.total_weight = total_weight;
            result.mst_edge_count = edges_accepted;
            result.edges_considered = edges_considered;
            result.edges_accepted = edges_accepted;
            result.edges_rejected = edges_rejected;
            return result;
        }

        /* Include vertex u into MST */
        in_mst[u] = true;

        if (parent[u] != -1) {
            /* Edge (parent[u], u) is accepted into MST */
            int w = g->adj_matrix[parent[u]][u];
            total_weight += w;
            result.mst_edges[edges_accepted].u = parent[u];
            result.mst_edges[edges_accepted].v = u;
            result.mst_edges[edges_accepted].weight = w;
            edges_accepted++;

            snprintf(msg, sizeof(msg),
                     "Greedy Cut Property: Added edge (%d, %d) with weight %d to MST. Total MST weight is now %d.",
                     parent[u], u, w, total_weight);
            step_record(result.steps, &result.num_steps, EVENT_ADD_MST_EDGE,
                        u, parent[u], parent[u], u, w,
                        key, parent, in_mst, total_weight, NULL, NULL, msg);
        } else {
            snprintf(msg, sizeof(msg),
                     "Root Selected: Vertex %d added to the tree. Growing MST outward from here.", u);
            step_record(result.steps, &result.num_steps, EVENT_SELECT_MIN_VERTEX,
                        u, -1, -1, -1, 0,
                        key, parent, in_mst, total_weight, NULL, NULL, msg);
        }

        /* Update key values of adjacent vertices of u not yet included in MST */
        for (int v = 0; v < V; v++) {
            int weight = g->adj_matrix[u][v];
            if (weight > 0) {
                edges_considered++;
                if (!in_mst[v]) {
                    snprintf(msg, sizeof(msg),
                             "Inspecting crossing cut edge (%d - %d) with weight %d. Current key[%d] = %s.",
                             u, v, weight, v, key[v] == INF ? "INF" : "finite");
                    step_record(result.steps, &result.num_steps, EVENT_EXAMINE_EDGE,
                                u, v, u, v, weight,
                                key, parent, in_mst, total_weight, NULL, NULL, msg);

                    if (weight < key[v]) {
                        key[v] = weight;
                        parent[v] = u;
                        snprintf(msg, sizeof(msg),
                                 "Key updated: key[%d] lowered to %d via parent vertex %d.",
                                 v, weight, u);
                        step_record(result.steps, &result.num_steps, EVENT_RELAX_EDGE,
                                    u, v, u, v, weight,
                                    key, parent, in_mst, total_weight, NULL, NULL, msg);
                    }
                } else {
                    edges_rejected++;
                }
            }
        }
    }

    result.success = true;
    result.total_weight = total_weight;
    result.mst_edge_count = edges_accepted;
    result.edges_considered = edges_considered;
    result.edges_accepted = edges_accepted;
    result.edges_rejected = edges_rejected;

    snprintf(msg, sizeof(msg),
             "Prim's Algorithm Complete: Successfully constructed Minimum Spanning Tree with %d edges and total weight of %d.",
             edges_accepted, total_weight);
    step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                -1, -1, -1, -1, 0,
                key, parent, in_mst, total_weight, NULL, NULL, msg);

    return result;
}
