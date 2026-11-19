/**
 * GREEDYVERSE - Dijkstra's Algorithm Implementation in C
 * 
 * Standard Complexity: O(V^2) using Adjacency Matrix and linear scan for minimum.
 * Greedy Principle: Locally optimal vertex choice (minimum tent distance)
 * is guaranteed to be globally optimal under non-negative edge weights.
 */

#include "greedyverse.h"

DijkstraResult run_dijkstra(const Graph* g, int source, int destination) {
    DijkstraResult result;
    memset(&result, 0, sizeof(DijkstraResult));
    result.source = source;
    result.destination = destination;
    result.success = false;

    /* Validation: Graph must have at least 1 vertex */
    if (g->num_vertices <= 0 || g->num_vertices > MAX_VERTICES) {
        snprintf(result.error_message, sizeof(result.error_message),
                 "Invalid graph size: %d vertices (must be between 1 and %d)", g->num_vertices, MAX_VERTICES);
        return result;
    }

    /* Validation: Source and destination range */
    if (source < 0 || source >= g->num_vertices || destination < 0 || destination >= g->num_vertices) {
        snprintf(result.error_message, sizeof(result.error_message),
                 "Source (%d) or destination (%d) out of bounds [0, %d)", source, destination, g->num_vertices);
        return result;
    }

    /* Validation: Check for negative edge weights */
    for (int i = 0; i < g->num_edges; i++) {
        if (g->edges[i].weight < 0) {
            snprintf(result.error_message, sizeof(result.error_message),
                     "Dijkstra's algorithm requires non-negative edge weights. Found negative edge (%d -> %d) with weight %d.",
                     g->edges[i].u, g->edges[i].v, g->edges[i].weight);
            return result;
        }
    }

    int V = g->num_vertices;
    int dist[MAX_VERTICES];
    int parent[MAX_VERTICES];
    bool visited[MAX_VERTICES];

    for (int i = 0; i < V; i++) {
        dist[i] = INF;
        parent[i] = -1;
        visited[i] = false;
    }

    dist[source] = 0;

    /* Initial step */
    char msg[384];
    snprintf(msg, sizeof(msg),
             "Initialization: Distances set to infinity for all vertices except source vertex %d (dist[%d] = 0). All vertices are unvisited.",
             source, source);
    step_record(result.steps, &result.num_steps, EVENT_INIT,
                source, -1, -1, -1, 0,
                dist, parent, visited, 0, NULL, NULL, msg);

    /* Main Dijkstra Loop: V iterations */
    for (int count = 0; count < V; count++) {
        /* Greedy Step: Linear scan to find unvisited vertex with minimum tentative distance */
        int min_dist = INF;
        int u = -1;

        for (int v = 0; v < V; v++) {
            if (!visited[v] && dist[v] < min_dist) {
                min_dist = dist[v];
                u = v;
            }
        }

        /* If remaining unvisited vertices are unreachable, terminate early */
        if (u == -1 || min_dist == INF) {
            snprintf(msg, sizeof(msg),
                     "Remaining unvisited vertices are unreachable from source %d. Halting exploration.", source);
            step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                        -1, -1, -1, -1, 0,
                        dist, parent, visited, 0, NULL, NULL, msg);
            break;
        }

        /* Mark vertex u as visited (finalized) */
        visited[u] = true;
        snprintf(msg, sizeof(msg),
                 "Greedy Selection: Picked vertex %d with minimum tentative distance %d. Its shortest path is now finalized.",
                 u, dist[u]);
        step_record(result.steps, &result.num_steps, EVENT_SELECT_MIN_VERTEX,
                    u, -1, -1, -1, 0,
                    dist, parent, visited, 0, NULL, NULL, msg);

        /* Early stop optimization: destination reached */
        if (u == destination) {
            snprintf(msg, sizeof(msg),
                     "Destination vertex %d reached! Shortest distance confirmed as %d.", destination, dist[destination]);
            step_record(result.steps, &result.num_steps, EVENT_PATH_FOUND,
                        u, destination, -1, -1, 0,
                        dist, parent, visited, 0, NULL, NULL, msg);
            break;
        }

        /* Relax neighbors of u */
        for (int v = 0; v < V; v++) {
            int weight = g->adj_matrix[u][v];
            if (weight > 0 && !visited[v]) {
                snprintf(msg, sizeof(msg),
                         "Examining outgoing edge (%d -> %d) with weight %d. Current dist[%d] = %s.",
                         u, v, weight, v, dist[v] == INF ? "INF" : "finite");
                step_record(result.steps, &result.num_steps, EVENT_EXAMINE_EDGE,
                            u, v, u, v, weight,
                            dist, parent, visited, 0, NULL, NULL, msg);

                /* Edge Relaxation Condition */
                if (dist[u] != INF && dist[u] + weight < dist[v]) {
                    int old_dist = dist[v];
                    dist[v] = dist[u] + weight;
                    parent[v] = u;

                    if (old_dist == INF) {
                        snprintf(msg, sizeof(msg),
                                 "Relaxed edge (%d -> %d): dist[%d] reduced from INF to %d via vertex %d.",
                                 u, v, v, dist[v], u);
                    } else {
                        snprintf(msg, sizeof(msg),
                                 "Relaxed edge (%d -> %d): dist[%d] improved from %d to %d (dist[%d] + %d).",
                                 u, v, v, old_dist, dist[v], u, weight);
                    }
                    step_record(result.steps, &result.num_steps, EVENT_RELAX_EDGE,
                                u, v, u, v, weight,
                                dist, parent, visited, 0, NULL, NULL, msg);
                }
            }
        }
    }

    /* Check if destination was reached */
    if (dist[destination] == INF) {
        result.success = false;
        snprintf(result.error_message, sizeof(result.error_message),
                 "No path exists from source vertex %d to destination vertex %d (Disconnected components).",
                 source, destination);
        return result;
    }

    /* Reconstruct shortest path by following parent pointers backwards */
    result.success = true;
    result.total_cost = dist[destination];

    int temp_path[MAX_VERTICES];
    int count = 0;
    int curr = destination;
    while (curr != -1 && count < MAX_VERTICES) {
        temp_path[count++] = curr;
        if (curr == source) break;
        curr = parent[curr];
    }

    result.path_length = count;
    for (int i = 0; i < count; i++) {
        result.path[i] = temp_path[count - 1 - i];
    }

    snprintf(msg, sizeof(msg),
             "Algorithm Complete: Shortest path from %d to %d verified with total path cost of %d.",
             source, destination, result.total_cost);
    step_record(result.steps, &result.num_steps, EVENT_COMPLETE,
                destination, -1, -1, -1, 0,
                dist, parent, visited, 0, NULL, NULL, msg);

    return result;
}
