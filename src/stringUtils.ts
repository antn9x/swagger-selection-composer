export function getNameByRouter(router = '') {
  return router.slice(1).replace(/\//g, '_')
    .replace('{', '')
    .replace('}', '');
}
