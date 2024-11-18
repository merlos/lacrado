import math

def calculate_collision_probability(length, n_values):
    # Define the size of the character set
    charset_size = 64  # [a-zA-Z0-9_-]

    # Calculate the total number of possible IDs
    total_ids = charset_size ** length

    results = []
    for n in n_values:
        # Probability of no collision using birthday paradox formula
        no_collision_probability = math.exp(-(n ** 2) / (2 * total_ids))
        collision_probability = 1 - no_collision_probability

        # Store the intermediate results for each n
        results.append({
            "n": n,
            "total_ids": total_ids,
            "no_collision_probability": no_collision_probability,
            "collision_probability": collision_probability
        })

    return results

# Parameters
length = 16  # Length of the ID
n_values = [1000, 100000, 1000000, 1000000000]  # Number of IDs to generate

# Calculate collision probabilities
results = calculate_collision_probability(length, n_values)

# Print the results
for result in results:
    print(f"n: {result['n']}")
    print(f"Total possible IDs: {result['total_ids']:.2e}")
    print(f"Probability of no collision: {result['no_collision_probability']:.15f}")
    print(f"Probability of collision: {result['collision_probability']:.15f}")
    print("-" * 50)
