Pathfinding Visualizer (Vanilla JS)

A small, single-file webapp that visualizes A* and BFS on a 30x30 grid.

How to run:

Open `webapp/index.html` in a browser. Or run a quick static server:

```bash
# from /Users/owenfang/Documents/PathfindingAlgos/webapp
python3 -m http.server 8000
# then open http://localhost:8000
```

Controls:
- Algorithm select (A* or BFS)
- Set Start, Set Goal: click the button then click the grid to place
- Toggle Walls: click grid to add/remove walls
- Run: run the selected algorithm
- Clear: reset the grid
