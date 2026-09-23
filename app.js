const API_URL = 'https://script.google.com/macros/s/AKfycbwvuxyq5rt77QWxkflx4gdLNKLUiA7q2r2Gg2Zqgv2Sv52KmcJTJ7cNzdHAg3gw1Oa6/exec';

function api(params={}) {
  if (!API_URL.startsWith('https://script.google.com/macros/s/')) return Promise.reject(new Error('API URL is not configured.'));
  return new Promise((resolve,reject)=>{
    const callback='brainGainCallback_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');
    const timer=setTimeout(()=>finish(new Error('API timed out.')),20000);
    function finish(error,data){
      clearTimeout(timer); script.remove(); delete window[callback];
      error ? reject(error) : resolve(data);
    }
    window[callback]=data=>data && data.ok===false ? finish(new Error(data.error||'API error')) : finish(null,data);
    script.onerror=()=>finish(new Error('Could not reach the API.'));
    const url=new URL(API_URL);
    Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,String(value)));
    url.searchParams.set('callback',callback);
    url.searchParams.set('_',Date.now());
    script.src=url.toString(); document.head.append(script);
  });
}

const safeUrl=value=>{
  try { const u=new URL(String(value||'')); return ['https:','http:'].includes(u.protocol) ? u.href : ''; }
  catch { return ''; }
};

const state={
  recommended:[],
  watchlist:[],
  mode:'recommended',
  type:'All',
  query:'',
  open:null
};

const $=s=>document.querySelector(s);

const esc=s=>String(s??'').replace(
  /[&<>"']/g,
  c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c])
);

const attr=s=>esc(s);

const types=items=>[
  'All',
  ...new Set(
    items.map(x=>x.Type).filter(Boolean)
  )
];


function youtubeId(url=''){

  try{

    const u=new URL(url);

    if(u.hostname==='youtu.be'){
      return u.pathname.slice(1).split('/')[0];
    }

    if(u.hostname==='youtube.com'||u.hostname==='www.youtube.com'||u.hostname==='m.youtube.com'){

      if(u.pathname.startsWith('/watch')){
        return u.searchParams.get('v');
      }

      if(u.pathname.startsWith('/live/')){
        return u.pathname.split('/')[2];
      }

      if(u.pathname.startsWith('/embed/')){
        return u.pathname.split('/')[2];
      }
    }

  }catch(e){}

  return null;
}


function imageFor(x){

  if(safeUrl(x.Thumbnail)){
    return safeUrl(x.Thumbnail);
  }

  const id=youtubeId(x.Link);

  return id
    ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    : '';
}


function baseItems(){

  if(state.mode==='watchlist'){
    return state.watchlist;
  }

  if(state.mode==='liked'){
    return state.recommended.filter(x=>x.Liked);
  }

  if(state.mode==='watched'){
    return state.recommended.filter(x=>x.Watched);
  }

  // For You hides watched content.
  return state.recommended.filter(x=>!x.Watched);
}


function renderChips(){

  const source=baseItems();

  const ts=types(source);

  if(!ts.includes(state.type)){
    state.type='All';
  }

  $('#chips').innerHTML=ts.map(t=>
    `<button
      class="chip ${t===state.type?'active':''}"
      data-type="${attr(t)}"
    >${esc(t)}</button>`
  ).join('');

  document.querySelectorAll('.chip')
    .forEach(b=>b.onclick=()=>{
      state.type=b.dataset.type;
      render();
    });
}


function currentItems(){

  let a=baseItems();

  if(state.type!=='All'){
    a=a.filter(x=>x.Type===state.type);
  }

  const q=state.query.trim().toLowerCase();

  if(q){
    a=a.filter(x=>
      [
        x.Title,
        x.Type,
        x['Creator / Director'],
        x.Tags,
        x['Why / Note'],
        x['Based On']
      ]
      .join(' ')
      .toLowerCase()
      .includes(q)
    );
  }

  // NEWEST FIRST.
  return a.slice().sort(
    (a,b)=>Number(b._row)-Number(a._row)
  );
}


function render(){

  renderChips();

  const a=currentItems();

  $('#count').textContent=
    `${a.length} item${a.length===1?'':'s'}`;

  $('#modeLabel').textContent=
    state.mode==='recommended'
      ? 'Recommended'
      : state.mode==='liked'
      ? 'Liked'
      : state.mode==='watched'
      ? 'Watched'
      : 'Watchlist';

  $('#feed').innerHTML=
    a.length
      ? a.map(card).join('')
      : `<div class="empty">
          Nothing here. Your standards remain intact.
        </div>`;

  document.querySelectorAll('.card')
    .forEach(c=>c.onclick=e=>{

      if(
        e.target.closest('.like') ||
        e.target.closest('.watched')
      ){
        return;
      }

      openDetail(
        Number(c.dataset.row),
        c.dataset.source
      );
    });

  document.querySelectorAll('.like')
    .forEach(b=>b.onclick=e=>{

      e.stopPropagation();

      toggleLike(
        Number(b.dataset.row)
      );
    });

  document.querySelectorAll('.watched')
    .forEach(b=>b.onclick=e=>{

      e.stopPropagation();

      toggleWatched(
        Number(b.dataset.row)
      );
    });
}


function card(x){

  const img=imageFor(x);

  const src=
    state.mode==='watchlist'
      ? 'watchlist'
      : 'recommended';

  return `
    <article
      class="card"
      data-row="${x._row}"
      data-source="${src}"
    >

      ${
        img
          ? `<img
              class="thumb"
              loading="lazy"
              src="${attr(img)}"
              alt=""
            >`
          : `<div class="placeholder">
              ${esc((x.Title||'?').slice(0,1))}
            </div>`
      }

      ${
        src==='recommended'
          ? `<button
              class="like ${x.Liked?'on':''} ${x._busy?'busy':''}"
              data-row="${x._row}"
              aria-label="${x.Liked?'Unlike':'Like'}"
            >${x.Liked?'♥':'♡'}</button>`
          : ''
      }

      <div class="body">

        <div class="meta">
          <span class="type">
            ${esc(x.Type||'Content')}
          </span>

          <span>
            ${esc(x.Year||'')}
          </span>
        </div>

        <h2 class="title">
          ${esc(x.Title)}
        </h2>

        <div class="creator">
          ${esc(x['Creator / Director']||'')}
        </div>

        <p class="note">
          ${esc(x['Why / Note']||'')}
        </p>

        ${
          src==='recommended'
            ? `<button
                class="watched"
                data-row="${x._row}"
              >${
                x.Watched
                  ? '↩ Mark unwatched'
                  : '✓ Mark watched'
              }</button>`
            : ''
        }

        ${
          x.Score
            ? `<span class="score">
                ${esc(x.Score)}
              </span>`
            : ''
        }

      </div>

    </article>
  `;
}


async function changeState(row, field) {
  const x=state.recommended.find(v=>Number(v._row)===Number(row));
  if (!x || x._busy) return;
  const previous=Boolean(x[field]), next=!previous;
  x[field]=next; x._busy=true;
  $('#sync').textContent='syncing…'; render();
  try {
    const result=await api({action:field==='Liked'?'like':'watched',row,value:next,title:x.Title});
    x[field]=Boolean(result[field==='Liked'?'liked':'watched']);
    synced();
  } catch(err) {
    x[field]=previous; $('#sync').textContent='sync failed';
    alert(field+' did not sync: '+err.message);
  } finally { x._busy=false; render(); }
}

function toggleLike(row){ return changeState(row,'Liked'); }
function toggleWatched(row){ return changeState(row,'Watched'); }

function synced(){
  $('#sync').textContent='synced';
  setTimeout(()=>{ if($('#sync').textContent==='synced') $('#sync').textContent=''; },1400);
}

function openDetail(row,source){

  const a=
    source==='watchlist'
      ? state.watchlist
      : state.recommended;

  const x=a.find(
    v=>Number(v._row)===Number(row)
  );

  if(!x)return;

  state.open=x;

  const id=youtubeId(x.Link);
  const img=imageFor(x);
  const link=safeUrl(x.Link);

  $('#detailSheet').innerHTML=`

    <button
      class="close"
      aria-label="Close"
    >×</button>

    ${
      id
        ? `<iframe
            class="embed"
            src="https://www.youtube-nocookie.com/embed/${attr(id)}"
            title="${attr(x.Title)}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>`

        : img
        ? `<img
            class="hero"
            src="${attr(img)}"
            alt=""
          >`

        : `<div class="placeholder">
            ${esc((x.Title||'?').slice(0,1))}
          </div>`
    }

    <div class="detail">

      <div class="meta">

        <span class="type">
          ${esc(x.Type||'Content')}
        </span>

        <span>
          ${esc(x.Year||'')}
        </span>

        ${
          x.Score
            ? `<span>• ${esc(x.Score)}</span>`
            : ''
        }

      </div>

      <h2>
        ${esc(x.Title)}
      </h2>

      <div class="creator">
        ${esc(x['Creator / Director']||'')}
      </div>

      <div class="detailgrid">
        ${
          String(x.Tags||'')
            .split(/[;,]/)
            .map(t=>t.trim())
            .filter(Boolean)
            .map(t=>
              `<span class="pill">
                ${esc(t)}
              </span>`
            )
            .join('')
        }
      </div>

      <div class="description">
        ${esc(
          x['Why / Note']||
          'No description yet.'
        )}
      </div>

      ${
        x['Based On']
          ? `<div class="based">
              <b>Based on:</b>
              ${esc(x['Based On'])}
            </div>`
          : ''
      }

      <div class="actions">

        ${
          source==='recommended'
            ? `<button
                class="action"
                id="detailLike"
              >${
                x.Liked
                  ? '♥ Liked'
                  : '♡ Like'
              }</button>

              <button
                class="action"
                id="detailWatched"
              >${
                x.Watched
                  ? '↩ Unwatch'
                  : '✓ Watched'
              }</button>`
            : ''
        }

        ${
          link
            ? `<a
                class="action primary"
                href="${attr(link)}"
                target="_blank"
                rel="noopener"
              >Open on ${esc(x.Platform||'platform')} ↗</a>`
            : ''
        }

      </div>

    </div>
  `;

  $('#modal').classList.add('open');

  $('.close').onclick=closeDetail;

  const dl=$('#detailLike');

  if(dl){
    dl.onclick=()=>{
      closeDetail();
      toggleLike(row);
    };
  }

  const dw=$('#detailWatched');

  if(dw){
    dw.onclick=()=>{
      closeDetail();
      toggleWatched(row);
    };
  }
}


function closeDetail(){

  $('#modal').classList.remove('open');

  state.open=null;
}


$('#modal').onclick=e=>{

  if(e.target===$('#modal')){
    closeDetail();
  }
};


document.addEventListener(
  'keydown',
  e=>{
    if(e.key==='Escape'){
      closeDetail();
    }
  }
);


$('#search').oninput=e=>{

  state.query=e.target.value;

  render();
};


document.querySelectorAll('.tab')
  .forEach(b=>b.onclick=()=>{

    document.querySelectorAll('.tab')
      .forEach(x=>
        x.classList.remove('active')
      );

    b.classList.add('active');

    state.mode=b.dataset.mode;

    state.type='All';

    render();
  });


async function refreshLibrary(){
  $('#refresh').classList.add('busy');
  $('#sync').textContent='refreshing…';
  try {
    const data=await api({action:'list'});
    state.recommended=data.recommended||[];
    state.watchlist=data.watchlist||[];
    $('#sync').textContent='updated'; render();
    setTimeout(()=>{ if($('#sync').textContent==='updated') $('#sync').textContent=''; },1400);
  } catch(err) {
    $('#sync').textContent='refresh failed';
    if(!state.recommended.length && !state.watchlist.length)
      $('#feed').innerHTML='<div class="empty">Couldn’t read the Sheet.<br><small>'+esc(err.message)+'</small></div>';
  } finally { $('#refresh').classList.remove('busy'); }
}

$('#refresh').onclick=refreshLibrary;
refreshLibrary();
