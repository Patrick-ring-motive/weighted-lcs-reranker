function lcs(seq1, seq2) {
  "use strict";
  if (seq1 == null || seq2 == null) return 0;
  if (seq1 === seq2) return seq1.length;
  let array1 = [...seq1];
  let array2 = [...seq2];
  if (array2.length > array1.length) {
    [array1, array2] = [array2, array1];
  }

  const arr1_length = array1.length;
  const arr2_length = array2.length;

  const width = arr2_length + 1;
  const height = arr1_length + 1;

  let prev = new Uint32Array(width);
  let curr = new Uint32Array(width);

  for (let i = 1; i !== height; ++i) {
    curr[0] = 0;
    const a1 = array1[i - 1];
    for (let x = 1; x !== width; ++x) {
      if (a1 === array2[x - 1]) {
        curr[x] = prev[x - 1] + 1;
      } else {
        curr[x] = curr[x - 1] > prev[x] ? curr[x - 1] : prev[x];
      }
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  const score = prev[arr2_length];
  return score;
}

function unorderedWindowOverlap(seq1, seq2) {
    let pattern = typeof seq1 === 'string' ? seq1 : [...(seq1 ?? [])];
    let text = typeof seq2 === 'string' ? seq2 : [...(seq2 ?? [])];
    if (text.length < pattern.length) [pattern, text] = [text, pattern];

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

const boundedLcs = (seq1, seq2) => {
  return Math.min(unorderedWindowOverlap(seq1,seq2),lcs(seq1,seq2));
};

const lcsMatch = (seq1, seq2) => {
  return boundedLcs(seq1, seq2) >= Math.floor(Math.max(seq1.length, seq2.length) * 0.8);
};

const weightedLcs = (seq1 = [], seq2 = []) => {
  if (seq1.length === 0 || seq2.length === 0) return 0;
  return (
    (boundedLcs(seq1, seq2) * Math.min(seq1.length, seq2.length)) /
    Math.max(seq1.length, seq2.length)
  );
};

export const lcsInfo = (se1, seq2) => {
  const minLength = Math.min(seq1?.length || 0, seq2?.length || 0) || 0;
  const maxLength = Math.max(seq1?.length || 0, seq2?.length || 0) || 0;
  const lcsLength = lcs(seq1, seq2);
  const lcsMatch = lcsLength >= Math.floor(0.8 * maxLength);
  const lcsWeight = lcsLength * minLength / (maxLength || Math.MIN_SAFE_INTEGER);
  return {
    minLength,
    maxLength,
    lcsLength,
    lcsMatch,
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
