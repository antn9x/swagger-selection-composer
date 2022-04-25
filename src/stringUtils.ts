import last from 'lodash/last';
import { singular, plural } from "pluralize";

export function getNameByRouter(router = '') {
  const splitted = router.split('/');
  if (splitted.length >= 3) {
    return last(splitted) || '';
  }
  return router.slice(1).replace(/\//g, '_')
    .replace('{', '')
    .replace('}', '');
}

export function getModuleName(name = '') {
  if (['auth', 'data', 'inventory'].includes(name)) {
    return name;
  };
  return singular(name);
}

export function getRouterName(name = '') {
  if (['auth'].includes(name)) {
    return name;
  };
  return plural(name);
}
