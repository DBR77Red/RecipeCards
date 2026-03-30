let _counter = 0;
export const randomUUID = () => `mock-uuid-${++_counter}`;
export function resetCounter() { _counter = 0; }
