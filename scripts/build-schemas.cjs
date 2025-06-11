#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

function generateSchema(type) {
  const schemaOutput = execSync(`typescript-json-schema tsconfig.app.json "${type}" --noExtraProps --required`);
  const schema = JSON.parse(schemaOutput);


  const filepath = `src/data/schemas/${type.replace('Json', '')}.schema.json`;
  fs.writeFileSync(filepath, JSON.stringify(schema, null, 2));
}


const allTypes = [
  "JsonTechs",
  "JsonResources",
  "JsonNations",
  "JsonPopulationTypes",
  "JsonTileImprovements",
  "JsonBuildings",
  "JsonUnits",
  "JsonDistricts",
]

const cliTypes = getCliTypes();
const types = cliTypes ? cliTypes : allTypes;

for (const type of types) {
  console.log(`Generating schema for ${type}...`);
  generateSchema(type);
}


function getCliTypes() {
  const cliTypes = process.argv.slice(2);
  for (const type of cliTypes) {
    if (!allTypes.includes(type)) {
      console.error(`Invalid type: ${type}. Must be one of: ${allTypes.join(', ')}`);
      process.exit(1);
    }
  }
  return cliTypes.length > 0 ? cliTypes : null;
}