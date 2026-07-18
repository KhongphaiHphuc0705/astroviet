import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import yaml from 'yaml';

// Force load all schemas so they get registered
import '../src/health/health.schema.js';
import '../src/modules/identity/presentation/openapi/auth.openapi.js';

import { generateOpenApiDocument } from '../src/docs/openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function main() {
  const document = generateOpenApiDocument();

  // Generate openapi.json
  const jsonPath = path.join(rootDir, 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
  // eslint-disable-next-line no-console
  console.log(`✅ OpenAPI JSON written to ${jsonPath}`);

  // Generate openapi.yaml
  const yamlPath = path.join(rootDir, 'openapi.yaml');
  fs.writeFileSync(yamlPath, yaml.stringify(document));
  // eslint-disable-next-line no-console
  console.log(`✅ OpenAPI YAML written to ${yamlPath}`);
}

main();
