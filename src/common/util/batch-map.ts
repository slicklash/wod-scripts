/**
 * Map over items in small concurrent batches.
 * Processes items in chunks of `limit` size, awaiting each batch before moving on.
 *
 * @param limit - max concurrent operations per batch (default: 3)
 * @param skipErrors - if `true`, skip failed items instead of failing fast
 */
export async function batchMap<T, U>(items: T[], fn: (item: T, index: number) => Promise<U>, options: { limit?: number; skipErrors?: boolean } = {}): Promise<U[]> {
  const { limit = 3, skipErrors = false } = options;
  const results: U[] = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit).entries();
    const promises = Array.from(batch, ([j, item]) =>
      fn(item, j).catch((err) => {
        if (!skipErrors) throw err;
        return undefined as unknown as U;
      }),
    );
    const done = await Promise.all(promises);
    for (const r of done) {
      if (r !== undefined) results.push(r);
    }
  }

  return results;
}
