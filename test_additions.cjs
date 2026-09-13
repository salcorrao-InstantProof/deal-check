'use strict';
// Core/record-shape checks only. No browser, DOM, or storage shim is used.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'deal_check.html'),'utf8');
const core=html.match(/<script id="deal-core">([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({});vm.runInContext(core,context);const C=context.DealCheck;
const clone=x=>JSON.parse(JSON.stringify(x));
const base=()=>clone(C.tests()[0].input.first);
const run=(a={},b={})=>C.analyze({first:{...base(),...a},new:{...base(),...b},options:{feePaid:'0'}});
const close=(actual,expected,tol=1e-8)=>assert(Math.abs(actual-expected)<=tol,`${actual} differs from ${expected}`);
let count=0,failures=0;
const output=['Node additions checks. Browser/UI execution and save/load persistence: NOT RUN.'];
function check(name,fn){count++;try{fn();output.push('PASS '+name);}catch(error){failures++;output.push('FAIL '+name+'\n  '+error.message);}}
const standard=run();
check('Original eight scenarios and the ninth zero-APR case all pass',()=>{
 assert.equal(C.tests().length,9);for(const x of C.runTests())assert(x.pass,x.name+': '+x.failures.join(', '));
});
check('Legacy records default independently to loan / 30 days / zero separate fees',()=>{
 assert.equal(standard.a.values.dealType,'loan');assert.equal(standard.b.values.daysToFirstPayment,30);
 assert.equal(standard.a.values.daysToFirstPayment,30);assert.equal(standard.ra.preAmortizationInterest,0);
 assert.equal(standard.ra.interest,327704);assert.equal(standard.scorecard.net,0);
 assert.equal(standard.a.feeBreakdown.licenseFees,0);
});
// Reference totals independently derived with a 48-digit decimal discounted cash-flow sum.
// These replace the old flat actual/365 add-on assumptions: timing now affects the schedule.
const reference=[
 [30,47628,327704,0,0],[31,47635,328093,344,45],[45,47726,333538,5165,669],
 [46,47732,333927,5510,713],[51,47765,335872,7232,936],[52,47771,336261,7576,981],
 [60,47823,339373,10331,1338],[90,48018,351089,20704,2681],[120,48214,362854,31119,4031]
];
for(const [days,payment,interest,pre,carry] of reference)check(days+' days matches independent payment and interest reference',()=>{
 const r=C.calculateSheet({...base(),daysToFirstPayment:String(days)});
 assert.equal(C.cents(r.firstPayment),payment);assert.equal(r.interestPaid,interest);
 assert.equal(r.preAmortizationInterest,pre);assert.equal(r.deferralFinancingInterest,carry);
 assert.equal(r.scheduledInterest+pre+carry,interest);
});
const delayed=run({}, {daysToFirstPayment:'90',payment:'480.18'});
check('Deferred interest enters total payments, interest, savings and net exactly once',()=>{
 assert.equal(delayed.rb.interest,351089);assert.equal(delayed.rb.totalPaid,3081089);
 assert.equal(delayed.scorecard.interestSavings,-23385);assert.equal(delayed.scorecard.net,-23385);
 assert.equal(delayed.scorecard.cashSavings,0);
 assert.equal(delayed.scorecard.rows.find(x=>x.bucket==='Extra pre-amortization interest').next,20704);
 assert.equal(delayed.scorecard.rows.find(x=>x.bucket==='Total interest over the term').next,351089);
 assert.equal(delayed.b.values.financed,2530000);assert.equal(delayed.b.values.payment,48018);
 assert(!delayed.noLeverMoved);assert(!delayed.lines.some(x=>x.finding==='No lever moved'));
});
check('Normal and deferred published dollar example: $25,000 / 72 / 7.95%',()=>{
 close(C.timedPayment(2500000,7.95,72,30),437.72092398502014);
 close(C.timedPayment(2500000,7.95,72,90),443.539938072751);
 assert.equal(C.timingProjection(2500000,7.95,72,30).interest,651591);
 assert.equal(C.timingProjection(2500000,7.95,72,90).interest,693488);
 // Independently check present value against every contractual payment, not the adapter inverse.
 const rate=.0795/12,scheduled=443.539938072751;
 let pv=0;for(let month=3;month<=74;month++)pv+=scheduled/Math.pow(1+rate,month);
 close(pv,25000,1e-7);
});
check('Appendix J published odd-first-period example reproduces 11.82% APR',()=>{
 close(C.impliedAPR(600000,36,20000,49),11.81651,.00001);
});
check('90-day implied APR uses entered days; no false APR or benchmark accusation',()=>{
 const raw={...base(),price:'25000',serviceFee:'0',tax:'0',titleFees:'0',trade:'0',payoff:'0',down:'0',financed:'25000',term:'72',apr:'7.95',payment:'443.54',daysToFirstPayment:'90'};
 const r=C.analyze({first:raw,new:raw,options:{preapprovalAPR:'7.95',feePaid:'0'}});
 close(r.rb.impliedAPR,7.95,.0001);assert.equal(r.rb.paymentFlag,false);assert.equal(r.rb.paymentGap,0);
 assert(!r.lines.some(x=>['Payment implies a different APR','APR versus pre-approval'].includes(x.finding)));
 assert(C.impliedAPR(2500000,72,44354,30)>8.42);
});
check('An actual higher-rate deferred payment still triggers the existing $2 flag',()=>{
 const r=run({}, {daysToFirstPayment:'90',payment:C.timedPayment(2530000,8.9,60,90).toFixed(2)});
 assert(r.rb.paymentFlag);close(r.rb.impliedAPR,8.9,.001);
 assert(r.lines.some(x=>x.finding==='Payment implies a different APR'&&x.text.includes('8.90%')));
});
check('Payment and APR round trips agree for every day 30–120',()=>{
 for(let d=30;d<=120;d++)for(const rate of [0,4.9,7.95,24.99]){
  assert.equal(C.firstPaymentDays(String(d)).value,d);
  const p=C.timedPayment(2500000,rate,72,d);close(C.impliedAPR(2500000,72,C.cents(p),d),rate,.001);
 }
});
check('Zero APR keeps exactly the same payment and zero interest at every allowed delay',()=>{
 const expected=C.payment(2530000,0,60);
 for(let d=30;d<=120;d++){
  const r=C.calculateSheet({...base(),apr:'0',daysToFirstPayment:String(d)});
  assert.equal(r.firstPayment,expected);assert.equal(r.interestPaid,0);assert.equal(r.preAmortizationInterest,0);
 }
});
check('Invalid days never fall back to a 30-day implied rate or savings',()=>{
 for(const value of ['29','121','45.5','',' ','-30','1e2','90days',null]){
  const r=run({}, {daysToFirstPayment:value});assert(r.blocked,String(value));assert.equal(r.rb.interest,null);
  assert.equal(r.rb.impliedAPR,null);assert.equal(r.rb.paymentFlag,false);assert.equal(r.scorecard.net,null);
  assert.equal(r.timingRoom,null);assert(r.errors.some(x=>x.includes('30 to 120')));
 }
});
check('Review begins at 46 days; the 21-extra-day provision begins beyond 51, not 45',()=>{
 assert.equal(C.timingWarning(45,72),null);
 assert(C.timingWarning(46,72));assert(!C.timingWarning(46,72).includes('cannot be disregarded'));
 assert(!C.timingWarning(51,72).includes('cannot be disregarded'));
 assert(C.timingWarning(52,72).includes('cannot be disregarded'));
 assert(!C.timingWarning(60,6).includes('cannot be disregarded under Reg Z §1026.17(c)(4)(ii)'));
 assert(!C.timingWarning(60,120).includes('cannot be disregarded under Reg Z §1026.17(c)(4)(ii)'));
 assert(run({}, {daysToFirstPayment:'46'}).lines.some(x=>x.finding.includes('timing review')));
});
check('45-to-30 timing saving is isolated and surfaced in the buyer lines',()=>{
 const r=run({daysToFirstPayment:'45',payment:'477.26'},{});
 close(r.timingChange.monthlySavings,.9724133260,.000001);assert.equal(r.timingChange.interestSavings,5834);
 assert(r.lines.some(x=>x.finding.includes('isolated estimate')&&x.text.includes('45 to 30')));
 assert.equal(r.timingRoom,null);assert(C.attributionCheck(r.explanation).pass);
 assert(r.explanation.steps.some(x=>x.label==='Days to first payment'));
});
check('Available room is proposed, holds New terms fixed and is not double-counted',()=>{
 const r=run({}, {daysToFirstPayment:'45',payment:'477.26'});
 assert.equal(r.timingRoom.interestSavings,5834);assert.equal(r.scorecard.interestSavings,-5834);
 assert.equal(r.scorecard.net,-5834);
 assert(r.lines.some(x=>x.finding.includes('Available room')&&x.text.includes('Pulling first payment from 45 to 30')));
 const changed=run({daysToFirstPayment:'90'}, {daysToFirstPayment:'60',down:'4000',financed:'23300',apr:'7.95',term:'72'});
 const expected=C.timingEffect(2330000,7.95,72,90,60);
 assert.deepEqual(changed.timingChange,expected);assert(C.attributionCheck(changed.explanation).pass);
});
check('Missing APR is inferred with entered timing; no circular extra-interest addition',()=>{
 const r=run({}, {apr:'',payment:'480.18',daysToFirstPayment:'90'});
 assert(r.rb.aprInferred);close(r.rb.impliedAPR,4.9,.001);assert.equal(C.cents(r.rb.modeledPayment),48018);
 assert.equal(r.rb.interest,48018*60-2530000);
 assert.equal(r.rb.baseInterest+r.rb.preAmortizationInterest+r.rb.deferralFinancingInterest,r.rb.interest);
 const normal=run({}, {apr:''});assert(normal.rb.aprInferred);assert.equal(normal.rb.preAmortizationInterest,0);
});
check('Missing financing keeps deferred projections unknown',()=>{
 const r=run({}, {financed:'',daysToFirstPayment:'90'});assert.equal(r.rb.preAmortizationInterest,null);
 assert.equal(r.rb.impliedAPR,null);assert.equal(r.rb.interest,null);assert.equal(r.b.values.financed,null);
});
check('Leases bypass days validation and never run a loan APR, payment or timing projection',()=>{
 const r=run({dealType:'lease',daysToFirstPayment:'bad'},{dealType:'lease',daysToFirstPayment:'120'});
 for(const x of [r.ra,r.rb]){assert(x.isLease);assert.equal(x.impliedAPR,null);assert.equal(x.modeledPayment,null);assert.equal(x.preAmortizationInterest,null);assert.equal(x.interest,null);assert.equal(x.timingWarning,null);assert.equal(x.paymentFlag,false);}
 assert.equal(r.a.values.daysToFirstPayment,null);assert.equal(r.blocked,false);assert.equal(r.timingRoom,null);
 assert(r.explanation.reason.includes('leases'));assert.equal(r.scorecard.interestSavings,null);
 const c=C.calculateSheet({...base(),dealType:'lease',daysToFirstPayment:''});assert(c.isLease);assert.equal(c.firstPayment,null);assert.equal(c.messages.length,0);
});
check('A mixed loan/lease comparison never offers timing savings or APR attribution',()=>{
 const r=run({}, {dealType:'lease'});assert.equal(r.timingRoom,null);assert.equal(r.timingChange,null);
 assert.equal(r.benchmarkGap,null);assert.equal(r.termWarning,false);assert(r.explanation.reason);
});
check('Itemized financing includes add-ons, products, fees, credits and negative equity',()=>{
 const r=run({}, {price:'30000',addons:[{name:'Etch',price:'299'}],serviceFee:'500',tax:'1500',titleFees:'300',rebates:'250',trade:'10000',payoff:'15000',down:'2000',products:[{name:'GAP',price:'850'}],financed:'36199'});
 assert.equal(r.rb.otd,3234900);assert.equal(r.rb.netTrade,-500000);assert.equal(r.rb.expected,3619900);assert.equal(r.rb.discrepancy,0);
});
check('Printed amount remains beside calculated balance, with a non-mutating signed mismatch',()=>{
 const raw={first:base(),new:{...base(),financed:'25500'},options:{feePaid:'0'}},before=JSON.stringify(raw),r=C.analyze(raw);
 assert.equal(r.b.values.financed,2550000);assert.equal(r.rb.expected,2530000);assert.equal(r.rb.discrepancy,20000);
 assert(r.blocked);assert.equal(JSON.stringify(raw),before);
 assert(C.report(r).includes('printed amount financed $25,500.00; calculated amount financed $25,300.00; printed minus calculated +$200.00'));
});
check('Negative and one-cent mismatches remain visible; $5 reconciliation threshold unchanged',()=>{
 assert.equal(run({}, {financed:'25100'}).rb.discrepancy,-20000);
 const r=run({}, {financed:'25300.01'});assert.equal(r.rb.discrepancy,1);assert.equal(r.blocked,false);
 assert.equal(run({}, {financed:'25305'}).blocked,false);assert.equal(run({}, {financed:'25305.01'}).blocked,true);
});
check('Missing itemized payoff stays unknown; missing printed value does not erase calculation',()=>{
 const r=run({}, {payoff:''});assert.equal(r.rb.expected,null);assert.equal(r.rb.discrepancy,null);
 const c=C.calculateSheet({...base(),financed:'',payment:''});assert.equal(c.amountFinanced,2530000);
 assert.equal(c.printedAmountFinanced,null);assert.equal(C.cents(c.firstPayment),47628);assert.equal(c.messages.length,0);
});
check('Separate license and registration charges feed calculator and Scorecard once',()=>{
 const raw={...base(),licenseFees:'75',registrationFees:'125',financed:'25500'};
 const c=C.calculateSheet(raw),r=run({}, raw);
 assert.equal(c.amountFinanced,2550000);assert.equal(c.sheet.feeBreakdown.titleFees,30000);
 assert.equal(c.sheet.values.titleFees,50000);assert.equal(r.rb.discrepancy,0);assert.equal(r.scorecard.cashSavings,-20000);
});
check('Calculator uses calculated financing even when printed balance differs',()=>{
 const r=C.calculateSheet({...base(),financed:'25500',daysToFirstPayment:'90'});
 assert.equal(r.amountFinanced,2530000);assert.equal(r.printedAmountFinanced,2550000);assert.equal(r.difference,20000);
 assert.equal(C.cents(r.firstPayment),48018);assert.equal(r.preAmortizationInterest,20704);assert.equal(r.interestPaid,351089);
});
check('Positive trade equity subtracts; negative equity adds; negative financing cannot amortize',()=>{
 assert.equal(C.calculateSheet(base()).amountFinanced,2530000);
 assert.equal(C.calculateSheet({...base(),payoff:'15000'}).amountFinanced,3530000);
 const r=C.calculateSheet({...base(),down:'40000'});assert(r.amountFinanced<0);assert.equal(r.firstPayment,null);assert(r.messages.length>0);
});
check('Legacy and updated record shapes, copy and JSON round trip retain separate timing/type fields',()=>{
 assert(C.validSavedSheet(base()));assert(C.validSavedSheet({...base(),daysToFirstPayment:'90',dealType:'lease'}));
 assert(!C.validSavedSheet({...base(),daysToFirstPayment:90}));assert(!C.validSavedSheet({...base(),dealType:'invalid'}));
 const incomplete=base();delete incomplete.financed;assert(!C.validSavedSheet(incomplete));
 const record={first:{...base(),daysToFirstPayment:'45',dealType:'loan'},new:{...base(),daysToFirstPayment:'120',dealType:'lease'}};
 const raw=clone(record),r=C.analyze(raw);assert.equal(raw.new.daysToFirstPayment,'120');assert.equal(r.a.values.daysToFirstPayment,45);
 assert.equal(r.b.values.dealType,'lease');assert.equal(r.b.values.daysToFirstPayment,null);
 const copied=C.analyze({first:raw.first,new:clone(raw.first)});assert.equal(copied.b.values.daysToFirstPayment,45);
});
check('Unknown/invalid separate fees are not silently zeroed',()=>{
 assert(!C.validSavedSheet({...base(),licenseFees:75}));assert.equal(C.calculateSheet({...base(),licenseFees:''}).amountFinanced,null);
 assert(C.calculateSheet({...base(),registrationFees:'bad'}).messages.some(x=>x.includes('Registration fees')));
});
check('Report exposes timing, separate interest, proposed room and the monthly-period assumption',()=>{
 const report=C.report(delayed);
 for(const text of ['Days to first payment: 30 days -> 90 days','Extra pre-amortization interest: $0.00 -> $207.04','Interest from financing the deferral: $0.00 -> $26.81','Total interest over the term: $3,277.04 -> $3,510.89','Pulling first payment from 90 to 30','30-day monthly periods','Exact contract APR requires actual dates'])assert(report.includes(text),text);
 assert(!report.includes('not added to principal or the monthly payment'));
});
check('All four manually selected books produce the same $25,000 / $20,000 = 125% result',()=>{
 assert.deepEqual(Object.values(C.BOOKS),['NADA trade','NADA retail','KBB clean trade','KBB retail']);
 for(const book of Object.keys(C.BOOKS)){
  const r=C.calculateLTV({amountFinanced:' $25,000.00 ',bookValue:'$20,000',book});assert.equal(r.percentage,125);assert.equal(r.bookLabel,C.BOOKS[book]);assert.equal(r.errors.length,0);
 }
});
check('LTV supports 0%, 100%, fractional and above-100% values without a cap',()=>{
 for(const [financed,book,expected] of [['0','100',0],['100','100',100],['1','3',100/3],['40000','20000',200]])close(C.calculateLTV({amountFinanced:financed,bookValue:book,book:'nada_trade'}).percentage,expected);
});
check('LTV rejects missing, zero/negative book value, negative financing and unknown book',()=>{
 for(const overrides of [{amountFinanced:''},{amountFinanced:'-1'},{amountFinanced:'abc'},{bookValue:''},{bookValue:'0'},{bookValue:'-5'},{bookValue:'Infinity'},{book:'unknown'},{book:'toString'}]){
  const r=C.calculateLTV({amountFinanced:'25000',bookValue:'20000',book:'nada_trade',...overrides});assert.equal(r.percentage,null);assert(r.errors.length);
 }
});
check('LTV leaves input and deal calculations untouched and requires no network',()=>{
 const raw={amountFinanced:'25000',bookValue:'20000',book:'kbb_retail'},before=JSON.stringify(raw);
 C.calculateLTV(raw);assert.equal(JSON.stringify(raw),before);assert.deepEqual(run(),standard);
 assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html));
 assert(html.includes("connect-src 'none'"));
});
output.push(`${count-failures}/${count} additions checks passed.`, '', 'ACTUAL CONSTRUCTED-CASE OUTPUT (First 30 / New 90 days):',C.report(delayed));
const text=output.join('\n')+'\n';if(process.argv.includes('--capture'))fs.writeFileSync(path.join(__dirname,'ADDITIONS_TEST_OUTPUT.txt'),text);
process.stdout.write(text);if(failures)process.exitCode=1;
