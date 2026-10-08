'use strict';
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
function invalidate(form){
 if(form.dataset.state==='sending')return;
 form.querySelector('.form-result').hidden=true;form.classList.remove('has-result');
 form.dataset.state='idle';form.querySelector('.submit-quote').disabled=false;form.querySelector('.submit-quote').textContent='Get My Quote';
 form.querySelector('.form-status').textContent='';
}
function openQuote(product='',context=''){
 closeMenu();
 if(modalForm.dataset.state==='sending'){
  if(!quoteDialog.open)quoteDialog.showModal();document.body.classList.add('modal-open');return;
 }
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
document.querySelectorAll('[data-privacy]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#privacy-dialog').showModal();document.body.classList.add('modal-open');}));
function showError(form,kind){
 const result=form.querySelector('.form-result');
 result.dataset.state='error';
 result.querySelector('b').textContent='Your enquiry could not be sent.';
 result.querySelector('p').textContent=kind==='timeout'?"We couldn’t confirm that your request was received. Please wait a moment before trying again.":"Your details are still here. Please check your connection and try again in a moment.";
 result.hidden=false;form.classList.add('has-result');
 form.querySelector('.form-status').textContent='';
 result.focus({preventScroll:true});result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'});
}
document.querySelectorAll('.quote-form').forEach(form=>{
 form.dataset.state='idle';
 const endpoint=window.NOVPetsEnquiryConfig.endpoint;
 form.action=endpoint.replace('/ajax/','/');
 form.addEventListener('input',e=>{
  if(e.target.name==='name')e.target.setCustomValidity('');
  invalidate(form);
  if(e.target.name==='product' && !form.querySelector('[name=product][value=sets]').checked){
   const context=form.querySelector('.quote-context');context.hidden=true;context.querySelector('span').textContent='';
  }
 });
 form.querySelector('.clear-context').addEventListener('click',()=>{const context=form.querySelector('.quote-context');context.hidden=true;context.querySelector('span').textContent='';invalidate(form);});
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(form.dataset.state==='sending'||form.dataset.state==='sent')return;
  const nameInput=form.querySelector('[name=name]');
  nameInput.setCustomValidity(nameInput.value.trim()?'':'Please enter your name.');
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const context=form.querySelector('.quote-context');
  // Keep the same reference for a retry so repeated deliveries can be recognised.
  if(form.dataset.state!=='error')form.dataset.requestId=window.crypto?.randomUUID?.()||`NOV-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const {payload}=NOVPetsEnquiries.prepare({name:data.get('name'),email:data.get('email'),phone:data.get('phone'),products:data.getAll('product'),message:data.get('message'),context:!context.hidden?context.querySelector('span').textContent:'',page:location.href.split('#')[0],requestId:form.dataset.requestId,honey:data.get('_honey')});
  form.dataset.state='sending';form.setAttribute('aria-busy','true');
  form.querySelector('.form-result').hidden=true;form.querySelector('.form-status').textContent='Sending your enquiry…';
  const controls=[...form.querySelectorAll('input,textarea,button')].filter(el=>!el.disabled);
  controls.forEach(el=>el.disabled=true);form.querySelector('.submit-quote').textContent='Sending…';
  const outcome=await NOVPetsEnquiries.send(endpoint,payload);
  controls.forEach(el=>el.disabled=false);form.setAttribute('aria-busy','false');
  form.dataset.state=outcome.kind==='sent'?'sent':'error';
  if(outcome.kind==='sent'){
   // Count only confirmed deliveries; never send buyer fields to Analytics.
   try{await window.NOVPetsAnalytics?.enquirySent(form.id);}catch(_){}
   form.reset();context.hidden=true;context.querySelector('span').textContent='';
   form.querySelector('.submit-quote').disabled=true;
   // The destination carries no buyer data in the URL or page content.
   window.location.assign(new URL('thank-you.html',window.location.href).href);
   return;
  }
  form.querySelector('.submit-quote').textContent='Try Again';
  showError(form,outcome.kind);
 });
});
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
