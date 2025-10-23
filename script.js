/* ========= Tiny client-side "backend" (localStorage) =========
 - users are stored in localStorage as array under 'cf_users'
 - current logged user stored under 'cf_current'
 - spaces are stored under 'cf_spaces'
 This is a mock / MVP approach so you can test flows without server.
=============================================================*/

const LS_USERS = 'cf_users';
const LS_CURRENT = 'cf_current';
const LS_SPACES = 'cf_spaces';

/* --- helpers --- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function loadUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); }
function saveUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u)); }
function setCurrent(u){ localStorage.setItem(LS_CURRENT, JSON.stringify(u)); }
function getCurrent(){ return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null'); }
function clearCurrent(){ localStorage.removeItem(LS_CURRENT); }
function loadSpaces(){ return JSON.parse(localStorage.getItem(LS_SPACES) || '[]'); }
function saveSpaces(s){ localStorage.setItem(LS_SPACES, JSON.stringify(s)); }

/* initial mock data (only if none exist) */
if(!localStorage.getItem(LS_USERS)){
  // add an example anunciante user: email: anunciante@demo.com pass: 123456
  const initial = [
    { id:1, type:'anunciante', first:'Dona', last:'Marta', city:'Salvador', email:'anunciante@demo.com', phone:'(71) 99999-9999', pass:'123456' },
    { id:2, type:'cliente', first:'João', last:'Silva', city:'São Paulo', email:'cliente@demo.com', phone:'(11) 98888-8888', pass:'123456' }
  ];
  saveUsers(initial);
}
if(!localStorage.getItem(LS_SPACES)){
  const initialSpaces = [
    { id:1, ownerEmail:'anunciante@demo.com', name:'Quintal da Dona Marta', type:'quintal', address:'Rua A, Salvador - BA', phone:'(71) 99999-9999', email:'contato@quintal.com', site:'', desc:'Quintal aconchegante para festas pequenas.', imgs:[] , created:Date.now() }
  ];
  saveSpaces(initialSpaces);
}

/* --- UI elements --- */
const btnLoginTop = $('#btnLoginTop');
const btnLoginMobile = $('#btnLoginMobile');
const btnLogoutTop = $('#btnLogoutTop');
const btnLogoutMobile = $('#btnLogoutMobile');
const linkPerfil = $('#linkPerfil');
const linkPainel = $('#linkPainel');
const linkPerfilMobile = $('#linkPerfilMobile');
const linkPainelMobile = $('#linkPainelMobile');

const menuToggle = $('#mobileToggle');
const mobileMenu = $('#mobileMenu') || $('#mobile-menu'); // older variants

/* Mobile toggles */
if(menuToggle){
  menuToggle.addEventListener('click', ()=> {
    const el = document.getElementById('mobileMenu');
    if(el) el.classList.toggle('hidden');
  });
}

/* Show/hide menu entries based on login */
function refreshHeader(){
  const cur = getCurrent();
  const logged = !!cur;
  // top
  if(logged){
    btnLoginTop.style.display = 'none';
    btnLogoutTop.style.display = 'inline';
    linkPerfil.style.display = 'inline';
    linkPainel.style.display = 'inline';
  } else {
    btnLoginTop.style.display = 'inline';
    btnLogoutTop.style.display = 'none';
    linkPerfil.style.display = 'none';
    linkPainel.style.display = 'none';
  }
  // mobile
  const btnLoginMob = $('#btnLoginMobile');
  if(btnLoginMob) btnLoginMob.style.display = logged ? 'none' : 'block';
  if(btnLogoutMobile) btnLogoutMobile.style.display = logged ? 'block' : 'none';
  if(linkPerfilMobile) linkPerfilMobile.style.display = logged ? 'block' : 'none';
  if(linkPainelMobile) linkPainelMobile.style.display = logged ? 'block' : 'none';

  // populate profile/panel areas
  populateProfile();
  populatePanel();
  populateResults();
}

/* ========== Registration ========== */
const formRegister = $('#formRegister');
if(formRegister){
  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    $('#registerError').classList.add('hidden');
    $('#registerSuccess').classList.add('hidden');

    const type = formRegister.querySelector('input[name="rType"]:checked')?.value || 'cliente';
    const first = $('#rFirstName').value.trim();
    const last = $('#rLastName').value.trim();
    const city = $('#rCity').value.trim();
    const email = $('#rEmail').value.trim().toLowerCase();
    const phone = $('#rPhone').value.trim();
    const pass = $('#rPass').value;
    const passConf = $('#rPassConfirm').value;
    const agree = $('#rAgree').checked;

    // validations
    if(!first || !last || !city || !email || !phone || !pass || !passConf){
      $('#registerError').textContent = 'Preencha todos os campos obrigatórios.';
      $('#registerError').classList.remove('hidden');
      return;
    }
    // email uniqueness
    const users = loadUsers();
    if(users.some(u => u.email === email)){
      $('#registerError').textContent = 'Este email já está cadastrado.';
      $('#registerError').classList.remove('hidden');
      return;
    }
    // phone basic validation (DDD)
    const phoneDigits = phone.replace(/\D/g,'');
    if(phoneDigits.length < 10){
      $('#registerError').textContent = 'Telefone inválido. Inclua DDD e número.';
      $('#registerError').classList.remove('hidden');
      return;
    }
    // password rules
    if(pass.length < 6){
      $('#registerError').textContent = 'Senha deve ter no mínimo 6 caracteres.';
      $('#registerError').classList.remove('hidden');
      return;
    }
    if(pass !== passConf){
      $('#registerError').textContent = 'As senhas não coincidem.';
      $('#registerError').classList.remove('hidden');
      return;
    }
    if(!agree){
      $('#registerError').textContent = 'É obrigatório aceitar os Termos de Uso e a Política de Privacidade.';
      $('#registerError').classList.remove('hidden');
      return;
    }

    // create user (simple)
    const id = Date.now();
    const newUser = { id, type, first, last, city, email, phone, pass };
    users.push(newUser);
    saveUsers(users);
    $('#registerSuccess').classList.remove('hidden');
    formRegister.reset();
    setTimeout(()=> { $('#registerSuccess').classList.add('hidden'); }, 3000);
  });
}

/* ========== Login ========== */
const formLogin = $('#formLogin');
if(formLogin){
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    $('#loginError').classList.add('hidden');
    const email = $('#loginEmail').value.trim().toLowerCase();
    const pass = $('#loginPass').value;
    const users = loadUsers();
    const user = users.find(u => u.email === email && u.pass === pass);
    if(!user){
      $('#loginError').textContent = 'Email ou senha inválidos.';
      $('#loginError').classList.remove('hidden');
      return;
    }
    // set current
    setCurrent(user);
    refreshHeader();
    // scroll to profile
    location.hash = '#perfil';
    // clear login form
    formLogin.reset();
  });
}

/* Login top button open login section (scroll) */
if(btnLoginTop) btnLoginTop.addEventListener('click', ()=> location.hash = '#login');
if(btnLoginMobile) btnLoginMobile.addEventListener('click', ()=> { location.hash = '#login'; const el=document.getElementById('mobileMenu'); if(el) el.classList.add('hidden'); });

/* Logout */
if(btnLogoutTop) btnLogoutTop.addEventListener('click', ()=> { clearCurrent(); refreshHeader(); alert('Você saiu.'); location.hash = '#home'; });
if(btnLogoutMobile) btnLogoutMobile.addEventListener('click', ()=> { clearCurrent(); refreshHeader(); const el=document.getElementById('mobileMenu'); if(el) el.classList.add('hidden'); alert('Você saiu.'); location.hash = '#home'; });

/* ========== Announce form (only for anunciante) ========== */
const announceForm = $('#announceForm');
if(announceForm){
  announceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $('#announceNote').classList.add('hidden');
    $('#announceSuccess').classList.add('hidden');

    const current = getCurrent();
    if(!current || current.type !== 'anunciante'){
      $('#announceNote').classList.remove('hidden');
      return;
    }

    // gather fields
    const name = $('#aName').value.trim();
    const type = $('#aType').value;
    const address = $('#aAddress').value.trim();
    const phone = $('#aPhone').value.trim();
    const email = $('#aEmail').value.trim();
    const site = $('#aSite').value.trim();
    const desc = $('#aDesc').value.trim();
    const imgs = $('#aImgs').value.split(',').map(s => s.trim()).filter(Boolean);

    if(!name || !type || !address || !phone || !email){
      alert('Preencha os campos obrigatórios do anúncio.');
      return;
    }

    // save to spaces
    const spaces = loadSpaces();
    const newSpace = {
      id: Date.now(),
      ownerEmail: current.email,
      name, type, address, phone, email, site, desc, imgs, created: Date.now()
    };
    spaces.push(newSpace);
    saveSpaces(spaces);
    $('#announceSuccess').classList.remove('hidden');
    announceForm.reset();
    populateResults();
    setTimeout(()=> $('#announceSuccess').classList.add('hidden'), 3000);
  });
}

/* ========== Populate UI: profile, panel, results ========== */
function populateProfile(){
  const cur = getCurrent();
  const profileInfo = $('#profileInfo');
  if(!profileInfo) return;
  if(!cur){
    profileInfo.innerHTML = 'Faça login para ver seus dados.';
    return;
  }
  profileInfo.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">👤</div>
      <div>
        <div class="font-semibold text-lg">${cur.first} ${cur.last}</div>
        <div class="text-sm text-gray-600">${cur.email} • ${cur.phone}</div>
        <div class="text-sm text-gray-600">Cidade: ${cur.city} • Tipo: ${cur.type}</div>
      </div>
    </div>
  `;
}

function populatePanel(){
  const cur = getCurrent();
  const panelInfo = $('#panelInfo');
  const hostSpacesList = $('#hostSpacesList');
  if(!panelInfo || !hostSpacesList) return;
  if(!cur || cur.type !== 'anunciante'){
    panelInfo.innerHTML = 'Painel disponível apenas para anunciantes após login.';
    hostSpacesList.innerHTML = '<div class="p-4 border border-gray-100 rounded-lg text-gray-600">Nenhum espaço (visível após login como anunciante)</div>';
    return;
  }
  // load spaces of this owner
  const spaces = loadSpaces().filter(s => s.ownerEmail === cur.email);
  panelInfo.innerHTML = `<p class="text-gray-700">Você tem ${spaces.length} anúncio(s).</p>`;
  if(spaces.length === 0){
    hostSpacesList.innerHTML = '<div class="p-4 border border-gray-100 rounded-lg text-gray-600">Nenhum anúncio ainda.</div>';
  } else {
    hostSpacesList.innerHTML = spaces.map(s => `
      <div class="p-4 border border-gray-100 rounded-lg">
        <div class="font-semibold">${s.name}</div>
        <div class="text-sm text-gray-600">${s.type} • ${s.address}</div>
        <div class="mt-2 flex gap-2">
          <button class="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm">Editar</button>
          <button class="px-3 py-1 bg-red-600 text-white rounded-md text-sm remove-space" data-id="${s.id}">Remover</button>
        </div>
      </div>
    `).join('');
    // add remove handlers
    $$('.remove-space').forEach(b => b.addEventListener('click', (ev)=> {
      const id = parseInt(ev.currentTarget.dataset.id,10);
      const all = loadSpaces().filter(sp=>sp.id !== id);
      saveSpaces(all);
      populatePanel();
      populateResults();
    }));
  }
}

function populateResults(){
  const container = $('#results');
  if(!container) return;
  const spaces = loadSpaces();
  if(spaces.length === 0){
    container.innerHTML = '<div class="text-center text-gray-600 p-6 bg-white rounded-2xl border border-gray-100">Nenhum espaço encontrado.</div>';
    return;
  }
  container.innerHTML = spaces.map(s => `
    <article class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <img src="${s.imgs[0]||'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop'}" class="w-full h-44 object-cover rounded-lg mb-3" alt="">
      <h4 class="font-semibold">${s.name}</h4>
      <p class="text-sm text-gray-600">${s.address} • ${s.type}</p>
      <div class="mt-2 flex items-center justify-between">
        <div class="text-sm text-gray-600">${s.email}</div>
        <div class="text-sm text-gray-600">${new Date(s.created).toLocaleDateString()}</div>
      </div>
    </article>
  `).join('');
}

/* Home search -> fill buscar */
$('#homeSearch')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#homeInput').value.trim();
  $('#qCity').value = q;
  // trigger search (simple filter)
  document.getElementById('searchForm')?.dispatchEvent(new Event('submit'));
  location.hash = '#buscar';
});

/* Search submit - filter results */
$('#searchForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = ($('#qCity').value||'').toLowerCase();
  const cap = parseInt($('#qCapacity').value) || 0;
  const all = loadSpaces();
  const filtered = all.filter(s => (city ? s.address.toLowerCase().includes(city) || s.name.toLowerCase().includes(city) : true) && (cap ? (s.cap||0) >= cap : true));
  const container = $('#results');
  container.innerHTML = filtered.length ? filtered.map(s => `
    <article class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <img src="${s.imgs[0]||'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop'}" class="w-full h-44 object-cover rounded-lg mb-3" alt="">
      <h4 class="font-semibold">${s.name}</h4>
      <p class="text-sm text-gray-600">${s.address} • ${s.type}</p>
      <div class="mt-2 flex items-center justify-between">
        <div class="text-sm text-gray-600">${s.email}</div>
        <div class="text-sm text-gray-600">${new Date(s.created).toLocaleDateString()}</div>
      </div>
    </article>
  `).join('') : '<div class="text-center text-gray-600 p-6 bg-white rounded-2xl border border-gray-100">Nenhum espaço encontrado.</div>';
});

/* Divulgar CTA: if not anunciante -> prompt login, else scroll to form */
$('#ctaDivulgar')?.addEventListener('click', () => {
  const cur = getCurrent();
  if(!cur){
    alert('Você precisa estar logado como anunciante para divulgar um espaço. Faça login ou cadastre-se.');
    location.hash = '#login';
    return;
  }
  if(cur.type !== 'anunciante'){
    alert('Apenas contas do tipo ANUNCIANTE podem divulgar espaços. Crie uma conta anunciante ou solicite alteração.');
    return;
  }
  location.hash = '#divulgar';
});

/* Divulgar top link click */
$('#linkDivulgar')?.addEventListener('click', (e)=> {
  const cur = getCurrent();
  if(!cur){
    e.preventDefault();
    alert('Faça login para divulgar um espaço.');
    location.hash = '#login';
  } else if(cur.type !== 'anunciante'){
    e.preventDefault();
    alert('Apenas anunciante pode divulgar espaços.');
    location.hash = '#perfil';
  }
});

/* Link mobile divulgation */
$('#linkDivulgarMobile')?.addEventListener('click', (e)=> {
  const cur = getCurrent();
  if(!cur){
    e.preventDefault();
    alert('Faça login para divulgar um espaço.');
    location.hash = '#login';
  } else if(cur.type !== 'anunciante'){
    e.preventDefault();
    alert('Apenas anunciante pode divulgar espaços.');
    location.hash = '#perfil';
  }
  const el = document.getElementById('mobileMenu');
  if(el) el.classList.add('hidden');
});

/* Simulated login/logout header controls */
btnLoginTop?.addEventListener('click', ()=> location.hash = '#login');
btnLoginMobile?.addEventListener('click', ()=> { location.hash = '#login'; const el=document.getElementById('mobileMenu'); if(el) el.classList.add('hidden'); });

/* On load */
window.addEventListener('load', ()=> {
  refreshHeader();
  populateResults();
});

