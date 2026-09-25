import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, Receipt,
  Bell, FileText, Settings, Search, Plus, Moon, Sun, Menu, X,
  ChevronRight, Wallet, AlertTriangle, CalendarDays, UserRound,
  CircleDollarSign, Printer, Trash2, Edit3, CheckCircle2, Clock3,
  SlidersHorizontal, BarChart3
} from "lucide-react";
import "./styles.css";

const uid = (prefix="ID") => `${prefix}-${Math.random().toString(36).slice(2,7).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
const today = () => new Date().toISOString().slice(0,10);
const money = n => `₹${Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}`;
const daysBetween = (a,b=today()) => Math.ceil((new Date(a)-new Date(b))/86400000);

const initialCustomers = [
  {id:"CUS-000001", name:"Rahul Sharma", phone:"9876543210", city:"Bathinda", category:"Customer", tags:["Regular"], notes:"Retail customer", created: "2026-09-01"},
  {id:"CUS-000002", name:"Simran Kaur", phone:"9812345678", city:"Mansa", category:"Customer", tags:["Wholesale"], notes:"", created: "2026-09-03"},
  {id:"CUS-000003", name:"Aman Traders", phone:"9988776655", city:"Ludhiana", category:"Business", tags:["Supplier"], notes:"", created: "2026-09-05"}
];

const initialTransactions = [
  {id:"TXN-1001", customerId:"CUS-000001", date:"2026-09-10", type:"given", amount:18500, description:"Goods on credit", dueDate:"2026-09-28", payment:0},
  {id:"TXN-1002", customerId:"CUS-000001", date:"2026-09-16", type:"payment", amount:5000, description:"Part payment", dueDate:"2026-09-28", payment:5000},
  {id:"TXN-1003", customerId:"CUS-000002", date:"2026-09-15", type:"given", amount:12000, description:"Purchase", dueDate:"2026-09-25", payment:0},
  {id:"TXN-1004", customerId:"CUS-000003", date:"2026-09-12", type:"received", amount:8000, description:"Advance received", dueDate:"2026-09-30", payment:0}
];

function load(key, fallback){
  try { const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch { return fallback; }
}

function App(){
  const [customers,setCustomers]=useState(()=>load("mk_customers",initialCustomers));
  const [transactions,setTransactions]=useState(()=>load("mk_transactions",initialTransactions));
  const [page,setPage]=useState("dashboard");
  const [selected,setSelected]=useState(null);
  const [dark,setDark]=useState(()=>load("mk_dark",false));
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const [modal,setModal]=useState(null);
  const [mobileOpen,setMobileOpen]=useState(false);

  useEffect(()=>localStorage.setItem("mk_customers",JSON.stringify(customers)),[customers]);
  useEffect(()=>localStorage.setItem("mk_transactions",JSON.stringify(transactions)),[transactions]);
  useEffect(()=>localStorage.setItem("mk_dark",JSON.stringify(dark)),[dark]);

  const customerMap=useMemo(()=>Object.fromEntries(customers.map(c=>[c.id,c])),[customers]);

  const balances=useMemo(()=>{
    const b={}; customers.forEach(c=>b[c.id]=0);
    transactions.forEach(t=>{
      if(t.type==="given") b[t.customerId]=(b[t.customerId]||0)+Number(t.amount);
      if(t.type==="received") b[t.customerId]=(b[t.customerId]||0)-Number(t.amount);
      if(t.type==="payment") b[t.customerId]=(b[t.customerId]||0)-Number(t.amount);
    });
    return b;
  },[customers,transactions]);

  const receivable=Math.max(0,Object.values(balances).filter(v=>v>0).reduce((a,b)=>a+b,0));
  const payable=Math.max(0,Object.values(balances).filter(v=>v<0).reduce((a,b)=>a+Math.abs(b),0));

  const overdue=transactions.filter(t=>{
    const outstanding = t.type==="given" ? Number(t.amount)-Number(t.payment||0) : 0;
    return outstanding>0 && t.dueDate && t.dueDate<today();
  }).reduce((s,t)=>s+(Number(t.amount)-Number(t.payment||0)),0);

  const dueToday=transactions.filter(t=>{
    const outstanding=t.type==="given"?Number(t.amount)-Number(t.payment||0):0;
    return outstanding>0 && t.dueDate===today();
  }).reduce((s,t)=>s+(Number(t.amount)-Number(t.payment||0)),0);

  function scoreFor(cid){
    const rows=transactions.filter(t=>t.customerId===cid && t.type==="given");
    if(!rows.length) return 700;
    let score=780;
    let late=0, totalDelay=0, completed=0;
    rows.forEach(t=>{
      const outstanding=Number(t.amount)-Number(t.payment||0);
      if(outstanding<=0){
        completed++;
        const paidDate=transactions.filter(p=>p.customerId===cid&&p.type==="payment"&&p.date>=t.date&&p.date<=new Date(new Date(t.date).getTime()+180*86400000).toISOString().slice(0,10))
          .sort((a,b)=>a.date.localeCompare(b.date))[0]?.date || t.dueDate;
        const d=daysBetween(t.dueDate,paidDate);
        if(d>0){late++;totalDelay+=d;score-=Math.min(70,d*3);}
      } else if(t.dueDate<today()){
        const d=Math.max(0,-daysBetween(t.dueDate));
        late++; totalDelay+=d; score-=Math.min(120,d*2);
      }
    });
    score -= Math.min(150, late*35);
    score += Math.min(60, completed*5);
    return Math.max(0,Math.min(900,Math.round(score)));
  }

  const openCustomer = c => { setSelected(c); setPage("customer"); setMobileOpen(false); };

  function addCustomer(data){
    const num=String(customers.length+1).padStart(6,"0");
    const c={...data,id:`CUS-${num}`,created:today()};
    setCustomers(x=>[c,...x]); setModal(null);
  }

  function addTransaction(data){
    setTransactions(x=>[{...data,id:uid("TXN"),payment:data.type==="payment"?Number(data.amount):0},...x]);
    setModal(null);
  }

  function deleteTransaction(id){ if(confirm("Delete this transaction?")) setTransactions(x=>x.filter(t=>t.id!==id)); }

  const filteredCustomers=customers.filter(c=>{
    const q=query.toLowerCase();
    const matches=!q || [c.name,c.id,c.phone,c.city,c.category].some(v=>String(v||"").toLowerCase().includes(q));
    const bal=balances[c.id]||0;
    const f=filter==="all" || (filter==="receive"&&bal>0)||(filter==="pay"&&bal<0)||(filter==="overdue"&&transactions.some(t=>t.customerId===c.id&&t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0&&t.dueDate<today()));
    return matches&&f;
  });

  return <div className={dark?"app dark":"app"}>
    <Sidebar page={page} setPage={p=>{setPage(p);setSelected(null);setMobileOpen(false)}} open={mobileOpen} close={()=>setMobileOpen(false)}/>
    <main className="main">
      <header className="topbar">
        <button className="iconBtn mobileOnly" onClick={()=>setMobileOpen(true)}><Menu/></button>
        <div className="brandMobile"><span className="brandMark">₹</span> My Khata</div>
        <div className="topSearch"><Search size={18}/><input placeholder="Search customers, ID, phone..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="topActions">
          <button className="iconBtn" onClick={()=>setDark(!dark)} title="Theme">{dark?<Sun/>:<Moon/>}</button>
          <button className="primaryBtn" onClick={()=>setModal("transaction")}><Plus size={18}/> Add Transaction</button>
        </div>
      </header>

      <div className="content">
        {page==="dashboard" && <Dashboard {...{customers,transactions,balances,receivable,payable,overdue,dueToday,customerMap,scoreFor,openCustomer,setPage,setModal}}/>}
        {page==="customers" && <Customers {...{filteredCustomers,query,setQuery,filter,setFilter,balances,scoreFor,openCustomer,setModal}}/>}
        {page==="receivables" && <MoneyPage title="Money to Receive" kind="receive" {...{customers,transactions,balances,customerMap,scoreFor,openCustomer,setModal}}/>}
        {page==="payables" && <MoneyPage title="Money to Pay" kind="pay" {...{customers,transactions,balances,customerMap,scoreFor,openCustomer,setModal}}/>}
        {page==="transactions" && <Transactions {...{transactions,customerMap,deleteTransaction,setModal}}/>}
        {page==="reminders" && <Reminders {...{transactions,customerMap,openCustomer}}/>}
        {page==="reports" && <Reports {...{customers,transactions,balances,scoreFor,openCustomer}}/>}
        {page==="settings" && <Settings dark={dark} setDark={setDark} customers={customers} setCustomers={setCustomers} transactions={transactions} setTransactions={setTransactions}/>}
        {page==="customer" && selected && <CustomerPage {...{customer:selected,transactions,balances,scoreFor,setModal,deleteTransaction,openCustomer,setPage}}/>}
      </div>
    </main>

    {modal==="customer" && <CustomerModal onClose={()=>setModal(null)} onSave={addCustomer}/>}
    {modal==="transaction" && <TransactionModal customers={customers} onClose={()=>setModal(null)} onSave={addTransaction}/>}
  </div>
}

function Sidebar({page,setPage,open,close}){
 const items=[
  ["dashboard","Dashboard",LayoutDashboard],["customers","Customers",Users],
  ["receivables","Receivables",ArrowDownToLine],["payables","Payables",ArrowUpFromLine],
  ["transactions","Transactions",Receipt],["reminders","Reminders",Bell],
  ["reports","Reports",FileText],["settings","Settings",Settings]
 ];
 return <aside className={open?"sidebar open":"sidebar"}>
   <div className="sideHeader"><div className="logo"><span className="brandMark">₹</span><span>My Khata</span></div><button className="iconBtn mobileOnly" onClick={close}><X/></button></div>
   <div className="tagline">Smart Khata. Simple Payments.</div>
   <nav>{items.map(([id,label,Icon])=><button key={id} className={page===id?"navItem active":"navItem"} onClick={()=>setPage(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
   <div className="sideBottom"><div className="miniProfile"><div className="avatar">MK</div><div><b>My Account</b><small>Owner</small></div></div></div>
 </aside>
}

function Dashboard(p){
 const recent=p.transactions.slice(0,7);
 return <div>
  <PageTitle title="Good Evening 👋" subtitle="Here’s your khata overview for today." action={<button className="primaryBtn" onClick={()=>p.setModal("transaction")}><Plus/> Add Transaction</button>}/>
  <div className="statGrid">
   <Stat icon={ArrowDownToLine} title="To Receive" value={money(p.receivable)} meta={`${p.customers.filter(c=>(p.balances[c.id]||0)>0).length} customers`} cls="green"/>
   <Stat icon={ArrowUpFromLine} title="To Pay" value={money(p.payable)} meta={`${p.customers.filter(c=>(p.balances[c.id]||0)<0).length} people`} cls="blue"/>
   <Stat icon={AlertTriangle} title="Overdue" value={money(p.overdue)} meta="Outstanding overdue" cls="red"/>
   <Stat icon={CalendarDays} title="Due Today" value={money(p.dueToday)} meta="Payment due today" cls="amber"/>
  </div>
  <div className="grid2">
   <Card title="Money Flow" icon={BarChart3}><MiniChart transactions={p.transactions}/></Card>
   <Card title="Payment Behaviour" icon={CircleDollarSign}><div className="scoreBig">{Math.round(p.customers.reduce((s,c)=>s+p.scoreFor(c.id),0)/(p.customers.length||1))}<span>/900</span></div><p className="muted">Average internal Payment Behaviour Score</p><div className="progress"><i style={{width:`${Math.min(100,Math.round(p.customers.reduce((s,c)=>s+p.scoreFor(c.id),0)/(p.customers.length||1)/9))}%`}}/></div><small className="muted">Based only on records stored in My Khata.</small></Card>
  </div>
  <div className="grid2">
   <Card title="Overdue Payments" action={<button className="textBtn" onClick={()=>p.setPage("receivables")}>View all <ChevronRight size={15}/></button>}>
    {p.transactions.filter(t=>t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0&&t.dueDate<today()).slice(0,4).map(t=><PaymentRow key={t.id} t={t} customer={p.customerMap[t.customerId]} score={p.scoreFor(t.customerId)} onClick={()=>p.openCustomer(p.customerMap[t.customerId])}/> )}
    {!p.transactions.some(t=>t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0&&t.dueDate<today())&&<Empty text="No overdue payments 🎉"/>}
   </Card>
   <Card title="Upcoming Payments" action={<button className="textBtn" onClick={()=>p.setPage("receivables")}>View all <ChevronRight size={15}/></button>}>
    {p.transactions.filter(t=>t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0&&t.dueDate>=today()).slice(0,4).map(t=><PaymentRow key={t.id} t={t} customer={p.customerMap[t.customerId]} score={p.scoreFor(t.customerId)} onClick={()=>p.openCustomer(p.customerMap[t.customerId])}/> )}
    {!p.transactions.some(t=>t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0&&t.dueDate>=today())&&<Empty text="No upcoming payments"/>}
   </Card>
  </div>
  <Card title="Recent Transactions" action={<button className="textBtn" onClick={()=>p.setPage("transactions")}>View all <ChevronRight size={15}/></button>}>
   <TransactionTable transactions={recent} customerMap={p.customerMap}/>
  </Card>
 </div>
}

function Stat({icon:Icon,title,value,meta,cls}){return <div className={`statCard ${cls}`}><div className="statIcon"><Icon size={21}/></div><div><span>{title}</span><strong>{value}</strong><small>{meta}</small></div></div>}
function PageTitle({title,subtitle,action}){return <div className="pageTitle"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>}
function Card({title,icon:Icon,action,children}){return <section className="card"><div className="cardHead"><div className="cardTitle">{Icon&&<Icon size={18}/>}<h2>{title}</h2></div>{action}</div>{children}</section>}
function Empty({text}){return <div className="empty">{text}</div>}

function MiniChart({transactions}){
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)});
 const vals=days.map(d=>transactions.filter(t=>t.date===d).reduce((s,t)=>s+(t.type==="given"?t.amount:0),0));
 const max=Math.max(...vals,1);
 return <div className="chart"><div className="bars">{vals.map((v,i)=><div className="barWrap" key={i}><div className="bar" style={{height:`${Math.max(8,v/max*100)}%`}} title={money(v)}></div><small>{days[i].slice(5)}</small></div>)}</div></div>
}

function PaymentRow({t,customer,score,onClick}){
 if(!customer)return null;
 const left=Number(t.amount)-Number(t.payment||0), late=t.dueDate<today();
 return <button className="paymentRow" onClick={onClick}><div className="avatar">{customer.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div className="grow"><b>{customer.name}</b><small>{customer.id} · Due {t.dueDate}</small></div><div className="paymentAmount"><b>{money(left)}</b><small className={late?"danger":""}>{late?`${Math.abs(daysBetween(t.dueDate))} days overdue`:`Score ${score}`}</small></div><ChevronRight size={17}/></button>
}

function Customers(p){
 return <div><PageTitle title="Customers" subtitle={`${p.filteredCustomers.length} profiles`} action={<button className="primaryBtn" onClick={()=>p.setModal("customer")}><Plus/> Add Customer</button>}/>
 <div className="filterBar"><div className="inlineSearch"><Search size={17}/><input placeholder="Search customers..." value={p.query} onChange={e=>p.setQuery(e.target.value)}/></div><div className="filters">{[["all","All"],["receive","To Receive"],["pay","To Pay"],["overdue","Overdue"]].map(([id,l])=><button key={id} className={p.filter===id?"filter active":"filter"} onClick={()=>p.setFilter(id)}>{l}</button>)}</div></div>
 <div className="customerGrid">{p.filteredCustomers.map(c=><CustomerCard key={c.id} c={c} balance={p.balances[c.id]||0} score={p.scoreFor(c.id)} onClick={()=>p.openCustomer(c)}/>)}</div>
 </div>
}

function CustomerCard({c,balance,score,onClick}){return <button className="customerCard" onClick={onClick}><div className="customerTop"><div className="avatar large">{c.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div className="grow"><h3>{c.name}</h3><small>{c.id}</small></div><ChevronRight/></div><div className="customerInfo"><div><span>Balance</span><b className={balance>0?"greenText":balance<0?"blueText":""}>{money(Math.abs(balance))}</b></div><div><span>Score</span><b>{score}/900</b></div></div><div className="customerBottom"><span>{c.category}</span><span>{c.city}</span></div></button>}

function MoneyPage({title,kind,customers,transactions,balances,customerMap,scoreFor,openCustomer,setModal}){
 const rows=customers.filter(c=>kind==="receive"?(balances[c.id]||0)>0:(balances[c.id]||0)<0);
 return <div><PageTitle title={title} subtitle="Track outstanding balances and payment activity."/><div className="customerGrid">{rows.map(c=><CustomerCard key={c.id} c={c} balance={balances[c.id]||0} score={scoreFor(c.id)} onClick={()=>openCustomer(c)}/>)}</div>{!rows.length&&<Card title={title}><Empty text="Nothing to show here."/></Card>}</div>
}

function Transactions({transactions,customerMap,deleteTransaction,setModal}){
 return <div><PageTitle title="Transactions" subtitle="Complete transaction history." action={<button className="primaryBtn" onClick={()=>setModal("transaction")}><Plus/> Add Transaction</button>}/><Card title="All Transactions"><TransactionTable transactions={transactions} customerMap={customerMap} onDelete={deleteTransaction}/></Card></div>
}

function TransactionTable({transactions,customerMap,onDelete}){
 return <div className="tableWrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Description</th><th>Amount</th><th>Type</th><th>Due</th>{onDelete&&<th></th>}</tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td>{t.date}</td><td><b>{customerMap[t.customerId]?.name||"Unknown"}</b><small>{t.customerId}</small></td><td>{t.description||"—"}</td><td><b>{money(t.amount)}</b></td><td><span className={`badge ${t.type}`}>{t.type==="given"?"Money Given":t.type==="received"?"Money Received":"Payment"}</span></td><td>{t.dueDate||"—"}</td>{onDelete&&<td><button className="iconBtn dangerBtn" onClick={()=>onDelete(t.id)}><Trash2 size={16}/></button></td>}</tr>)}</tbody></table></div>
}

function Reminders({transactions,customerMap,openCustomer}){
 const rows=transactions.filter(t=>t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 return <div><PageTitle title="Reminders" subtitle="Upcoming and overdue payment dates."/><Card title="Payment Schedule">{rows.map(t=><PaymentRow key={t.id} t={t} customer={customerMap[t.customerId]} score={0} onClick={()=>openCustomer(customerMap[t.customerId])}/>)}</Card></div>
}

function Reports({customers,transactions,balances,scoreFor,openCustomer}){
 return <div><PageTitle title="Reports" subtitle="Print a complete report for any client."/><div className="customerGrid">{customers.map(c=><div className="reportCard" key={c.id}><div className="avatar large">{c.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div className="grow"><h3>{c.name}</h3><small>{c.id}</small><p>Balance: <b>{money(Math.abs(balances[c.id]||0))}</b></p></div><button className="secondaryBtn" onClick={()=>openCustomer(c)}><Printer size={16}/> Report</button></div>)}</div></div>
}

function CustomerPage({customer,transactions,balances,scoreFor,setModal,deleteTransaction,setPage}){
 const rows=transactions.filter(t=>t.customerId===customer.id);
 return <div><button className="backBtn" onClick={()=>setPage("customers")}>← Customers</button><div className="profileHero"><div className="avatar xl">{customer.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div className="grow"><h1>{customer.name}</h1><p>{customer.id} · {customer.phone} · {customer.city}</p><div className="tags"><span>{customer.category}</span>{(customer.tags||[]).map(t=><span key={t}>{t}</span>)}</div></div><div className="profileActions"><button className="secondaryBtn" onClick={()=>window.print()}><Printer size={16}/> Print Report</button><button className="primaryBtn" onClick={()=>setModal("transaction")}><Plus/> Transaction</button></div></div><div className="statGrid"><Stat icon={Wallet} title="Current Balance" value={money(Math.abs(balances[customer.id]||0))} meta={balances[customer.id]>0?"To receive":"To pay"} cls={balances[customer.id]>0?"green":"blue"}/><Stat icon={CircleDollarSign} title="Payment Behaviour" value={`${scoreFor(customer.id)}/900`} meta="Internal score" cls="blue"/><Stat icon={Receipt} title="Transactions" value={rows.length} meta="Total records" cls="amber"/><Stat icon={AlertTriangle} title="Overdue" value={money(rows.filter(t=>t.type==="given"&&Number(t.amount)-Number(t.payment||0)>0&&t.dueDate<today()).reduce((s,t)=>s+Number(t.amount)-Number(t.payment||0),0))} meta="Outstanding" cls="red"/></div><Card title="Complete Ledger"><TransactionTable transactions={rows} customerMap={{[customer.id]:customer}} onDelete={deleteTransaction}/></Card><Card title="Score Explanation"><p className="muted">This Payment Behaviour Score is an internal indicator derived from recorded payment activity. It is not an official CIBIL or credit-bureau score.</p></Card></div>
}

function CustomerModal({onClose,onSave}){
 const [f,setF]=useState({name:"",phone:"",city:"",category:"Customer",tags:[],notes:""});
 return <Modal title="Add Customer" onClose={onClose}><FormField label="Full name"><input autoFocus value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField><FormField label="Phone"><input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></FormField><FormField label="City"><input value={f.city} onChange={e=>setF({...f,city:e.target.value})}/></FormField><FormField label="Category"><select value={f.category} onChange={e=>setF({...f,category:e.target.value})}><option>Customer</option><option>Business</option><option>Supplier</option><option>Friend</option><option>Family</option></select></FormField><FormField label="Notes"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></FormField><ModalActions onClose={onClose} save={()=>f.name.trim()&&onSave(f)}/></Modal>
}

function TransactionModal({customers,onClose,onSave}){
 const [f,setF]=useState({customerId:customers[0]?.id||"",type:"given",amount:"",description:"",date:today(),dueDate:""});
 return <Modal title="Add Transaction" onClose={onClose}><FormField label="Customer"><select value={f.customerId} onChange={e=>setF({...f,customerId:e.target.value})}>{customers.map(c=><option key={c.id} value={c.id}>{c.name} — {c.id}</option>)}</select></FormField><div className="formGrid"><FormField label="Type"><select value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="given">Money Given</option><option value="received">Money Received</option><option value="payment">Payment</option></select></FormField><FormField label="Amount"><input type="number" min="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></FormField></div><div className="formGrid"><FormField label="Date"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></FormField><FormField label="Due date"><input type="date" value={f.dueDate} onChange={e=>setF({...f,dueDate:e.target.value})}/></FormField></div><FormField label="Description"><input value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></FormField><ModalActions onClose={onClose} save={()=>Number(f.amount)>0&&onSave({...f,amount:Number(f.amount)})}/></Modal>
}

function Modal({title,onClose,children}){return <div className="modalOverlay"><div className="modal"><div className="modalHead"><h2>{title}</h2><button className="iconBtn" onClick={onClose}><X/></button></div>{children}</div></div>}
function ModalActions({onClose,save}){return <div className="modalActions"><button className="secondaryBtn" onClick={onClose}>Cancel</button><button className="primaryBtn" onClick={save}>Save</button></div>}
function FormField({label,children}){return <label className="field"><span>{label}</span>{children}</label>}

function Settings({dark,setDark,customers,setCustomers,transactions,setTransactions}){
 const reset=()=>{if(confirm("Reset demo data? This removes current local data.")){setCustomers(initialCustomers);setTransactions(initialTransactions)}};
 return <div><PageTitle title="Settings" subtitle="Customize your My Khata experience."/><div className="settingsGrid"><Card title="Appearance"><div className="settingRow"><div><b>Dark mode</b><p>Use a darker interface.</p></div><button className={dark?"toggle on":"toggle"} onClick={()=>setDark(!dark)}><i/></button></div></Card><Card title="Payment Behaviour Score"><p className="muted">The app uses an internal 0–900 indicator based on recorded payment behaviour. It is not an official credit-bureau score.</p><div className="notice">Do not present this score as CIBIL, TransUnion, Experian or Equifax.</div></Card><Card title="Data"><p className="muted">Current local customers: {customers.length} · transactions: {transactions.length}</p><button className="dangerOutline" onClick={reset}><Trash2 size={16}/> Reset demo data</button></Card></div></div>
}

function FormattedReport({customer,rows,score,balance}){
 return <div className="printReport"><div className="reportHeader"><div><h1>My Khata</h1><h2>Overall Client Report</h2><p>Generated: {new Date().toLocaleDateString("en-IN")}</p></div><div className="reportId">Report ID: {uid("RPT")}</div></div><div className="reportClient"><div className="avatar xl">{customer.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><h2>{customer.name}</h2><p>{customer.id} · {customer.phone}</p><p>{customer.address||customer.city||""}</p></div></div><div className="reportSummary"><div><span>Current Balance</span><b>{money(Math.abs(balance))}</b></div><div><span>Payment Behaviour</span><b>{score}/900</b></div><div><span>Transactions</span><b>{rows.length}</b></div><div><span>Outstanding</span><b>{money(rows.filter(t=>t.type==="given").reduce((s,t)=>s+Number(t.amount)-Number(t.payment||0),0))}</b></div></div><h3>Complete Transaction Statement</h3><table><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Due Date</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{t.date}</td><td>{t.description||"—"}</td><td>{t.type}</td><td>{money(t.amount)}</td><td>{t.dueDate||"—"}</td></tr>)}</tbody></table><div className="reportDisclaimer"><b>Payment Behaviour Score:</b> This is an internal score calculated from transaction history recorded in My Khata. It is not an official CIBIL, TransUnion, Experian or Equifax credit score.</div><footer>My Khata · Page 1 · Private financial record</footer></div>
}

createRoot(document.getElementById("root")).render(<App/>);