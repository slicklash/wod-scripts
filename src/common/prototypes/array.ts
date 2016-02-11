interface ArrayConstructor {
    from(items: any): any[];
}

interface Array<T> {
    find(predicate: (search: T) => boolean) : T;
}
