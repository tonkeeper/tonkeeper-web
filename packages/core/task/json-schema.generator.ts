type JSONSchema = {
  title?: string;
  type?: string;
  enum?: string[];
  const?: string;
  format?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  $defs?: Record<string, JSONSchema>;
  oneOf?: { $ref: string }[];
  $ref?: string;
  description?: string;
};

function resolveRef(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

function generateTSType(schema: JSONSchema, defs: Record<string, JSONSchema>, name = ''): string {
  if (schema.enum) {
    return schema.enum.map(val => `"${val}"`).join(" | ");
  }

  if (schema.const) {
    return `"${schema.const}"`;
  }

  if (schema.type === "string") {
    return "string";
  }

  if (schema.type === "number") {
    return "number";
  }

  if (schema.type === "boolean") {
    return "boolean";
  }

  if (schema.type === "array" && schema.items) {
    return `(${generateTSType(schema.items, defs)})[]`;
  }

  if (schema.type === "object" && schema.properties) {
    const lines = Object.entries(schema.properties).map(([key, value]) => {
      const optional = schema.required?.includes(key) ? "" : "?";
      return `  ${key}${optional}: ${generateTSType(value, defs)};`;
    });
    return `{\n${lines.join("\n")}\n}`;
  }

  if (schema.$ref) {
    const refName = resolveRef(schema.$ref);
    return refName;
  }

  return "any";
}

function generateInterfaces(schema: JSONSchema, options?: { namePrefix?: string }): { code: string, generatedNames: string[] } {
  if (!schema.$defs) throw new Error("Schema must contain $defs");

  const defs = schema.$defs;
  const result: string[] = [];

  const generatedNames: string[] = [];

  for (const [defName, defSchema] of Object.entries(defs)) {
    const nameProp = defSchema.properties?.name;
    const eventName = nameProp?.const;

    if (!eventName) throw new Error(`Schema ${defName} must have 'name' with const value`);

    const className = `${options?.namePrefix ?? ''}${defName}`;
    generatedNames.push(className);

    const otherFields = Object.entries(defSchema.properties || {}).filter(([key]) => key !== 'name');

    const classFields = [
      `  readonly name = '${eventName}';`,
      ...otherFields.map(([key, propSchema]) => {
        const tsType = generateTSType(propSchema, defs);
        return `  ${key}!: ${tsType};`;
      })
    ];

    const constructorParamFields = otherFields.map(([key, s]) => {
      const description = s.description;
      const tsType = generateTSType(s, defs);
      const doc = description ? `  /** ${description} */\n` : '';
      return `${doc}  ${key}: ${tsType};`;
    }).join('\n');

    const constructorParams = `props: {\n${constructorParamFields}\n}`;

    const jsonFields = [
      `      name: this.name`,
      ...otherFields.map(([key]) => `      ${key}: this.${key}`)
    ];

    result.push(`export class ${className} {
${classFields.join('\n')}

  constructor(${constructorParams}) {
    Object.assign(this, props);
  }

  toJSON() {
    return {
${jsonFields.join(',\n')}
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}`);
  }

  return {
    code: `/* eslint-disable max-classes-per-file */\n\n${result.join('\n\n')}`,
    generatedNames
  };
}




module.exports = { generateInterfaces };
