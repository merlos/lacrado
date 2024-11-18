# Probability of collision of IDs

Lacrado has an id of 16 characters chosen from the letters, numbers and the symbols '_' and '-'.So, what is the probability of generating two ids that are the same and are in the database? 

We need to calculate the collision probability for an ID of length 16, where each character is randomly chosen from the character set \([a-zA-Z0-9_-]\), which contains 64 possible characters. 


### Parameters:
1. **Length of ID**: 16
2. **Character Set Size**: 64 (\([a-zA-Z0-9_-]\))
3. **Total Possible IDs**:
   \[
   \text{Total Possible IDs} = 64^{16}
   \]
4. **Number of IDs (\(n\))**: Varying \(n\) values (\(1,000\), \(100,000\), \(1,000,000\), \(1,000,000,000\)).

We will use the **Birthday Paradox Approximation**:
\[
P(\text{collision}) = 1 - e^{-\frac{n^2}{2 \times \text{Total Possible IDs}}}
\]

### Step-by-Step Calculation:
1. Compute the total number of possible IDs.
2. For each \(n\), calculate the probability of **no collision**:
   \[
   P(\text{no collision}) = e^{-\frac{n^2}{2 \times \text{Total Possible IDs}}}
   \]
3. Subtract the probability of no collision from 1 to get the probability of a collision:
   \[
   P(\text{collision}) = 1 - P(\text{no collision})
   \]


### Results for Collision Probability:

Using [collisions.py](./collisions.py).

```sh
python3 ./collisions.py
```
```
n: 1000
Total possible IDs: 7.92e+28
Probability of no collision: 1.000000000000000
Probability of collision: 0.000000000000000
--------------------------------------------------
n: 100000
Total possible IDs: 7.92e+28
Probability of no collision: 1.000000000000000
Probability of collision: 0.000000000000000
--------------------------------------------------
n: 1000000
Total possible IDs: 7.92e+28
Probability of no collision: 1.000000000000000
Probability of collision: 0.000000000000000
--------------------------------------------------
n: 1000000000
Total possible IDs: 7.92e+28
Probability of no collision: 0.999999999993689
Probability of collision: 0.000000000006311
--------------------------------------------------
```

For an ID length of 16 characters, with each character chosen from the 64-character set \([a-zA-Z0-9_-]\):

- **Total possible IDs**: \(7.92 \times 10^{28}\)

| \(n\) (Number of IDs) | Probability of No Collision | Probability of Collision |
|------------------------|-----------------------------|--------------------------|
| 1,000                 | 1.0000000000               | 0.0000000000            |
| 100,000               | 1.0000000000               | 0.0000000000            |
| 1,000,000             | 1.0000000000               | 0.0000000000            |
| 1,000,000,000         | 1.0000000000               | 0.0000000000            |

### Explanation:
The probability of a collision is practically zero even for \(n = 1,000,000,000\) because the total number of possible IDs (\(7.92 \times 10^{28}\)) is astronomically large compared to the number of IDs being generated. This makes collisions highly unlikely. 
