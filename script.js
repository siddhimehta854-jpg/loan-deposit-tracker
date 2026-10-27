const loanStatuses=['Under Review','Approved','Rejected','Additional Information'];
const depositStatuses=['Active','Matured'];
const today=new Date();
const dateOffset=d=>{const x=new Date();x.setDate(x.getDate()+d);return x.toISOString().slice(0,10)};
const loanFields=[
  {key:'id',label:'Application Reference',type:'text',required:true,placeholder:'e.g. LN-1009'},
  {key:'applicant',label:'Applicant Name',type:'text',required:true,placeholder:'Dummy applicant name'},
  {key:'date',label:'Application Date',type:'date',required:true},
  {key:'product',label:'Loan Product',type:'select',options:['Home Loan','Personal Loan','Vehicle Loan','Education Loan','Business Loan','Gold Loan']},
  {key:'amount',label:'Approved Amount (₹)',type:'number',min:0},
  {key:'status',label:'Application Status',type:'select',options:loanStatuses},
  {key:'docs',label:'Documentation / Review Notes',type:'text',placeholder:'e.g. Income proof pending'}
];
const depositFields=[
  {key:'id',label:'Deposit Reference',type:'text',required:true,placeholder:'e.g. DP-2006'},
  {key:'applicant',label:'Customer Name',type:'text',required:true,placeholder:'Dummy customer name'},
  {key:'product',label:'Deposit Product',type:'select',options:['Fixed Deposit','Recurring Deposit','Savings Deposit','Tax-Saving Deposit']},
  {key:'date',label:'Opening Date',type:'date',required:true},
  {key:'amount',label:'Deposit Amount (₹)',type:'number',required:true,min:0},
  {key:'maturity',label:'Maturity Date (optional)',type:'date'},
  {key:'status',label:'Deposit Status',type:'select',options:depositStatuses}
];
const initialLoans=[
  {id:'LN-1001',applicant:'Aarav Sharma',date:dateOffset(-2),product:'Home Loan',amount:2500000,status:'Approved',docs:'Complete'},
  {id:'LN-1002',applicant:'Diya Verma',date:dateOffset(-4),product:'Personal Loan',amount:350000,status:'Under Review',docs:'Income proof pending'},
  {id:'LN-1003',applicant:'Rohan Gupta',date:dateOffset(-5),product:'Vehicle Loan',amount:650000,status:'Additional Information',docs:'Address proof required'},
  {id:'LN-1004',applicant:'Ananya Singh',date:dateOffset(-7),product:'Education Loan',amount:800000,status:'Approved',docs:'Complete'},
  {id:'LN-1005',applicant:'Kabir Mehta',date:dateOffset(-8),product:'Personal Loan',amount:0,status:'Rejected',docs:'Review completed'},
  {id:'LN-1006',applicant:'Isha Patel',date:dateOffset(-9),product:'Home Loan',amount:4200000,status:'Under Review',docs:'Property documents pending'},
  {id:'LN-1007',applicant:'Vivaan Jain',date:dateOffset(-10),product:'Vehicle Loan',amount:550000,status:'Approved',docs:'Complete'},
  {id:'LN-1008',applicant:'Meera Rao',date:dateOffset(-11),product:'Education Loan',amount:0,status:'Additional Information',docs:'Co-applicant details required'}
];
const initialDeposits=[
  {id:'DP-2001',applicant:'Aarav Sharma',product:'Fixed Deposit',date:dateOffset(-100),amount:250000,maturity:dateOffset(265),status:'Active'},
  {id:'DP-2002',applicant:'Diya Verma',product:'Recurring Deposit',date:dateOffset(-80),amount:50000,maturity:dateOffset(285),status:'Active'},
  {id:'DP-2003',applicant:'Rohan Gupta',product:'Fixed Deposit',date:dateOffset(-400),amount:400000,maturity:dateOffset(-35),status:'Matured'},
  {id:'DP-2004',applicant:'Ananya Singh',product:'Savings Deposit',date:dateOffset(-30),amount:75000,maturity:'',status:'Active'},
  {id:'DP-2005',applicant:'Kabir Mehta',product:'Fixed Deposit',date:dateOffset(-600),amount:150000,maturity:dateOffset(-20),status:'Matured'}
];
let loans=loadData('banksphere_loans',initialLoans), deposits=loadData('banksphere_deposits',initialDeposits), view='dashboard', editingId=null, toastTimer;
function loadData(k,fb){try{const d=localStorage.getItem(k);return d?JSON.parse(d):fb}catch{return fb}}
function persist(){localStorage.setItem('banksphere_loans',JSON.stringify(loans));localStorage.setItem('banksphere_deposits',JSON.stringify(deposits));}
function money(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0)}
function esc(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function fmt(d){if(!d)return '—';const x=new Date(d+'T00:00:00');return isNaN(x)?'—':x.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function cls(s){return ({'Approved':'approved','Active':'active','Under Review':'review','Rejected':'rejected','Additional Information':'info','Matured':'matured','Pending':'pending'})[s]||'other'}
function pill(s){return `<span class="pill pill-${cls(s)}">${esc(s)}</span>`}
function navigate(next){view=next;document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.getElementById('dashboardView').classList.toggle('hidden',view!=='dashboard');document.getElementById('recordsView').classList.toggle('hidden',view==='dashboard');document.getElementById('pageTitle').textContent=({dashboard:'Overview Dashboard',loans:'Loan Tracking',deposits:'Deposit Tracking'})[view];document.getElementById('pageSubtitle').textContent=({dashboard:'A consolidated view of loan applications and deposits.',loans:'Monitor applications, approvals and documentation.',deposits:'Track deposit products, balances and maturity dates.'})[view];if(view!=='dashboard')setupRecords();renderAll();}
function renderDashboard(){
  const counts=Object.fromEntries(loanStatuses.map(s=>[s,loans.filter(l=>l.status===s).length]));
  document.getElementById('sTotal').textContent=loans.length;document.getElementById('sReview').textContent=counts['Under Review'];document.getElementById('sApproved').textContent=counts['Approved'];document.getElementById('sRejected').textContent=counts['Rejected'];
  const chart={'Under Review':'#efa936','Approved':'#21a477','Rejected':'#e35b6a','Additional Information':'#6485f4'};
  document.getElementById('statusChart').innerHTML=loanStatuses.map(s=>{const c=counts[s],p=loans.length?c/loans.length*100:0;return `<div class="status-row"><span>${esc(s)}</span><div class="track"><div class="fill" style="width:${p}%;background:${chart[s]}"></div></div><strong>${c}</strong></div>`}).join('');
  document.getElementById('dCount').textContent=deposits.length;document.getElementById('dValue').textContent=money(deposits.reduce((sum,d)=>sum+Number(d.amount||0),0));document.getElementById('dActive').textContent=deposits.filter(d=>d.status==='Active').length;document.getElementById('dMatured').textContent=deposits.filter(d=>d.status==='Matured').length;
  const recent=[...loans].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('recentLoans').innerHTML=recent.length?recent.map(l=>`<tr><td class="ref">${esc(l.id)}</td><td>${esc(l.applicant)}</td><td>${esc(l.product)}</td><td>${money(l.amount)}</td><td>${pill(l.status)}</td></tr>`).join(''):`<tr><td colspan="5" class="empty">No loan records yet.</td></tr>`;
}
function currentData(){return view==='loans'?loans:deposits}
function currentFields(){return view==='loans'?loanFields:depositFields}
function setupRecords(){
  const isLoan=view==='loans';
  document.getElementById('recordTitle').textContent=isLoan?'Loan Applications':'Deposit Records';
  document.getElementById('recordSubtitle').textContent=isLoan?'Track application status, approved amounts and pending documentation.':'Manage opening dates, deposit amounts and maturity status.';
  document.getElementById('statusFilter').innerHTML='<option value="">All statuses</option>' + (isLoan?loanStatuses:depositStatuses).map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  document.getElementById('searchInput').value='';
  const headers=isLoan?['Reference','Applicant','Application Date','Product','Approved Amount','Status','Documentation','Actions']:['Reference','Customer','Product','Opening Date','Amount','Maturity Date','Status','Actions'];
  document.getElementById('recordHead').innerHTML='<tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr>';
}
function renderRecords(){
  if(view==='dashboard')return;
  const q=document.getElementById('searchInput').value.toLowerCase();
  const status=document.getElementById('statusFilter').value;
  const rows=currentData().filter(r=>(!status||r.status===status)&&[r.id,r.applicant,r.product,r.docs||''].join(' ').toLowerCase().includes(q));
  document.getElementById('recordBody').innerHTML=rows.length?rows.map(r=>{
    const base=`<td class="ref">${esc(r.id)}</td><td>${esc(r.applicant)}</td><td class="product">${esc(r.product)}</td>`;
    if(view==='loans') return `<tr>${base}<td>${fmt(r.date)}</td><td>${money(r.amount)}</td><td>${pill(r.status)}</td><td>${esc(r.docs||'—')}</td><td><div class="actions"><button class="icon-btn" onclick="editRecord('${esc(r.id)}')">Edit</button><button class="icon-btn" onclick="deleteRecord('${esc(r.id)}')">Delete</button></div></td></tr>`;
    return `<tr>${base}<td>${fmt(r.date)}</td><td>${money(r.amount)}</td><td>${fmt(r.maturity)}</td><td>${pill(r.status)}</td><td><div class="actions"><button class="icon-btn" onclick="editRecord('${esc(r.id)}')">Edit</button><button class="icon-btn" onclick="deleteRecord('${esc(r.id)}')">Delete</button></div></td></tr>`;
  }).join(''):`<tr><td colspan="9" class="empty">No matching records found. Try changing your search or add a record.</td></tr>`;
}
function renderAll(){renderDashboard();if(view!=='dashboard')renderRecords();}
function openModal(id=null){
  editingId=id;const record=id?currentData().find(r=>r.id===id):null;
  document.getElementById('modalTitle').textContent=(record?'Edit ':'Add ')+(view==='loans'?'Loan Application':'Deposit Record');
  document.getElementById('formFields').innerHTML=currentFields().map(f=>{
    const value=record?.[f.key] ?? (f.key==='date'?dateOffset(0):f.key==='status'?(view==='loans'?'Under Review':'Active'):'');
    const input=f.type==='select'?`<select class="field" name="${f.key}" ${f.required?'required':''}>${f.options.map(o=>`<option ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input class="field" name="${f.key}" type="${f.type}" value="${esc(value)}" placeholder="${esc(f.placeholder||'')}" ${f.required?'required':''} ${f.min!==undefined?`min="${f.min}"`:''}>`;
    return `<div class="form-group"><label>${esc(f.label)}${f.required?' *':''}</label>${input}</div>`;
  }).join('');
  document.getElementById('modalBackdrop').classList.remove('hidden');
}
function closeModal(){document.getElementById('modalBackdrop').classList.add('hidden')}
document.getElementById('modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal();});
document.getElementById('recordForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.target), record={};currentFields().forEach(f=>record[f.key]=form.get(f.key)??'');if(currentData().some(r=>r.id===record.id&&r.id!==editingId)){notify('That reference already exists.');return}if(view==='loans'&&record.status!=='Approved')record.amount=0;if(view==='deposits'&&record.maturity&&record.maturity<record.date){notify('Maturity date cannot be before opening date.');return}const data=currentData(), idx=data.findIndex(r=>r.id===editingId);if(idx>=0)data[idx]=record;else data.unshift(record);persist();closeModal();renderAll();notify(idx>=0?'Record updated successfully.':'Record added successfully.');});
function editRecord(id){openModal(id)}
function deleteRecord(id){const data=currentData();if(!data.some(r=>r.id===id))return;if(!confirm(`Delete record ${id}? This cannot be undone.`))return;if(view==='loans')loans=loans.filter(r=>r.id!==id);else deposits=deposits.filter(r=>r.id!==id);persist();renderAll();notify('Record deleted.');}
function exportCSV(){const data=currentData();if(!data.length){notify('There are no records to export.');return}const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(','))].join('\r\n');const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}), url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=(view==='loans'?'loan-records':'deposit-records')+'.csv';a.click();URL.revokeObjectURL(url);notify('CSV export generated.');}
function notify(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2600);}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));document.getElementById('today').textContent=today.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});renderAll();
