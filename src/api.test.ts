import { expect, test } from "bun:test";
import { getProjectId } from "./api";

test("getProjectId functions", () => {
	expect(getProjectId("https://scratch.mit.edu/projects/1182094620/")).toBe(
		1182094620,
	);
	expect(
		getProjectId("https://scratch.mit.edu/projects/1234567890/editor"),
	).toBe(1234567890);
	expect(
		getProjectId("https://scratch.mit.edu/projects/1234567890/fullscreen"),
	).toBe(1234567890);
	expect(() => getProjectId("https://scratch.mit.edu/users/username/")).toThrow(
		"Invalid Scratch project URL",
	);
});
