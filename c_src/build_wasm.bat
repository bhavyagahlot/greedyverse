@echo off
REM ============================================================
REM GREEDYVERSE - WebAssembly Build Script for Windows (Emscripten)
REM ============================================================

echo [GREEDYVERSE] Compiling C Algorithm Suite to WebAssembly...

where emcc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Emscripten compiler (emcc) not found in PATH.
    echo Please install and activate Emscripten SDK:
    echo   git clone https://github.com/emscripten-core/emsdk.git
    echo   cd emsdk ^&^& emsdk install latest ^&^& emsdk activate latest
    echo Alternatively, use the built-in C Backend Server (node server.js).
    exit /b 1
)

emcc -O3 dijkstra.c prim.c kruskal.c main.c ^
    -s WASM=1 ^
    -s EXPORTED_FUNCTIONS="['_run_dijkstra','_run_prim','_run_kruskal','_run_battle','_main']" ^
    -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','allocate','intArrayFromString']" ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -o ..\public\wasm\greedyverse.js

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] WebAssembly module generated in public\wasm\
) else (
    echo [FAILED] Compilation failed.
)
