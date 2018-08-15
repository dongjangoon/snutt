export default interface BatchProcessor<A, B> {
    process(item: A, executionContext?): Promise<B>; 
}