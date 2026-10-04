// LCS length of word against doc[start, end)
function lcsLength(word, doc, start, end) {
  const wordLength = word.length;
  const row = new Uint32Array(wordLength + 1);
  for (let docIndex = start; docIndex < end; ++docIndex) {
    let diagonal = 0; // row[wordIndex - 1] from the previous doc char
    const docChar = doc[docIndex];
    for (let wordIndex = 1; wordIndex <= wordLength; ++wordIndex) {
      const above = row[wordIndex]; // previous doc char, same wordIndex
      row[wordIndex] = word[wordIndex - 1] === docChar ?
        diagonal + 1 :
        Math.max(above, row[wordIndex - 1]);
      diagonal = above;
    }
  }
  return row[wordLength];
}

// Best word by windowed LCS. Window = word length + maxGap.
function bestLcsWord(words, doc) {
  let best = {
    word: null,
    score: -1
  };
  for (const word of words) {
    const maxGap = word.length;
    const wordLength = word.length;
    if (!wordLength) continue;
    const span = wordLength + maxGap;
    let top = 0;
    const lastStart = Math.max(0, doc.length - span);
    for (let start = 0; start <= lastStart; ++start) {
      const length = lcsLength(
        word,
        doc,
        start,
        Math.min(doc.length, start + span)
      );
      if (length > top) {
        top = length;
        if (top === wordLength) break;
      }
    }
    const score = top / wordLength;
    if (score > best.score) best = {
      word,
      score
    };
  }
  return best;
}

// Max multiset overlap between word and any window of `span` doc chars.
function bestWindowOverlap(word, doc, span) {
  const wordLength = word.length;
  const needed = new Map();
  for (const char of word) needed.set(char, (needed.get(char) ?? 0) + 1);
  const inWindow = new Map();
  for (const char of needed.keys()) inWindow.set(char, 0);

  let overlap = 0;
  let top = 0;
  for (let docIndex = 0; docIndex < doc.length; ++docIndex) {
    const entering = doc[docIndex];
    const enteringNeeded = needed.get(entering);
    if (enteringNeeded !== undefined) {
      const count = inWindow.get(entering);
      if (count < enteringNeeded) ++overlap; // still useful, not surplus
      inWindow.set(entering, count + 1);
    }
    if (docIndex >= span) {
      const leaving = doc[docIndex - span];
      const leavingNeeded = needed.get(leaving);
      if (leavingNeeded !== undefined) {
        const count = inWindow.get(leaving) - 1;
        inWindow.set(leaving, count);
        if (count < leavingNeeded) --overlap; // lost a useful one
      }
    }
    if (overlap > top) {
      top = overlap;
      if (top === wordLength) break;
    }
  }
  return top;
}

function bestWord(words, doc, spanFor = word => word.length * 2) {
  let best = {
    word: null,
    score: -1
  };
  for (const word of words) {
    if (!word.length) continue;
    const score = bestWindowOverlap(word, doc, spanFor(word)) / word.length;
    if (score > best.score) best = {
      word,
      score
    };
  }
  return best;
}
