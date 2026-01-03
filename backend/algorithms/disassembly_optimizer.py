import pandas as pd
import networkx as nx
import time
import math
import copy
from typing import List, Dict, Any, Optional


class DisassemblyOptimizer:
    """
    Disassembly optimization using Dijkstra and Genetic Algorithms
    Adapted from the ALGORITHMS file
    """

    def __init__(self):
        self.optimization_history = []

    def optimize(self, product_id: str, graph_data: Any, target_parts: List[str], parameters: Dict[str, Any], component_properties: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Optimize disassembly path using Dijkstra or Genetic Algorithm
        
        Args:
            product_id: Product identifier (kettle, gearbox)
            graph_data: Graph data from Neo4j or CSV
            target_parts: List of parts to disassemble (target component)
            parameters: Optimization parameters including algorithm type
            component_properties: User-defined properties for components/edges
        
        Returns:
            Dictionary with optimized path, sequence, and metrics
        """

        # Extract CSV data
        if isinstance(graph_data, dict) and 'csv_data' in graph_data:
            edges_df = pd.DataFrame(graph_data['csv_data'])
        elif isinstance(graph_data, list):
            edges_df = pd.DataFrame(graph_data)
        else:
            # Convert graph format to DataFrame
            edges_df = self._graph_to_dataframe(graph_data)

        # Clean data
        edges_df['from'] = edges_df['from'].astype(str).str.strip()
        edges_df['to'] = edges_df['to'].astype(str).str.strip()

        # Get target part (use first one if multiple)
        target = target_parts[0] if target_parts else None
        if not target:
            raise ValueError("No target part specified")

        # Build topology graph
        G_topology = nx.DiGraph()
        for _, row in edges_df.iterrows():
            G_topology.add_edge(row['from'], row['to'])

        # Validate target
        if target not in G_topology.nodes:
            raise ValueError(f"Target '{target}' not found in graph")

        # Find start nodes (nodes with no incoming edges)
        start_nodes = [
            n for n in G_topology.nodes if G_topology.in_degree(n) == 0]

        if not start_nodes:
            raise ValueError("No start nodes found in graph")

        # Enumerate all valid paths
        all_paths = []
        for start in start_nodes:
            try:
                all_paths.extend(nx.all_simple_paths(
                    G_topology, start, target))
            except nx.NetworkXNoPath:
                pass

        if not all_paths:
            raise ValueError("No valid disassembly paths found")

        # Get algorithm type from parameters (default: dijkstra)
        algorithm = parameters.get('algorithm', 'dijkstra')

        if algorithm == 'genetic':
            result = self._genetic_algorithm(
                product_id, edges_df, G_topology, all_paths, target, start_nodes, parameters, component_properties
            )
        else:
            result = self._dijkstra_algorithm(
                product_id, edges_df, G_topology, all_paths, target, start_nodes, parameters, component_properties
            )
        
        return result

    def _graph_to_dataframe(self, graph_data: Dict) -> pd.DataFrame:
        """Convert graph format (nodes/edges) to DataFrame"""
        if 'edges' in graph_data:
            edges = graph_data['edges']
            df_data = []
            for edge in edges:
                df_data.append({
                    'from': edge.get('source', ''),
                    'to': edge.get('target', ''),
                    'safety_risk': edge.get('safety_risk', ''),
                    'fastener': edge.get('fastener', ''),
                    'tool': edge.get('tool', ''),
                    'fastener_count': edge.get('fastener_count', 0)
                })
            return pd.DataFrame(df_data)
        return pd.DataFrame()

    def _dijkstra_algorithm(self, product_id: str, edges_df: pd.DataFrame, 
                           G_topology: nx.DiGraph, all_paths: List[List[str]],
                           target: str, start_nodes: List[str], 
                           parameters: Dict[str, Any], component_properties: Dict[str, Any] = None) -> Dict[str, Any]:
        """Dijkstra algorithm for disassembly optimization"""

        # Compute edge weights based on product type
        if product_id == 'kettle':
            G = self._build_weighted_graph_kettle(
                edges_df, all_paths, parameters, component_properties)
        else:  # gearbox
            G = self._build_weighted_graph_gearbox(
                edges_df, all_paths, parameters, component_properties)

        # Run Dijkstra
        best_path = None
        best_cost = float('inf')

        for start in start_nodes:
            if start not in G:
                continue
            try:
                path = nx.dijkstra_path(G, start, target, weight='weight')
                cost = nx.dijkstra_path_length(
                    G, start, target, weight='weight')

                if cost < best_cost:
                    best_cost = cost
                    best_path = path
            except nx.NetworkXNoPath:
                pass

        if not best_path:
            raise ValueError("No path found to target")

        # Build result
        optimal_path = []
        for i, part in enumerate(best_path):
            optimal_path.append({
                'step': i + 1,
                'part_id': part,
                'part_name': part,
                'action': 'disassemble'
            })

        return {
            'product_id': product_id,
            'target_parts': [target],
            'optimal_path': optimal_path,
            'sequence': best_path,
            'metrics': {
                'total_time': best_cost,
                'total_cost': best_cost,
                'average_difficulty': best_cost / len(best_path) if best_path else 0,
                'number_of_steps': len(best_path),
                'efficiency_score': 1.0 / best_cost if best_cost > 0 else 0,
                'algorithm': 'dijkstra'
            },
            'animation_steps': self._generate_animation_steps(best_path)
        }

    def _genetic_algorithm(self, product_id: str, edges_df: pd.DataFrame,
                          G_topology: nx.DiGraph, all_paths: List[List[str]],
                          target: str, start_nodes: List[str],
                          parameters: Dict[str, Any], component_properties: Dict[str, Any] = None) -> Dict[str, Any]:
        """Genetic algorithm for disassembly optimization"""

        # Build weighted graph
        if product_id == 'kettle':
            G = self._build_weighted_graph_kettle(
                edges_df, all_paths, parameters, component_properties)
        else:  # gearbox
            G = self._build_weighted_graph_gearbox(
                edges_df, all_paths, parameters, component_properties)

        # GA parameters
        retain = parameters.get('retain', 0.5)
        mutation_rate = parameters.get('mutation_rate', 0.2)
        generations = parameters.get('generations', 30)

        # Population size
        avg_path_length = int(sum(len(p) for p in all_paths) / len(all_paths))
        theoretical_population = math.factorial(avg_path_length)

        # Cap population for scalability (especially for gearbox)
        MAX_POPULATION = 100
        population_size = min(theoretical_population, MAX_POPULATION)
        population_size = max(2, population_size)

        # Initial population
        population = []
        for path in all_paths:
            population.append(path)
            if len(population) >= population_size:
                break

        idx = 0
        while len(population) < population_size:
            population.append(all_paths[idx % len(all_paths)])
            idx += 1

        best_overall = None
        best_cost = float('inf')

        # GA main loop
        start_time = time.time()

        for gen in range(generations):
            # Selection
            population = self._select_population(population, G, retain)

            # Mutation
            population = self._mutate_population(
                population, all_paths, mutation_rate, gen)

            # Evaluate
            for path in population:
                cost = self._path_cost(path, G)
                if cost < best_cost:
                    best_cost = cost
                    best_overall = path

        elapsed_time = time.time() - start_time

        if not best_overall:
            raise ValueError("No solution found")

        # Build result
        optimal_path = []
        for i, part in enumerate(best_overall):
            optimal_path.append({
                'step': i + 1,
                'part_id': part,
                'part_name': part,
                'action': 'disassemble'
            })

        return {
            'product_id': product_id,
            'target_parts': [target],
            'optimal_path': optimal_path,
            'sequence': best_overall,
            'metrics': {
                'total_time': best_cost,
                'total_cost': best_cost,
                'average_difficulty': best_cost / len(best_overall) if best_overall else 0,
                'number_of_steps': len(best_overall),
                'efficiency_score': 1.0 / best_cost if best_cost > 0 else 0,
                'algorithm': 'genetic',
                'generations': generations,
                'execution_time': elapsed_time
            },
            'animation_steps': self._generate_animation_steps(best_overall)
        }

    def _build_weighted_graph_kettle(self, edges_df: pd.DataFrame, 
                                     all_paths: List[List[str]],
                                     parameters: Dict[str, Any],
                                     component_properties: Dict[str, Any] = None) -> nx.DiGraph:
        """Build weighted graph for kettle using CSV data or defaults"""

        # Mapping dictionaries
        safety_map = {"Low": 1, "Medium": 2, "High": 3,
                      "low": 1, "medium": 2, "high": 3}
        fastener_map = {"Snap fit": 1, "Spring": 1.5, "Screws": 2, "Wires": 3,
                        "snap fit": 1, "spring": 1.5, "screws": 2, "wires": 3}
        tool_map = {"Hand": 1, "Pull": 1.5, "Philips screwdriver": 2, "Wire cutter": 3,
                    "hand": 1, "pull": 1.5, "philips screwdriver": 2, "wire cutter": 2}

        def fastener_count_penalty(count):
            if pd.isna(count) or count == 0:
                return 1
            count = int(count)
            if count <= 2:
                return 1
            elif count <= 4:
                return 2
            else:
                return 3

        # Build graph
        G = nx.DiGraph()
        edge_weights = {}

        # Use component_properties if provided (from user input)
        if component_properties:
            for _, row in edges_df.iterrows():
                u, v = row['from'], row['to']
                edge_key = f"{u}->{v}"
                
                # Get properties from user input
                edge_props = component_properties.get(edge_key, {})
                
                safety_str = str(edge_props.get('safety_risk', 'Medium')).strip()
                safety = safety_map.get(safety_str, 2)
                
                fastener_str = str(edge_props.get('fastener', 'Screws')).strip()
                fastener = fastener_map.get(fastener_str, 2)
                
                tool_str = str(edge_props.get('tool', 'Hand')).strip()
                tool = tool_map.get(tool_str, 1)
                
                count_penalty = fastener_count_penalty(edge_props.get('fastener_count', 2))
                
                weight = safety + fastener + tool + count_penalty
                G.add_edge(u, v, weight=weight)
        # Use CSV data if available (kettle has safety_risk, fastener, tool, fastener_count)
        elif 'safety_risk' in edges_df.columns:
            for _, row in edges_df.iterrows():
                u, v = row['from'], row['to']
                safety_str = str(row.get('safety_risk', 'Medium')).strip()
                safety = safety_map.get(safety_str, 2)

                fastener_str = str(row.get('fastener', 'Screws')).strip()
                fastener = fastener_map.get(fastener_str, 2)

                tool_str = str(row.get('tool', 'Hand')).strip()
                tool = tool_map.get(tool_str, 1)

                count_penalty = fastener_count_penalty(
                    row.get('fastener_count', 2))

                weight = safety + fastener + tool + count_penalty
                edge_weights[(u, v)] = weight
                G.add_edge(u, v, weight=weight)
        else:
            # Use default weights if CSV doesn't have the data
            for _, row in edges_df.iterrows():
                u, v = row['from'], row['to']
                # Default weights
                weight = parameters.get('default_weight', 2.0)
                G.add_edge(u, v, weight=weight)

        return G

    def _build_weighted_graph_gearbox(self, edges_df: pd.DataFrame,
                                     all_paths: List[List[str]],
                                     parameters: Dict[str, Any],
                                     component_properties: Dict[str, Any] = None) -> nx.DiGraph:
        """Build weighted graph for gearbox using component safety and rule-based costs"""

        # Get component safety from component_properties (user input) or parameters
        component_safety = {}
        default_safety = {"Low": 1, "Medium": 2, "High": 3}
        
        if component_properties:
            # Extract safety from component_properties (gearbox uses component names as keys)
            for comp_name, props in component_properties.items():
                if isinstance(props, dict) and 'safety_risk' in props:
                    safety_val = props['safety_risk']
                    if isinstance(safety_val, str):
                        component_safety[comp_name] = default_safety.get(safety_val, 2)
                    else:
                        component_safety[comp_name] = safety_val
        else:
            # Fallback to parameters
            component_safety = parameters.get('component_safety', {})

        def tool_cost(tools):
            if pd.isna(tools) or not tools:
                return 1
            tools = str(tools).lower()
            if "pull" in tools:
                return 2
            if "screw" in tools:
                return 2
            return 1

        def fastener_count_cost(component_name):
            name = str(component_name).lower()
            if "bolt" in name or "screw" in name:
                return 3
            if "snap ring" in name:
                return 2
            return 1

        # Build graph
        G = nx.DiGraph()

        # Get component tools from component_properties if provided
        component_tools = {}
        if component_properties:
            for comp_name, props in component_properties.items():
                if isinstance(props, dict) and 'disassembly_tools' in props:
                    component_tools[comp_name] = props['disassembly_tools']

        for _, row in edges_df.iterrows():
            u, v = row['from'], row['to']

            # Get safety for target component
            safety_val = component_safety.get(v, 2)  # Default to Medium
            if isinstance(safety_val, str):
                safety = default_safety.get(safety_val, 2)
            else:
                safety = safety_val

            # Get tool cost - prefer user input, then CSV, then default
            tool_str = None
            if component_tools and v in component_tools:
                tool_str = component_tools[v]
            else:
                tool_str = row.get('disassembly_tools', None)
            tool = tool_cost(tool_str)

            # Get fastener cost
            fastener = fastener_count_cost(v)

            weight = safety + tool + fastener
            G.add_edge(u, v, weight=weight)

        return G

    def _path_cost(self, path: List[str], G: nx.DiGraph) -> float:
        """Calculate total cost of a path"""
        cost = 0
        for i in range(len(path) - 1):
            if not G.has_edge(path[i], path[i + 1]):
                return float('inf')
            cost += G[path[i]][path[i + 1]]['weight']
        return cost

    def _select_population(self, population: List[List[str]], G: nx.DiGraph, retain: float) -> List[List[str]]:
        """Select top retain% of population based on cost"""
        population = sorted(population, key=lambda p: self._path_cost(p, G))
        retain_length = max(1, int(len(population) * retain))
        return population[:retain_length]

    def _mutate_population(self, population: List[List[str]], all_paths: List[List[str]],
                           mutation_rate: float, generation: int) -> List[List[str]]:
        """Mutate population deterministically"""
        if mutation_rate <= 0:
            return population

        mutation_interval = max(1, int(1 / mutation_rate))
        new_population = copy.deepcopy(population)

        if generation % mutation_interval == 0:
            for i in range(len(new_population)):
                new_population[i] = all_paths[(
                    generation + i) % len(all_paths)]

        return new_population

    def _generate_animation_steps(self, path: List[str]) -> List[Dict]:
        """Generate animation steps for 3D model highlighting"""
        steps = []
        for i, part_id in enumerate(path):
            steps.append({
                'step': i + 1,
                'part_id': part_id,
                'highlight': True,
                'duration': 1.0,  # Default duration
                'action': 'disassemble'
            })
        return steps
