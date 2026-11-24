// Проверяет примеры из docs/examples по схеме формата (запускается в CI).
import Ajv2020 from "ajv/dist/2020.js";
import fs from "node:fs";
import YAML from "yaml";

const schema = JSON.parse(fs.readFileSync("schema/interface-config.schema.json", "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const examples = {
  "docs/examples/interface.json": (t) => JSON.parse(t),
  "docs/examples/interface.yaml": (t) => YAML.parse(t),
};
let failed = false;
for (const [file, parse] of Object.entries(examples)) {
  const ok = validate(parse(fs.readFileSync(file, "utf8")));
  console.log(`${ok ? "✓" : "✗"} ${file}`);
  if (!ok) {
    failed = true;
    for (const e of validate.errors) console.log(`   ${e.instancePath || "/"} ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
