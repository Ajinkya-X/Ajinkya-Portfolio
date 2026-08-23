(function(){
  "use strict";
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none)").matches || "ontouchstart" in window;

  /* ---------------- PRELOADER ---------------- */
  addEventListener("load", () => setTimeout(hidePre, reduce ? 60 : 850));
  setTimeout(hidePre, 3500); // safety net
  function hidePre(){ const p=$("#preloader"); if(p) p.classList.add("done"); }

  /* Depth counter on the preloader: runs down to the sea floor while the page
     loads, so the wait reads as a descent instead of a spinner. */
  (function plDepth(){
    const el=$("#plDepth"); if(!el) return;
    if(reduce){ el.textContent="6 000"; return; }
    const t0=performance.now(), dur=1800;
    (function step(now){
      const p=Math.min((now-t0)/dur,1), e=1-Math.pow(1-p,2);
      el.textContent=Math.round(e*6000).toLocaleString("en-US").replace(",", " ");
      if(p<1) requestAnimationFrame(step);
    })(t0);
  })();

  /* ---------------- THEME ---------------- */
  const root = document.documentElement, themeBtn = $("#themeBtn");
  const setTheme = t => t==="light" ? root.setAttribute("data-theme","light") : root.removeAttribute("data-theme");
  try { const s=localStorage.getItem("theme"); if(s) setTheme(s); } catch(e){}
  themeBtn && themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme")==="light" ? "dark" : "light";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch(e){}
  });

  /* ---------------- CUSTOM CURSOR ---------------- */
  if(!isTouch){
    const dot=$(".cursor-dot"), ring=$(".cursor-ring");
    let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
    addEventListener("mousemove", e => { mx=e.clientX; my=e.clientY; if(dot){dot.style.left=mx+"px";dot.style.top=my+"px";} });
    (function loop(){ rx+=(mx-rx)*.2; ry+=(my-ry)*.2; if(ring){ring.style.left=rx+"px";ring.style.top=ry+"px";} requestAnimationFrame(loop); })();
    const H="a,button,input,textarea,[data-cursor],.card,.chip,.filter";
    document.addEventListener("mouseover", e => { if(ring && e.target.closest(H)) ring.classList.add("hover"); });
    document.addEventListener("mouseout",  e => { if(ring && e.target.closest(H)) ring.classList.remove("hover"); });
  }

  /* ---------------- RIPPLE ----------------
     Pointer-down drops a ring that expands and fades, the way a touch on
     still water behaves. Cheap: one element, removed when it finishes.   */
  if(!reduce){
    addEventListener("pointerdown", e => {
      const r=document.createElement("span");
      r.className="ripple";
      r.style.left=e.clientX+"px"; r.style.top=e.clientY+"px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 800);
    }, {passive:true});
  }

  /* ---------------- NAV / SCROLL ---------------- */
  const nav=$("#nav"), burger=$("#burger"), navLinks=$("#navLinks"), progress=$("#progress"), toTop=$("#toTop");
  const sections=$$("section[id]"), navItems=$$("#navLinks a");
  /* ---------------- MAGNETIC NAV INDICATOR ----------------
     Tracks the hovered link, settles on the active section on mouse-out.
     Transform/width only, so it stays on the compositor.               */
  const indicator=$("#navIndicator"), sectionLinks=$$('#navLinks a[href^="#"]');
  function placeIndicator(el){
    if(!indicator || !el) return;
    if(innerWidth<=900){ indicator.style.opacity="0"; return; }
    indicator.style.width = el.offsetWidth + "px";
    indicator.style.transform = "translate3d(" + el.offsetLeft + "px,-50%,0)";
    indicator.style.opacity = "1";
  }
  function moveIndicator(){
    const active = sectionLinks.find(a => a.classList.contains("active"));
    if(active) placeIndicator(active);
    else if(indicator) indicator.style.opacity="0";
  }
  sectionLinks.forEach(a => {
    a.addEventListener("mouseenter", () => placeIndicator(a));
    a.addEventListener("focus",      () => placeIndicator(a));
  });
  navLinks && navLinks.addEventListener("mouseleave", moveIndicator);
  addEventListener("resize", moveIndicator);
  // fonts land after first paint and change link widths, so re-measure
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

  /* ---------------- DEPTH (the dive) ----------------
     Scroll position becomes depth: --depth goes 0 -> 1 on the root element,
     so CSS can darken the water, and the gauge reports real metres and the
     actual oceanographic zone you are passing through.                     */
  const drRead=$("#drRead"), drZone=$("#drZone"), sounderRead=$("#sounderRead");
  const ZONES=[[.24,"Sunlight"],[.48,"Twilight"],[.72,"Midnight"],[.93,"Abyss"],[1.01,"Hadal"]];
  const FLOOR=6000;                       // metres at the bottom of the page
  let zoneNow="";
  function setDepth(p){
    root.style.setProperty("--depth", p.toFixed(4));
    const m=Math.round(p*FLOOR/10)*10;
    const txt=m.toLocaleString("en-US").replace(",", " ");
    if(drRead) drRead.textContent=txt;
    if(sounderRead) sounderRead.textContent=txt;
    let z=ZONES[ZONES.length-1][1];
    for(const [lim,name] of ZONES){ if(p<lim){ z=name; break; } }
    if(z!==zoneNow){
      zoneNow=z;
      // the wildlife in .water is gated on this attribute, so the creatures
      // and the gauge can never disagree about which zone you are in
      root.dataset.zone = z.toLowerCase();
      if(drZone){ drZone.textContent=z; drZone.classList.remove("flip");
        void drZone.offsetWidth; drZone.classList.add("flip"); }
    }
  }
  let lastY=scrollY;
  function onScroll(){
    const h=document.documentElement, y=scrollY;
    if(progress) progress.style.transform = "scaleX(" + ((h.scrollTop/(h.scrollHeight-h.clientHeight))||0) + ")";
    if(nav){
      nav.classList.toggle("scrolled", y>30);
      // hide while scrolling down, bring it back on the way up (never while the
      // mobile menu is open, or the close button would vanish)
      const menuOpen = navLinks && navLinks.classList.contains("open");
      if(!menuOpen && y>260 && y>lastY+6)      nav.classList.add("nav-hidden");
      else if(menuOpen || y<lastY-6 || y<=260) nav.classList.remove("nav-hidden");
    }
    const max=h.scrollHeight-h.clientHeight;
    setDepth(max>0 ? Math.min(Math.max(y/max,0),1) : 0);
    if(toTop) toTop.classList.toggle("show", y>560);
    let cur=""; const pos=y+innerHeight*0.35;
    sections.forEach(s => { if(s.offsetTop<=pos) cur=s.id; });
    navItems.forEach(a => a.classList.toggle("active", a.getAttribute("href")==="#"+cur));
    moveIndicator();
    lastY = y<0 ? 0 : y;
  }
  let ticking=false;
  addEventListener("scroll", () => { if(!ticking){ requestAnimationFrame(()=>{onScroll();ticking=false;}); ticking=true; } }, {passive:true});
  onScroll();

  burger && burger.addEventListener("click", () => {
    const open=navLinks.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if(open) nav && nav.classList.remove("nav-hidden");
  });
  const surface = () => scrollTo({top:0, behavior: reduce?"auto":"smooth"});
  toTop && toTop.addEventListener("click", surface);
  const fSurface=$("#fSurface");
  fSurface && fSurface.addEventListener("click", surface);

  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id=a.getAttribute("href");
    if(id.length>1){
      const el=document.querySelector(id);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior: reduce?"auto":"smooth", block:"start"});
        navLinks && navLinks.classList.remove("open");
        if(burger){ burger.classList.remove("open"); burger.setAttribute("aria-expanded","false"); burger.setAttribute("aria-label","Open menu"); }
        document.body.style.overflow="";
      }
    }
  }));

  /* ---------------- REVEAL ON SCROLL ---------------- */
  const revEls=$$(".reveal");
  if("IntersectionObserver" in window && !reduce){
    const io=new IntersectionObserver((ents)=>{
      ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, {threshold:.12, rootMargin:"0px 0px -8% 0px"});
    revEls.forEach(el=>io.observe(el));
  } else revEls.forEach(el=>el.classList.add("in"));

  /* ---------------- STAT COUNTERS ---------------- */
  function count(el){
    const target=+el.dataset.count, suf=el.dataset.suffix||"";
    if(reduce){ el.textContent=target+suf; return; }
    const dur=1500, t0=performance.now();
    (function step(now){
      const p=Math.min((now-t0)/dur,1), e=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*e)+suf;
      if(p<1) requestAnimationFrame(step); else el.textContent=target+suf;
    })(t0);
  }
  const nums=$$(".num[data-count]");
  if("IntersectionObserver" in window){
    const io2=new IntersectionObserver((ents)=>ents.forEach(en=>{ if(en.isIntersecting){count(en.target);io2.unobserve(en.target);} }), {threshold:.6});
    nums.forEach(n=>io2.observe(n));
  } else nums.forEach(count);

  /* ---------------- ROTATING ROLE ---------------- */
  const roleEl=$("#role");
  const roles=["Full stack Java developer","Java \u00b7 SQL \u00b7 JavaScript","Graduating 2026"];
  if(roleEl && !reduce){
    let ri=0,ci=0,del=false; roleEl.textContent="";
    (function type(){
      const w=roles[ri];
      ci += del ? -1 : 1;
      roleEl.textContent = w.slice(0,ci);
      if(!del && ci===w.length){ del=true; return setTimeout(type,1700); }
      if(del && ci===0){ del=false; ri=(ri+1)%roles.length; }
      setTimeout(type, del?40:80);
    })();
  }

  /* ---------------- 3D TILT (cards) ---------------- */
  if(!isTouch && !reduce){
    $$(".tilt").forEach(el => {
      el.addEventListener("mousemove", e => {
        const r=el.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
        el.style.transform="perspective(900px) rotateX("+((0.5-py)*10).toFixed(2)+"deg) rotateY("+((px-0.5)*12).toFixed(2)+"deg)";
        el.style.setProperty("--mx",(px*100)+"%");
        el.style.setProperty("--my",(py*100)+"%");
      });
      el.addEventListener("mouseleave", () => { el.style.transform=""; });
    });
  }

  /* ---------------- PROJECT FILTER ---------------- */
  const filters=$$("#filters .filter"), cards=$$("#projGrid .card");
  filters.forEach(btn => btn.addEventListener("click", () => {
    filters.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const f=btn.dataset.f;
    cards.forEach(c => {
      const show = f==="all" || (c.dataset.tags||"").split(" ").includes(f);
      c.classList.toggle("hide", !show);
    });
  }));

  /* ---------------- PROJECT DETAIL MODAL ---------------- */
  const projects=[
    { title:"AI-Powered Smart Interview Assistant",
      role:"Java \u00b7 JavaScript \u00b7 full stack",
      desc:"Interview practice that pushes back. You pick a role, it asks questions for that role, takes your answer and returns specific feedback rather than a score. The point was to make a rehearsal cost something, because the ones that feel easy do not prepare you.",
      highlights:["Questions adapt to the role you choose","Feedback on every answer, not a final score","Java driving the logic underneath","Responsive Bootstrap interface on top"],
      tags:["Java","JavaScript","Bootstrap","HTML/CSS","AI"] },
    { title:"Packet Food Ingredient Rating System",
      role:"Web app \u00b7 OCR \u00b7 public API",
      desc:"Point it at a barcode and it tells you what you are about to eat. It looks the product up through the Open Food Facts API, reads the ingredient list, and turns that wall of chemical names into one number you can decide on while standing in the aisle.",
      highlights:["Barcode / QR scanning with OCR","Live product lookup via Open Food Facts API","Ingredient parsing into a readable health score","Flask back end serving a lightweight web UI"],
      tags:["Python","Flask","OCR","Barcode / QR","Open Food Facts API"] },
    { title:"Extract Text From Image (OCR)",
      role:"Utility \u00b7 OCR",
      desc:"A small tool that lifts text off an image and hands it back as something you can edit. I built it after retyping the same page of handwritten notes twice, which was exactly one time too many.",
      highlights:["Optical Character Recognition pipeline","Handles varied image sources","Outputs clean, copy-ready text"],
      tags:["Python","OCR","Image Processing"] }
  ];
  const modalBack=$("#modalBack"), modalClose=$("#modalClose");
  const mTitle=$("#mTitle"), mRole=$("#mRole"), mDesc=$("#mDesc"), mHigh=$("#mHigh"), mTags=$("#mTags");
  const checkSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';
  function openModal(i){
    const p=projects[i]; if(!p||!modalBack) return;
    mTitle.textContent=p.title; mRole.textContent=p.role; mDesc.textContent=p.desc;
    mHigh.innerHTML=p.highlights.map(h=>"<li>"+checkSvg+"<span>"+h+"</span></li>").join("");
    mTags.innerHTML=p.tags.map(t=>"<span>"+t+"</span>").join("");
    modalBack.classList.add("open"); modalBack.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }
  function closeModal(){ if(!modalBack) return; modalBack.classList.remove("open"); modalBack.setAttribute("aria-hidden","true"); document.body.style.overflow=""; }
  $$(".js-detail").forEach(b => b.addEventListener("click", () => openModal(+b.dataset.proj)));
  modalClose && modalClose.addEventListener("click", closeModal);
  modalBack && modalBack.addEventListener("click", e => { if(e.target===modalBack) closeModal(); });
  addEventListener("keydown", e => { if(e.key==="Escape") closeModal(); });

  /* ---------------- TOAST ---------------- */
  const toastWrap=$("#toast-wrap");
  function toast(msg){
    if(!toastWrap) return;
    const t=document.createElement("div");
    t.className="toast";
    t.innerHTML=checkSvg+"<span>"+msg+"</span>";
    toastWrap.appendChild(t);
    requestAnimationFrame(()=>t.classList.add("show"));
    setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(),400); }, 3200);
  }

  /* ---------------- COPY EMAIL ---------------- */
  const copyBtn=$("#copyEmail");
  copyBtn && copyBtn.addEventListener("click", async () => {
    const email="ajinkaya01@gmail.com";
    try{ await navigator.clipboard.writeText(email); }
    catch(e){ const ta=document.createElement("textarea"); ta.value=email; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(_){} ta.remove(); }
    copyBtn.textContent="copied!";
    toast("Email copied to clipboard");
    setTimeout(()=>copyBtn.textContent="copy",1800);
  });

  /* ---------------- CONTACT FORM ---------------- */
  const form=$("#contactForm");
  if(form){
    const name=$("#cName"), email=$("#cEmail"), msg=$("#cMsg");
    const field=el=>el.closest(".form-field");
    const setErr=(el,bad)=>field(el).classList.toggle("err",bad);
    [name,email,msg].forEach(el=>el.addEventListener("input",()=>field(el).classList.remove("err")));
    form.addEventListener("submit", e => {
      e.preventDefault();
      const okName=name.value.trim().length>0;
      const okMail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      const okMsg=msg.value.trim().length>=10;
      setErr(name,!okName); setErr(email,!okMail); setErr(msg,!okMsg);
      if(!(okName&&okMail&&okMsg)) return;
      const subject=encodeURIComponent("Portfolio contact from "+name.value.trim());
      const body=encodeURIComponent(name.value.trim()+" <"+email.value.trim()+">\n\n"+msg.value.trim());
      window.location.href="mailto:ajinkaya01@gmail.com?subject="+subject+"&body="+body;
      toast("Opening your email app…");
      form.reset();
    });
  }

  /* ---------------- SKILL SPHERE (3D tag cloud) ---------------- */
  const sphere=$("#skill-sphere");
  if(sphere){
    const tags=["Java","Core Java","Advanced Java","JavaScript","HTML5","CSS3","Bootstrap","SQL","JDBC","REST APIs","OOP","Git","GitHub","C","Responsive UI"];
    const N=tags.length;
    const pts=tags.map((t,i)=>{
      const span=document.createElement("span");
      span.className="s-tag"; span.textContent=t; sphere.appendChild(span);
      const phi=Math.acos(1-2*(i+0.5)/N), th=Math.PI*(1+Math.sqrt(5))*(i+0.5);
      return { span, x:Math.sin(phi)*Math.cos(th), y:Math.sin(phi)*Math.sin(th), z:Math.cos(phi) };
    });
    const radius=()=>Math.min(sphere.clientWidth, sphere.clientHeight)/2 - 26;
    let ax=0,ay=0,tax=0.2,tay=0, drag=false,lx,ly, raf=null;
    if(!isTouch || true){
      sphere.addEventListener("pointerdown", e=>{ drag=true; lx=e.clientX; ly=e.clientY; try{sphere.setPointerCapture(e.pointerId);}catch(_){} });
      sphere.addEventListener("pointermove", e=>{ if(!drag) return; tay+=(e.clientX-lx)*0.005; tax-=(e.clientY-ly)*0.005; lx=e.clientX; ly=e.clientY; });
      ["pointerup","pointercancel","pointerleave"].forEach(ev=>sphere.addEventListener(ev,()=>drag=false));
    }
    function frame(){
      if(!drag && !reduce){ tay+=0.0038; tax+=0.0006; }
      ax+=(tax-ax)*0.1; ay+=(tay-ay)*0.1;
      const sx=Math.sin(ax),cx=Math.cos(ax),sy=Math.sin(ay),cy=Math.cos(ay), r=radius();
      for(const p of pts){
        const x1=p.x*cy - p.z*sy, z1=p.x*sy + p.z*cy;
        const y2=p.y*cx - z1*sx,  z2=p.y*sx + z1*cx;
        const sc=(z2+1.7)/2.7;
        p.span.style.transform="translate(-50%,-50%) translate3d("+(x1*r).toFixed(1)+"px,"+(y2*r).toFixed(1)+"px,0) scale("+sc.toFixed(3)+")";
        p.span.style.opacity=(0.4+sc*0.6).toFixed(3);
        p.span.style.zIndex=Math.round(sc*100);
      }
      raf=requestAnimationFrame(frame);
    }
    frame();
    // pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if(document.hidden){ if(raf) cancelAnimationFrame(raf); raf=null; }
      else if(!raf) frame();
    });
  }

  /* ---------------- MARINE SNOW (hero) ----------------
     Not a constellation: marine snow. Particles sink slowly, sway on a slow
     current, and part around the pointer as if it displaced the water. If
     WebGL is unavailable the CSS water layers still carry the hero, so this
     failing is a downgrade rather than an empty screen.                    */
  (function initSnow(){
    const canvas=$("#bg-canvas");
    if(!canvas || typeof THREE==="undefined" || reduce) return;
    let renderer, scene, camera, points, raf=null, W=0, H=0;
    const COUNT = innerWidth<720 ? 90 : 190;
    const SPREAD_X=120, SPREAD_Y=90, SPREAD_Z=70;

    try{
      renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    }catch(e){ return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.z=60;

    const pos=new Float32Array(COUNT*3);
    const grit=[];                                  // per-particle drift state
    for(let i=0;i<COUNT;i++){
      const p={
        x:(Math.random()-0.5)*SPREAD_X,
        y:(Math.random()-0.5)*SPREAD_Y,
        z:(Math.random()-0.5)*SPREAD_Z,
        fall:0.045+Math.random()*0.075,             // sink rate
        seed:Math.random()*Math.PI*2,               // sway phase
        amp:0.10+Math.random()*0.26,                // sway width
        px:0, py:0                                  // displacement from pointer
      };
      grit.push(p);
      pos[i*3]=p.x; pos[i*3+1]=p.y; pos[i*3+2]=p.z;
    }

    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({
      color:0xBFF7F0, size:0.95, transparent:true, opacity:0.55,
      sizeAttenuation:true, depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    points=new THREE.Points(geo, mat);
    scene.add(points);

    /* pointer, in normalised device coords */
    let ndcX=0, ndcY=0, havePointer=false;
    if(!isTouch){
      addEventListener("pointermove", e => {
        ndcX=(e.clientX/innerWidth)*2-1;
        ndcY=-((e.clientY/innerHeight)*2-1);
        havePointer=true;
      }, {passive:true});
    }

    function size(){
      const r=canvas.getBoundingClientRect();
      W=r.width||innerWidth; H=r.height||innerHeight;
      renderer.setSize(W,H,false);
      camera.aspect=W/H; camera.updateProjectionMatrix();
    }
    size();
    addEventListener("resize", size);

    /* world-space half-extents at the particle plane, so pointer repulsion
       lines up with what is actually on screen at any aspect ratio */
    const halfH = Math.tan((70*Math.PI/180)/2) * 60;

    const PUSH_R=14, PUSH=2.6;
    let t=0;
    function frame(){
      t+=0.006;
      const mx=ndcX*halfH*(W/H||1), my=ndcY*halfH;

      for(let i=0;i<COUNT;i++){
        const p=grit[i];
        p.y -= p.fall;                                        // sink
        if(p.y < -SPREAD_Y/2){ p.y = SPREAD_Y/2; p.x=(Math.random()-0.5)*SPREAD_X; }
        const sway = Math.sin(t*1.6 + p.seed) * p.amp;        // slow current

        // pointer displaces the water; particles ease back once it leaves
        let tx=0, ty=0;
        if(havePointer){
          const dx=(p.x+sway)-mx, dy=p.y-my;
          const d2=dx*dx+dy*dy;
          if(d2 < PUSH_R*PUSH_R && d2 > 0.0001){
            const d=Math.sqrt(d2), f=(1-d/PUSH_R)*PUSH;
            tx=(dx/d)*f; ty=(dy/d)*f;
          }
        }
        p.px += (tx-p.px)*0.06;
        p.py += (ty-p.py)*0.06;

        pos[i*3]   = p.x + sway + p.px;
        pos[i*3+1] = p.y + p.py;
        pos[i*3+2] = p.z;
      }
      geo.attributes.position.needsUpdate=true;

      // the whole field drifts a touch with the pointer, like a slow current
      points.rotation.y += ((ndcX*0.12)-points.rotation.y)*0.02;
      points.rotation.x += ((ndcY*0.06)-points.rotation.x)*0.02;

      renderer.render(scene,camera);
      raf=requestAnimationFrame(frame);
    }
    frame();

    document.addEventListener("visibilitychange", () => {
      if(document.hidden){ if(raf) cancelAnimationFrame(raf); raf=null; }
      else if(!raf) frame();
    });
  })();

})();
