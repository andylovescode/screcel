export function benchmark(name: string, impl: () => Promise<void>) {
	console.time(name);
	return impl().finally(() => console.timeEnd(name));
}
