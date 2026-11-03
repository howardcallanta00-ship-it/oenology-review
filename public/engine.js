export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function isCorrect(question, selected) {
  return selected.length === question.answers.length && new Set(selected).size === selected.length && question.answers.every(a => selected.includes(a));
}
export function makeSession(bank, settings, missed = []) {
  const pool = bank.filter(q => (settings.topic === 'all' || q.topic === settings.topic) && (settings.type === 'all' || q.type === settings.type) && (!settings.missed || missed.includes(q.id)));
  // Round-robin topic sampling gives a short all-topic session broad coverage.
  const groups = new Map();
  shuffle(pool).forEach(q => { if (!groups.has(q.topic)) groups.set(q.topic, []); groups.get(q.topic).push(q); });
  const balanced = [];
  while ([...groups.values()].some(g => g.length)) {
    for (const group of shuffle([...groups.values()])) if (group.length) balanced.push(group.pop());
  }
  return balanced.slice(0, settings.count === 'all' ? balanced.length : Number(settings.count)).map(q => ({
    ...q, order: q.type === 'tf' ? [0, 1] : shuffle(q.options.map((_, i) => i)), selected: [], checked: false, correct: false
  }));
}
export function recordAnswer(progress, question, correct) {
  const previous = progress.records[question.id] || {attempts:0,correct:0};
  progress.records[question.id] = {attempts:previous.attempts+1,correct:previous.correct+(correct?1:0),lastCorrect:correct};
}
export function validateSavedSession(value, bank) {
  if (!value || !Array.isArray(value.items) || !value.items.length || !Number.isInteger(value.index) || value.index < 0 || value.index >= value.items.length) return null;
  const ids = new Set();
  const items = [];
  for (const item of value.items) {
    const q = bank.find(q => q.id === item.id);
    if (!q || ids.has(q.id) || !Array.isArray(item.order) || item.order.length !== q.options.length || new Set(item.order).size !== q.options.length || !item.order.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length)) return null;
    if (!Array.isArray(item.selected) || new Set(item.selected).size!==item.selected.length || !item.selected.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length) || (q.type!=='multi'&&item.selected.length>1)) return null;
    ids.add(q.id);
    items.push({...q,order:item.order,selected:item.selected,checked:!!item.checked,correct:!!item.checked&&isCorrect(q,item.selected)});
  }
  if(items.some((q,i)=>i<value.index&&!q.checked)||items.some((q,i)=>i>value.index&&q.checked)) return null;
  return {items,index:value.index,exam:!!value.exam,finished:!!value.finished&&items.every(q=>q.checked)};
}
