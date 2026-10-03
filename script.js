'use strict';
const productNames={seat:'Dog Car Seat Covers',boot:'Dog Boot Liners',sets:'Custom Dog Travel Sets'};
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#main-navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
window.matchMedia('(min-width:801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const quoteDialog=document.querySelector('#quote-dialog');
const modalForm=quoteDialog.querySelector('form');
function invalidate(form){form.querySelector('.form-result').hidden=true;form.classList.remove('has-result');form.querySelector('.copy-status').textContent='';}
function openQuote(product='',context=''){
 closeMenu();
 if(product){modalForm.querySelectorAll('[name=product]').forEach(input=>input.checked=input.value===product);}
 const block=modalForm.querySelector('.quote-context');
 block.querySelector('span').textContent=context;block.hidden=!context;
 invalidate(modalForm);
 quoteDialog.showModal();document.body.classList.add('modal-open');
 // Focus the heading to avoid opening a mobile keyboard before the form is visible.
 const title=quoteDialog.querySelector('h2');title.tabIndex=-1;title.focus({preventScroll:true});
}
document.querySelectorAll('[data-quote]').forEach(button=>button.addEventListener('click',()=>openQuote(button.dataset.quote)));
document.querySelectorAll('.set-builder').forEach(builder=>{
 const components=()=>[...builder.querySelectorAll('[name=component]:checked')].map(input=>input.value);
 const branding=()=>[...builder.querySelectorAll('[name=custom]:checked')].map(input=>input.value);
 builder.addEventListener('change',()=>{const count=components().length;builder.querySelector('.builder-count').textContent=`${count} ${count===1?'item':'items'} selected`;builder.querySelector('.builder-hint').textContent='Your selections will be included in your enquiry.';});
 builder.querySelector('[data-build-quote]').addEventListener('click',()=>{
  if(!components().length){builder.querySelector('.builder-hint').textContent='Choose at least one product to start your set.';builder.querySelector('[name=component]').focus();return;}
  const context=`Your set: ${components().join(', ')}\nCustomisation: ${branding().join(', ')||'To discuss'}`;
  openQuote('sets',context);
 });
});
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});
});
document.querySelector('[data-privacy]').addEventListener('click',()=>{document.querySelector('#privacy-dialog').showModal();document.body.classList.add('modal-open');});
document.querySelectorAll('.quote-form').forEach(form=>{
 form.addEventListener('input',e=>{
  invalidate(form);
  if(e.target.name==='product' && !form.querySelector('[name=product][value=sets]').checked){
   const context=form.querySelector('.quote-context');context.hidden=true;context.querySelector('span').textContent='';
  }
 });
 form.querySelector('.clear-context').addEventListener('click',()=>{const context=form.querySelector('.quote-context');context.hidden=true;context.querySelector('span').textContent='';invalidate(form);});
 form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const context=form.querySelector('.quote-context');
  const selected=data.getAll('product').map(key=>productNames[key]).filter(Boolean);
  const text=['NOV PETS — Quote Request','Design preview — not sent','',`Name: ${String(data.get('name')).trim()||'Not provided'}`,`Email: ${String(data.get('email')).trim()}`,`Phone / WhatsApp: ${String(data.get('phone')||'').trim()||'Not provided'}`,`Products: ${selected.join(', ')||'To discuss'}`,!context.hidden?context.querySelector('span').textContent:'',`Message: ${String(data.get('message')).trim()||'Please share product and quotation options.'}`].filter((line,i)=>line||i===2).join('\n');
  const result=form.querySelector('.form-result');result.querySelector('pre').textContent=text;result.hidden=false;form.classList.add('has-result');result.focus({preventScroll:true});result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'});
 });
 form.querySelector('.copy-request').addEventListener('click',async()=>{
  const text=form.querySelector('.form-result pre').textContent;const status=form.querySelector('.copy-status');
  try{if(!navigator.clipboard)throw new Error('Clipboard not available');await navigator.clipboard.writeText(text);status.textContent='Copied to clipboard.';}
  catch{const pre=form.querySelector('.form-result pre');const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Text selected. Use Copy on your device to keep it.';}
 });
});
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
