// Prints the parts of Buffer's API schema we need (no secrets, no data).
const KEY = process.env.BUFFER_API_KEY;
const q = async (query, variables = {}) => {
  const r = await fetch('https://api.buffer.com', {method: 'POST', headers: {Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json'}, body: JSON.stringify({query, variables})});
  return r.json();
};
const T = `fragment T on __Type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }`;
const show = (t) => (t ? (t.kind === 'NON_NULL' ? show(t.ofType) + '!' : t.kind === 'LIST' ? `[${show(t.ofType)}]` : t.name) : '?');
const typeInfo = async (name) => {
  const d = await q(`query($n:String!){ __type(name:$n){ name kind fields { name args { name type {...T} } type {...T} } inputFields { name type {...T} } enumValues { name } possibleTypes { name } } } ${T}`, {n: name});
  return d.data?.__type;
};
const print = (t) => {
  if (!t) return;
  console.log(`\n## ${t.kind} ${t.name}`);
  for (const f of t.fields || []) console.log(`  ${f.name}${f.args?.length ? '(' + f.args.map((a) => a.name + ': ' + show(a.type)).join(', ') + ')' : ''}: ${show(f.type)}`);
  for (const f of t.inputFields || []) console.log(`  ${f.name}: ${show(f.type)}`);
  if (t.enumValues) console.log('  enum: ' + t.enumValues.map((e) => e.name).join(', '));
  if (t.possibleTypes) console.log('  union: ' + t.possibleTypes.map((e) => e.name).join(', '));
};
const base = (t) => (t.ofType ? base(t.ofType) : t.name);
const seen = new Set();
const walk = async (name, depth) => {
  if (!name || seen.has(name) || depth < 0 || name.startsWith('__') || ['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime'].includes(name)) return;
  seen.add(name);
  const t = await typeInfo(name);
  print(t);
  for (const f of [...(t?.fields || []), ...(t?.inputFields || [])]) {
    const n = base(f.type);
    if (/metric|stat|insight|analytic|post|channel|filter|input|sort/i.test(n) || /metric|stat/i.test(f.name)) await walk(n, depth - 1);
    for (const a of f.args || []) await walk(base(a.type), depth - 1);
  }
  for (const p of t?.possibleTypes || []) await walk(p.name, depth - 1);
};
const root = await typeInfo('Query');
print(root);
for (const f of root?.fields || []) if (/post|metric|stat|insight|analytic/i.test(f.name)) {
  for (const a of f.args) await walk(base(a.type), 2);
  await walk(base(f.type), 3);
}
