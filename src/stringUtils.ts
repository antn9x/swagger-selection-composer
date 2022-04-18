export function getNameByRouter(router = '') {
  return router.slice(1).replace('/', '_')
    .replace('{', '')
    .replace('}', '');
}
