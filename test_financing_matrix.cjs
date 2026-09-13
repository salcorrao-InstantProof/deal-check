'use strict';
// Numerical tests of the existing estimate model, not browser or legal APR verification.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'deal_check.html'),'utf8');
const context=vm.createContext({});
vm.runInContext(html.match(/<script id="deal-core">([\s\S]*?)<\/script>/)[1],context);
const C=context.DealCheck;
const profiles=[
 ['No trade',0,0,0,3350000],
 ['Positive equity',12000,7000,2000,2650000],
 ['Even trade',12000,12000,2000,3150000],
 ['Negative equity',12000,17000,2000,3650000],
 ['Paid-off trade',12000,0,2000,1950000],
 ['More cash down',12000,7000,8000,2050000]
];
const rates=[0,4.9,7.95,12,21.533],terms=[24,36,48,60,72,84],daysList=[30,45,90,120];
function raw(profile,apr,term,days){return {
 price:'30000',addons:[{name:'Accessory',price:'300'}],products:[{name:'Service contract',price:'1200'}],
 serviceFee:'500',tax:'1800',titleFees:'100',licenseFees:'75',registrationFees:'125',rebates:'600',
 trade:String(profile[1]),payoff:String(profile[2]),down:String(profile[3]),
 apr:String(apr),term:String(term),daysToFirstPayment:String(days),financed:'',payment:'',state:'WI'
};}
// Independent present-value sum, without using the app's payment/timing helpers.
function oracle(principal,apr,term,days){
 const r=apr/1200,whole=Math.floor(days/30),fraction=days/30-whole;
 let discountedPayments=0;
 for(let n=0;n<term;n++)discountedPayments+=1/(Math.pow(1+r,whole+n)*(1+fraction*r));
 return principal/100/discountedPayments;
}
const cents=x=>Math.round(x*100);
const output=['Financing matrix: Node numerical verification only. Browser: NOT RUN.',
 '720 combinations: 6 trade/down profiles × 5 rates × 6 terms × 4 first-payment timings.',
 'Itemization: $30,000 + $300 + $1,200 + $500 + $1,800 + $100 + $75 + $125 − $600 = $33,500 before trade/payoff/cash down.',
 'Oracle uses an independent discounted-payment sum. Estimates assume normalized 30-day periods.',
 'Total payments and cash-plus-payments below are derived checks; not new UI fields or a full TILA total-sale-price calculation.',
 'Projected interest excludes any reclassification of prepaid finance charges.', ''];
let count=0,failures=0,maxPaymentError=0,maxResidual=0;
const examples=[];
for(const profile of profiles)for(const apr of rates)for(const term of terms)for(const days of daysList){
 count++;const name=`${profile[0]} / ${apr}% / ${term} months / ${days} days`;
 try{
  const input=raw(profile,apr,term,days),before=JSON.stringify(input),r=C.calculateSheet(input);
  assert.equal(r.amountFinanced,profile[4],'itemized principal');
  assert.equal(r.printedAmountFinanced,null,'printed financing remains blank');
  assert.equal(JSON.stringify(input),before,'input preserved');
  const expected=oracle(profile[4],apr,term,days),error=Math.abs(expected-r.firstPayment);
  maxPaymentError=Math.max(maxPaymentError,error);assert(error<1e-7,'independent payment mismatch');
  assert.equal(r.interestPaid,cents(expected*term-profile[4]/100),'projected interest');
  const total=cents(r.firstPayment*term);
  assert.equal(total,profile[4]+r.interestPaid,'principal plus interest equals total payments');
  assert.equal(total+profile[3]*100,profile[4]+r.interestPaid+profile[3]*100,'cash plus payments');
  // Independently roll the modeled balance forward and subtract the unrounded payment.
  const rate=apr/1200;let balance=profile[4]/100;
  for(let period=1;period<Math.floor(days/30);period++)balance*=1+rate;
  balance*=1+(days%30)/30*rate;
  for(let n=0;n<term;n++)balance=balance*(1+rate)-r.firstPayment;
  maxResidual=Math.max(maxResidual,Math.abs(balance));assert(Math.abs(balance)<1e-6,'ending balance');
  if(apr===0){assert.equal(r.firstPayment,C.calculateSheet(raw(profile,apr,term,30)).firstPayment);assert.equal(r.interestPaid,0);}
  // Infer from the independently generated payment rounded as a printed payment would be.
  const compared=C.reconcile(C.normalize({...input,financed:(profile[4]/100).toFixed(2),payment:expected.toFixed(2)},'Matrix'));
  assert(!compared.paymentFlag,'false payment discrepancy');
  assert(Math.abs(compared.impliedAPR-apr)<0.002,'APR recovery outside 0.002 percentage points');
  // A $200 printed mismatch must survive the calculator unchanged.
  const mismatch=C.calculateSheet({...input,financed:String(profile[4]/100+200)});
  assert.equal(mismatch.amountFinanced,profile[4]);assert.equal(mismatch.difference,20000);
  output.push('PASS '+name);
  if(apr===7.95&&term===60&&days===30)examples.push(`${profile[0]} | trade $${profile[1]} | payoff $${profile[2]} | down $${profile[3]} | financed $${(profile[4]/100).toFixed(2)} | payment $${r.firstPayment.toFixed(2)} | interest $${(r.interestPaid/100).toFixed(2)} | total payments $${(total/100).toFixed(2)}`);
 }catch(e){failures++;output.push('FAIL '+name+': '+e.message);}
}
output.push('',`${count-failures}/${count} financing combinations passed`,
 `Maximum payment difference from independent oracle: $${maxPaymentError.toFixed(10)}`,
 `Maximum unrounded amortization residual: $${maxResidual.toFixed(10)}`,
 'Printed payments are rounded to cents; a real final installment can differ. No actual-date or irregular-schedule compliance claim.',
 '', 'EXAMPLES: 7.95%, 60 months, first payment 30 days',...examples);
const text=output.join('\n')+'\n';
if(process.argv.includes('--capture'))fs.writeFileSync(path.join(__dirname,'FINANCING_MATRIX_OUTPUT.txt'),text);
console.log(output.slice(-12).join('\n'));
if(failures)process.exitCode=1;
