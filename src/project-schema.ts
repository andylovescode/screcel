import * as v from "valibot";

export const valueSchema = v.union([v.string(), v.number()]);

export const variableSchema = v.tuple([v.string(), valueSchema]);

export const listSchema = v.tuple([v.string(), v.array(valueSchema)]);

export const costumeSchema = v.object({
	name: v.string(),
	bitmapResolution: v.optional(v.number()),
	dataFormat: v.string(),
	assetId: v.string(),
	md5ext: v.string(),
	rotationCenterX: v.number(),
	rotationCenterY: v.number(),
});

export const soundSchema = v.object({
	name: v.string(),
	assetId: v.string(),
	dataFormat: v.string(),
	format: v.string(),
	rate: v.number(),
	sampleCount: v.number(),
	md5ext: v.string(),
});

export const blockInputSchema = v.union([
	v.tuple([v.number(), v.array(v.union([v.string(), v.number()]))]),
	v.tuple([v.number(), v.string()]),
	v.tuple([v.number(), v.string(), v.array(v.union([v.string(), v.number()]))]),
]);

export const blockSchema = v.object({
	opcode: v.string(),
	next: v.nullable(v.string()),
	parent: v.nullable(v.string()),
	inputs: v.record(v.string(), blockInputSchema),
	fields: v.record(
		v.string(),
		v.union([v.array(v.string()), v.array(v.union([v.string(), v.boolean()]))]),
	),
	shadow: v.boolean(),
	topLevel: v.boolean(),
	x: v.optional(v.number()),
	y: v.optional(v.number()),
});

export const monitorSchema = v.object({
	id: v.string(),
	mode: v.string(),
	opcode: v.string(),
	params: v.record(v.string(), v.string()),
	spriteName: v.nullable(v.string()),
	value: v.union([v.string(), v.number(), v.array(valueSchema)]),
	width: v.number(),
	height: v.number(),
	x: v.number(),
	y: v.number(),
	visible: v.boolean(),
	sliderMin: v.optional(v.number()),
	sliderMax: v.optional(v.number()),
	isDiscrete: v.optional(v.boolean()),
});

export const metaSchema = v.object({
	semver: v.string(),
	vm: v.string(),
	agent: v.string(),
});

export const targetSchema = v.object({
	isStage: v.boolean(),
	name: v.string(),
	variables: v.record(v.string(), variableSchema),
	lists: v.record(v.string(), listSchema),
	broadcasts: v.record(v.string(), v.unknown()),
	blocks: v.record(v.string(), blockSchema),
	comments: v.record(v.string(), v.unknown()),
	currentCostume: v.number(),
	costumes: v.array(costumeSchema),
	sounds: v.array(soundSchema),
	volume: v.number(),
	layerOrder: v.number(),
	tempo: v.optional(v.number()),
	videoTransparency: v.optional(v.number()),
	videoState: v.optional(v.string()),
	textToSpeechLanguage: v.optional(v.nullable(v.string())),
	// Non-stage specific fields
	visible: v.optional(v.boolean()),
	x: v.optional(v.number()),
	y: v.optional(v.number()),
	size: v.optional(v.number()),
	direction: v.optional(v.number()),
	draggable: v.optional(v.boolean()),
	rotationStyle: v.optional(v.string()),
});

export const projectSchema = v.object({
	targets: v.array(targetSchema),
	monitors: v.array(monitorSchema),
	extensions: v.array(v.string()),
	meta: metaSchema,
});

export type Value = v.InferInput<typeof valueSchema>;

export type Variable = v.InferInput<typeof variableSchema>;

export type List = v.InferInput<typeof listSchema>;

export type Costume = v.InferInput<typeof costumeSchema>;

export type Sound = v.InferInput<typeof soundSchema>;

export type BlockInput = v.InferInput<typeof blockInputSchema>;

export type Block = v.InferInput<typeof blockSchema>;

export type Monitor = v.InferInput<typeof monitorSchema>;

export type Meta = v.InferInput<typeof metaSchema>;

export type Target = v.InferInput<typeof targetSchema>;

export type Project = v.InferInput<typeof projectSchema>;
