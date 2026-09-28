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

const lcsMatch = (seq1,seq2)=>{
  return lcs(seq1,seq2) >= Math.floor(Math.max(seq1.length,seq2.length) * 0.8);
};

const weightedLcs = (seq1 = [], seq2 = []) => {
  if (seq1.length === 0 || seq2.length === 0) return 0;
  return (
    (lcs(seq1, seq2) * Math.min(seq1.length, seq2.length)) /
    Math.max(seq1.length, seq2.length)
  );
};

export const rank = (query = "", results = []) => {
  return structuredClone(results)
    .map((result) => {
      result.score = weightedLcs(query, result.text);
      return result;
    })
    .sort((x, y) => y?.score - x?.score);
};
