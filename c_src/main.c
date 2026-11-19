/**
 * GREEDYVERSE - Main CLI Runner & JSON Serializer
 * 
 * Provides unified graph utilities, step recorder, Battle Mode execution,
 * and JSON output formatting for seamless frontend & WebAssembly communication.
 */

#include "greedyverse.h"
#include <time.h>

void step_record(StepTrace* steps, int* count, EventType type, 
                 int curr, int target, int eu, int ev, int ew,
                 const int* dist, const int* parent, const bool* visited,
                 int mst_weight, const int* dsu_p, const int* dsu_r,
                 const char* msg) {
    if (*count >= MAX_STEPS) return;

    StepTrace* s = &steps[*count];
    s->step_index = *count;
    s->event_type = type;
    s->current_vertex = curr;
    s->target_vertex = target;
    s->edge_u = eu;
    s->edge_v = ev;
    s->edge_weight = ew;
    s->mst_weight = mst_weight;

    if (dist) memcpy(s->dist, dist, sizeof(int) * MAX_VERTICES);
    else memset(s->dist, 0, sizeof(s->dist));

    if (parent) memcpy(s->parent, parent, sizeof(int) * MAX_VERTICES);
    else memset(s->parent, -1, sizeof(s->parent));

    if (visited) memcpy(s->visited, visited, sizeof(bool) * MAX_VERTICES);
    else memset(s->visited, 0, sizeof(s->visited));

    if (dsu_p) memcpy(s->dsu_parent, dsu_p, sizeof(int) * MAX_VERTICES);
    else memset(s->dsu_parent, 0, sizeof(s->dsu_parent));

    if (dsu_r) memcpy(s->dsu_rank, dsu_r, sizeof(int) * MAX_VERTICES);
    else memset(s->dsu_rank, 0, sizeof(s->dsu_rank));

    strncpy(s->message, msg, sizeof(s->message) - 1);
    s->message[sizeof(s->message) - 1] = '\0';

    (*count)++;
}

void graph_init(Graph* g, int num_vertices, bool is_directed) {
    memset(g, 0, sizeof(Graph));
    g->num_vertices = num_vertices;
    g->is_directed = is_directed;
    g->num_edges = 0;
}

bool graph_add_edge(Graph* g, int u, int v, int weight, int id) {
    if (u < 0 || u >= g->num_vertices || v < 0 || v >= g->num_vertices) return false;
    if (g->num_edges >= MAX_EDGES) return false;

    g->adj_matrix[u][v] = weight;
    if (!g->is_directed) {
        g->adj_matrix[v][u] = weight;
    }

    g->edges[g->num_edges].u = u;
    g->edges[g->num_edges].v = v;
    g->edges[g->num_edges].weight = weight;
    g->edges[g->num_edges].id = id;
    g->num_edges++;

    return true;
}

BattleResult run_battle(const Graph* g) {
    BattleResult res;
    memset(&res, 0, sizeof(BattleResult));

    clock_t t0 = clock();
    res.prim_result = run_prim(g, 0);
    clock_t t1 = clock();
    res.prim_time_ms = ((double)(t1 - t0) / CLOCKS_PER_SEC) * 1000.0;

    clock_t t2 = clock();
    res.kruskal_result = run_kruskal(g);
    clock_t t3 = clock();
    res.kruskal_time_ms = ((double)(t3 - t2) / CLOCKS_PER_SEC) * 1000.0;

    res.weights_match = (res.prim_result.success && res.kruskal_result.success &&
                         res.prim_result.total_weight == res.kruskal_result.total_weight);

    return res;
}

/* Static buffer for JSON formatting */
static char json_buffer[1024 * 512];

static void append_steps_json(char* buf, size_t buf_size, const StepTrace* steps, int num_steps, int V) {
    strncat(buf, "\"steps\":[", buf_size - strlen(buf) - 1);
    for (int i = 0; i < num_steps; i++) {
        const StepTrace* s = &steps[i];
        char step_buf[1024];
        snprintf(step_buf, sizeof(step_buf),
            "{\"step\":%d,\"type\":%d,\"current\":%d,\"target\":%d,"
            "\"edge\":{\"u\":%d,\"v\":%d,\"weight\":%d},"
            "\"mstWeight\":%d,\"message\":\"%s\",",
            s->step_index, s->event_type, s->current_vertex, s->target_vertex,
            s->edge_u, s->edge_v, s->edge_weight,
            s->mst_weight, s->message);
        strncat(buf, step_buf, buf_size - strlen(buf) - 1);

        /* Distances array */
        strncat(buf, "\"dist\":[", buf_size - strlen(buf) - 1);
        for (int v = 0; v < V; v++) {
            char val[32];
            snprintf(val, sizeof(val), "%s%d", (v > 0 ? "," : ""), (s->dist[v] == INF ? -1 : s->dist[v]));
            strncat(buf, val, buf_size - strlen(buf) - 1);
        }
        strncat(buf, "],", buf_size - strlen(buf) - 1);

        /* Visited array */
        strncat(buf, "\"visited\":[", buf_size - strlen(buf) - 1);
        for (int v = 0; v < V; v++) {
            char val[16];
            snprintf(val, sizeof(val), "%s%s", (v > 0 ? "," : ""), (s->visited[v] ? "true" : "false"));
            strncat(buf, val, buf_size - strlen(buf) - 1);
        }
        strncat(buf, "],", buf_size - strlen(buf) - 1);

        /* DSU Parent array */
        strncat(buf, "\"dsuParent\":[", buf_size - strlen(buf) - 1);
        for (int v = 0; v < V; v++) {
            char val[32];
            snprintf(val, sizeof(val), "%s%d", (v > 0 ? "," : ""), s->dsu_parent[v]);
            strncat(buf, val, buf_size - strlen(buf) - 1);
        }
        strncat(buf, "]}", buf_size - strlen(buf) - 1);

        if (i < num_steps - 1) {
            strncat(buf, ",", buf_size - strlen(buf) - 1);
        }
    }
    strncat(buf, "]", buf_size - strlen(buf) - 1);
}

char* dijkstra_to_json(const DijkstraResult* res) {
    json_buffer[0] = '\0';
    snprintf(json_buffer, sizeof(json_buffer),
        "{\"algorithm\":\"dijkstra\",\"success\":%s,\"errorMessage\":\"%s\","
        "\"source\":%d,\"destination\":%d,\"totalCost\":%d,\"pathLength\":%d,\"path\":[",
        res->success ? "true" : "false", res->error_message,
        res->source, res->destination, res->total_cost, res->path_length);

    for (int i = 0; i < res->path_length; i++) {
        char val[16];
        snprintf(val, sizeof(val), "%s%d", (i > 0 ? "," : ""), res->path[i]);
        strncat(json_buffer, val, sizeof(json_buffer) - strlen(json_buffer) - 1);
    }
    strncat(json_buffer, "],", sizeof(json_buffer) - strlen(json_buffer) - 1);

    append_steps_json(json_buffer, sizeof(json_buffer), res->steps, res->num_steps, MAX_VERTICES);
    strncat(json_buffer, "}", sizeof(json_buffer) - strlen(json_buffer) - 1);

    return json_buffer;
}

char* mst_to_json(const MSTResult* res, const char* algo_name) {
    json_buffer[0] = '\0';
    snprintf(json_buffer, sizeof(json_buffer),
        "{\"algorithm\":\"%s\",\"success\":%s,\"errorMessage\":\"%s\","
        "\"totalWeight\":%d,\"edgesConsidered\":%d,\"edgesAccepted\":%d,\"edgesRejected\":%d,\"mstEdges\":[",
        algo_name, res->success ? "true" : "false", res->error_message,
        res->total_weight, res->edges_considered, res->edges_accepted, res->edges_rejected);

    for (int i = 0; i < res->mst_edge_count; i++) {
        char edge_str[64];
        snprintf(edge_str, sizeof(edge_str), "%s{\"u\":%d,\"v\":%d,\"weight\":%d}",
                 (i > 0 ? "," : ""), res->mst_edges[i].u, res->mst_edges[i].v, res->mst_edges[i].weight);
        strncat(json_buffer, edge_str, sizeof(json_buffer) - strlen(json_buffer) - 1);
    }
    strncat(json_buffer, "],", sizeof(json_buffer) - strlen(json_buffer) - 1);

    append_steps_json(json_buffer, sizeof(json_buffer), res->steps, res->num_steps, MAX_VERTICES);
    strncat(json_buffer, "}", sizeof(json_buffer) - strlen(json_buffer) - 1);

    return json_buffer;
}

/* CLI entrypoint for testing, C backend server execution, or manual inspection */
int main(int argc, char* argv[]) {
    char algo[32] = "dijkstra";
    int src = 0;
    int dst = 3;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--algorithm") == 0 && i + 1 < argc) {
            strncpy(algo, argv[++i], sizeof(algo) - 1);
        } else if (strcmp(argv[i], "--source") == 0 && i + 1 < argc) {
            src = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--dest") == 0 && i + 1 < argc) {
            dst = atoi(argv[++i]);
        }
    }

    /* Standard sample graph for verification: 5 vertices */
    Graph g;
    graph_init(&g, 5, false);
    graph_add_edge(&g, 0, 1, 4, 1);
    graph_add_edge(&g, 0, 2, 2, 2);
    graph_add_edge(&g, 1, 2, 1, 3);
    graph_add_edge(&g, 1, 3, 5, 4);
    graph_add_edge(&g, 2, 3, 8, 5);
    graph_add_edge(&g, 2, 4, 10, 6);
    graph_add_edge(&g, 3, 4, 2, 7);

    if (strcmp(algo, "dijkstra") == 0) {
        DijkstraResult res = run_dijkstra(&g, src, dst);
        printf("%s\n", dijkstra_to_json(&res));
    } else if (strcmp(algo, "prim") == 0) {
        MSTResult res = run_prim(&g, src);
        printf("%s\n", mst_to_json(&res, "prim"));
    } else if (strcmp(algo, "kruskal") == 0) {
        MSTResult res = run_kruskal(&g);
        printf("%s\n", mst_to_json(&res, "kruskal"));
    } else if (strcmp(algo, "battle") == 0) {
        BattleResult b = run_battle(&g);
        printf("{\"battle\":true,\"weightsMatch\":%s,\"primWeight\":%d,\"kruskalWeight\":%d}\n",
               b.weights_match ? "true" : "false",
               b.prim_result.total_weight, b.kruskal_result.total_weight);
    } else {
        fprintf(stderr, "Unknown algorithm: %s\n", algo);
        return 1;
    }

    return 0;
}
