import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajvInstance = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
});

addFormats(ajvInstance);

export default ajvInstance;
