import path from 'path';
import yaml from 'js-yaml';

export function jsonToYaml(json: Object) {
  return yaml.dump(json).replace(/'y'/g, 'y');
}