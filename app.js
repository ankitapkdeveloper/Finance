// ---------- Categories (edit this list to customize categories/emojis/keywords) ----------
const CATEGORIES = [
  {id:'food', label:'Food & Chai', emoji:'🍔', color:'#FF6B4A', keywords:['chai','tea','coffee','food','lunch','dinner','breakfast','restaurant','hotel','samosa','snack','sweet','pizza','burger','dosa','tiffin','zomato','swiggy']},
  {id:'groceries', label:'Groceries', emoji:'🛒', color:'#3DAE6D', keywords:['vegetable','veggies','fruit','milk','rice','dal','atta','grocery','groceries','sabzi','kirana','egg','oil','sugar']},
  {id:'transport', label:'Transport', emoji:'🚌', color:'#3E8EDE', keywords:['auto','bus','train','petrol','diesel','fuel','uber','ola','taxi','cab','metro','rickshaw','parking','toll']},
  {id:'bills', label:'Bills & Recharge', emoji:'💡', color:'#8B5CF6', keywords:['electricity','bill','recharge','wifi','internet','phone','mobile','gas','dth','broadband']},
  {id:'health', label:'Health', emoji:'💊', color:'#F4436C', keywords:['doctor','medicine','hospital','clinic','pharmacy','health','dental','checkup','medical']},
  {id:'shopping', label:'Shopping', emoji:'👕', color:'#E0459B', keywords:['shirt','shoes','dress','clothes','clothing','amazon','flipkart','mall','shopping','bag','watch']},
  {id:'entertainment', label:'Entertainment', emoji:'🎬', color:'#F5A623', keywords:['movie','netflix','cinema','game','outing','party','fun','picnic','subscription']},
  {id:'education', label:'Education', emoji:'📚', color:'#17A2B8', keywords:['school','book','fees','tuition','course','college','stationery','exam']},
  {id:'gifts', label:'Gifts & Festivals', emoji:'🎁', color:'#FF7EB6', keywords:['gift','festival','diwali','wedding','donation','puja','charity']},
  {id:'home', label:'Home & Rent', emoji:'🏠', color:'#5B8C5A', keywords:['rent','repair','furniture','maid','cleaning','plumber','electrician']},
  {id:'other', label:'Other', emoji:'💰', color:'#6B7A99', keywords:[]}
];
function catById(id){ return CATEGORIES.find(c=>c.id===id) || CATEGORIES[CATEGORIES.length-1]; }
function formatINR(n){ return '₹'+(Number(n)||0).toLocaleString('en-IN',{maximumFractionDigits:2}); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function startOfWeek(d=new Date()){ const date=new Date(d); const day=date.getDay(); const diff=(day===0?-6:1)-day; date.setDate(date.getDate()+diff); date.setHours(0,0,0,0); return date; }
function startOfMonth(d=new Date()){ return new Date(d.getFullYear(), d.getMonth(),1); }
function startOfYear(d=new Date()){ return new Date(d.getFullYear(),0,1); }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function formatDateShort(ds){ return new Date(ds).toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }

// ---------- Display: theme, text size, accent colour ----------
const ACCENT_PRESETS = [
  ['#FF5A67','#FF8A5C'],
  ['#3E8EDE','#6FB2F5'],
  ['#3DAE6D','#6FCB93'],
  ['#8B5CF6','#B79CFA'],
  ['#E0459B','#F17FC0'],
  ['#F5A623','#FFC04D']
];
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kharcha_theme', theme);
}
function applyFontSize(size){
  document.documentElement.setAttribute('data-font-size', size);
  localStorage.setItem('kharcha_font_size', size);
}
function applyAccent(pair){
  document.documentElement.style.setProperty('--primary', pair[0]);
  document.documentElement.style.setProperty('--primary-2', pair[1]);
  localStorage.setItem('kharcha_accent', JSON.stringify(pair));
}
function currentAccent(){
  const saved = localStorage.getItem('kharcha_accent');
  try{ return saved ? JSON.parse(saved) : ACCENT_PRESETS[0]; }catch(e){ return ACCENT_PRESETS[0]; }
}
function initDisplayControls(){
  document.getElementById('darkModeToggle').onchange = (e)=> applyTheme(e.target.checked ? 'dark' : 'light');
  document.querySelectorAll('#fontSizeToggle button').forEach(b=>{
    b.onclick=()=>{
      applyFontSize(b.dataset.size);
      document.querySelectorAll('#fontSizeToggle button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    };
  });
  renderAccentSwatches();
}
function renderAccentSwatches(){
  const wrap = document.getElementById('accentSwatches'); wrap.innerHTML='';
  const current = currentAccent();
  ACCENT_PRESETS.forEach(pair=>{
    const b=document.createElement('button'); b.type='button';
    b.className='swatch'+(pair[0]===current[0] ? ' selected' : '');
    b.style.background = 'linear-gradient(135deg, '+pair[0]+', '+pair[1]+')';
    b.onclick=()=>{ applyAccent(pair); renderAccentSwatches(); };
    wrap.appendChild(b);
  });
}
function refreshDisplayControlsUI(){
  document.getElementById('darkModeToggle').checked = document.documentElement.getAttribute('data-theme')==='dark';
  const savedSize = localStorage.getItem('kharcha_font_size') || 'normal';
  document.querySelectorAll('#fontSizeToggle button').forEach(b=> b.classList.toggle('active', b.dataset.size===savedSize));
  renderAccentSwatches();
}

// ---------- Category auto-detect, with learning ----------
let learnedMap = {};
function detectCategory(text){
  const t=(text||'').toLowerCase().trim();
  if(!t) return null;
  if(learnedMap[t]) return learnedMap[t];
  for(const word of t.split(/\s+/)){ if(learnedMap[word]) return learnedMap[word]; }
  for(const c of CATEGORIES){ for(const k of c.keywords){ if(t.includes(k)) return c.id; } }
  return null;
}
async function learnCategory(desc, catId){
  const t=(desc||'').toLowerCase().trim();
  if(!t) return;
  const words = t.split(/\s+/);
  const key = words.length<=2 ? t : words[0];
  if(learnedMap[key]===catId) return;
  learnedMap[key]=catId;
  const rows = await Store.list('category_learned');
  const existing = rows.find(r=>r.keyword===key);
  if(existing){ await Store.update('category_learned', existing.id, {category:catId}); }
  else { await Store.insert('category_learned', {keyword:key, category:catId}); }
}
async function loadLearned(){
  const rows = await Store.list('category_learned');
  learnedMap = {};
  rows.forEach(r=> learnedMap[r.keyword]=r.category);
}

// ---------- Data layer: Supabase ----------
const sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

const Store = {
  async list(table){
    const { data, error } = await sb.from(table).select('*').order('created_at', { ascending:false });
    if(error){ console.error(table, error); return []; }
    return data || [];
  },
  async insert(table, row){
    const { data, error } = await sb.from(table).insert(row).select().single();
    if(error){ console.error(table, error); throw error; }
    return data;
  },
  async update(table, id, patch){
    const { data, error } = await sb.from(table).update(patch).eq('id', id).select().single();
    if(error){ console.error(table, error); throw error; }
    return data;
  },
  async remove(table, id){
    const { error } = await sb.from(table).delete().eq('id', id);
    if(error) console.error(table, error);
  }
};

const pendingDeleteIds = new Set();
async function refreshExpenses(){ state.expenses = (await Store.list('expenses')).filter(r=>!pendingDeleteIds.has(r.id)); }
async function refreshShopping(){ state.shopping = (await Store.list('shopping_list')).filter(r=>!pendingDeleteIds.has(r.id)); }

function initRealtime(){
  sb.channel('family-kharcha-changes')
    .on('postgres_changes', {event:'*', schema:'public', table:'expenses'}, async ()=>{ await refreshExpenses(); render(); })
    .on('postgres_changes', {event:'*', schema:'public', table:'shopping_list'}, async ()=>{ await refreshShopping(); render(); })
    .on('postgres_changes', {event:'*', schema:'public', table:'family_members'}, async ()=>{ state.members = await Store.list('family_members'); render(); })
    .on('postgres_changes', {event:'*', schema:'public', table:'budgets'}, async ()=>{ state.budgets = await Store.list('budgets'); render(); })
    .on('postgres_changes', {event:'*', schema:'public', table:'recurring'}, async ()=>{ state.recurring = await Store.list('recurring'); render(); })
    .on('postgres_changes', {event:'*', schema:'public', table:'category_learned'}, async ()=>{ await loadLearned(); })
    .subscribe();
}

function queueOffline(table, row){
  const q = JSON.parse(localStorage.getItem('kharcha_offline_queue')||'[]');
  q.push({table, row, ts:Date.now()});
  localStorage.setItem('kharcha_offline_queue', JSON.stringify(q));
}
async function flushOfflineQueue(){
  const q = JSON.parse(localStorage.getItem('kharcha_offline_queue')||'[]');
  if(q.length===0) return;
  const remaining=[];
  for(const item of q){
    try{ await Store.insert(item.table, item.row); }
    catch(e){ remaining.push(item); }
  }
  localStorage.setItem('kharcha_offline_queue', JSON.stringify(remaining));
  if(remaining.length < q.length){
    showToast('Synced offline entries ✅');
    await refreshExpenses(); await refreshShopping(); render();
  }
}
window.addEventListener('online', flushOfflineQueue);

let state = {
  expenses:[], shopping:[], members:[], budgets:[], recurring:[],
  currentMember:null, currentScreen:'home',
  addSelectedCategory:null, userPickedCategory:false, editingExpenseId:null,
  recSelectedCategory:null,
  historyPeriod:'day',
  filterMembers:new Set(), filterCategories:new Set(),
  authMode:'login', pinMode:'enter'
};
let currentUserId = null;

async function loadAll(){
  await Promise.all([refreshExpenses(), refreshShopping(), loadLearned()]);
  state.members = await Store.list('family_members');
  state.budgets = await Store.list('budgets');
  state.recurring = await Store.list('recurring');
  if(state.members.length===0){ const m = await Store.insert('family_members', {name:'Me', emoji:'🙂'}); state.members=[m]; }
  state.currentMember = state.currentMember || state.members[0].name;
}

async function processRecurring(){
  const currentYM = todayStr().slice(0,7);
  const todayDate = new Date().getDate();
  let logged=0;
  for(const r of state.recurring){
    if(r.last_logged_month !== currentYM && todayDate >= r.day_of_month){
      const row={member_name:r.member_name, amount:r.amount, description:r.description, category:r.category, emoji:r.emoji, expense_date:todayStr()};
      const saved = await Store.insert('expenses', row);
      state.expenses.unshift(saved);
      await Store.update('recurring', r.id, {last_logged_month: currentYM});
      r.last_logged_month = currentYM;
      logged++;
    }
  }
  if(logged>0){ showToast(logged+' recurring expense'+(logged>1?'s':'')+' added'); }
}

function switchScreen(name){
  if(state.currentScreen==='add' && name!=='add' && state.editingExpenseId){ resetAddForm(); }
  state.currentScreen=name;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.screen===name));
  render();
}
function showToast(msg, actionLabel, actionFn, duration){
  const t=document.getElementById('toast');
  const msgEl=document.getElementById('toastMsg');
  const actionEl=document.getElementById('toastAction');
  msgEl.textContent=msg;
  if(actionLabel && actionFn){
    actionEl.textContent=actionLabel; actionEl.style.display='inline-block';
    actionEl.onclick=()=>{ actionFn(); t.classList.remove('show'); };
  } else { actionEl.style.display='none'; actionEl.onclick=null; }
  t.classList.add('show');
  clearTimeout(showToast._tm);
  showToast._tm=setTimeout(()=>t.classList.remove('show'), duration || (actionLabel?4500:1800));
}

function renderMembers(){
  const wrap=document.getElementById('memberSwitch'); wrap.innerHTML='';
  state.members.forEach(m=>{
    const b=document.createElement('button');
    b.className='member-chip'+(m.name===state.currentMember?' active':'');
    b.textContent=(m.emoji||'🙂')+' '+m.name;
    b.onclick=()=>{ state.currentMember=m.name; renderMembers(); if(state.currentScreen==='add'){ renderAddMemberChips(); } };
    wrap.appendChild(b);
  });
  const add=document.createElement('button');
  add.className='member-chip add'; add.textContent='+ Add';
  add.onclick=async ()=>{
    const name=prompt('Family member name?');
    if(name && name.trim()){
      const m=await Store.insert('family_members',{name:name.trim(), emoji:'🙂'});
      state.members.push(m); state.currentMember=m.name; render();
    }
  };
  wrap.appendChild(add);
}

function totalActiveFilters(){ return state.filterMembers.size + state.filterCategories.size; }
function filteredExpenses(){
  return state.expenses.filter(function(e){
    return (state.filterMembers.size===0 || state.filterMembers.has(e.member_name)) &&
           (state.filterCategories.size===0 || state.filterCategories.has(e.category));
  });
}
function renderMemberFilter(containerId){
  const wrap=document.getElementById(containerId); wrap.innerHTML='';
  const allBtn=document.createElement('button'); allBtn.type='button';
  allBtn.className='chip filter-chip'+(state.filterMembers.size===0?' selected':'');
  allBtn.textContent='All';
  allBtn.onclick=()=>{ state.filterMembers.clear(); render(); };
  wrap.appendChild(allBtn);
  state.members.forEach(m=>{
    const b=document.createElement('button'); b.type='button';
    const active = state.filterMembers.has(m.name);
    b.className='chip filter-chip'+(active?' selected':'');
    b.textContent=(m.emoji||'🙂')+' '+m.name;
    b.onclick=()=>{
      if(state.filterMembers.has(m.name)) state.filterMembers.delete(m.name);
      else state.filterMembers.add(m.name);
      render();
    };
    wrap.appendChild(b);
  });
}
function renderCategoryFilter(containerId){
  const wrap=document.getElementById(containerId); wrap.innerHTML='';
  const allBtn=document.createElement('button'); allBtn.type='button';
  allBtn.className='chip filter-chip'+(state.filterCategories.size===0?' selected':'');
  allBtn.textContent='All';
  allBtn.onclick=()=>{ state.filterCategories.clear(); render(); };
  wrap.appendChild(allBtn);
  CATEGORIES.forEach(c=>{
    const b=document.createElement('button'); b.type='button';
    const active = state.filterCategories.has(c.id);
    b.className='chip filter-chip';
    b.style.background = active ? c.color : c.color+'22';
    b.style.color = active ? '#fff' : 'inherit';
    b.textContent=c.emoji+' '+c.label;
    b.onclick=()=>{
      if(state.filterCategories.has(c.id)) state.filterCategories.delete(c.id);
      else state.filterCategories.add(c.id);
      render();
    };
    wrap.appendChild(b);
  });
}
function renderFilterBar(prefix){
  const count = totalActiveFilters();
  const toggleBtn = document.getElementById(prefix+'FilterToggle');
  const clearBtn = document.getElementById(prefix+'FilterClear');
  toggleBtn.textContent = count>0 ? ('🔍 Filters ('+count+')') : '🔍 Filters';
  toggleBtn.classList.toggle('has-filters', count>0);
  clearBtn.style.display = count>0 ? 'inline-block' : 'none';
  renderMemberFilter(prefix+'MemberFilter');
  renderCategoryFilter(prefix+'CategoryFilter');
}
function initFilterBars(){
  ['home','history'].forEach(function(prefix){
    document.getElementById(prefix+'FilterToggle').onclick = function(){
      const panel = document.getElementById(prefix+'FilterPanel');
      panel.style.display = (panel.style.display==='none') ? 'block' : 'none';
    };
    document.getElementById(prefix+'FilterClear').onclick = function(){
      state.filterMembers.clear(); state.filterCategories.clear(); render();
    };
  });
}

function renderCategoryChipsInto(containerId, selectedId, onSelect){
  const wrap=document.getElementById(containerId); wrap.innerHTML='';
  CATEGORIES.forEach(c=>{
    const b=document.createElement('button'); b.type='button';
    const selected = selectedId===c.id;
    b.className='chip'; b.style.background= selected ? c.color : c.color+'22'; b.style.color = selected ? '#fff':'inherit';
    b.textContent=c.emoji+' '+c.label;
    b.onclick=()=> onSelect(c.id);
    wrap.appendChild(b);
  });
}

function computeTotal(list, fromDate){ return list.filter(e=> new Date(e.expense_date) >= fromDate).reduce((s,e)=>s+Number(e.amount),0); }
function expenseCard(e){
  const c=catById(e.category);
  const div=document.createElement('div'); div.className='item-card';
  div.innerHTML='<div class="item-emoji" style="background:'+c.color+'22">'+(e.emoji||c.emoji)+'</div>'+
    '<div class="item-info"><div class="item-desc">'+escapeHtml(e.description || c.label)+'</div>'+
    '<div class="item-meta">'+escapeHtml(e.member_name||'')+' · '+formatDateShort(e.expense_date)+'</div></div>'+
    '<div class="item-amount">'+formatINR(e.amount)+'</div>'+
    '<button class="item-del">🗑</button>';
  div.addEventListener('click', (ev)=>{ if(ev.target.closest('.item-del')) return; editExpense(e); });
  div.querySelector('.item-del').onclick=(ev)=>{ ev.stopPropagation(); deleteExpenseWithUndo(e); };
  return div;
}
function deleteExpenseWithUndo(e){
  pendingDeleteIds.add(e.id);
  state.expenses = state.expenses.filter(x=>x.id!==e.id);
  render();
  showToast('Expense deleted', 'Undo', ()=>{
    pendingDeleteIds.delete(e.id);
    state.expenses.unshift(e);
    render();
  });
  setTimeout(async ()=>{
    if(pendingDeleteIds.has(e.id)){ await Store.remove('expenses', e.id); pendingDeleteIds.delete(e.id); }
  }, 4500);
}
function renderBudgetProgress(){
  const titleEl=document.getElementById('budgetSectionTitle');
  const wrap=document.getElementById('budgetProgressList');
  wrap.innerHTML='';
  if(state.budgets.length===0){ titleEl.style.display='none'; wrap.style.display='none'; return; }
  titleEl.style.display='block'; wrap.style.display='flex';
  const monthList = state.expenses.filter(e=> new Date(e.expense_date) >= startOfMonth());
  const byCat={}; monthList.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+Number(e.amount); });
  state.budgets.forEach(b=>{
    const c=catById(b.category);
    const spent = byCat[b.category]||0;
    const pct = Math.min(100, (spent/b.monthly_limit)*100);
    const over = spent > b.monthly_limit;
    const div=document.createElement('div'); div.className='budget-progress-card';
    div.innerHTML='<div class="budget-progress-head"><span>'+c.emoji+' '+c.label+'</span><span class="'+(over?'over':'')+'">'+formatINR(spent)+' / '+formatINR(b.monthly_limit)+'</span></div>'+
      '<div class="progress-track"><div class="progress-fill" style="width:'+pct+'%;background:'+(over?'#E0304A':(pct>80?'#F5A623':c.color))+'"></div></div>';
    wrap.appendChild(div);
  });
}
function renderHome(){
  renderFilterBar('home');
  const filtered = filteredExpenses();
  const hasFilter = totalActiveFilters()>0;
  const todayList = filtered.filter(e=>e.expense_date===todayStr());
  document.getElementById('heroAmount').textContent = formatINR(todayList.reduce((s,e)=>s+Number(e.amount),0));
  document.getElementById('heroDate').textContent = new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long'});
  document.getElementById('statWeek').textContent = formatINR(computeTotal(filtered, startOfWeek()));
  document.getElementById('statMonth').textContent = formatINR(computeTotal(filtered, startOfMonth()));
  document.getElementById('statYear').textContent = formatINR(computeTotal(filtered, startOfYear()));

  renderBudgetProgress();

  const monthList = filtered.filter(e=> new Date(e.expense_date) >= startOfMonth());
  const byCat={}; monthList.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+Number(e.amount); });
  const total = Object.values(byCat).reduce((a,b)=>a+b,0) || 1;
  const bar=document.getElementById('catBar'); const legend=document.getElementById('catLegend');
  bar.innerHTML=''; legend.innerHTML='';
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).forEach(([catId,amt])=>{
    const c=catById(catId);
    const seg=document.createElement('div'); seg.style.width=(amt/total*100)+'%'; seg.style.background=c.color; bar.appendChild(seg);
    const row=document.createElement('div'); row.className='cat-legend-row';
    row.innerHTML='<span class="dot" style="background:'+c.color+'"></span><span class="name">'+c.emoji+' '+c.label+'</span><span>'+formatINR(amt)+'</span>';
    legend.appendChild(row);
  });
  if(monthList.length===0){
    legend.innerHTML = hasFilter
      ? '<div class="empty">No matching expenses this month</div>'
      : '<div class="empty">No expenses yet this month</div>';
  }

  const recentWrap=document.getElementById('recentList'); recentWrap.innerHTML='';
  const recent=[...filtered].sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).slice(0,8);
  if(recent.length===0){
    recentWrap.innerHTML = hasFilter
      ? '<div class="empty">No expenses match these filters</div>'
      : '<div class="empty">No expenses yet.<br>Tap ➕ Add to log your first one!</div>';
  }
  recent.forEach(e=> recentWrap.appendChild(expenseCard(e)));
}

function renderAddCategoryChips(){
  renderCategoryChipsInto('addCatGrid', state.addSelectedCategory, (id)=>{
    state.addSelectedCategory=id; state.userPickedCategory=true; renderAddCategoryChips();
  });
}
function renderAddMemberChips(){
  const wrap=document.getElementById('addMemberGrid'); wrap.innerHTML='';
  state.members.forEach(m=>{
    const b=document.createElement('button'); b.type='button';
    const selected = state.currentMember===m.name;
    b.className='chip'; if(selected){ b.style.background='var(--primary)'; b.style.color='#fff'; }
    b.textContent=(m.emoji||'🙂')+' '+m.name;
    b.onclick=()=>{ state.currentMember=m.name; renderAddMemberChips(); renderMembers(); };
    wrap.appendChild(b);
  });
}
function initAddForm(){
  const descInput=document.getElementById('descInput');
  descInput.addEventListener('input', ()=>{
    if(!state.userPickedCategory){
      const guess=detectCategory(descInput.value);
      if(guess){ state.addSelectedCategory=guess; renderAddCategoryChips(); }
    }
    if(descInput.value.trim()===''){ state.userPickedCategory=false; }
  });
  document.getElementById('dateInput').value = todayStr();
  document.getElementById('saveExpenseBtn').onclick = saveExpense;
  document.getElementById('cancelEditBtn').onclick = ()=>{ resetAddForm(); switchScreen('home'); };
}
function editExpense(e){
  state.editingExpenseId = e.id;
  document.getElementById('amountInput').value = e.amount;
  document.getElementById('descInput').value = e.description||'';
  document.getElementById('dateInput').value = e.expense_date;
  state.addSelectedCategory = e.category;
  state.userPickedCategory = true;
  if(e.member_name) state.currentMember = e.member_name;
  document.getElementById('addScreenTitle').textContent='Edit Expense';
  document.getElementById('saveExpenseBtn').textContent='Update Expense';
  document.getElementById('cancelEditBtn').style.display='inline-block';
  switchScreen('add');
}
function resetAddForm(){
  document.getElementById('amountInput').value=''; document.getElementById('descInput').value='';
  state.addSelectedCategory=null; state.userPickedCategory=false; state.editingExpenseId=null;
  document.getElementById('addScreenTitle').textContent='Add an Expense';
  document.getElementById('saveExpenseBtn').textContent='Save Expense';
  document.getElementById('cancelEditBtn').style.display='none';
  document.getElementById('dateInput').value=todayStr();
  renderAddCategoryChips();
}
async function saveExpense(){
  const amount=parseFloat(document.getElementById('amountInput').value);
  if(!amount || amount<=0){ showToast('Enter an amount'); return; }
  const desc=document.getElementById('descInput').value.trim();
  const date=document.getElementById('dateInput').value || todayStr();
  const catId = state.addSelectedCategory || detectCategory(desc) || 'other';
  const cat = catById(catId);
  const row={ member_name: state.currentMember, amount, description:desc, category:catId, emoji:cat.emoji, expense_date:date };
  const wasEditing = state.editingExpenseId;
  try{
    if(wasEditing){
      const updated = await Store.update('expenses', wasEditing, row);
      const idx = state.expenses.findIndex(x=>x.id===wasEditing);
      if(idx>-1) state.expenses[idx]=updated;
      showToast('Expense updated ✅');
    } else {
      const saved = await Store.insert('expenses', row);
      state.expenses.unshift(saved);
      showToast('Expense added ✅');
    }
  }catch(err){
    if(!wasEditing && !navigator.onLine){
      row.id='temp-'+Date.now(); row.created_at=new Date().toISOString();
      state.expenses.unshift(row);
      const rest = Object.assign({}, row); delete rest.id;
      queueOffline('expenses', rest);
      showToast('Saved offline — will sync later 📶');
    } else {
      showToast('Could not save — check your connection'); return;
    }
  }
  if(state.userPickedCategory && desc){ await learnCategory(desc, catId); }
  resetAddForm();
  switchScreen('home');
}

function shopCard(item){
  const c=catById(item.category||'other');
  const div=document.createElement('div'); div.className='shop-item'+(item.is_purchased?' done':'');
  div.innerHTML='<button class="shop-check'+(item.is_purchased?' done':'')+'">'+(item.is_purchased?'✓':'')+'</button>'+
    '<div class="item-info"><div class="item-desc">'+c.emoji+' '+escapeHtml(item.item_name)+'</div>'+
    '<div class="item-meta">'+(item.quantity? escapeHtml(item.quantity)+' · ':'')+(item.estimated_cost?formatINR(item.estimated_cost):'No price set')+'</div></div>'+
    '<button class="item-del">🗑</button>';
  div.querySelector('.shop-check').onclick = async ()=>{
    const newVal=!item.is_purchased;
    await Store.update('shopping_list', item.id, {is_purchased:newVal});
    item.is_purchased=newVal;
    if(newVal && item.estimated_cost){
      const row={member_name:state.currentMember, amount:item.estimated_cost, description:item.item_name, category:item.category||'other', emoji:c.emoji, expense_date:todayStr()};
      const saved=await Store.insert('expenses', row);
      state.expenses.unshift(saved);
      showToast('Bought! Added to expenses too 🎉');
    } else { showToast(newVal?'Marked bought':'Marked pending'); }
    renderShopping();
  };
  div.querySelector('.item-del').onclick = ()=> deleteShopItemWithUndo(item);
  return div;
}
function deleteShopItemWithUndo(item){
  pendingDeleteIds.add(item.id);
  state.shopping = state.shopping.filter(x=>x.id!==item.id);
  renderShopping();
  showToast('Item deleted', 'Undo', ()=>{
    pendingDeleteIds.delete(item.id);
    state.shopping.unshift(item);
    renderShopping();
  });
  setTimeout(async ()=>{
    if(pendingDeleteIds.has(item.id)){ await Store.remove('shopping_list', item.id); pendingDeleteIds.delete(item.id); }
  }, 4500);
}
function renderShopping(){
  const pendWrap=document.getElementById('shopPending'); const doneWrap=document.getElementById('shopDone');
  pendWrap.innerHTML=''; doneWrap.innerHTML='';
  const pending=state.shopping.filter(i=>!i.is_purchased); const done=state.shopping.filter(i=>i.is_purchased);
  document.getElementById('shopTotal').textContent=formatINR(pending.reduce((s,i)=>s+Number(i.estimated_cost||0),0));
  if(pending.length===0) pendWrap.innerHTML='<div class="empty">List is empty. Add something to buy!</div>';
  pending.forEach(i=>pendWrap.appendChild(shopCard(i)));
  if(done.length===0) doneWrap.innerHTML='<div class="empty">Nothing bought yet</div>';
  done.forEach(i=>doneWrap.appendChild(shopCard(i)));
}
function initShoppingForm(){
  document.getElementById('addShopBtn').onclick = async ()=>{
    const name=document.getElementById('shopNameInput').value.trim();
    if(!name){ showToast('Enter item name'); return; }
    const qty=document.getElementById('shopQtyInput').value.trim();
    const cost=parseFloat(document.getElementById('shopCostInput').value)||null;
    const catId = detectCategory(name) || 'other';
    const row={item_name:name, quantity:qty, estimated_cost:cost, category:catId, emoji:catById(catId).emoji, is_purchased:false, added_by:state.currentMember};
    try{
      const saved=await Store.insert('shopping_list', row);
      state.shopping.unshift(saved);
    }catch(e){
      if(!navigator.onLine){
        row.id='temp-'+Date.now(); row.created_at=new Date().toISOString();
        state.shopping.unshift(row);
        const rest = Object.assign({}, row); delete rest.id;
        queueOffline('shopping_list', rest);
        showToast('Saved offline — will sync later 📶');
      }
    }
    document.getElementById('shopNameInput').value=''; document.getElementById('shopQtyInput').value=''; document.getElementById('shopCostInput').value='';
    showToast('Added to list');
    renderShopping();
  };
}

function groupKey(dateStr, period){
  if(period==='day') return dateStr;
  if(period==='week'){ return startOfWeek(new Date(dateStr)).toISOString().slice(0,10); }
  if(period==='month'){ return dateStr.slice(0,7); }
  return dateStr.slice(0,4);
}
function groupLabel(key, period){
  if(period==='day') return new Date(key).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
  if(period==='week'){ const s=new Date(key); const e=new Date(s); e.setDate(e.getDate()+6); return s.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' – '+e.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }
  if(period==='month'){ const parts=key.split('-'); return new Date(Number(parts[0]),Number(parts[1])-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'}); }
  return key;
}
function renderHistory(){
  renderFilterBar('history');
  const filtered = filteredExpenses();
  const hasFilter = totalActiveFilters()>0;
  const wrap=document.getElementById('historyList'); wrap.innerHTML='';
  const groups={};
  filtered.forEach(e=>{
    const k=groupKey(e.expense_date, state.historyPeriod);
    if(!groups[k]) groups[k]={total:0, items:[]};
    groups[k].total+=Number(e.amount); groups[k].items.push(e);
  });
  const keys=Object.keys(groups).sort().reverse();
  if(keys.length===0){
    wrap.innerHTML = hasFilter
      ? '<div class="empty">No expenses match these filters</div>'
      : '<div class="empty">No expenses yet</div>';
    return;
  }
  keys.forEach(k=>{
    const g=groups[k];
    const card=document.createElement('div'); card.className='period-card';
    const head=document.createElement('div'); head.className='period-head';
    head.innerHTML='<span class="l">'+groupLabel(k, state.historyPeriod)+'</span><span class="r">'+formatINR(g.total)+'</span>';
    head.onclick=()=>card.classList.toggle('open');
    const body=document.createElement('div'); body.className='period-body';
    g.items.sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).forEach(e=> body.appendChild(expenseCard(e)));
    card.appendChild(head); card.appendChild(body); wrap.appendChild(card);
  });
}
function initHistoryToggle(){
  document.querySelectorAll('#screen-history .period-toggle button').forEach(b=>{
    if(!b.dataset.period) return;
    b.onclick=()=>{
      state.historyPeriod=b.dataset.period;
      document.querySelectorAll('#screen-history .period-toggle button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderHistory();
    };
  });
}

function renderBudgetEditor(){
  const wrap=document.getElementById('budgetEditor'); wrap.innerHTML='';
  CATEGORIES.forEach(c=>{
    const existing = state.budgets.find(b=>b.category===c.id);
    const row=document.createElement('div'); row.className='budget-row';
    row.innerHTML='<span class="budget-label">'+c.emoji+' '+c.label+'</span>'+
      '<input type="number" class="text-input budget-input" data-cat="'+c.id+'" placeholder="No limit" value="'+(existing?existing.monthly_limit:'')+'">';
    wrap.appendChild(row);
  });
}
async function saveBudgets(){
  const inputs=document.querySelectorAll('.budget-input');
  for(const inp of inputs){
    const catId=inp.dataset.cat; const val=parseFloat(inp.value);
    const existing = state.budgets.find(b=>b.category===catId);
    if(!val || val<=0){
      if(existing){ await Store.remove('budgets', existing.id); state.budgets=state.budgets.filter(b=>b.id!==existing.id); }
      continue;
    }
    if(existing){ await Store.update('budgets', existing.id, {monthly_limit:val}); existing.monthly_limit=val; }
    else{ const saved=await Store.insert('budgets', {category:catId, monthly_limit:val}); state.budgets.push(saved); }
  }
  showToast('Budgets saved ✅');
  render();
}
function renderRecurringCatChips(){
  renderCategoryChipsInto('recCatGrid', state.recSelectedCategory, (id)=>{ state.recSelectedCategory=id; renderRecurringCatChips(); });
}
function renderRecurringList(){
  const wrap=document.getElementById('recurringList'); wrap.innerHTML='';
  if(state.recurring.length===0){ wrap.innerHTML='<div class="empty">No recurring expenses yet</div>'; return; }
  state.recurring.forEach(r=>{
    const c=catById(r.category);
    const div=document.createElement('div'); div.className='item-card'; div.style.cursor='default';
    div.innerHTML='<div class="item-emoji" style="background:'+c.color+'22">'+(r.emoji||c.emoji)+'</div>'+
      '<div class="item-info"><div class="item-desc">'+escapeHtml(r.description)+'</div>'+
      '<div class="item-meta">Every month, day '+r.day_of_month+' · '+escapeHtml(r.member_name||'')+'</div></div>'+
      '<div class="item-amount">'+formatINR(r.amount)+'</div>'+
      '<button class="item-del">🗑</button>';
    div.querySelector('.item-del').onclick=async ()=>{
      await Store.remove('recurring', r.id);
      state.recurring = state.recurring.filter(x=>x.id!==r.id);
      renderRecurringList();
      showToast('Recurring expense removed');
    };
    wrap.appendChild(div);
  });
}
function initSettingsForm(){
  document.getElementById('settingsBtn').onclick = ()=>{
    renderBudgetEditor(); renderRecurringList(); renderRecurringCatChips();
    refreshDisplayControlsUI();
    switchScreen('settings');
  };
  document.getElementById('settingsBack').onclick = ()=> switchScreen('home');
  document.getElementById('saveBudgetsBtn').onclick = saveBudgets;
  document.getElementById('exportCsvBtn').onclick = exportCSV;
  document.getElementById('addRecurringBtn').onclick = async ()=>{
    const desc=document.getElementById('recDescInput').value.trim();
    const amount=parseFloat(document.getElementById('recAmountInput').value);
    const day=parseInt(document.getElementById('recDayInput').value);
    if(!desc || !amount || amount<=0){ showToast('Enter description and amount'); return; }
    const dayClamped = Math.min(28, Math.max(1, day||1));
    const catId = state.recSelectedCategory || detectCategory(desc) || 'other';
    const row={description:desc, amount, category:catId, emoji:catById(catId).emoji, member_name:state.currentMember, day_of_month:dayClamped, last_logged_month:null};
    const saved=await Store.insert('recurring', row);
    state.recurring.push(saved);
    document.getElementById('recDescInput').value=''; document.getElementById('recAmountInput').value=''; document.getElementById('recDayInput').value='';
    state.recSelectedCategory=null; renderRecurringCatChips();
    renderRecurringList();
    showToast('Recurring expense added');
  };
  document.getElementById('changePinBtn').onclick = ()=>{
    const val = prompt('Enter a new PIN (4+ digits) for this device:');
    if(val===null) return;
    if(val.trim().length<4){ showToast('PIN should be at least 4 digits'); return; }
    localStorage.setItem('kharcha_pin_'+currentUserId, val.trim());
    showToast('PIN updated for this device');
  };
  document.getElementById('lockNowBtn').onclick = ()=> location.reload();
  document.getElementById('logoutBtn').onclick = async ()=>{
    if(!confirm('Log out of this family on this device?')) return;
    await sb.auth.signOut();
    location.reload();
  };
}
function exportCSV(){
  const rows = [['Date','Member','Category','Description','Amount']];
  [...state.expenses].sort((a,b)=> new Date(a.expense_date)-new Date(b.expense_date)).forEach(e=>{
    rows.push([e.expense_date, e.member_name||'', catById(e.category).label, e.description||'', e.amount]);
  });
  const csv = rows.map(r=> r.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='family-kharcha-'+todayStr()+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function usernameToEmail(u){
  return u.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '@familykharcha.local';
}
function showAuthScreen(mode){
  state.authMode = mode;
  document.getElementById('authOverlay').classList.remove('hidden');
  document.getElementById('pinOverlay').classList.add('hidden');
  document.getElementById('authTitle').textContent = mode==='signup' ? 'Create a New Family' : 'Log In to Your Family';
  document.getElementById('authConfirmField').style.display = mode==='signup' ? 'block' : 'none';
  document.getElementById('authSubmitBtn').textContent = mode==='signup' ? 'Create Family' : 'Log In';
  document.getElementById('authSwitchText').textContent = mode==='signup' ? 'Already have a family?' : 'New family?';
  document.getElementById('authSwitchBtn').textContent = mode==='signup' ? 'Log In' : 'Create one';
  document.getElementById('authError').textContent='';
  document.getElementById('authPassword').value='';
  document.getElementById('authConfirm').value='';
}
function hideAuthScreen(){ document.getElementById('authOverlay').classList.add('hidden'); }
function initAuthForm(){
  document.getElementById('authSwitchBtn').onclick = ()=> showAuthScreen(state.authMode==='signup' ? 'login' : 'signup');
  document.getElementById('authSubmitBtn').onclick = async ()=>{
    const uname = document.getElementById('authUsername').value.trim();
    const pass = document.getElementById('authPassword').value;
    const confirm = document.getElementById('authConfirm').value;
    const errEl = document.getElementById('authError');
    errEl.textContent='';
    if(!uname || !pass){ errEl.textContent='Enter a family name and password'; return; }
    if(pass.length<6){ errEl.textContent='Password should be at least 6 characters'; return; }
    const email = usernameToEmail(uname);
    if(state.authMode==='signup'){
      if(pass!==confirm){ errEl.textContent="Passwords don't match"; return; }
      const { data, error } = await sb.auth.signUp({ email, password: pass });
      if(error){ errEl.textContent = error.message; return; }
      if(data.user && data.user.identities && data.user.identities.length===0){
        errEl.textContent = 'That family name is already taken — try logging in instead.'; return;
      }
      if(!data.session){
        errEl.textContent = "Couldn't sign in automatically — ask whoever set up this app to turn off \u201CConfirm email\u201D in the Supabase dashboard, then try again.";
        return;
      }
      currentUserId = data.session.user.id;
      hideAuthScreen();
      showPinScreen('set');
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
      if(error){ errEl.textContent = 'Wrong family name or password'; return; }
      currentUserId = data.session.user.id;
      hideAuthScreen();
      const pin = localStorage.getItem('kharcha_pin_'+currentUserId);
      showPinScreen(pin ? 'enter' : 'set');
    }
  };
}

function showPinScreen(mode){
  state.pinMode = mode;
  document.getElementById('pinOverlay').classList.remove('hidden');
  document.getElementById('lockTitle').textContent = mode==='set' ? 'Set a PIN for quick access on this device' : 'Enter your PIN';
  document.getElementById('pinSubmitBtn').textContent = mode==='set' ? 'Set PIN' : 'Unlock';
  document.getElementById('lockSkip').style.display = mode==='set' ? 'block' : 'none';
  document.getElementById('lockError').textContent='';
  document.getElementById('pinInput').value='';
  document.getElementById('pinInput').focus();
}
function hidePinScreen(){ document.getElementById('pinOverlay').classList.add('hidden'); }
function initPinForm(){
  document.getElementById('pinSubmitBtn').onclick = ()=>{
    const val = document.getElementById('pinInput').value.trim();
    if(state.pinMode==='set'){
      if(val.length<4){ document.getElementById('lockError').textContent='PIN should be at least 4 digits'; return; }
      localStorage.setItem('kharcha_pin_'+currentUserId, val);
      hidePinScreen(); startApp();
    } else {
      if(val === localStorage.getItem('kharcha_pin_'+currentUserId)){ hidePinScreen(); startApp(); }
      else { document.getElementById('lockError').textContent='Wrong PIN, try again'; }
    }
  };
  document.getElementById('lockSkip').onclick = ()=>{ hidePinScreen(); startApp(); };
  document.getElementById('forgotPinBtn').onclick = async ()=>{
    await sb.auth.signOut();
    hidePinScreen();
    showAuthScreen('login');
  };
}

async function boot(){
  const sessionResult = await sb.auth.getSession();
  const session = sessionResult.data.session;
  if(!session){ showAuthScreen('login'); return; }
  currentUserId = session.user.id;
  const pin = localStorage.getItem('kharcha_pin_'+currentUserId);
  showPinScreen(pin ? 'enter' : 'set');
}

function render(){
  renderMembers();
  if(state.currentScreen==='home') renderHome();
  if(state.currentScreen==='add'){ renderAddCategoryChips(); renderAddMemberChips(); }
  if(state.currentScreen==='shop') renderShopping();
  if(state.currentScreen==='history') renderHistory();
}
document.querySelectorAll('.nav-btn').forEach(b=> b.onclick=()=> switchScreen(b.dataset.screen));

async function startApp(){
  try{
    await loadAll();
    initAddForm();
    initShoppingForm();
    initHistoryToggle();
    initSettingsForm();
    initFilterBars();
    initDisplayControls();
    initRealtime();
    await processRecurring();
    render();
    flushOfflineQueue();
  }catch(e){
    console.error(e);
    document.getElementById('screen-home').innerHTML = '<div class="loading-note">Could not connect to Supabase.<br>Check the values in config.js.</div>';
  }
}

initAuthForm();
initPinForm();
boot();

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
