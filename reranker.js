function lcsAlign(seq1, seq2) {
  "use strict";
  const none = {
    length: 0,
    a: [],
    b: []
  };
  if (seq1 == null || seq2 == null) return none;
  if (seq1 === seq2) {
    const all = [...seq1];
    return {
      length: all.length,
      a: all,
      b: all
    };
  }
  let long = [...seq1];
  let short = [...seq2];
  if (short.length > long.length)[long, short] = [short, long];

  const n = long.length;
  const m = short.length;
  if (!n || !m) return none;
  const width = m + 1;

  const mk = () => ({
    len: new Uint32Array(width),
    s1: new Int32Array(width),
    s2: new Int32Array(width),
    e1: new Int32Array(width),
    e2: new Int32Array(width),
  });
  const copy = (dst, x, src, y) => {
    dst.len[x] = src.len[y];
    dst.s1[x] = src.s1[y];
    dst.s2[x] = src.s2[y];
    dst.e1[x] = src.e1[y];
    dst.e2[x] = src.e2[y];
  };

  let prev = mk();
  let curr = mk();

  for (let i = 1; i <= n; ++i) {
    curr.len[0] = 0;
    const a1 = long[i - 1];
    for (let x = 1; x !== width; ++x) {
      if (a1 === short[x - 1]) {
        const d = prev.len[x - 1];
        curr.len[x] = d + 1;
        if (d === 0) {
          curr.s1[x] = i - 1;
          curr.s2[x] = x - 1;
        } else {
          curr.s1[x] = prev.s1[x - 1];
          curr.s2[x] = prev.s2[x - 1];
        }
        curr.e1[x] = i - 1;
        curr.e2[x] = x - 1;
      } else if (curr.len[x - 1] > prev.len[x]) {
        copy(curr, x, curr, x - 1);
      } else {
        copy(curr, x, prev, x);
      }
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  const length = prev.len[m];
  if (!length) return none;
  return {
    length,
    a: long.slice(prev.s1[m], prev.e1[m] + 1),
    b: short.slice(prev.s2[m], prev.e2[m] + 1),
  };
}

// unorderedWindowOverlap unchanged

const boundedLcs = (seq1, seq2) => {
  const {
    length,
    a,
    b
  } = lcsAlign(seq1, seq2);
  if (!length) return 0;
  return Math.min(unorderedWindowOverlap(a, b), length);
};

function unorderedWindowOverlap(seq1, seq2) {
  let pattern = [...(seq1 ?? [])];
  let text = [...(seq2 ?? [])];
  if (text.length < pattern.length)[pattern, text] = [text, pattern];

  const patternLength = pattern.length;
  if (!patternLength) return 0;
  const windowSize = patternLength * 2;

  const needed = new Map();
  for (let index = 0; index !== patternLength; ++index) {
    const item = pattern[index];
    needed.set(item, (needed.get(item) ?? 0) + 1);
  }
  const inWindow = new Map();
  for (const item of needed.keys()) inWindow.set(item, 0);

  let overlap = 0;
  let best = 0;
  const textLength = text.length;
  for (let index = 0; index !== textLength; ++index) {
    const entering = text[index];
    const enteringNeeded = needed.get(entering);
    if (enteringNeeded !== undefined) {
      const count = inWindow.get(entering);
      if (count < enteringNeeded) ++overlap;
      inWindow.set(entering, count + 1);
    }
    if (index >= windowSize) {
      const leaving = text[index - windowSize];
      const leavingNeeded = needed.get(leaving);
      if (leavingNeeded !== undefined) {
        const count = inWindow.get(leaving) - 1;
        inWindow.set(leaving, count);
        if (count < leavingNeeded) --overlap;
      }
    }
    if (overlap > best) {
      best = overlap;
      if (best === patternLength) break;
    }
  }
  return best;
}

const lcsMatch = (seq1, seq2) => {
  return boundedLcs(seq1, seq2) >= Math.floor(Math.max(seq1?.length || 0, seq2?.length || 0) * 0.8);
};

const weightedLcs = (seq1 = [], seq2 = []) => {
  if (seq1.length === 0 || seq2.length === 0) return 0;
  return (
    (boundedLcs(seq1, seq2) * Math.min(seq1.length, seq2.length)) /
    Math.max(seq1.length, seq2.length)
  );
};

export const lcsInfo = (seq1, seq2) => {
  const minLength = Math.min(seq1?.length || 0, seq2?.length || 0) || 0;
  const maxLength = Math.max(seq1?.length || 0, seq2?.length || 0) || 0;
  const lcsLength = boundedLcs(seq1, seq2);
  const lcsMatch = lcsLength >= Math.floor(0.8 * maxLength);
  const lcsContains = lcsLength >= Math.floor(0.8 * minLength);
  const lcsRatio = minLength ? lcsLength / minLength : 0;
  const lcsWeight = lcsLength * minLength / (maxLength || Math.MIN_SAFE_INTEGER);
  return {
    minLength,
    maxLength,
    lcsLength,
    lcsMatch,
    lcsContains,
    lcsRatio,
    lcsWeight
  };
};

export const rank = (query = "", results = []) => {
  return structuredClone(results)
    .map((result) => {
      result.score = weightedLcs(query, result.text);
      return result;
    })
    .sort((x, y) => y?.score - x?.score);
};
