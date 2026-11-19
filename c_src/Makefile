# GREEDYVERSE - C Build System (GCC / Clang / Emscripten)

CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c99
EMCC = emcc
EMFLAGS = -O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -s NO_EXIT_RUNTIME=1 -s ALLOW_MEMORY_GROWTH=1

SRCS = dijkstra.c prim.c kruskal.c main.c
OBJS = $(SRCS:.c=.o)
TARGET = greedyverse

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

%.o: %.c greedyverse.h
	$(CC) $(CFLAGS) -c $< -o $@

# Build WebAssembly module using Emscripten
wasm:
	$(EMCC) $(EMFLAGS) dijkstra.c prim.c kruskal.c main.c -o ../public/wasm/greedyverse.js

clean:
	rm -f $(OBJS) $(TARGET) ../public/wasm/greedyverse.wasm ../public/wasm/greedyverse.js

.PHONY: all wasm clean
