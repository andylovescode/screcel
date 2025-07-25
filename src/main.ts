import { download_project } from "./api";
import { benchmark } from "./benchmark";
import { codegenProject } from "./codegen";

benchmark("Run all", async () => {
	const scratch_url = "https://scratch.mit.edu/projects/1182094620/";

	const project = await download_project(scratch_url);

	const code = codegenProject(project);

	Bun.write("./output.js", code);
});
