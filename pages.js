// Shared JS for static web pages (terms, about, contact, index)
function toggleTheme(){
  const d=document.documentElement;
  const t=d.getAttribute('data-theme')==='dark'?'light':'dark';
  d.setAttribute('data-theme',t);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=t==='dark'?'☀':'◐';
  localStorage.setItem('shelf_theme',t);
}
function handleSubmit(e){
  if(e)e.preventDefault();
  const name=document.getElementById('c-name')?.value.trim();
  const email=document.getElementById('c-email')?.value.trim();
  const msg=document.getElementById('c-msg')?.value.trim();
  if(!name||!email||!msg){alert('Please fill in all fields');return}
  const el=document.getElementById('contact-form');
  if(el)el.innerHTML='<p style="color:var(--accent);font-family:\'DM Mono\',monospace;font-size:13px">✓ Thanks! We\'ll get back to you soon.</p>';
}
document.addEventListener('DOMContentLoaded',function(){
  // Apply saved theme
  const s=localStorage.getItem('shelf_theme');
  if(s){document.documentElement.setAttribute('data-theme',s);const b=document.getElementById('theme-btn');if(b)b.textContent=s==='dark'?'☀':'◐'}
  // Wire theme button
  const btn=document.getElementById('theme-btn');
  if(btn)btn.addEventListener('click',toggleTheme);
  // Wire contact form
  const form=document.getElementById('contact-form');
  if(form)form.addEventListener('submit',handleSubmit);
});
