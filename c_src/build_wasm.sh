#!/usr/bin/env bash
# ============================================================
# GREEDYVERSE - WebAssembly Build Script for Linux / macOS
# ============================================================

set -e

echo "[GREEDYVERSE] Compiling C Algorithm Suite to WebAssembly..."

if ! command -v emcc &> /dev/null; then
    echo "[ERROR] Emscripten compiler (emcc) not found in PATH."
    echo "Install via Emscripten SDK (emsdk) or use the Node.js C Backend Server."
    exit 1
fi

emcc -O3 dijkstra.c prim.c kruskal.c main.c \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="['_run_dijkstra','_run_prim','_run_kruskal','_run_battle','_main']" \
    -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','allocate','intArrayFromString']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -o ../public/wasm/greedyverse.js

echo "[SUCCESS] WebAssembly module generated in ../public/wasm/"
