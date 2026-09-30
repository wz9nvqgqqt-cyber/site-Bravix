const packages={
  integral:{unitValue:1350,kicker:'ENTREGA MAIS COMPLETA',term:'6 meses',state:'Escopo construtivo acordado',short:'Base + complementos',description:'Estrutura, envelope, piso, duas docas, portas automatizadas, núcleo de apoio, mezanino e instalações básicas.',list:['Entrega mais próxima da operação','Menor volume de complementações futuras','Base para o estudo de viabilidade']},
  estrutura:{unitValue:1280,kicker:'BASE LOGÍSTICA + FLEXIBILIDADE',term:'5 meses',state:'Envelope + operação logística-base',short:'Base logística',description:'Mantém estrutura, cobertura, fechamento, piso, duas docas, portas funcionais e mezanino estrutural; posterga parcelas finais.',list:['Automação final das portas postergada','Acabamentos e instalações reduzidos','Complementação orientada ao ocupante']},
  essencial:{unitValue:1150,kicker:'ESTRUTURA FECHADA PARA EVOLUIR',term:'3–4 meses',state:'Entrega “no cinza”',short:'Envelope protegido',description:'Estrutura fechada e protegida, com interfaces preservadas para piso final, mezanino, docas e instalações futuras.',list:['Não pronta para ocupação','Nova mobilização e retrabalho possíveis','Decisões finais vinculadas ao locatário']}
};
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const setText=(id,text)=>{const el=$(id);if(el)el.textContent=text};
const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
const decimal=n=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const pct=n=>decimal(n)+'%';
let selectedPackage='integral';
function selectPackage(key){
  selectedPackage=key;const p=packages[key],total=p.unitValue*1200,saving=1620000-total;
  $('#package-panel').setAttribute('aria-labelledby',`tab-${key}`);
  $$('.package-tab').forEach(b=>{const active=b.dataset.package===key;b.classList.toggle('active',active);b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1});
  setText('#package-kicker',p.kicker);setText('#package-total',brl(total));setText('#package-unit',`R$ ${decimal(p.unitValue)}/m²`);setText('#package-term',p.term);setText('#package-state',p.state);setText('#scope-state',p.short);setText('#package-description',p.description);setText('#package-saving',saving?`ECONOMIA VS. INTEGRAL · ${brl(saving)} · ${pct(saving/1620000*100)}`:'REFERÊNCIA DE COMPARAÇÃO');setText('#proof-unit',brl(p.unitValue));setText('#proof-total',brl(total));$('#package-list').replaceChildren(...p.list.map(x=>{const li=document.createElement('li');li.textContent=x;return li}));
  $('.scope-drawing').dataset.state=key;
  $$('.scope-matrix thead th,.scope-matrix tbody td').forEach(el=>el.classList.remove('selected'));
  const col=['integral','estrutura','essencial'].indexOf(key)+2;$$(`.scope-matrix tr > :nth-child(${col})`).forEach(el=>el.classList.add('selected'));
  $$('.investment-row').forEach(b=>b.classList.toggle('selected',b.dataset.investment===key));
}
$$('.package-tab').forEach(btn=>{btn.addEventListener('click',()=>selectPackage(btn.dataset.package));btn.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...$$('.package-tab')],i=tabs.indexOf(btn),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;tabs[next].click();tabs[next].focus()})});selectPackage('integral');
$$('[data-investment]').forEach(b=>b.addEventListener('click',()=>selectPackage(b.dataset.investment)));
$$('[data-metric]').forEach(btn=>btn.addEventListener('click',()=>{const metric=btn.dataset.metric;$$('[data-metric]').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});$$('[data-investment]').forEach(row=>{const p=packages[row.dataset.investment],total=p.unitValue*1200,value=metric==='unit'?p.unitValue:metric==='saving'?1620000-total:total,max=metric==='unit'?1350:metric==='saving'?240000:1620000;row.querySelector('i').style.setProperty('--w',`${value/max*100}%`);row.querySelector('strong').textContent=brl(value)+(metric==='unit'?'/m²':'')})}));
function drawRecovery(annual){
  const svg=$('#recovery-chart');if(!svg)return;const ceiling=Math.max(annual*6,1620000)*1.1,x=t=>64+t/6*624,y=v=>238-v/ceiling*205;let markup='';
  for(let i=0;i<=6;i++)markup+=`<text x="${x(i)}" y="270" text-anchor="middle">${i} ano${i===1?'':'s'}</text>`;
  for(let i=0;i<=3;i++){const v=ceiling*i/3;markup+=`<path class="chart-grid" d="M64 ${y(v)}H688"/><text x="52" y="${y(v)+4}" text-anchor="end">${decimal(v/1000000)} mi</text>`}
  markup+=`<path class="investment-line" d="M64 ${y(1620000)}H688"/><path class="revenue-line" d="M64 238L688 ${y(annual*6)}"/>`;
  const crossing=1620000/annual;if(crossing<=6)markup+=`<circle cx="${x(crossing)}" cy="${y(1620000)}" r="6"/><text class="crossing-label" x="${x(crossing)}" y="${y(1620000)-15}" text-anchor="middle">${decimal(crossing)} anos</text>`;
  svg.innerHTML=markup;svg.setAttribute('aria-label',`Receita acumulada de ${brl(annual*6)} em seis anos. Cruzamento com investimento-base em ${decimal(crossing)} anos, antes das despesas excluídas.`);
}
function calculate(){const rent=Number($('#rent-range').value),vacancy=Number($('#vacancy-range').value);const monthly=rent*1200,annual=monthly*12*(1-vacancy/100),yieldValue=annual/1620000*100,payback=1620000/annual;setText('#rent-output',`R$ ${decimal(rent)}/m²`);setText('#vacancy-output',`${vacancy}%`);setText('#monthly-result',brl(monthly));setText('#annual-result',brl(annual));setText('#yield-result',pct(yieldValue));setText('#payback-result',decimal(payback));drawRecovery(annual);$$('[data-rent]').forEach(b=>b.classList.toggle('active',Number(b.dataset.rent)===rent))}
$('#rent-range').addEventListener('input',calculate);$('#vacancy-range').addEventListener('input',calculate);$$('[data-rent]').forEach(b=>b.addEventListener('click',()=>{$('#rent-range').value=b.dataset.rent;calculate()}));calculate();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(el=>observer.observe(el));
const header=$('.site-header'),progress=$('.rail-progress');function onScroll(){header.classList.toggle('scrolled',scrollY>40);const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max?scrollY/max*100:0}%`}addEventListener('scroll',onScroll,{passive:true});onScroll();
$('#copy-brief').addEventListener('click',async()=>{const pauta=`Pauta — Galpão BRAVIX 1.200 m²\nSetor Placa das Mercedes, Brasília–DF\n1. Confirmar lote e documentos\n2. Autorizar topografia e sondagem SPT\n3. Modalidade selecionada: ${selectedPackage==='estrutura'?'Estrutura+':selectedPackage==='essencial'?'Essencial':'Integral'} — ${brl(packages[selectedPackage].unitValue*1200)}\n4. Compatibilizar projetos e quantitativos\n5. Validar orçamento, contrato e mobilização`;try{await navigator.clipboard.writeText(pauta);$('#copy-brief').innerHTML='Pauta copiada <span>✓</span>'}catch{$('#copy-brief').textContent='Copie a pauta exibida abaixo';let pre=$('#brief-fallback');if(!pre){pre=document.createElement('pre');pre.id='brief-fallback';$('#copy-brief').after(pre)}pre.textContent=pauta;pre.tabIndex=0;pre.focus()}});
