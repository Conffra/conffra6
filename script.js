// Shared script for login and registration pages.
// Firebase initialization + Auth
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {"apiKey": "AIzaSyCMU9WzwFB7bFoXsA9jVgTHx8macUb3LnM", "authDomain": "conffra-dec7d.firebaseapp.com", "projectId": "conffra-dec7d", "storageBucket": "conffra-dec7d.firebasestorage.app", "messagingSenderId": "382421171283", "appId": "1:382421171283:web:4dc6881733ce25ae2d1aa6"};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Helpers
const $ = sel => document.querySelector(sel);

function showMessage(el, text, type='error'){ if(!el) return; el.textContent = text; el.classList.remove('error','success'); el.style.display='block'; el.classList.add(type); setTimeout(()=> el.style.display='none', 5000); }

// Registration
const registerForm = $('#registerForm');
if(registerForm){
  registerForm.addEventListener('submit', async (e) =>{
    e.preventDefault();
    const type = registerForm.querySelector('input[name="rType"]:checked')?.value || 'cliente';
    const first = $('#rFirstName').value.trim();
    const last = $('#rLastName').value.trim();
    const city = $('#rCity').value.trim();
    const email = $('#rEmail').value.trim().toLowerCase();
    const phone = $('#rPhone').value.trim();
    const pass = $('#rPass').value;
    const passConf = $('#rPassConfirm').value;
    const agree = $('#rAgree').checked;
    const msg = $('#registerMsg');

    // basic validations
    if(!first || !last || !city || !email || !phone || !pass || !passConf){
      showMessage(msg, 'Preencha todos os campos obrigatórios.', 'error'); return;
    }
    if(pass.length < 6){
      showMessage(msg, 'Senha deve ter no mínimo 6 caracteres.', 'error'); return;
    }
    if(pass !== passConf){
      showMessage(msg, 'As senhas não coincidem.', 'error'); return;
    }
    if(!agree){
      showMessage(msg, 'É obrigatório aceitar os Termos de Uso e a Política de Privacidade.', 'error'); return;
    }

    try{
      // create user with Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      // Optional: send email verification
      try{ await sendEmailVerification(userCred.user); }catch(e){ console.warn('Email verification not sent:', e); }

      showMessage(msg, 'Cadastro realizado com sucesso. Você será redirecionado(a).', 'success');
      registerForm.reset();
      setTimeout(()=> window.location.href = 'index.html', 1500);
    }catch(err){ 
      console.error(err);
      let text = 'Erro ao cadastrar.';
      if(err.code === 'auth/email-already-in-use') text = 'Este e‑mail já está em uso.';
      if(err.code === 'auth/invalid-email') text = 'E‑mail inválido.';
      showMessage(msg, text, 'error');
    }
  });
}

// Login
const loginForm = $('#loginForm');
if(loginForm){
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const pass = $('#loginPass').value;
    const msg = $('#loginMsg');
    if(!email || !pass){ showMessage(msg, 'Preencha e‑mail e senha.', 'error'); return; }
    try{
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      showMessage(msg, 'Login realizado com sucesso. Redirecionando...', 'success');
      loginForm.reset();
      setTimeout(()=> window.location.href = 'index.html', 1200);
    }catch(err){ 
      console.error(err);
      let text = 'Erro ao fazer login.';
      if(err.code === 'auth/wrong-password') text = 'Senha incorreta.';
      if(err.code === 'auth/user-not-found') text = 'Usuário não encontrado.';
      if(err.code === 'auth/invalid-email') text = 'E‑mail inválido.';
      showMessage(msg, text, 'error');
    }
  });
}
