/* Relay Desk: pure, deterministic reconciliation rules. Money uses integer cents. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Relay=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function validate(data){
 if(!data||!Array.isArray(data.invoices)||!Array.isArray(data.events))throw Error('Expected invoices and events arrays.');
 if(data.invoices.length>500||data.events.length>5000)throw Error('Limit: 500 invoices and 5,000 events.');
 const ids=new Set();
 for(const i of data.invoices){if(!i.id||ids.has(i.id)||!Number.isSafeInteger(i.amount)||i.amount<=0||!Number.isSafeInteger(i.booked)||i.booked<0||!/^[A-Z]{3}$/.test(i.currency)||typeof i.customer!=='string')throw Error('Each invoice needs a unique id, customer, positive amount in cents, nonnegative booked cents and a three-letter currency.');ids.add(i.id);}
 for(const e of data.events){if(!e.id||!e.invoice||!['paid','failed'].includes(e.type)||!Number.isSafeInteger(e.amount)||e.amount<=0||!Number.isFinite(Date.parse(e.at))||!/^[A-Z]{3}$/.test(e.currency))throw Error('Each event needs id, invoice, paid/failed type, positive cents, currency and an ISO date.');}
 return data;
}
function evaluate(data,now=new Date('2026-10-30T18:00:00Z'),lagHours=24){
 validate(data);if(!Number.isFinite(lagHours)||lagHours<0)throw Error('Invalid lag threshold');
 const eventIds=new Map(), conflicts=new Set(), unique=[],duplicates=[];
 for(const e of data.events){if(eventIds.has(e.id)){const prior=eventIds.get(e.id); if(['invoice','type','amount','currency','at'].some(k=>prior[k]!==e[k])){conflicts.add(prior.invoice);conflicts.add(e.invoice);}duplicates.push(e);}else{eventIds.set(e.id,e);unique.push(e);}}
 const rows=data.invoices.map(i=>{
 const events=unique.filter(e=>e.invoice===i.id).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 const paid=events.filter(e=>e.type==='paid');const total=paid.reduce((n,e)=>n+e.amount,0);
 const mismatched=events.some(e=>e.currency!==i.currency);const future=events.some(e=>Date.parse(e.at)>+now);
 const dup=duplicates.filter(e=>e.invoice===i.id).length;
 let state='Awaiting payment',severity='low',reason='No successful payment event has arrived.',action='Monitor';
 if(conflicts.has(i.id)){state='Conflicting event ID';severity='high';reason='The same event ID has different payloads. Provider evidence must be verified.';action='Escalate';}
 else if(future){state='Invalid event time';severity='high';reason='An event is dated after the evaluation clock.';action='Escalate';}
 else if(mismatched){state='Currency mismatch';severity='high';reason='Event currency differs from the invoice. Amounts cannot be reconciled across currencies.';action='Escalate';}
 else if(total>i.amount){state='Possible overpayment';severity='high';reason='Distinct successful event IDs exceed the invoice amount. Review transaction identity before any adjustment.';action='Escalate';}
 else if(i.booked>total){state='Ledger ahead';severity='high';reason='The accounting total exceeds observed successful events. Check for a missing event or an external payment.';action='Escalate';}
 else if(total===i.amount&&i.booked===total){state='Reconciled';reason='Successful events, invoice total and accounting total agree.';action='No action';}
 else if(total>i.booked){const age=(+now-Math.max(...paid.map(e=>Date.parse(e.at))))/3600000;if(age>=lagHours){state='Sync overdue';severity='medium';reason=`Payment evidence exceeds accounting by ${total-i.booked} cents after the ${lagHours}h grace period.`;action='Request sync';}else{state='Within sync window';reason='Payment is confirmed; allow the configured accounting sync window.';action='Monitor';}}
 else if(total>0){state='Partially paid';reason='Accounting matches the partial payment; an invoice balance remains.';action='Monitor';}
 else if(events.some(e=>e.type==='failed')){state='Payment failed';severity='medium';reason='Only failed payment attempts are present. A customer follow-up may be needed.';action='Contact customer';}
 return {...i,events,paid:total,duplicates:dup,state,severity,reason,action};
 });
 return {rows,duplicates:duplicates.length,orphanEvents:unique.filter(e=>!data.invoices.some(i=>i.id===e.invoice)),evaluatedAt:now.toISOString(),lagHours};
}
function approve(row,role,note){if(role!=='Operator')throw Error('Viewer access cannot approve actions.');if(!['Request sync','Escalate','Contact customer'].includes(row.action))throw Error('This item has no action to approve.');if(typeof note!=='string'||note.trim().length<12)throw Error('Add a reason of at least 12 characters.');return {invoice:row.id,action:row.action,note:note.trim(),state:row.state,status:'Simulated approval; no external action sent'};}
return {validate,evaluate,approve};});
