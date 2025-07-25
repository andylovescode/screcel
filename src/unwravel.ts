import type { Block } from "./project-schema";

// Expression types
export interface LiteralExpression {
	type: "literal";
	value: string | number | boolean;
	dataType: "string" | "number" | "boolean";
}

export interface VariableExpression {
	type: "variable";
	name?: string;
	id: string;
}

export interface BinaryOperationExpression {
	type: "binary_operation";
	operator: "add" | "subtract" | "multiply" | "divide" | "mod" | "join";
	left: Expression;
	right: Expression;
}

export interface ComparisonExpression {
	type: "comparison";
	operator: "equals" | "gt" | "lt";
	left: Expression;
	right: Expression;
}

export interface LogicalOperationExpression {
	type: "logical_operation";
	operator: "and" | "or";
	left: Expression;
	right: Expression;
}

export interface LogicalNotExpression {
	type: "logical_not";
	operand: Expression;
}

export interface ListItemExpression {
	type: "list_item";
	list: string;
	index: Expression;
}

export interface ListLengthExpression {
	type: "list_length";
	list: string;
}

export interface BlockExpression {
	type: "block_expression";
	opcode: string;
	inputs: Record<string, Expression>;
	fields?: Record<string, (string | boolean)[] | string | number | boolean>;
}

export type Expression =
	| LiteralExpression
	| VariableExpression
	| BinaryOperationExpression
	| ComparisonExpression
	| LogicalOperationExpression
	| LogicalNotExpression
	| ListItemExpression
	| ListLengthExpression
	| BlockExpression;

export interface Instruction {
	type: string;
	opcode: string;
	inputs?: Record<string, Expression>;
	fields?: Record<string, (string | boolean)[] | string | number | boolean>;
}

export interface RepeatInstruction extends Instruction {
	type: "repeat";
	times: Expression;
	body: Instruction[];
}

export interface RepeatUntilInstruction extends Instruction {
	type: "repeat_until";
	condition: Expression;
	body: Instruction[];
}

export interface IfInstruction extends Instruction {
	type: "if";
	condition: Expression;
	thenBranch: Instruction[];
	elseBranch?: Instruction[];
}

export interface ForeverInstruction extends Instruction {
	type: "forever";
	body: Instruction[];
}

export interface WaitUntilInstruction extends Instruction {
	type: "wait_until";
	condition: Expression;
}

export interface StopInstruction extends Instruction {
	type: "stop";
	stopOption: string;
}

export type ControlFlowInstruction =
	| RepeatInstruction
	| RepeatUntilInstruction
	| IfInstruction
	| ForeverInstruction
	| WaitUntilInstruction
	| StopInstruction
	| Instruction;

export interface UnraveledScript {
	id: string;
	isTopLevel: boolean;
	x?: number;
	y?: number;
	instructions: ControlFlowInstruction[];
}

export function unwravelBlocks(
	blocks: Record<string, Block>,
): UnraveledScript[] {
	const visited = new Set<string>();
	const scripts: UnraveledScript[] = [];

	// Find all top-level blocks
	const topLevelBlocks = Object.entries(blocks).filter(
		([_, block]) => block.topLevel,
	);

	for (const [blockId, block] of topLevelBlocks) {
		if (visited.has(blockId)) continue;

		const script = unwravelScript(blockId, blocks, visited);
		if (script.instructions.length > 0) {
			scripts.push(script);
		}
	}

	return scripts;
}

function unwravelScript(
	startBlockId: string,
	blocks: Record<string, Block>,
	visited: Set<string>,
): UnraveledScript {
	const startBlock = blocks[startBlockId];
	const instructions: ControlFlowInstruction[] = [];

	let currentBlockId: string | null = startBlockId;

	while (currentBlockId && !visited.has(currentBlockId)) {
		const block: Block | undefined = blocks[currentBlockId];
		if (!block) break;

		visited.add(currentBlockId);

		const instruction = convertBlockToInstruction(block, blocks, visited);
		if (instruction) {
			instructions.push(instruction);
		}

		currentBlockId = block.next;
	}

	return {
		id: startBlockId,
		isTopLevel: startBlock.topLevel,
		x: startBlock.x,
		y: startBlock.y,
		instructions,
	};
}

type Substack = [2, string];

function convertBlockToInstruction(
	block: Block,
	blocks: Record<string, Block>,
	visited: Set<string>,
): ControlFlowInstruction | null {
	const { opcode, inputs, fields } = block;

	// Control flow blocks
	switch (opcode) {
		case "control_repeat":
			return {
				type: "repeat",
				opcode,
				times: extractValue(inputs.TIMES, blocks),
				body: extractSubstack(inputs.SUBSTACK as Substack, blocks, visited),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		case "control_repeat_until":
			return {
				type: "repeat_until",
				opcode,
				condition: extractValue(inputs.CONDITION, blocks),
				body: extractSubstack(inputs.SUBSTACK as Substack, blocks, visited),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		case "control_if":
			return {
				type: "if",
				opcode,
				condition: extractValue(inputs.CONDITION, blocks),
				thenBranch: extractSubstack(
					inputs.SUBSTACK as Substack,
					blocks,
					visited,
				),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		case "control_if_else":
			return {
				type: "if",
				opcode,
				condition: extractValue(inputs.CONDITION, blocks),
				thenBranch: extractSubstack(
					inputs.SUBSTACK as Substack,
					blocks,
					visited,
				),
				elseBranch: extractSubstack(
					inputs.SUBSTACK2 as Substack,
					blocks,
					visited,
				),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		case "control_forever":
			return {
				type: "forever",
				opcode,
				body: extractSubstack(inputs.SUBSTACK as Substack, blocks, visited),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		case "control_wait_until":
			return {
				type: "wait_until",
				opcode,
				condition: extractValue(inputs.CONDITION, blocks),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		case "control_stop":
			return {
				type: "stop",
				opcode,
				stopOption: extractStopOption(fields),
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};

		// Regular instruction blocks
		default:
			return {
				type: "instruction",
				opcode,
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};
	}
}

function extractSubstack(
	substackInput: Substack,
	blocks: Record<string, Block>,
	visited: Set<string>,
): ControlFlowInstruction[] {
	if (!substackInput || substackInput.length < 2) return [];

	const blockId = substackInput[1];
	if (typeof blockId !== "string" || visited.has(blockId)) return [];

	const instructions: ControlFlowInstruction[] = [];
	let currentBlockId: string | null = blockId;

	while (currentBlockId && !visited.has(currentBlockId)) {
		const block: Block | undefined = blocks[currentBlockId];
		if (!block) break;

		visited.add(currentBlockId);

		const instruction = convertBlockToInstruction(block, blocks, visited);
		if (instruction) {
			instructions.push(instruction);
		}

		currentBlockId = block.next;
	}

	return instructions;
}

function extractValue(
	input: unknown,
	blocks: Record<string, Block>,
): Expression {
	if (!input) {
		return { type: "literal", value: "", dataType: "string" };
	}

	if (Array.isArray(input)) {
		const [inputType, value, ...rest] = input;

		switch (inputType) {
			case 1: {
				// literal value
				const literalValue = Array.isArray(value) ? value[1] : value;
				return createLiteralExpression(literalValue);
			}
			case 2: // variable reference
				return { type: "variable", id: String(value) };
			case 3: {
				// block reference
				const blockId = value;
				if (typeof blockId === "string" && blocks[blockId]) {
					return convertBlockToExpression(blocks[blockId], blocks);
				}
				return createLiteralExpression(value);
			}
			default:
				return createLiteralExpression(value);
		}
	}

	return createLiteralExpression(input);
}

function createLiteralExpression(value: unknown): LiteralExpression {
	if (typeof value === "number") {
		return { type: "literal", value, dataType: "number" };
	}
	if (typeof value === "boolean") {
		return { type: "literal", value, dataType: "boolean" };
	}
	return { type: "literal", value: String(value), dataType: "string" };
}

function convertBlockToExpression(
	block: Block,
	blocks: Record<string, Block>,
): Expression {
	const { opcode, inputs, fields } = block;

	// Convert common expression blocks
	switch (opcode) {
		case "operator_add":
		case "operator_subtract":
		case "operator_multiply":
		case "operator_divide":
		case "operator_mod":
			return {
				type: "binary_operation",
				operator: opcode.split("_")[1] as
					| "add"
					| "subtract"
					| "multiply"
					| "divide"
					| "mod",
				left: extractValue(inputs.NUM1, blocks),
				right: extractValue(inputs.NUM2, blocks),
			};

		case "operator_join":
			return {
				type: "binary_operation",
				operator: "join",
				left: extractValue(inputs.STRING1, blocks),
				right: extractValue(inputs.STRING2, blocks),
			};

		case "operator_equals":
		case "operator_gt":
		case "operator_lt":
			return {
				type: "comparison",
				operator: opcode.split("_")[1] as "equals" | "gt" | "lt",
				left: extractValue(inputs.OPERAND1, blocks),
				right: extractValue(inputs.OPERAND2, blocks),
			};

		case "operator_and":
		case "operator_or":
			return {
				type: "logical_operation",
				operator: opcode.split("_")[1] as "and" | "or",
				left: extractValue(inputs.OPERAND1, blocks),
				right: extractValue(inputs.OPERAND2, blocks),
			};

		case "operator_not":
			return {
				type: "logical_not",
				operand: extractValue(inputs.OPERAND, blocks),
			};

		case "data_variable":
			return {
				type: "variable",
				name: Array.isArray(fields.VARIABLE)
					? String(fields.VARIABLE[0])
					: undefined,
				id: Array.isArray(fields.VARIABLE)
					? String(fields.VARIABLE[1]) || String(fields.VARIABLE[0]) || ""
					: "",
			};

		case "data_itemoflist":
			return {
				type: "list_item",
				list: Array.isArray(fields.LIST) ? String(fields.LIST[1]) : "",
				index: extractValue(inputs.INDEX, blocks),
			};

		case "data_lengthoflist":
			return {
				type: "list_length",
				list: Array.isArray(fields.LIST) ? String(fields.LIST[1]) : "",
			};

		default:
			return {
				type: "block_expression",
				opcode,
				inputs: extractAllInputs(inputs, blocks),
				fields,
			};
	}
}

function extractAllInputs(
	inputs: Record<string, unknown>,
	blocks: Record<string, Block>,
): Record<string, Expression> {
	const result: Record<string, Expression> = {};

	for (const [key, value] of Object.entries(inputs)) {
		result[key] = extractValue(value, blocks);
	}

	return result;
}

function extractStopOption(
	fields: Record<string, (string | boolean)[] | string | number | boolean>,
): string {
	if (fields.STOP_OPTION && Array.isArray(fields.STOP_OPTION)) {
		return String(fields.STOP_OPTION[0]);
	}
	return "all";
}
