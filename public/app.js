import {topics,questions,typeLabels} from './data.js';
import {isCorrect,makeSession,recordAnswer,validateSavedSession} from './engine.js';
const main=document.querySelector('main');
const KEY='cellar-notes-v1';
const blank=()=>({version:1,records:{},read:[],session:null});
let storageAvailable=true;
let progress=blank();
try {
  const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  if(raw?.version===1 && raw.records && typeof raw.records==='object' && !Array.isArray(raw.records)) {
    progress=blank();
    for(const q of questions){const r=raw.records[q.id];if(r&&Number.isInteger(r.attempts)&&r.attempts>0&&Number.isInteger(r.correct)&&r.correct>=0&&r.correct<=r.attempts&&typeof r.lastCorrect==='boolean')progress.records[q.id]=r;}
    progress.read=Array.isArray(raw.read)?raw.read.filter(id=>topics.some(t=>t.id===id)):[];
    progress.session=validateSavedSession(raw.session,questions);
  }
} catch {storageAvailable=false;}
let session=progress.session;
let activeTopic='all';
let settings={topic:'all',type:'all',count:'20',exam:false,missed:false};
let view='';
let search='';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=id=>topics.find(t=>t.id===id)?.title||'All topics';
const missedIds=()=>Object.entries(progress.records).filter(([,r])=>!r.lastCorrect).map(([id])=>id);
const save=()=>{
  progress.session=session;
  try{localStorage.setItem(KEY,JSON.stringify(progress));}catch{storageAvailable=false;}
  document.querySelector('#storage-status').textContent=storageAvailable?'Progress stays in this browser.':'Storage unavailable — progress lasts this visit only.';
};
function intro(kicker,heading,copy,stamp=true){return `<section class="intro"><div><div class="eyebrow">${kicker}</div><h1>${heading}</h1><p>${copy}</p></div>${stamp?`<div class="stamp" aria-label="Lesson 4, vine to glass"><div>VINE TO GLASS<br><strong>04</strong><br>STUDY EDITION</div></div>`:''}</section>`;}
function sidebar(selected,mode){return `<aside class="sidebar"><div class="eyebrow">The field index</div><nav aria-label="Study topics" class="topic-list"><button class="topic-button ${selected==='all'?'active':''}" data-topic="all" data-mode="${mode}" aria-pressed="${selected==='all'}"><span class="number">00</span>All topics</button>${topics.map((t,i)=>`<button class="topic-button ${selected===t.id?'active':''}" data-topic="${t.id}" data-mode="${mode}" aria-pressed="${selected===t.id}"><span class="number">${String(i+1).padStart(2,'0')}</span>${t.title}</button>`).join('')}</nav><p class="footnote">Based on all 9 source pages.<br>Class claims are labeled.<br>No account needed.</p></aside>`;}
function pageFocus(){main.focus({preventScroll:true});window.scrollTo(0,0);}
function route(){
  main.className='';
  const [name,id]=location.hash.slice(1).split('/');
  const next=['notes','progress','about'].includes(name)?name:'practice';
  view=next;
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===next)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(next==='notes'){activeTopic=topics.some(t=>t.id===id)?id:'all';renderNotes();}
  if(next==='progress')renderProgress();
  if(next==='about')renderAbout();
  if(next==='practice'){if(id==='setup')renderSetup();else if(session && !session.finished)renderQuestion();else if(session?.finished)renderResults();else renderSetup();}
  pageFocus();save();
}
function renderSetup(message=''){
  main.className='';
  main.innerHTML=intro('Oenology / Lesson 04','A little practice.<br><em>A clearer palate.</em>','From the first vineyard to the final pour. Study the whole lesson, then put the details to the test.')+`<div class="workspace">${sidebar(settings.topic,'practice')}<section class="practice-panel">${session?`<div class="session-banner"><span>${session.finished?'Your last session is saved.':'A session is in progress.'}</span><button class="small" data-action="resume">${session.finished?'View results':'Resume session'}</button></div>`:''}<div class="setup"><div class="eyebrow">Your next study session</div><h2>${settings.topic==='all'?'Make the knowledge stick.':title(settings.topic)}</h2><p class="lead">${settings.topic==='all'?`${questions.length} questions. Twelve topics. Three ways to think.`:topics.find(t=>t.id===settings.topic).summary}</p><form id="setup-form"><div class="configuration"><label class="field">Question format<select name="type"><option value="all">Mixed formats</option>${Object.entries(typeLabels).map(([k,v])=>`<option value="${k}" ${settings.type===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">Session length<select name="count">${[['10','10 questions'],['20','20 questions'],['40','40 questions'],['all','All available']].map(([k,v])=>`<option value="${k}" ${settings.count===k?'selected':''}>${v}</option>`).join('')}</select></label></div><label class="checkline"><input type="checkbox" name="exam" ${settings.exam?'checked':''}>Exam mode <span class="meta">— explanations at the end</span></label><label class="checkline"><input type="checkbox" name="missed" ${settings.missed?'checked':''}>Missed questions only <span class="meta">(${missedIds().length} to revisit)</span></label><div class="setup-actions"><button class="primary" type="submit">Start practice <span aria-hidden="true">→</span></button><span class="meta" id="pool-count"></span></div><p class="error" role="alert" id="setup-error">${escapeHtml(message)}</p></form></div><div class="notebook-strip"><article><strong>Recall, then understand.</strong><p>Check an answer, read why it works, and revisit its source topic.</p></article><article><strong>The complete field guide.</strong><p>Every section of the notes, with comparison tables and source clarifications. <a href="#notes">Open guide →</a></p></article></div></section></div>`;
  updatePoolCount();
}
function getSettings(){const form=document.querySelector('#setup-form');const data=new FormData(form);return {...settings,type:data.get('type'),count:data.get('count'),exam:data.has('exam'),missed:data.has('missed')};}
function updatePoolCount(){settings=getSettings();const count=questions.filter(q=>(settings.topic==='all'||q.topic===settings.topic)&&(settings.type==='all'||q.type===settings.type)&&(!settings.missed||missedIds().includes(q.id))).length;document.querySelector('#pool-count').textContent=`${count} available in this selection`;}
function startSession(){
  settings=getSettings();
  const items=makeSession(questions,settings,missedIds());
  if(!items.length){document.querySelector('#setup-error').textContent='No questions match this selection. Try another format, topic, or turn off “Missed questions only”.';return;}
  session={items,index:0,exam:settings.exam,finished:false};save();renderQuestion();pageFocus();
  history.replaceState(null,'','#practice');
}
function renderQuestion(){
  main.className='in-session';
  const q=session.items[session.index];
  const feedback=q.checked&&!session.exam;
  const correctCount=session.items.filter(q=>q.checked&&q.correct).length;
  main.innerHTML=intro('Practice / '+(session.exam?'Exam mode':'Learning mode'),'Build your <em>wine knowledge.</em>',session.exam?'Commit each answer. Your score and explanations arrive at the end.':'Take your time. Every answer is a chance to understand the detail.',false)+`<div class="workspace">${sidebar(q.topic,'active')}<section class="practice-panel"><div class="session-head"><span class="meta">QUESTION ${String(session.index+1).padStart(2,'0')} / ${session.items.length}${session.exam?'':` · ${correctCount} correct`}</span><button class="quiet small" data-action="pause">Pause & configure</button></div><div class="track" role="progressbar" aria-label="Session completion" aria-valuemin="0" aria-valuemax="${session.items.length}" aria-valuenow="${session.items.filter(q=>q.checked).length}"><span style="width:${session.items.filter(q=>q.checked).length/session.items.length*100}%"></span></div><div class="question"><div class="eyebrow">${typeLabels[q.type]} <span aria-hidden="true">/</span> ${title(q.topic)}</div><h2 id="question-title">${q.prompt}</h2><p id="question-help" class="instruction">${q.type==='multi'?'Select every correct answer. One or more choices may be correct. Exact match required; no partial credit.':q.type==='tf'?'Decide whether the statement is true or false.':'Choose the single best answer.'}</p><form id="answer-form"><fieldset class="choices" aria-labelledby="question-title" aria-describedby="question-help"><legend class="sr-only">Answer choices</legend><div class="choice-list">${q.order.map((i,pos)=>{
    const correct=feedback&&q.answers.includes(i);const wrong=feedback&&q.selected.includes(i)&&!q.answers.includes(i);
    return `<label class="choice ${correct?'correct':''} ${wrong?'incorrect':''}"><input type="${q.type==='multi'?'checkbox':'radio'}" name="answer" value="${i}" ${q.selected.includes(i)?'checked':''} ${q.checked?'disabled':''}><span class="letter" aria-hidden="true">${String.fromCharCode(65+pos)}</span><span class="option-copy">${q.options[i]}</span>${correct?'<span class="answer-tag">CORRECT</span>':wrong?'<span class="answer-tag">YOUR PICK</span>':''}</label>`;
  }).join('')}</div></fieldset><p id="answer-error" class="error" role="alert"></p><div class="answer-actions">${q.checked?`<button class="primary" type="button" data-action="next">${session.index===session.items.length-1?'View results':'Next question'} <span aria-hidden="true">→</span></button>`:`<button class="primary" type="submit">${session.exam?'Commit answer':'Check answer'} <span aria-hidden="true">→</span></button>`}${!session.exam?`<a class="source-link" href="#notes/${q.topic}">Review this topic</a>`:'<span class="meta">Feedback held until the end</span>'}</div></form>${feedback?`<div class="feedback ${q.correct?'':'wrong'}" role="status"><strong>${q.correct?'Correct. Well remembered.':'Not quite. Here’s the distinction.'}</strong><p>${q.explanation}</p><p><b>Correct answer${q.answers.length>1?'s':''}:</b> ${q.answers.map(i=>q.options[i]).join('; ')}</p><a href="#notes/${q.topic}">Read the field guide →</a></div>`:q.checked?'<div class="feedback" role="status"><strong>Answer committed.</strong><p>Continue to the next question. Explanations appear in your results.</p></div>':''}</div><p class="meta" style="margin-top:18px">${storageAvailable?'Your place is saved automatically in this browser.':'Progress is in memory only for this visit.'} Choices are shuffled for each new session.</p></section></div>`;
}
function checkAnswer(){
  const q=session.items[session.index];if(q.checked)return;
  const selected=[...document.querySelectorAll('[name="answer"]:checked')].map(x=>Number(x.value));
  if(!selected.length){document.querySelector('#answer-error').textContent='Choose an answer before continuing.';return;}
  q.selected=selected;q.correct=isCorrect(q,selected);q.checked=true;recordAnswer(progress,q,q.correct);save();renderQuestion();
  const feedback=document.querySelector('.feedback');feedback?.scrollIntoView({block:'nearest',behavior:'auto'});
  document.querySelector('[data-action="next"]').focus({preventScroll:true});
}
function renderResults(){
  main.className='';
  const correct=session.items.filter(q=>q.correct).length;
  const wrong=session.items.filter(q=>!q.correct);
  main.innerHTML=intro('Session complete','A stronger foundation.<br><em>One pour at a time.</em>','Keep what you know. Revisit what needs another look.')+`<section class="setup"><div class="eyebrow">Your session results</div><div class="scoreline"><div class="score">${Math.round(correct/session.items.length*100)}<small>%</small></div><div><strong>${correct} of ${session.items.length} correct</strong><br><span class="meta">Exact-match scoring · no partial credit</span></div></div><div class="setup-actions">${wrong.length?'<button class="primary" data-action="retry">Practice these misses →</button>':'<a href="#notes">Explore the field guide →</a>'}<button data-action="new">New session</button><a href="#progress">View overall progress</a></div><div class="breakdown">${topics.filter(t=>session.items.some(q=>q.topic===t.id)).map(t=>{const a=session.items.filter(q=>q.topic===t.id);return `<div><span>${t.title}</span><strong>${a.filter(q=>q.correct).length} / ${a.length}</strong></div>`;}).join('')}</div></section><section class="result-list"><h2>Your answer review</h2><p class="meta">Open any question to compare your answer and the explanation.</p>${session.items.map((q,i)=>`<details><summary><span class="status ${q.correct?'':'miss'}">${q.correct?'Correct':'Revisit'}</span>${i+1}. ${q.prompt}</summary><p><strong>Your answer:</strong> ${q.selected.map(i=>q.options[i]).join('; ')}</p><p><strong>Correct answer${q.answers.length>1?'s':''}:</strong> ${q.answers.map(i=>q.options[i]).join('; ')}</p><p>${q.explanation}</p><a class="source-link" href="#notes/${q.topic}">Review ${title(q.topic)} →</a></details>`).join('')}</section>`;
}
function renderNotes(){
 main.className='';
 main.innerHTML=intro('The field guide / Complete lesson','From vine<br><em>to understanding.</em>','All nine pages, organized for recall. Source claims and uncertain quiz answers are clearly marked.')+`<div class="workspace">${sidebar(activeTopic,'notes')}<section class="reader"><div class="reader-tools"><label class="field">Search the guide<input id="notes-search" type="search" placeholder="Try tannin, corkscrew, Riesling…" value="${escapeHtml(search)}"></label><button class="small" data-action="print">Print guide</button></div><div id="note-results"></div></section></div>`;
 renderNoteResults();
}
function renderNoteResults(){
 const filtered=topics.filter(t=>(activeTopic==='all'||t.id===activeTopic)&&`${t.title} ${t.summary} ${t.notes.replace(/<[^>]*>/g,' ')}`.toLowerCase().includes(search.toLowerCase().trim()));
 document.querySelector('#note-results').innerHTML=`<p class="meta" role="status">${filtered.length} topic${filtered.length===1?'':'s'} shown${activeTopic!=='all'?' · Search is limited to the selected topic.':''}</p>`+(filtered.length?filtered.map((t)=>`<article class="reader-section" id="topic-${t.id}"><div class="section-top"><span class="eyebrow">FIELD NOTE ${String(topics.indexOf(t)+1).padStart(2,'0')} / SOURCE PP. ${t.pages}</span><button class="small" data-practice-topic="${t.id}">Practice topic →</button></div><h2>${t.title}</h2><p class="lead">${t.summary}</p>${t.notes}<label class="checkline"><input type="checkbox" data-read="${t.id}" ${progress.read.includes(t.id)?'checked':''}>Mark this topic as read</label></article>`).join(''):`<div class="empty"><h2>No matching topics.</h2><p>Try a shorter term or search across all topics.</p><button data-action="clear-search">Clear search & show all</button></div>`);
}
function renderProgress(){
 main.className='';
 const entries=Object.values(progress.records);const latestCorrect=entries.filter(r=>r.lastCorrect).length;const attempts=entries.reduce((s,r)=>s+r.attempts,0);const correct=entries.reduce((s,r)=>s+r.correct,0);
 main.innerHTML=intro('Your progress / Browser only','A record of<br><em>what’s taking root.</em>','Track coverage and the questions to revisit. This is a study record, not a prediction of your exam result.')+`<div class="progress-grid"><div><strong>${entries.length}<small> / ${questions.length}</small></strong><span>Unique questions attempted</span></div><div><strong>${attempts?Math.round(correct/attempts*100):0}%</strong><span>Accuracy across all attempts</span></div><div><strong>${progress.read.length}<small> / ${topics.length}</small></strong><span>Topics marked read</span></div></div><p class="meta">${latestCorrect} questions correct on the latest attempt · ${missedIds().length} to revisit. Bars show question coverage, not mastery.</p><div>${topics.map(t=>{const bank=questions.filter(q=>q.topic===t.id);const tried=bank.filter(q=>progress.records[q.id]).length;return `<div class="topic-progress"><a href="#notes/${t.id}">${t.title}</a><div class="track" role="progressbar" aria-label="${t.title} question coverage" aria-valuemin="0" aria-valuemax="${bank.length}" aria-valuenow="${tried}"><span style="width:${tried/bank.length*100}%"></span></div><small>${tried} / ${bank.length}</small></div>`;}).join('')}</div><div class="progress-actions"><button class="primary" data-action="missed">Practice missed questions →</button><button data-action="new">Configure a session</button><button class="quiet" data-action="reset-prompt">Reset study data</button></div><div id="reset-area"></div><p class="meta">Saved on this browser and device only. Clearing browser data removes your record. There is no account or cross-device sync.</p>`;
}
function renderAbout(){main.innerHTML=`<div class="about">${intro('About this reviewer','A field guide.<br><em>With the source in view.</em>','Built from Oenology Notes.pdf, Lesson 4: Introduction to Wines, pages 1–9.',false)}<h2>What’s covered</h2><p>History, seven opener types, all corkscrew diagram labels, five wine characteristics, grapes and family tree, tannins and color, red and white varieties, four wine types, wine legs, food pairing, bottle styles and combinations, finishing processes, sediment, decanting, sensory analysis, and the original quiz distinctions.</p><h2>How questions are written</h2><p>${questions.length} curated questions use multiple choice, true/false, and select-all formats. New sessions shuffle question order and answer positions. Short all-topic sessions distribute questions across topics; choose “All available” to attempt the full bank.</p><p>Distractors use related terms and comparable phrasing. Select-all items require an exact match, with no partial credit. Explanations identify the intended distinction.</p><h2>Where the handout needs care</h2><ul><li>Historical dates are tested as handout recall, not independently established history.</li><li>The family tree mixes species and varieties and contains questionable classifications; questions explicitly attribute its placements.</li><li>Tannins and color pigments are distinct. Darker color does not prove higher tannin; not all red grapes have white flesh.</li><li>Body examples vary with wine style. The four wine types overlap.</li><li>Two-cup longevity, sediment health benefits, therapeutic use and the Portuguese custom are reported source claims, not health advice.</li><li>Sediment alone proves neither a defect nor superior quality.</li><li>The original quiz has no answer key. The roasted-chicken pairing is unresolved and is not forced into a scored question.</li></ul><h2>Your data</h2><p>Progress and the active session are stored locally in your browser. If browser storage fails, study still works for the current visit. No analytics, accounts, remote fonts, AI requests, payment flows, or backend services are included. Answers are in the site’s public files; this is a self-study tool.</p><p><a href="#practice">Back to practice →</a></p></div>`;}

document.addEventListener('submit',e=>{if(e.target.id==='setup-form'){e.preventDefault();startSession();}if(e.target.id==='answer-form'){e.preventDefault();checkAnswer();}});
document.addEventListener('input',e=>{if(e.target.id==='notes-search'){search=e.target.value;renderNoteResults();}});
document.addEventListener('change',e=>{
 if(e.target.closest('#setup-form'))updatePoolCount();
 if(e.target.name==='answer'&&session){session.items[session.index].selected=[...document.querySelectorAll('[name="answer"]:checked')].map(x=>Number(x.value));save();}
 if(e.target.dataset.read){const id=e.target.dataset.read;progress.read=e.target.checked?[...new Set([...progress.read,id])]:progress.read.filter(x=>x!==id);save();}
});
document.addEventListener('click',e=>{
 if(e.target.closest('.skip')){e.preventDefault();main.focus();return;}
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.topic){
   if(btn.dataset.mode==='notes'){search='';location.hash=btn.dataset.topic==='all'?'notes':`notes/${btn.dataset.topic}`;if(location.hash==='#notes'&&activeTopic==='all')renderNotes();}
   else if(btn.dataset.mode==='active'){location.hash=`notes/${btn.dataset.topic==='all'?'':btn.dataset.topic}`;}
   else {settings.topic=btn.dataset.topic;renderSetup();}
 }
 if(btn.dataset.practiceTopic){settings={...settings,topic:btn.dataset.practiceTopic,missed:false};location.hash='practice/setup';renderSetup();pageFocus();}
 const action=btn.dataset.action;
 if(action==='pause'){renderSetup();pageFocus();}
 if(action==='resume'){session.finished?renderResults():renderQuestion();pageFocus();}
 if(action==='next'){
   if(!session.items[session.index].checked)return;
   if(session.index===session.items.length-1){session.finished=true;save();renderResults();}else{session.index++;save();renderQuestion();}pageFocus();
 }
 if(action==='new'){settings.missed=false;location.hash='practice/setup';renderSetup();pageFocus();}
 if(action==='retry'){
   const ids=session.items.filter(q=>!q.correct).map(q=>q.id);
   session={items:makeSession(questions,{topic:'all',type:'all',count:'all',missed:true},ids),index:0,exam:false,finished:false};save();renderQuestion();pageFocus();
 }
 if(action==='missed'){settings={topic:'all',type:'all',count:'all',exam:false,missed:true};location.hash='practice/setup';renderSetup();pageFocus();}
 if(action==='print')window.print();
 if(action==='clear-search'){search='';activeTopic='all';if(location.hash!=='#notes')location.hash='notes';else renderNotes();}
 if(action==='reset-prompt'){document.querySelector('#reset-area').innerHTML='<div class="confirm-reset" role="region" aria-label="Confirm reset"><p>Delete this browser’s question history, read markers, and saved session? This cannot be undone.</p><button data-action="reset-confirm">Delete study data</button><button data-action="reset-cancel">Keep my progress</button></div>';document.querySelector('[data-action="reset-cancel"]').focus();}
 if(action==='reset-cancel'){document.querySelector('#reset-area').innerHTML='';document.querySelector('[data-action="reset-prompt"]').focus();}
 if(action==='reset-confirm'){progress=blank();session=null;save();renderProgress();pageFocus();}
});
window.addEventListener('hashchange',route);
route();
