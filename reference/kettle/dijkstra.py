#DIJIKSTRA ALGORITHM FOR KETTLE 
import pandas as pd
import networkx as nx

# 1. Load & clean data
edges_df = pd.read_csv("kettle_graph.csv")
edges_df["from"] = edges_df["from"].astype(str).str.strip()
edges_df["to"] = edges_df["to"].astype(str).str.strip()

# 2. Define mappings
safety_map = {"Low": 1, "Medium": 2, "High": 3}
fastener_map = {"Snap fit": 1, "Spring": 1.5, "Screws": 2, "Wires": 3}
tool_map = {"Hand": 1, "Pull": 1.5, "Philips screwdriver": 2, "Wire cutter": 3}

def fastener_count_penalty(count):
    if count <= 2:
        return 1
    elif count <= 4:
        return 2
    else:
        return 3

# 3. Build topology graph
G_topology = nx.DiGraph()

for _, row in edges_df.iterrows():
    G_topology.add_edge(row["from"], row["to"])

# 4. Target input 
print("Available components:", list(G_topology.nodes))

target = input("Enter component to disassemble: ").strip()

if target not in G_topology.nodes:
    raise ValueError(f"Target '{target}' not in graph")


# 5. Start nodes
start_nodes = [n for n in G_topology.nodes if G_topology.in_degree(n) == 0]


# 6. Enumerate valid paths
all_paths = []

for start in start_nodes:
    try:
        all_paths.extend(nx.all_simple_paths(G_topology, start, target))
    except nx.NetworkXNoPath:
        pass

if not all_paths:
    raise ValueError("No valid disassembly paths found")

print(f"\nNumber of valid disassembly paths: {len(all_paths)}")


# 7. Collect EDGE weights
edge_weights = {}

print("\nEnter disassembly details for each connection:\n")

for path in all_paths:
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]

        if (u, v) in edge_weights:
            continue

        print(f"Disassembly step: {u} → {v}")

        safety = input("  Safety risk (Low / Medium / High): ")
        fastener = input("  Fastener type (Snap fit / Spring / Screws / Wires): ")
        tool = input("  Tool used (Hand / Pull / Philips screwdriver / Wire cutter): ")
        count = int(input("  Number of fasteners: "))

        edge_weights[(u, v)] = (
            safety_map[safety]
            + fastener_map[fastener]
            + tool_map[tool]
            + fastener_count_penalty(count)
        )


# 8. Build WEIGHTED graph
G = nx.DiGraph()
G.add_nodes_from(G_topology.nodes)

for (u, v), w in edge_weights.items():
    G.add_edge(u, v, weight=w)


# 9. Run Dijkstra (SAFE)
best_path = None
best_cost = float("inf")

for start in start_nodes:
    if start not in G:
        continue

    try:
        path = nx.dijkstra_path(G, start, target, weight="weight")
        cost = nx.dijkstra_path_length(G, start, target, weight="weight")

        if cost < best_cost:
            best_cost = cost
            best_path = path
    except nx.NetworkXNoPath:
        pass


# 10. Output
print("\nDIJKSTRA RESULT (USER-DEFINED WEIGHTS)")
print("Optimal disassembly sequence:", best_path)
print("Total disassembly complexity:", best_cost)