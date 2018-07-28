export default interface BatchProcessor<A, B> {
    process(item: A): Promise<B>; 
}