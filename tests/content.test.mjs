import test from 'node:test';
import assert from 'node:assert/strict';
import {questions,topics} from '../public/data.js';
import {makeSession,isCorrect,recordAnswer,validateSavedSession,shuffle} from '../public/engine.js';

test('every source topic has notes, source pages, and meaningful question coverage',()=>{
 assert.equal(topics.length,12);
 assert.ok(questions.length>=100);
 assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 for(const t of topics){assert.ok(t.notes.length>400);assert.ok(t.pages);assert.ok(questions.filter(q=>q.topic===t.id).length>=5,t.id);}
});
test('question schema, options, and answer keys are valid',()=>{
 for(const q of questions){
  assert.ok(topics.some(t=>t.id===q.topic));assert.ok(['mc','tf','multi'].includes(q.type));
  assert.ok(q.prompt&&q.explanation);assert.ok(q.options.length>=2);
  assert.equal(new Set(q.options).size,q.options.length,q.id);
  assert.ok(q.answers.length>0);assert.equal(new Set(q.answers).size,q.answers.length);
  assert.ok(q.answers.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length));
  if(q.type!=='multi')assert.equal(q.answers.length,1);
 }
 assert.deepEqual(new Set(questions.map(q=>q.type)),new Set(['mc','tf','multi']));
});
test('select-all scoring rejects partial answers, extras and duplicates',()=>{
 const q={answers:[0,2]};assert.ok(isCorrect(q,[2,0]));assert.ok(!isCorrect(q,[0]));assert.ok(!isCorrect(q,[0,1,2]));assert.ok(!isCorrect(q,[0,0]));
});
test('session filters are combined and short sessions cover all topics',()=>{
 const s=makeSession(questions,{topic:'all',type:'all',count:'20'});
 assert.equal(s.length,20);assert.equal(new Set(s.map(q=>q.topic)).size,12);
 const filtered=makeSession(questions,{topic:'tools',type:'mc',count:'all'});
 assert.ok(filtered.every(q=>q.topic==='tools'&&q.type==='mc'));
 assert.equal(filtered.length,questions.filter(q=>q.topic==='tools'&&q.type==='mc').length);
 const missed=makeSession(questions,{topic:'all',type:'all',count:'all',missed:true},['q1','q2']);assert.equal(missed.length,2);
 assert.equal(makeSession(questions,{topic:'tools',type:'mc',count:'all',missed:true},[]).length,0);
});
test('shuffling preserves keys and changes answer positions over repeated sessions',()=>{
 const positions=new Set();
 for(let i=0;i<100;i++){const q=makeSession([questions[0]],{topic:'all',type:'all',count:'all'})[0];positions.add(q.order.indexOf(q.answers[0]));assert.deepEqual([...q.order].sort(),[0,1,2,3]);assert.ok(isCorrect(q,[q.order[q.order.indexOf(q.answers[0])]]));}
 assert.equal(positions.size,4);assert.deepEqual(shuffle([1,2,3],()=>0),[2,3,1]);
});
test('progress counts attempts and clears latest-missed status on correction',()=>{
 const p={records:{}};const q=questions[0];recordAnswer(p,q,false);recordAnswer(p,q,true);assert.deepEqual(p.records[q.id],{attempts:2,correct:1,lastCorrect:true});
});
test('saved session survives a round trip; malformed data is rejected',()=>{
 const session={items:makeSession(questions,{topic:'all',type:'all',count:'10'}),index:0,exam:true,finished:false};
 assert.equal(validateSavedSession(JSON.parse(JSON.stringify(session)),questions).items.length,10);
 assert.equal(validateSavedSession({...session,index:999},questions),null);
 const corrupt=structuredClone(session);corrupt.items[0].order=[0,0,0,0];assert.equal(validateSavedSession(corrupt,questions),null);
 const old=structuredClone(session);old.items[0].id='missing';assert.equal(validateSavedSession(old,questions),null);
 const finished=structuredClone(session);finished.finished=true;assert.equal(validateSavedSession(finished,questions).finished,false);
});
