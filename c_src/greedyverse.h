/**
 * GREEDYVERSE - Interactive Greedy Algorithm Visualizer
 * Core C Algorithm Interface and Data Structures
 * 
 * B.Tech Design and Analysis of Algorithms (DAA) & Industrial Programming
 * Authors: GREEDYVERSE Core Team
 */

#ifndef GREEDYVERSE_H
#define GREEDYVERSE_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MAX_VERTICES 64
#define MAX_EDGES 512
#define MAX_STEPS 1024
#define INF 999999999

/* Trace Event Types for Frontend Step-by-Step Playback */
typedef enum {
    EVENT_INIT = 0,
    EVENT_SELECT_MIN_VERTEX = 1,
    EVENT_EXAMINE_EDGE = 2,
    EVENT_RELAX_EDGE = 3,
    EVENT_VISITED_VERTEX = 4,
    EVENT_ADD_MST_EDGE = 5,
    EVENT_REJECT_EDGE = 6,
    EVENT_CYCLE_DETECTED = 7,
    EVENT_PATH_FOUND = 8,
    EVENT_COMPLETE = 9,
    EVENT_ERROR = 10
} EventType;

/* Graph Edge Structure */
typedef struct {
    int u;
    int v;
    int weight;
    int id;
} Edge;

/* Graph Structure */
typedef struct {
    int num_vertices;
    int num_edges;
    bool is_directed;
    int adj_matrix[MAX_VERTICES][MAX_VERTICES];
    Edge edges[MAX_EDGES];
} Graph;

/* Single Animation/Visualization Step Record */
typedef struct {
    int step_index;
    EventType event_type;
    int current_vertex;
    int target_vertex;
    int edge_u;
    int edge_v;
    int edge_weight;
    int dist[MAX_VERTICES];
    int parent[MAX_VERTICES];
    bool visited[MAX_VERTICES];
    int mst_weight;
    int dsu_parent[MAX_VERTICES];
    int dsu_rank[MAX_VERTICES];
    char message[384];
} StepTrace;

/* Dijkstra Result Container */
typedef struct {
    bool success;
    char error_message[128];
    int source;
    int destination;
    int total_cost;
    int path_length;
    int path[MAX_VERTICES];
    int num_steps;
    StepTrace steps[MAX_STEPS];
} DijkstraResult;

/* Minimum Spanning Tree (Prim / Kruskal) Result Container */
typedef struct {
    bool success;
    char error_message[128];
    int start_vertex;          /* For Prim */
    int total_weight;
    int mst_edge_count;
    Edge mst_edges[MAX_VERTICES];
    int edges_considered;
    int edges_accepted;
    int edges_rejected;
    int num_steps;
    StepTrace steps[MAX_STEPS];
} MSTResult;

/* Algorithm Battle Comparison Result */
typedef struct {
    MSTResult prim_result;
    MSTResult kruskal_result;
    double prim_time_ms;
    double kruskal_time_ms;
    bool weights_match;
} BattleResult;

/* Disjoint Set Union (DSU / Union-Find) Structure for Kruskal's Algorithm */
typedef struct {
    int parent[MAX_VERTICES];
    int rank[MAX_VERTICES];
} DSU;

/* Function Declarations */
void dsu_init(DSU* dsu, int n);
int dsu_find(DSU* dsu, int i);
bool dsu_union(DSU* dsu, int x, int y);

void graph_init(Graph* g, int num_vertices, bool is_directed);
bool graph_add_edge(Graph* g, int u, int v, int weight, int id);
bool graph_validate_non_negative_weights(const Graph* g);
bool graph_is_connected(const Graph* g);

/* Algorithm Implementations */
DijkstraResult run_dijkstra(const Graph* g, int source, int destination);
MSTResult run_prim(const Graph* g, int start_vertex);
MSTResult run_kruskal(const Graph* g);
BattleResult run_battle(const Graph* g);

/* Utility and JSON Serializers */
void step_record(StepTrace* steps, int* count, EventType type, 
                 int curr, int target, int eu, int ev, int ew,
                 const int* dist, const int* parent, const bool* visited,
                 int mst_weight, const int* dsu_p, const int* dsu_r,
                 const char* msg);

char* dijkstra_to_json(const DijkstraResult* res);
char* mst_to_json(const MSTResult* res, const char* algo_name);
char* battle_to_json(const BattleResult* res);

#endif /* GREEDYVERSE_H */
