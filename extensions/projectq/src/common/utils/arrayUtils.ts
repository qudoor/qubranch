/**
 * Returns the elements of an array that meet the condition specified in an async callback function.
 * @param asyncPredicate The filter method calls the async predicate function one time for each element in the array.
 */
export async function asyncFilter<T>(arr: T[], asyncPredicate: (value: T) => Promise<unknown>): Promise<T[]> {
    const results = await Promise.all(arr.map(asyncPredicate));
    return arr.filter((_v, index) => results[index]);
}
