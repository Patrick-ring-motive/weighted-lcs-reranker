/**
 * Cloudflare Worker wrapper for weighted-lcs-reranker.
 *
 * Exposes rank(query, results) (see ./reranker.js) as an HTTP microservice. The
 * core `rank` function is re-exported on the default export so this module can
 * also be imported directly.
 *
 *   GET  /?query=lazy+dog&results=the+cat,the+lazy+dog,a+fox
 *   POST / { "query": "lazy dog", "results": ["the cat", "the lazy dog"] }
 *   POST / { "query": "lazy dog", "results": [{ "text": "the lazy dog", "id": 1 }] }
 *
 * Response: { "results": [{ "text", "score", ... }, ...] }  (best first)
 *
 * Note: GET splits `results` on commas, so candidates can't contain commas —
 * use POST for arbitrary text or to preserve extra fields on each result.
 */
import {
  rank
} from "./reranker.js";

const isString = x => typeof x === "string" || x instanceof String;
const isArray = x => Array.isArray(x) || x instanceof Array;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });

// Normalize results into the [{ text, ... }] shape rank expects. Accepts an
// array of strings or an array of objects that already carry a `text` field.
const normalizeResults = (results) =>
  results.map(item => (isString(item) ? {
    text: String(item)
  } : item));

export default {
  rank,

  async fetch(request) {
    try {
      let query;
      let results;

      if (request.method === "GET") {
        const url = new URL(request.url);
        query = url.searchParams.get("query");
        const raw = url.searchParams.get("results");
        results = raw == null ? [] : raw.split(",").map(t => t.trim()).filter(Boolean);
      } else if (request.method === "POST") {
        const body = await request.json();
        query = body?.query;
        results = body?.results;
      } else {
        return json({
          error: "Method not allowed. Use GET or POST."
        }, 405);
      }

      if (!isString(query))
        return json({
          error: 'Missing or invalid "query". Must be a string.'
        }, 400);

      if (!isArray(results))
        return json({
          error: 'Missing or invalid "results". Must be an array.'
        }, 400);

      const ranked = rank(query, normalizeResults(results));
      return json({
        results: ranked
      });
    } catch (error) {
      return json({
        error: "Internal server error",
        message: error.message
      }, 500);
    }
  }
};
