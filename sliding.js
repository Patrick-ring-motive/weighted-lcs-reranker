/**
 * Returns the length of the LCS constrained to a diagonal window.
 *
 * A[i] and B[j] may only match when |i - j| < window.
 *
 * Time:  O(min(n, m) * window)
 * Space: O(window)
 *
 * @param {Array} a
 * @param {Array} b
 * @param {number} window
 * @param {(a: *, b: *) => boolean} [equal]
 * @returns {number}
 */
function lcsWindowCount(a, b, window, equal = (a, b) => a === b) {
    if (!a?.length || !b?.length) {
        return 0;
    }

    if (b.length > a.length) {
        [a, b] = [b, a];
    }
    window ||= b.length * 2;
    const m = b.length;

    let previous = new Uint32Array(m + 1);
    let current = new Uint32Array(m + 1);
    const a_len = a.length + 1;
    for (let i = 1; i <= a_len; ++i) {
        const start = Math.max(1, i - window + 1);
        const end = Math.min(m, i + window - 1);

        /*
         * Values outside the current band cannot contribute.
         * The zero at start - 1 represents the left boundary.
         */
        for (let j = start; j <= end; ++j) {
            let value = Math.max(
                previous[j],
                current[j - 1]
            );

            if (equal(a[i - 1], b[j - 1])) {
                value = Math.max(
                    value,
                    previous[j - 1] + 1
                );
            }

            current[j] = value;
        }

        [previous, current] = [current, previous];
    }

    return previous[m];
}
