# Weighted LCS Reranker

A lightweight, dependency-free reranking module for Vector DB retrieval results based on **Weighted Longest Common Subsequence (LCS)**.

This is useful as a post-processing step after semantic/vector search when you want to reward candidates that preserve token/character order overlap with the user query.

## Why use this?

Vector search is great for semantic similarity, but it can still return results that are topically related while being weak lexical matches.

This reranker adds a cheap lexical signal:

- Computes LCS between query and candidate text
- Normalizes by length ratio to reduce bias toward much longer/shorter strings
- Sorts results by this weighted score (descending)

Good fit when you want:

- fast, local reranking
- no external model/API calls
- deterministic behavior

## Scoring

For sequences `q` and `t`:

$$
\text{score}(q, t) = \text{LCS}(q, t) \times \frac{\min(|q|, |t|)}{\max(|q|, |t|)}
$$

Special case:

- If either sequence is empty, score is `0`

### Notes on implementation

- Uses rolling dynamic-programming rows (`Uint32Array`) for memory efficiency.
- Time complexity: $O(|q| \cdot |t|)$ per candidate
- Space complexity: $O(\min(|q|, |t|))$ for DP row width

## API

`reranker.js` exports:

- `rank(query, results)`

### Input

- `query` (`string`, default `""`)
- `results` (`Array<{ text: string, ... }>`)

Each result item must include a `text` field.

### Output

Returns a **new array** of result objects (cloned from input), each augmented with:

- `score` (`number`) — weighted LCS score

Sorted in descending score order.

## Example

```js
import { rank } from "./reranker.js";

const query = "how to reset password";
const results = [
  { id: 1, text: "password reset instructions for account recovery" },
  { id: 2, text: "billing invoice download guide" },
  { id: 3, text: "reset your password quickly" },
];

const reranked = rank(query, results);
console.log(reranked);
```

## Integration with Vector DB pipelines

Typical flow:

1. Retrieve top-$k$ candidates from vector DB
2. Pass candidates to `rank(query, candidates)`
3. Use reranked top-$n$ for downstream steps (answer synthesis, display, etc.)

## Trade-offs

Pros:

- Very fast for short/medium texts
- No model inference costs
- Interpretable and deterministic

Cons:

- Not semantic by itself
- Can under-score paraphrases with low lexical overlap
- Per-candidate cost grows with text length

Tip: keep candidate text snippets reasonably short (e.g., chunked passages) for best speed.

## File structure

- `reranker.js` — implementation of LCS, weighted score, and `rank`

## License

Add your project license information here.
