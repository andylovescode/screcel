import { exists, readFile } from "node:fs/promises";
import { join } from "node:path";
import * as v from "valibot";
import { projectSchema } from "./project-schema";

export function getProjectId(url: string): number {
	const pathname = new URL(url).pathname;
	const segments = pathname.split("/");

	if (!segments.includes("projects")) {
		throw new Error("Invalid Scratch project URL");
	}

	return Number.parseInt(segments[segments.indexOf("projects") + 1]);
}

const projectApiSchema = v.object({
	project_token: v.string(),
});

export async function download_project(url: string) {
	const projectId = getProjectId(url);

	const cachePath = join(
		".screcel",
		"cache",
		`projects-${projectId.toString()}.json`,
	);

	if (await exists(cachePath)) {
		return v.parse(
			projectSchema,
			JSON.parse((await readFile(cachePath)).toString()),
		);
	}

	const data = await fetch(
		`https://api.scratch.mit.edu/projects/${projectId}`,
	).then((res) => res.json());
	const { project_token } = v.parse(projectApiSchema, data);

	const projectJson = await fetch(
		`https://projects.scratch.mit.edu/${projectId}?token=${project_token}`,
	).then((res) => res.json());

	await Bun.write(cachePath, JSON.stringify(projectJson, null, 2));

	return v.parse(projectSchema, projectJson);
}
