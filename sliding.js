/**
 * Computes a longest common subsequence while restricting matches
 * to a diagonal sliding window.
 *
 * A[i] may only match B[j] when |i - j| < window.
 *
 * Time:  O((n + m) * window)
 * Space: O(window)
 *
 * @param {Array} a
 * @param {Array} b
 * @param {number} window
 * @param {(a: *, b: *) => boolean} [equal]
 * @returns {Array}
 */
function windowedLCS(a, b, window, equal = (a, b) => a === b) {
    if (window <= 0 || !a.length || !b.length) {
        return [];
    }

    /*
     * Work with the shorter sequence as the column dimension.
     * This minimizes memory and usually improves cache behavior.
     */
    if (b.length > a.length) {
        return windowedLCS(b, a, window, (a, b) => equal(b, a));
    }

    const n = a.length;
    const m = b.length;

    /*
     * We need the actual sequence, so store the predecessor choice
     * for each cell in the band.
     *
     * A cell is identified by (i, j), but only j values within
     * `window` of i are represented.
     */
    const rows = new Array(n);

    /*
     * The DP value for a cell is:
     *
     *   match -> dp[i-1][j-1] + 1
     *   skip A -> dp[i-1][j]
     *   skip B -> dp[i][j-1]
     *
     * Only the diagonal band is retained.
     */
    let previous = new Map();

    for (let i = 0; i < n; i++) {
        const current = new Map();
        const start = Math.max(0, i - window + 1);
        const end = Math.min(m - 1, i + window - 1);

        for (let j = start; j <= end; j++) {
            let value = 0;
            let choice = 0;

            if (equal(a[i], b[j])) {
                const diagonal = previous.get(j - 1) ?? 0;

                value = diagonal + 1;
                choice = 1;
            }

            const up = previous.get(j) ?? 0;

            if (up > value) {
                value = up;
                choice = 2;
            }

            const left = current.get(j - 1) ?? 0;

            if (left > value) {
                value = left;
                choice = 3;
            }

            current.set(j, value);
        }

        rows[i] = current;
        previous = current;
    }

    /*
     * Reconstruct the sequence.
     *
     * Because cells outside the band don't exist, reaching one of
     * those boundaries simply means the corresponding direction
     * isn't available.
     */
    const result = [];

    let i = n - 1;
    let j = m - 1;

    while (i >= 0 && j >= 0) {
        const row = rows[i];
        const choice = row.get(j);

        if (choice === 1) {
            result.push(a[i]);
            i--;
            j--;
        } else if (choice === 2) {
            i--;
        } else if (choice === 3) {
            j--;
        } else {
            /*
             * The target cell may be outside the band.
             */
            if (i > j) {
                i--;
            } else {
                j--;
            }
        }
    }

    result.reverse();

    return result;
}
