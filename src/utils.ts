export function unwrap<T>(value: T | undefined | null): T {
	if (value === undefined || value === null) {
		throw new Error("Value cannot be undefined or null");
	}
	return value;
}
