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
  toTop && toTop.addEventListener("click", () => scrollTo({top:0, behavior: reduce?"auto":"smooth"}));

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
  const roles=["Full Stack Java Developer","Backend Developer","Problem Solver","Lifelong Learner"];
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

  /* ---------------- TYPED CODE (Developer.java) ---------------- */
  const codeEl=$("#code"), codeCur=$("#codeCursor");
  const toks=[
    ["package","k"],[" dev.ajinkaya;\n\n",""],
    ["public class ","k"],["Developer","t"],[" {\n    ",""],
    ["String","t"],[" name = ",""],["\"Ajinkaya Pratap Bhosale\"","s"],[";\n    ",""],
    ["String","t"],["[] stack = { ",""],
      ["\"Java\"","s"],[", ",""],["\"SQL\"","s"],[", ",""],["\"JavaScript\"","s"],[", ",""],["\"Python\"","s"],[" };\n    ",""],
    ["boolean","t"],[" openToWork = ",""],["true","k"],[";\n\n    ",""],
    ["public ","k"],["String","t"],[" ",""],["build","m"],["() {\n        ",""],
    ["return","k"],[" ",""],["\"clean, scalable software\"","s"],[";\n    }\n}",""]
  ];
  const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const codeLen=toks.reduce((n,t)=>n+t[0].length,0);
  function renderCode(n){
    let out="",used=0;
    for(const [txt,cls] of toks){
      if(used>=n) break;
      const seg=esc(txt.slice(0,Math.min(txt.length,n-used)));
      out += cls ? '<span class="'+cls+'">'+seg+'</span>' : seg;
      used += Math.min(txt.length,n-used);
    }
    if(codeEl) codeEl.innerHTML=out;
  }
  function typeCode(){
    if(!codeEl) return;
    if(reduce){ renderCode(codeLen); if(codeCur) codeCur.style.display="none"; return; }
    let c=0;
    (function tick(){ renderCode(++c); if(c<codeLen) setTimeout(tick, 20+Math.random()*24); else if(codeCur) codeCur.style.display="none"; })();
  }
  const ide=$("#ide");
  if(ide && "IntersectionObserver" in window){
    const io3=new IntersectionObserver((ents)=>ents.forEach(en=>{ if(en.isIntersecting){ setTimeout(typeCode,650); io3.unobserve(en.target);} }), {threshold:.3});
    io3.observe(ide);
  } else setTimeout(typeCode, 900);

  /* ---------------- 3D TILT (cards + IDE) ---------------- */
  if(!isTouch && !reduce){
    $$(".tilt, #ide").forEach(el => {
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
      role:"// Java · AI · full-stack",
      desc:"An interactive assistant that helps candidates rehearse for interviews. It generates role-specific questions, captures answers, and returns instant, constructive feedback so practice sessions feel realistic and actually build confidence.",
      highlights:["Dynamic, role-aware question generation","Instant feedback loop on each answer","Clean, responsive UI built with Bootstrap","Java-driven logic on the back end"],
      tags:["Java","JavaScript","Bootstrap","HTML/CSS","AI"] },
    { title:"Packet Food Ingredient Rating System",
      role:"// Python · Flask · computer vision",
      desc:"Scan a packaged-food barcode and get an instant health rating. The app pulls product data from the Open Food Facts API, parses the ingredient list, and turns it into a clear score that helps people make healthier choices in seconds.",
      highlights:["Barcode / QR scanning with OCR","Live product lookup via Open Food Facts API","Ingredient parsing into a readable health score","Flask back end serving a lightweight web UI"],
      tags:["Python","Flask","OCR","Barcode / QR","Open Food Facts API"] },
    { title:"Extract Text From Image (OCR)",
      role:"// Python · OCR",
      desc:"A focused utility that pulls text straight out of images and converts it into clean, editable digital text using Optical Character Recognition — handy for digitising notes, receipts, and printed documents.",
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
    const tags=["Java","Core Java","Advanced Java","JavaScript","HTML5","CSS3","Bootstrap","SQL","JDBC","Python","Flask","Git","GitHub","OOP","REST APIs","C","Responsive UI"];
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

  /* ---------------- THREE.JS HERO PARTICLES ---------------- */
  (function initThree(){
    const canvas=$("#bg-canvas");
    if(!canvas || typeof THREE==="undefined" || reduce) return;
    let renderer, scene, camera, points, lines, raf=null, W, H;
    const COUNT = innerWidth<720 ? 70 : 130;
    const nodes=[];
    try{
      renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    }catch(e){ return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.z=60;

    const SPREAD=90;
    const posArr=new Float32Array(COUNT*3);
    for(let i=0;i<COUNT;i++){
      const v={ x:(Math.random()-0.5)*SPREAD, y:(Math.random()-0.5)*SPREAD*0.7, z:(Math.random()-0.5)*SPREAD,
                vx:(Math.random()-0.5)*0.05, vy:(Math.random()-0.5)*0.05, vz:(Math.random()-0.5)*0.05 };
      nodes.push(v);
      posArr[i*3]=v.x; posArr[i*3+1]=v.y; posArr[i*3+2]=v.z;
    }
    const pGeo=new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(posArr,3));
    const pMat=new THREE.PointsMaterial({ color:0xFF9E2C, size:1.1, transparent:true, opacity:0.9, sizeAttenuation:true });
    points=new THREE.Points(pGeo, pMat);
    scene.add(points);

    // connecting lines
    const MAXSEG=COUNT*6;
    const linePos=new Float32Array(MAXSEG*3);
    const lGeo=new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(linePos,3));
    const lMat=new THREE.LineBasicMaterial({ color:0x37E0C6, transparent:true, opacity:0.16 });
    lines=new THREE.LineSegments(lGeo, lMat);
    scene.add(lines);

    let mouseX=0, mouseY=0;
    addEventListener("mousemove", e => { mouseX=(e.clientX/innerWidth-0.5); mouseY=(e.clientY/innerHeight-0.5); }, {passive:true});

    function resize(){
      const hero=canvas.parentElement;
      W=hero.clientWidth; H=hero.clientHeight;
      renderer.setSize(W,H,false);
      camera.aspect=W/H; camera.updateProjectionMatrix();
    }
    resize(); addEventListener("resize", resize);

    const DIST=22, DIST2=DIST*DIST;
    function animate(){
      const pa=pGeo.attributes.position.array;
      for(let i=0;i<COUNT;i++){
        const n=nodes[i];
        n.x+=n.vx; n.y+=n.vy; n.z+=n.vz;
        if(n.x> SPREAD/2||n.x<-SPREAD/2) n.vx*=-1;
        if(n.y> SPREAD*0.35||n.y<-SPREAD*0.35) n.vy*=-1;
        if(n.z> SPREAD/2||n.z<-SPREAD/2) n.vz*=-1;
        pa[i*3]=n.x; pa[i*3+1]=n.y; pa[i*3+2]=n.z;
      }
      pGeo.attributes.position.needsUpdate=true;

      let s=0;
      for(let i=0;i<COUNT && s<MAXSEG-2;i++){
        for(let j=i+1;j<COUNT && s<MAXSEG-2;j++){
          const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dz=nodes[i].z-nodes[j].z;
          if(dx*dx+dy*dy+dz*dz < DIST2){
            linePos[s*3]=nodes[i].x; linePos[s*3+1]=nodes[i].y; linePos[s*3+2]=nodes[i].z; s++;
            linePos[s*3]=nodes[j].x; linePos[s*3+1]=nodes[j].y; linePos[s*3+2]=nodes[j].z; s++;
          }
        }
      }
      lGeo.setDrawRange(0,s);
      lGeo.attributes.position.needsUpdate=true;

      const tgtY=mouseX*0.5, tgtX=mouseY*0.3;
      points.rotation.y += (tgtY-points.rotation.y)*0.03 + 0.0009;
      points.rotation.x += (tgtX-points.rotation.x)*0.03;
      lines.rotation.copy(points.rotation);

      renderer.render(scene,camera);
      raf=requestAnimationFrame(animate);
    }
    animate();
    document.addEventListener("visibilitychange", () => {
      if(document.hidden){ if(raf) cancelAnimationFrame(raf); raf=null; }
      else if(!raf) animate();
    });
  })();

})();
