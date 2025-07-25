import type { Project, Value } from "./project-schema";
import {
	type ControlFlowInstruction,
	type Expression,
	type Instruction,
	type RepeatInstruction,
	type UnraveledScript,
	unwravelBlocks,
} from "./unwravel";
import { unwrap } from "./utils";

export type IdentifierRegistry = {
	getIdentifier(id: string, cleanName?: string): string;
};

export function createIdentifierRegistry(): IdentifierRegistry {
	const identifiers: Record<string, string> = {};

	return {
		getIdentifier(id: string, cleanName = id): string {
			if (id in identifiers) {
				return identifiers[id];
			}

			const safe = cleanName.replace(/[^a-zA-Z0-9_]/g, "_");

			const identifier = `id_${Object.keys(identifiers).length + 1}_${safe}`;
			identifiers[id] = identifier;
			return identifier;
		},
	};
}

export type Script = {
	indent(): void;
	unindent(): void;
	write(line: string): void;
	identifiers: IdentifierRegistry;
	script: string;
};

export function createScript(): Script {
	const lines: string[] = [];
	let indentLevel = 0;

	function indent() {
		indentLevel++;
	}

	function unindent() {
		if (indentLevel > 0) {
			indentLevel--;
		}
	}

	function write(line: string) {
		lines.push("    ".repeat(indentLevel) + line);
	}

	const identifiers = createIdentifierRegistry();

	return {
		indent,
		unindent,
		write,
		get script() {
			return lines.join("\n");
		},
		identifiers,
	};
}

export function codegenProject(project: Project) {
	const script = createScript();

	script.write("// Generated code for Scratch project");

	for (const target of project.targets) {
		script.write(`// Target: ${target.name}`);

		script.write(
			`function ${script.identifiers.getIdentifier(target.name)}() {`,
		);
		script.indent();

		for (const [variableId, [variableName, initialValue]] of Object.entries(
			target.variables,
		)) {
			const identifier = script.identifiers.getIdentifier(
				variableId,
				variableName,
			);
			script.write(
				`let ${identifier} = ${JSON.stringify(initialValue)}; // Variable: ${variableName}`,
			);
		}

		for (const [listId, [listName, initialValue]] of Object.entries(
			target.lists,
		)) {
			const identifier = script.identifiers.getIdentifier(
				listId,
				listName,
			);
			script.write(
				`let ${identifier} = ${JSON.stringify(initialValue)}; // List: ${listName}`,
			);
		}

		const unwraveled = unwravelBlocks(target.blocks);

		for (const unwraveledScript of unwraveled) {
			codegenScript(unwraveledScript, script);
		}

		script.write("function flagClicked() {");

		script.indent();

		for (const [blockId, block] of Object.entries(target.blocks)) {
			if (block.opcode === "event_whenflagclicked") {
				const methodName = script.identifiers.getIdentifier(blockId);
				script.write(`${methodName}(); // Executing block: ${block.opcode}`);
			}
		}

		script.unindent();

		script.write("}");

		script.write("return { flagClicked };");

		script.unindent();
		script.write("}");
	}

	return script.script;
}

export function codegenExpression(
	expression: Expression,
	script: Script,
): string {
	switch (expression.type) {
		case "literal": {
			return JSON.stringify(expression.value);
		}
		case "list_length": {
			const listName = script.identifiers.getIdentifier(expression.list);
			return `${listName}.length`;
		}
		case "binary_operation": {
			const left = codegenExpression(expression.left, script);
			const right = codegenExpression(expression.right, script);
			switch (expression.operator) {
				case "add":
					return `${left} + ${right}`;
				case "subtract":
					return `${left} - ${right}`;
				case "multiply":
					return `${left} * ${right}`;
				case "divide":
					return `${left} / ${right}`;
				case "join": {
					return `String(${left}) + String(${right})`; // Ensure both sides are strings
				}
				default:
					throw new Error(`Unsupported operator: ${expression.operator}`);
			}
		}
		case "list_item": {
			const listName = script.identifiers.getIdentifier(expression.list);
			const index = codegenExpression(expression.index, script);
			return `${listName}[${index}]`;
		}
		default: {
			throw new Error(`Unsupported expression type: ${expression.type}`);
		}
	}
}

function codegenInstruction(
	instruction: ControlFlowInstruction,
	script: Script,
) {
	switch (instruction.type) {
		case "instruction": {
			switch (instruction.opcode) {
				case "data_setvariableto": {
					const variableId = (unwrap(instruction.fields).VARIABLE as [string,string])[1];
					const value = unwrap(instruction.inputs).VALUE;
					const variableName = script.identifiers.getIdentifier(variableId);
					const serializedValue = codegenExpression(value, script);
					script.write(`${variableName} = ${serializedValue}; // Set variable`);
					break;
				}
				case "data_addtolist": {
					const listId = (unwrap(instruction.fields).LIST as [string,string])[1];
					const value = unwrap(instruction.inputs).ITEM;
					const listName = script.identifiers.getIdentifier(listId);
					const serializedValue = codegenExpression(value, script);
					script.write(`${listName}.push(${serializedValue}); // Add to list`);
					break;
				}
				case "data_changevariableby": {
					const variableId = (unwrap(instruction.fields).VARIABLE as [string,string])[1];
					const value = unwrap(instruction.inputs).VALUE;
					const variableName = script.identifiers.getIdentifier(variableId);
					const serializedValue = codegenExpression(value, script);
					script.write(`${variableName} += Number(${serializedValue}); // Change variable`);
					break;
				}
				case "event_whenflagclicked": {
					break;
				}
				default: {
					throw new Error(`Unsupported opcode: ${instruction.opcode}`);
				}
			}

			break;
		}
		case "repeat": {
			const count = unwrap(instruction.inputs).TIMES;
			const serializedCount = codegenExpression(count, script);
			script.write(`for (let i = 0; i < ${serializedCount}; i++) {`);
			script.indent();

			for (const innerInstruction of (instruction as RepeatInstruction).body) {
				codegenInstruction(innerInstruction, script);
			}

			script.unindent();
			script.write("}");
			break;
		}
		default: {
			throw new Error(`Unsupported instruction type: ${instruction.type}`);
		}
	}
}

function codegenScript(unwraveledScript: UnraveledScript, script: Script) {
	const methodName = script.identifiers.getIdentifier(unwraveledScript.id);

	script.write(`function ${methodName}() {`);
	script.indent();

	for (const instruction of unwraveledScript.instructions) {
		codegenInstruction(instruction, script);
	}

	script.unindent();
	script.write("}");

	return methodName;
}
