#DIJIKSTRI ALGORITHM FOR GEARBOX
import pandas as pd
import networkx as nx

# =====================================================
# 1. LOAD CSV FROM NEO4J
# =====================================================

edges_df = pd.read_csv("gearbox_graph.csv")

edges_df["from"] = edges_df["from"].astype(str).str.strip()
edges_df["to"] = edges_df["to"].astype(str).str.strip()

# =====================================================
# 2. BUILD TOPOLOGY GRAPH (NO WEIGHTS YET)
# =====================================================

G_topology = nx.DiGraph()

for _, row in edges_df.iterrows():
    G_topology.add_edge(row["from"], row["to"])

# =====================================================
# 3. TARGET COMPONENT INPUT
# =====================================================

print("Available components:")
for n in G_topology.nodes:
    print("-", n)

target = input("\nEnter component to disassemble: ").strip()

if target not in G_topology.nodes:
    raise ValueError(f"Target '{target}' not found in graph")

# =====================================================
# 4. IDENTIFY START NODES
# =====================================================

start_nodes = [n for n in G_topology.nodes if G_topology.in_degree(n) == 0]

# =====================================================
# 5. ENUMERATE VALID DISASSEMBLY PATHS
# =====================================================

all_paths = []

for start in start_nodes:
    try:
        all_paths.extend(nx.all_simple_paths(G_topology, start, target))
    except nx.NetworkXNoPath:
        pass

if not all_paths:
    raise ValueError("No valid disassembly paths found")

print(f"\nNumber of valid disassembly paths: {len(all_paths)}")

# =====================================================
# 6. USER INPUT: SAFETY RISK (ONCE PER COMPONENT)
# =====================================================

components_in_paths = set()
for path in all_paths:
    components_in_paths.update(path)

print("\nEnter SAFETY RISK for each component (Low / Medium / High):")

safety_map = {"Low": 1, "Medium": 2, "High": 3}
component_safety = {}

for comp in sorted(components_in_paths):
    while True:
        val = input(f"  {comp}: ").strip().title()
        if val in safety_map:
            component_safety[comp] = safety_map[val]
            break
        else:
            print("    Invalid input. Enter Low / Medium / High.")

# =====================================================
# 7. OTHER COST MODELS (RULE-BASED)
# =====================================================

def tool_cost(tools):
    if pd.isna(tools):
        return 1
    tools = str(tools).lower()
    if "pull" in tools:
        return 2
    if "screw" in tools:
        return 2
    return 1


def fastener_count_cost(component_name):
    name = component_name.lower()
    if "bolt" in name or "screw" in name:
        return 3
    if "snap ring" in name:
        return 2
    return 1

# =====================================================
# 8. COMPUTE EDGE WEIGHTS (USING USER SAFETY)
# =====================================================

def compute_weight(row):
    safety = component_safety.get(row["to"], 1)
    tool = tool_cost(row.get("disassembly_tools", None))
    fastener = fastener_count_cost(row["to"])
    return safety + tool + fastener


edges_df["weight"] = edges_df.apply(compute_weight, axis=1)

# =====================================================
# 9. BUILD WEIGHTED GRAPH
# =====================================================

G = nx.DiGraph()

for _, row in edges_df.iterrows():
    G.add_edge(row["from"], row["to"], weight=row["weight"])

# =====================================================
# 10. RUN DIJKSTRA
# =====================================================

best_path = None
best_cost = float("inf")

for start in start_nodes:
    try:
        path = nx.dijkstra_path(G, start, target, weight="weight")
        cost = nx.dijkstra_path_length(G, start, target, weight="weight")

        if cost < best_cost:
            best_cost = cost
            best_path = path

    except nx.NetworkXNoPath:
        continue

# =====================================================
# 11. OUTPUT RESULTS
# =====================================================

print("\nDIJKSTRA RESULT (GEARBOX)")
print("Optimal disassembly sequence:")

for i, step in enumerate(best_path, 1):
    print(f"  {i}. {step}")

print(f"\nTotal disassembly complexity: {best_cost}")
print("(Lower score = easier and safer disassembly)")
