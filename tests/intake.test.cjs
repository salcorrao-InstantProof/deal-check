'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {test} = require('node:test');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = id => {
  const match = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)<\\/script>'));
  assert.ok(match, id + ' is present');
  return match[1];
};
const context = vm.createContext({});
vm.runInContext(script('intake-core'), context);
const core = context.DealCheckIntake;
const fixture = {firstName:'Avery',replyEmail:'avery@example.com',vehicle:'2022 Example sedan',buyerState:'WI',paymentType:'finance',timing:'Tomorrow afternoon',concern:'Please explain the package price.',unsigned:true};
const reference = 'DC-1A2B3C4D';
const openConfig = {intakeEmail:'review@example.com',acceptingRequests:true};
const build = overrides => core.buildRequest({...fixture,...overrides},reference);

test('request includes buyer inputs, $59 fee, attachment instructions, and unconfirmed status',()=>{
  const request=build();
  for(const value of Object.values(fixture).filter(v=>typeof v==='string'&&v!=='finance')) assert.ok(request.body.includes(value));
  for(const text of ['Paying with: Financing','$59','not a confirmed booking or payment','ATTACH BEFORE SENDING']) assert.ok(request.body.includes(text));
});
test('missing and whitespace-only required fields cannot create requests',()=>{
  for(const field of ['firstName','replyEmail','vehicle','buyerState','paymentType','concern']) assert.throws(()=>build({[field]:'  '}));
});
test('unsigned acknowledgement is required and is not coerced from text',()=>{
  for(const unsigned of [false,undefined,'true']) assert.throws(()=>build({unsigned}));
});
test('cash, financing, and undecided remain distinct; unsupported payment types fail',()=>{
  assert.ok(build({paymentType:'cash'}).body.includes('Paying with: Cash'));
  assert.ok(build({paymentType:'undecided'}).body.includes('Paying with: Still deciding'));
  assert.throws(()=>build({paymentType:'lease'}));
});
test('invalid state and reply addresses are rejected, including header injection',()=>{
  assert.throws(()=>build({buyerState:'ZZ'}));
  for(const replyEmail of ['not-email','avery@example.com\r\nBcc: victim@example.com','a@','a@localhost','a@example.com?bcc=other@example.com']) assert.throws(()=>build({replyEmail}));
});
test('bounds reject excess text rather than silently dropping it',()=>{
  for(const [field,limit] of Object.entries({firstName:40,replyEmail:100,vehicle:90,timing:70,concern:600})) assert.throws(()=>build({[field]:'a'.repeat(limit+1)}));
  assert.equal(build({concern:'a'.repeat(600)}).data.concern.length,600);
});
test('missing timing stays unknown; no response deadline is invented',()=>{
  assert.ok(build({timing:''}).body.includes('Requested timing: Please confirm with me'));
  assert.ok(!build().body.includes('within 20 minutes'));
});
test('closed or invalid intake cannot produce an email action',()=>{
  for(const config of [{},null,{intakeEmail:'',acceptingRequests:true},{...openConfig,acceptingRequests:false},{...openConfig,acceptingRequests:'true'},{intakeEmail:'javascript:alert(1)',acceptingRequests:true},{intakeEmail:'a@example.com?bcc=other@example.com',acceptingRequests:true}]) assert.equal(core.mailto(build(),config),null);
});
test('encoded message round-trips without adding recipients or headers',()=>{
  const request=build({concern:'Is A&B included?\n#1 + tax = $59? &bcc=other@example.com'});
  const url=new URL(core.mailto(request,openConfig));
  assert.equal(url.protocol,'mailto:');
  assert.equal(decodeURIComponent(url.pathname),openConfig.intakeEmail);
  assert.deepEqual([...url.searchParams.keys()],['subject','body']);
  assert.equal(url.searchParams.get('body'),request.body);
  assert.equal(url.searchParams.get('subject'),request.subject);
});
test('edits produce fresh text without mutating a prior request',()=>{
  const first=build(),second=build({vehicle:'2023 Example hatchback',concern:'Check the new price.'});
  assert.equal(first.data.vehicle,fixture.vehicle);
  assert.ok(second.body.includes('2023 Example hatchback'));
  assert.ok(!second.body.includes(fixture.concern));
});
test('references exclude buyer identity from email subject identifiers',()=>{
  assert.throws(()=>core.buildRequest(fixture,'avery@example.com'));
  assert.ok(build().subject.endsWith(reference));
  assert.ok(!build().subject.includes(fixture.firstName));
});
test('the committed intake is visibly closed and email defaults to disabled',()=>{
  const raw=JSON.parse(html.match(/<script id="pilot-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(core.getConfig(raw).acceptingRequests,false);
  assert.match(html,/<button id="open-email"[^>]*disabled/);
  assert.match(html,/Pilot intake isn’t open yet/);
});
test('scripts parse and UI lookups match unique HTML IDs (not a browser test)',()=>{
  new vm.Script(script('intake-core'));
  const ui=script('intake-ui');
  new vm.Script(ui);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate HTML id');
  for(const [,id] of ui.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id),'missing element: '+id);
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),'missing anchor: '+id);
});
test('customer code does not store inputs, upload, or interpolate raw HTML',()=>{
  const source=script('intake-core')+script('intake-ui');
  assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest)\b/);
  assert.doesNotMatch(source,/innerHTML|insertAdjacentHTML|document\.write/);
});
test('entire coach HTML remains byte-for-byte identical to the recovered version',()=>{
  const bytes=fs.readFileSync(path.join(root,'deal_check.html'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'af399b0ea4e8effb0c3d71a64e32b1f8e97a1bc208db00ad7dbaec33c4c76c17');
});
