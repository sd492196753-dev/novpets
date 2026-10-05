(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NOVPetsEnquiries=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const productNames={seat:'Dog Car Seat Covers',boot:'Dog Boot Liners',sets:'Custom Dog Travel Sets'};
 function prepare(values){
  const clean=value=>String(value||'').trim();
  const products=(values.products||[]).map(key=>productNames[key]).filter(Boolean);
  const email=clean(values.email);
  const payload={
   name:clean(values.name)||'Not provided',email,
   'Phone / WhatsApp':clean(values.phone)||'Not provided',
   Products:products.join(', ')||'To discuss',
   'Set configuration':clean(values.context)||'Not selected',
   message:clean(values.message)||'Please share product and quotation options.',
   'Page':clean(values.page),'Request ID':clean(values.requestId),
   _replyto:email,_subject:'NOV PETS — New quote enquiry',_template:'table',_honey:clean(values.honey)
  };
  return {payload};
 }
 async function send(endpoint,payload,options={}){
  // Only a provider-issued opaque form ID belongs in the public site.
  if(!/^https:\/\/formsubmit\.co\/ajax\/[a-zA-Z0-9_-]{16,128}$/.test(endpoint||''))return {kind:'unavailable'};
  if(payload._honey)return {kind:'error'};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),options.timeoutMs||25000);
  try{
   const response=await (options.fetchImpl||fetch)(endpoint,{
    method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify(payload),signal:controller.signal,credentials:'omit',referrerPolicy:'strict-origin-when-cross-origin'
   });
   if(!response.ok)return {kind:'error'};
   const result=await response.json();
   if(result.success===true||result.success==='true')return {kind:'sent'};
   if(/activat/i.test(String(result.message||'')))return {kind:'activation'};
   return {kind:'error'};
  }catch(error){return {kind:error.name==='AbortError'?'timeout':'error'};}
  finally{clearTimeout(timer);}
 }
 return {prepare,send};
});
