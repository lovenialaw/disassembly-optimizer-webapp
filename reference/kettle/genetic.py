import time
import math
import copy

# =====================================================
# 1. FITNESS FUNCTION
# =====================================================

def path_cost(path, G):
    """Total disassembly complexity of a path"""
    cost = 0
    for i in range(len(path) - 1):
        if not G.has_edge(path[i], path[i + 1]):
            return float("inf")
        cost += G[path[i]][path[i + 1]]["weight"]
    return cost


def fitness(path, G):
    """Higher fitness = lower disassembly complexity"""
    return 1 / (1 + path_cost(path, G))


# =====================================================
# 2. DEFAULT GA PARAMETERS (NO USER INPUT)
# =====================================================

DEFAULT_RETAIN = 0.5
DEFAULT_MUTATION_RATE = 0.2
DEFAULT_GENERATIONS = 30

retain = DEFAULT_RETAIN
mutation_rate = DEFAULT_MUTATION_RATE
generations = DEFAULT_GENERATIONS


# =====================================================
# 3. POPULATION SIZE BASED ON NUMBER OF COMPONENTS
# =====================================================
# Example:
#   3 components → 3! = 6 possible arrangements → population size = 6

avg_path_length = int(sum(len(p) for p in all_paths) / len(all_paths))
population_size = math.factorial(avg_path_length)

# Safety guard (GA requires at least 2 chromosomes)
population_size = max(2, population_size)

print("=== GA PARAMETERS (DEFAULT) ===")
print(f"Average components per path: {avg_path_length}")
print(f"Population size (factorial): {avg_path_length}! = {population_size}")
print(f"Retain rate: {retain}")
print(f"Mutation rate: {mutation_rate}")
print(f"Generations: {generations}")


# =====================================================
# 4. INITIAL POPULATION (DETERMINISTIC)
# =====================================================
# Take paths in fixed order, no random sampling

population = []
for path in all_paths:
    population.append(path)
    if len(population) >= population_size:
        break

# If not enough paths, repeat deterministically
idx = 0
while len(population) < population_size:
    population.append(all_paths[idx % len(all_paths)])
    idx += 1


best_overall = None
best_cost = float("inf")


# =====================================================
# 5. SELECTION (DETERMINISTIC)
# =====================================================

def select_population(population, G, retain):
    """Keep the top retain% paths based on cost"""
    population = sorted(population, key=lambda p: path_cost(p, G))
    retain_length = max(1, int(len(population) * retain))
    return population[:retain_length]


# =====================================================
# 6. MUTATION (DETERMINISTIC, NO RANDOMNESS)
# =====================================================
# Mutation replaces a chromosome using a fixed cycling rule

def mutate_population(population, all_paths, mutation_rate, generation):
    """
    Deterministic mutation:
    Periodically replaces a chromosome with another valid disassembly path.
    No randomness is used.
    """

    if mutation_rate <= 0:
        return population

    mutation_interval = max(1, int(1 / mutation_rate))
    new_population = copy.deepcopy(population)

    if generation % mutation_interval == 0:
        for i in range(len(new_population)):
            new_population[i] = all_paths[(generation + i) % len(all_paths)]

    return new_population


# =====================================================
# 7. GA MAIN LOOP
# =====================================================

start_time = time.time()
mutation_counter = 0

print("\n=== EVOLUTION STARTED ===")

for gen in range(generations):

    # Selection (elitist, deterministic)
    population = select_population(population, G, retain)

    # Mutation (deterministic replacement)
    population = mutate_population(
        population, all_paths, mutation_rate, gen
    )

    # Evaluate best solution
    for path in population:
        cost = path_cost(path, G)
        if cost < best_cost:
            best_cost = cost
            best_overall = path


# =====================================================
# 8. RESULTS
# =====================================================

elapsed_time = time.time() - start_time

print("\n🧬 GENETIC ALGORITHM RESULT (KETTLE)")
print("Best disassembly sequence:")
for i, step in enumerate(best_overall, 1):
    print(f"  {i}. {step}")

print(f"\nTotal disassembly complexity: {best_cost:.2f}")
print(f"Generations: {generations}")
print(f"Execution time: {elapsed_time:.2f} seconds")
print("(Lower score = easier and safer disassembly)")