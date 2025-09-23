export function resolveImagePath(p) {
  const FALLBACK = './src/assets/img/placeholder.jpg';
  if (!p) return FALLBACK;
  if (/^(https?:)?\/\//.test(p) || p.startsWith('data:')) return p;
  p = p.replace(/^\.\//, '');
  const filename = p.split('/').pop();
  return `./src/assets/img/${filename}`;
}
