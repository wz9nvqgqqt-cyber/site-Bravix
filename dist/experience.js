const one=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const photos=[
  ['fachada-dia','Fachada diurna','Dois acessos frontais e a operação de carga na lateral.'],
  ['implantacao','Implantação','Uma leitura do conjunto: acesso, pátio de manobra e edifício.'],
  ['estrutura','Estrutura e envelope','Cobertura, pórticos e fechamento em corte conceitual.'],
  ['operacao-corte','Organização operacional','Armazenagem, circulação e núcleo de apoio vistos de cima.'],
  ['interior-acessos','Interior · acessos','Vão livre e a relação entre recebimento e armazenagem.'],
  ['interior-docas','Interior · docas','Conexão entre o espaço operacional, as docas e o mezanino.'],
  ['mezanino','Mezanino e apoio','Apoio administrativo sobre o núcleo sanitário.'],
  ['docas','Duas docas','Interface de carga lateral sob a marquise.'],
  ['fachada-entardecer','Fachada · entardecer','A volumetria do galpão sob a luz do fim de tarde.'],
  ['fachada-noite','Fachada · noite','Leitura noturna dos acessos e da circulação externa.']
];
let photoIndex=0,suppressGalleryClickUntil=0;
const dialog=one('#image-dialog');
const rail=one('#gallery-rail');
photos.forEach(([name,title],i)=>{const btn=document.createElement('button');btn.className='gallery-thumb';btn.setAttribute('aria-label',`Perspectiva ${i+1}: ${title}`);btn.innerHTML=`<img src="assets/media/${name}-thumb.webp" width="320" height="180" loading="lazy" decoding="async" alt=""><span>${String(i+1).padStart(2,'0')} / ${title}</span>`;btn.addEventListener('click',()=>selectPhoto(i));rail.append(btn)});
function selectPhoto(index){
  photoIndex=(index+photos.length)%photos.length;const [name,title,description]=photos[photoIndex];
  one('#gallery-picture source').srcset=`assets/media/${name}.avif`;one('#gallery-image').src=`assets/media/${name}.webp`;one('#gallery-image').alt=`${title}. ${description}`;
  one('#gallery-counter').textContent=`${String(photoIndex+1).padStart(2,'0')} / 10`;one('#gallery-title').textContent=title;one('#gallery-description').textContent=description;
  all('.gallery-thumb').forEach((b,i)=>{b.classList.toggle('active',i===photoIndex);b.setAttribute('aria-pressed',i===photoIndex)});
  const thumb=rail.children[photoIndex],left=thumb.offsetLeft-rail.offsetLeft;
  if(left<rail.scrollLeft||left+thumb.offsetWidth>rail.scrollLeft+rail.clientWidth)rail.scrollTo({left:Math.max(0,left-20),behavior:reduced?'instant':'smooth'});
  if(dialog.open){one('#dialog-image').src=`assets/media/${name}.webp`;one('#dialog-image').alt=`${title}. ${description}`;one('#dialog-caption').textContent=`${String(photoIndex+1).padStart(2,'0')} / 10 — ${title}`}
}
one('#gallery-prev').onclick=()=>selectPhoto(photoIndex-1);one('#gallery-next').onclick=()=>selectPhoto(photoIndex+1);selectPhoto(0);
one('#open-gallery').onclick=()=>{if(performance.now()<suppressGalleryClickUntil)return;dialog.showModal();selectPhoto(photoIndex)};
one('#dialog-close').onclick=()=>dialog.close();one('#dialog-prev').onclick=()=>selectPhoto(photoIndex-1);one('#dialog-next').onclick=()=>selectPhoto(photoIndex+1);
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();selectPhoto(photoIndex+1)}if(e.key==='ArrowLeft'){e.preventDefault();selectPhoto(photoIndex-1)}});
let touchX=0;one('#gallery-picture').addEventListener('touchstart',e=>{touchX=e.touches[0].clientX},{passive:true});one('#gallery-picture').addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchX;if(Math.abs(delta)>60){suppressGalleryClickUntil=performance.now()+500;selectPhoto(photoIndex+(delta<0?1:-1))}},{passive:true});

const film=one('#project-film');let filmReady=false;
function loadFilm(){if(filmReady)return;filmReady=true;const small=innerWidth<768||navigator.connection?.saveData;film.src=`assets/media/filme-galpao${small?'-mobile':''}.mp4`;film.load()}
async function playFilm(seek){loadFilm();one('#film-play').hidden=true;if(Number.isFinite(seek)){if(film.readyState>0)film.currentTime=seek;else film.addEventListener('loadedmetadata',()=>{film.currentTime=seek},{once:true})}try{await film.play()}catch{one('#film-play').hidden=false}}
one('#film-play').onclick=()=>playFilm();all('[data-seek]').forEach(b=>b.onclick=()=>playFilm(Number(b.dataset.seek)));
film.addEventListener('play',()=>{one('#film-play').hidden=true});film.addEventListener('timeupdate',()=>{all('[data-seek]').forEach((b,i,arr)=>{const on=film.currentTime>=Number(b.dataset.seek)&&film.currentTime<(arr[i+1]?Number(arr[i+1].dataset.seek):39);b.classList.toggle('active',on)})});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&!film.paused)film.pause()},{threshold:.05}).observe(film);
document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause()});
one('#load-map').addEventListener('click',()=>{const host=one('#map-host');host.hidden=false;const frame=document.createElement('iframe');frame.title='Mapa regional do Setor Placa das Mercedes em Brasília';frame.src='https://maps.google.com/maps?q=Setor%20Placa%20das%20Mercedes%20Nucleo%20Bandeirante%20Brasilia%20DF&z=15&output=embed';frame.referrerPolicy='no-referrer-when-downgrade';host.replaceChildren(frame);one('.map-placeholder').hidden=true});

const records=[
  {region:'ADE Brasília',area:800,rent:20000,source:'https://www.vivareal.com.br/aluguel/distrito-federal/brasilia/galpao_comercial/'},
  {region:'Samambaia Norte · anúncio 1',area:1200,rent:23000,source:'https://yahoo.imovelweb.com.br/comerciais-galpao-deposito-barracao-aluguel-samambaia-norte-samambaia.html'},
  {region:'Samambaia Norte · anúncio 2',area:1200,rent:30000,source:'https://yahoo.imovelweb.com.br/comerciais-galpao-deposito-barracao-aluguel-samambaia-norte-samambaia.html'},
  {region:'ADE Samambaia',area:1000,rent:40000,source:'https://www.vivareal.com.br/aluguel/distrito-federal/brasilia/galpao_comercial/'},
  {region:'Zona Industrial · SCIA',area:1250,rent:50000,source:'https://www.vivareal.com.br/aluguel/distrito-federal/brasilia/galpao_comercial/'},
  {region:'Zona Industrial',area:1500,rent:45000,source:'https://www.vivareal.com.br/aluguel/distrito-federal/brasilia/galpao_comercial/'},
  {region:'SCIA',area:1450,rent:60000,source:'https://www.vivareal.com.br/aluguel/distrito-federal/brasilia/galpao_comercial/'}
];
const currency=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n),dec=n=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
one('#market-plot').innerHTML='<span class="plot-min">19,17</span><span class="plot-max">41,38</span><div class="median-guide"><span>MEDIANA / 30,00</span></div>';
function selectRecord(i){const d=records[i];one('#market-detail').innerHTML=`<span>${String(i+1).padStart(2,'0')} / ${d.region}</span><strong>R$ ${dec(d.rent/d.area)}/m²</strong><p>${d.area.toLocaleString('pt-BR')} m² · ${currency(d.rent)}/mês pedido</p><a href="${d.source}" target="_blank" rel="noopener">Consultar página-fonte ↗</a>`;all('.market-dot').forEach((b,j)=>{b.classList.toggle('active',j===i);b.setAttribute('aria-pressed',j===i)})}
records.forEach((d,i)=>{const b=document.createElement('button');b.className='market-dot';b.style.setProperty('--x',`${8+i*14}%`);b.style.setProperty('--y',`${12+(d.rent/d.area-19.1667)/(41.3793-19.1667)*76}%`);b.setAttribute('aria-label',`${d.region}, ${d.area} metros quadrados, ${dec(d.rent/d.area)} reais por metro quadrado`);b.innerHTML=`<span>0${i+1}</span>`;b.onclick=()=>selectRecord(i);b.onfocus=()=>selectRecord(i);one('#market-plot').append(b);const row=document.createElement('div');row.className='source-row';row.innerHTML=`<span>0${i+1}</span><div>${d.region} · ${d.area} m² · ${currency(d.rent)}/mês</div><a href="${d.source}" target="_blank" rel="noopener">Fonte ↗</a>`;one('#market-sources').append(row)});
const segments=['3 de 10 empresas: assistência, equipamentos e serviços técnicos. Não mede demanda efetiva por locação.','2 de 10 empresas: atividades automotivas. Usos e adaptações dependem do perfil do ocupante.','2 de 10 empresas: materiais de construção e comércio relacionado.','3 de 10 empresas: distribuição (1), indústria (1) e administração (1).'];
all('[data-segment]').forEach(b=>b.onclick=()=>{one('#segment-detail').textContent=segments[Number(b.dataset.segment)];all('[data-segment]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});one('.donut span').firstChild.textContent=[3,2,2,3][Number(b.dataset.segment)];one('.donut small').textContent='de 10 empresas'});

const phases=[
  ['DEFINIÇÃO','Congelar a base do projeto.','Confirmar lote, documentos e premissas para levantar quantitativos consistentes.','Definir perfil de ocupante e posicionamento antes de iniciar a prospecção.'],
  ['FUNDAÇÕES','Preparar o terreno e as bases.','Mobilização, execução das fundações compatibilizadas e liberação dos apoios. Solo e topografia podem alterar esta etapa.','Preparar teaser técnico e iniciar contato com uma lista qualificada.'],
  ['ESTRUTURA','Montar a estrutura metálica.','Recebimento, montagem e conferência dos pórticos, contraventamentos e interfaces.','Produzir material visual e apresentar o produto a interessados aderentes.'],
  ['ENVELOPE','Fechar e proteger o edifício.','Cobertura, fechamentos e drenagem imediata. Inspeções acompanham a montagem.','Organizar visitas técnicas e captar requisitos de ocupação.'],
  ['PISO + DOCAS','Consolidar as interfaces operacionais.','Piso e soluções civis de doca conforme cargas, cotas e projetos aprovados.','Compatibilizar adaptações reversíveis com o interessado qualificado.'],
  ['INSTALAÇÕES','Completar o escopo contratado.','Instalações básicas, núcleo de apoio e complementos previstos na modalidade selecionada.','Negociar condições e documentar responsabilidades de cada parte.'],
  ['ENTREGA','Conferir, registrar e entregar.','Inspeção do escopo, testes previstos e documentação. Licenças e ocupação exigem validações específicas.','Preparar a transição para o ocupante. Locação não é garantida pelo cronograma.']
];
all('[data-month]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.month),p=phases[i];one('#phase-index').textContent=`M${i} / ${p[0]}`;one('#phase-title').textContent=p[1];one('#phase-description').textContent=p[2];one('#phase-commercial').textContent=p[3];all('[data-month]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)})});

let model=null,loadingModel=false;
const modelObserver=new IntersectionObserver(async entries=>{if(!entries.some(e=>e.isIntersecting)||loadingModel)return;loadingModel=true;modelObserver.disconnect();try{const {initBlueprint}=await import('./blueprint.js');model=await initBlueprint(one('#model-canvas'));all('[data-explode]').forEach(b=>b.onclick=()=>{model?.setExplosion(Number(b.dataset.explode));one('#explode-output').textContent=b.dataset.explode+'%';all('[data-explode]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)})})}catch{one('#model-status').textContent='Veja o estudo técnico na imagem de referência; o modelo não iniciou neste dispositivo.'}},{rootMargin:'250px'});modelObserver.observe(one('#model-canvas'));
one('#explode-range').addEventListener('input',e=>{one('#explode-output').textContent=e.target.value+'%';all('[data-explode]').forEach(b=>b.classList.toggle('active',Math.abs(Number(b.dataset.explode)-Number(e.target.value))<12))});
one('#model-reset').addEventListener('click',()=>{one('#explode-output').textContent='0%';all('[data-explode]').forEach(b=>b.classList.toggle('active',b.dataset.explode==='0'))});
addEventListener('pagehide',()=>{model?.dispose();film.pause()},{once:true});

function motion(){
  if(reduced||!window.gsap||!window.ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.visual-chapter .editorial-heading, .film-heading, .construction-steps, .scope-matrix-wrap, .recovery-panel, .phase-detail, .locality-grid').forEach(el=>gsap.from(el,{y:26,opacity:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
  gsap.from('.section-diagram .frame',{strokeDasharray:3000,strokeDashoffset:3000,duration:1.6,ease:'power2.out',scrollTrigger:{trigger:'.section-diagram',start:'top 85%',once:true}});
  ScrollTrigger.refresh();
}
if(document.readyState==='complete')motion();else addEventListener('load',motion,{once:true});
