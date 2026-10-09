(function () {
  const GMAPS_KEY = ""; // এখানে Google Maps API key বসান (না দিলে Esri স্যাটেলাইট ম্যাপ চলবে)
  const db = supabaseClient;
  const CATS = { Agri: "এগ্রিকালচার ও ফলমূল", Food: "বিখ্যাত খাবার ও মিষ্টি", Handicraft: "হস্তশিল্প ও তাঁত বস্ত্র", Ayurvedic: "আয়ুর্বেদিক ও ভেষজ", GI: "জিআই (GI) পণ্য", Other: "অন্যান্য" };
  const ROLES = { Buyer: "Buyer", Seller: "Seller / Producer", Dealer: "Dealer", Wholesaler: "Wholesaler / Reseller" };
  let me = null, catFilter = "all", usersLayer = null, gmap = null;
  const $ = (i) => document.getElementById(i);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const opts = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  const inp = "w-full border border-gray-300 rounded-lg p-2.5 text-sm";

  // ---------- UI ইনজেক্ট ----------
  document.body.insertAdjacentHTML("beforeend", `
  <div id="aibAuth" class="fixed inset-0 bg-black/70 z-[60] hidden flex items-center justify-center p-4">
   <div class="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto">
    <div class="bg-brandDark text-white p-5 text-center relative">
     <button onclick="aib.closeAuth()" class="absolute top-3 right-4 text-xl">×</button>
     <h3 class="text-xl font-black">All In Business</h3>
     <p id="aibAuthMsg" class="text-xs text-gray-300 mt-1">Before any action, sign in. Your selected role is saved to your profile.</p>
    </div>
    <div class="flex text-sm font-bold">
     <button id="tabIn" onclick="aib.tab('in')" class="flex-1 py-3 bg-brandRed text-white">Sign in</button>
     <button id="tabUp" onclick="aib.tab('up')" class="flex-1 py-3 bg-gray-200">Create account</button>
    </div>
    <form onsubmit="aib.submitAuth(event)" class="p-5 space-y-3">
     <div id="upOnly" class="space-y-3 hidden">
      <select id="aRole" class="${inp} font-semibold">${opts(ROLES)}</select>
      <input id="aName" placeholder="Full name" class="${inp}">
      <input id="aBiz" placeholder="Business / shop name" class="${inp}">
      <select id="aCat" class="${inp}">${opts(CATS)}</select>
      <input id="aPhone" placeholder="Mobile (017XXXXXXXX)" class="${inp}">
      <input id="aLoc" placeholder="জেলা ও উপজেলা" class="${inp}">
      <button type="button" onclick="aib.getGPS('aGps')" class="text-xs bg-gray-100 border rounded px-3 py-2 w-full">📍 আমার বর্তমান লোকেশন নিন <span id="aGps"></span></button>
     </div>
     <input id="aEmail" type="email" required placeholder="Email" class="${inp}">
     <input id="aPass" type="password" required minlength="6" placeholder="Password" class="${inp}">
     <button class="w-full bg-brandRed text-white py-3 rounded-xl font-bold" id="aSubmit">Sign in</button>
    </form>
   </div>
  </div>`);

  $("divisionTabs").closest("main").insertAdjacentHTML("beforeend", `
  <section id="aibMarket" class="bg-white p-6 rounded-2xl shadow-md border space-y-4">
   <div class="flex flex-wrap justify-between items-center gap-2">
    <h2 class="text-2xl font-black"><i class="fa-solid fa-shop text-brandRed"></i> লাইভ মার্কেটপ্লেস (ইউজারদের পণ্য)</h2>
    <div class="flex gap-2 text-xs font-bold">
     <button onclick="aib.guard(()=>aib.toggle('prodForm'))" class="bg-brandRed text-white px-3 py-2 rounded-lg">+ পণ্য / রিকোয়েস্ট যোগ</button>
     <button onclick="aib.guard(()=>aib.toggle('storeForm'))" class="bg-brandDark text-white px-3 py-2 rounded-lg">+ আমার স্টোর</button>
     <button onclick="aib.guard(()=>aib.toggle('myProfile'))" class="bg-gray-200 px-3 py-2 rounded-lg">আমার প্রোফাইল</button>
    </div>
   </div>
   <div id="myProfile" class="hidden bg-gray-50 border rounded-xl p-4 text-sm"></div>
   <form id="storeForm" onsubmit="aib.addStore(event)" class="hidden grid md:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-xl border">
    <input id="sName" required placeholder="স্টোরের নাম" class="${inp}">
    <select id="sCat" class="${inp}">${opts(CATS)}</select>
    <input id="sDesc" placeholder="স্টোরের বিবরণ" class="${inp}">
    <button type="button" onclick="aib.getGPS('sGps')" class="text-xs bg-white border rounded p-2">📍 স্টোর লোকেশন <span id="sGps"></span></button>
    <button class="bg-brandRed text-white rounded-lg font-bold py-2 md:col-span-2">স্টোর তৈরি করুন</button>
   </form>
   <form id="prodForm" onsubmit="aib.addProduct(event)" class="hidden grid md:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-xl border">
    <select id="pKind" class="${inp}"><option value="sell">আমি বিক্রি করব (Sell)</option><option value="buy">আমি কিনতে চাই (Buy request)</option></select>
    <input id="pTitle" required placeholder="পণ্যের নাম" class="${inp}">
    <select id="pCat" class="${inp}">${opts(CATS)}</select>
    <input id="pPrice" type="number" placeholder="দাম (৳)" class="${inp}">
    <input id="pQty" placeholder="পরিমাণ (যেমন ১০০ কেজি)" class="${inp}">
    <input id="pDist" placeholder="জেলা" class="${inp}">
    <select id="pStore" class="${inp}"><option value="">স্টোর ছাড়া</option></select>
    <input id="pDesc" placeholder="বিবরণ" class="${inp} md:col-span-2">
    <button class="bg-brandRed text-white rounded-lg font-bold py-2 md:col-span-3">প্রকাশ করুন</button>
   </form>
   <div id="aibCats" class="flex gap-2 overflow-x-auto text-xs font-bold"></div>
   <div id="aibProducts" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
  </section>

  <section class="max-w-7xl mx-auto px-4 mt-8 grid lg:grid-cols-2 gap-6">
   <div class="bg-white p-5 rounded-2xl shadow-md border">
    <h3 class="font-bold mb-2"><i class="fa-solid fa-comments text-brandRed"></i> কমন চ্যাট রুম (সবাই অনলাইনে)</h3>
    <div id="chatBox" class="h-72 overflow-y-auto bg-gray-50 border rounded-xl p-3 space-y-2 text-sm"></div>
    <form onsubmit="aib.send(event)" class="flex gap-2 mt-2"><input id="chatIn" class="${inp}" placeholder="মেসেজ লিখুন..."><button class="bg-brandRed text-white px-4 rounded-lg">পাঠান</button></form>
   </div>
   <div class="bg-white p-5 rounded-2xl shadow-md border">
    <div class="flex justify-between items-center mb-2">
     <h3 class="font-bold"><i class="fa-solid fa-location-crosshairs text-brandRed"></i> ক্রেতা/বিক্রেতা/স্টোর লোকেশন</h3>
     <button onclick="aib.googleMap()" class="text-xs bg-brandDark text-white px-3 py-1.5 rounded">Google Satellite Map</button>
    </div>
    <div id="gmap" class="h-72 rounded-xl bg-gray-100 text-xs text-gray-500 flex items-center justify-center">উপরের বাটনে ক্লিক করুন (সবার লোকেশন মূল ম্যাপেও দেখা যাবে)</div>
   </div>
  </section>`);

  // ---------- Auth ----------
  let mode = "in", gps = {};
  const aib = (window.aib = {
    tab(m) { mode = m; $("upOnly").classList.toggle("hidden", m === "in"); $("aSubmit").innerText = m === "in" ? "Sign in" : "Create account";
      $("tabIn").className = "flex-1 py-3 " + (m === "in" ? "bg-brandRed text-white" : "bg-gray-200"); $("tabUp").className = "flex-1 py-3 " + (m === "up" ? "bg-brandRed text-white" : "bg-gray-200"); },
    closeAuth() { $("aibAuth").classList.add("hidden"); },
    toggle(id) { $(id).classList.toggle("hidden"); },
    guard(fn) { if (!me) return openAuthModal(); fn(); },
    getGPS(el) { navigator.geolocation.getCurrentPosition((p) => { gps[el] = { lat: p.coords.latitude, lng: p.coords.longitude }; $(el).innerText = "✅ নেওয়া হয়েছে"; }, () => alert("লোকেশন পারমিশন দিন")); },
    async submitAuth(e) {
      e.preventDefault(); const email = $("aEmail").value, password = $("aPass").value;
      if (mode === "up") {
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) return alert(error.message);
        const p = { id: data.user.id, full_name: $("aName").value, business_name: $("aBiz").value, role: $("aRole").value, category: $("aCat").value,
          phone: $("aPhone").value, location_text: $("aLoc").value, lat: gps.aGps?.lat, lng: gps.aGps?.lng };
        if (data.session) { const r = await db.from("profiles").upsert(p); if (r.error) return alert(r.error.message); }
        else return alert("ইমেইল কনফার্ম করে তারপর Sign in করুন (অথবা Supabase এ Confirm email বন্ধ করুন)");
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password }); if (error) return alert(error.message);
      }
      aib.closeAuth(); await loadMe();
    },
    async addStore(e) {
      e.preventDefault(); const g = gps.sGps || {};
      const { error } = await db.from("stores").insert({ owner: me.id, name: $("sName").value, category: $("sCat").value, description: $("sDesc").value, lat: g.lat ?? me.lat, lng: g.lng ?? me.lng });
      if (error) return alert(error.message); e.target.reset(); aib.toggle("storeForm"); loadStores(); plotUsers();
    },
    async addProduct(e) {
      e.preventDefault();
      const { error } = await db.from("products").insert({ owner: me.id, owner_name: me.business_name || me.full_name, store_id: $("pStore").value || null, title: $("pTitle").value, category: $("pCat").value,
        kind: $("pKind").value, price: $("pPrice").value || null, qty: $("pQty").value, district: $("pDist").value, description: $("pDesc").value });
      if (error) return alert(error.message); e.target.reset(); aib.toggle("prodForm"); loadProducts();
    },
    async review(pid) {
      aib.guard(async () => { const r = parseInt(prompt("রেটিং দিন (১-৫):"), 10); if (!(r >= 1 && r <= 5)) return; const c = prompt("মন্তব্য:") || "";
        const { error } = await db.from("reviews").insert({ product_id: pid, user_id: me.id, user_name: me.full_name, rating: r, comment: c }); if (error) alert(error.message); loadProducts(); });
    },
    contact(name) { aib.guard(() => { $("chatIn").value = `@${name} আপনার পণ্য সম্পর্কে জানতে চাই — `; $("chatIn").focus(); $("chatIn").scrollIntoView({ block: "center" }); }); },
    async send(e) { e.preventDefault(); if (!me) return openAuthModal(); const b = $("chatIn").value.trim(); if (!b) return;
      const { error } = await db.from("messages").insert({ user_id: me.id, user_name: me.full_name, body: b }); if (error) alert(error.message); $("chatIn").value = ""; },
    async signOut() { await db.auth.signOut(); me = null; $("navUserName").innerText = "প্রোফাইল / লগইন"; $("myProfile").classList.add("hidden"); },
    googleMap() {
      if (!GMAPS_KEY) { $("gmap").innerHTML = "GMAPS_KEY ফাঁকা। Google Maps API key বসালে এখানে আসল Google স্যাটেলাইট ম্যাপ আসবে। আপাতত উপরের মূল ম্যাপে স্যাটেলাইট ভিউ চালু করুন।"; return; }
      const draw = () => { gmap = new google.maps.Map($("gmap"), { center: { lat: 23.8, lng: 90.4 }, zoom: 7, mapTypeId: "hybrid" }); pts().then((a) => a.forEach((p) => new google.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map: gmap, title: p.t }))); };
      if (window.google?.maps) return draw();
      const s = document.createElement("script"); s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}`; s.onload = draw; document.head.appendChild(s);
    },
  });

  // ---------- মূল ফাংশন override (আসল কোড অপরিবর্তিত) ----------
  window.openAuthModal = (r) => { $("aibAuth").classList.remove("hidden"); aib.tab(mode); };
  window.requireAction = (name) => {
    if (!me) { $("aibAuthMsg").innerText = `"${name}" এর আগে সাইন ইন করুন। আপনার রোল প্রোফাইলে সেভ হবে।`; return openAuthModal(); }
    $("aibMarket").scrollIntoView({ behavior: "smooth" });
  };
  const oldCat = window.filterCategory;
  window.filterCategory = (c) => { oldCat(c); catFilter = c; loadProducts(); };

  // ---------- ডাটা ----------
  async function loadMe() {
    const { data: { user } } = await db.auth.getUser(); if (!user) return;
    const { data } = await db.from("profiles").select("*").eq("id", user.id).single();
    me = data || { id: user.id, full_name: user.email, role: "Buyer" };
    $("navUserName").innerText = `${me.full_name} (${me.role})`;
    $("myProfile").innerHTML = `<b>${esc(me.full_name)}</b> · ${esc(ROLES[me.role] || me.role)}<br>স্টোর/ব্যবসা: ${esc(me.business_name)} · ক্যাটাগরি: ${esc(CATS[me.category] || "")}<br>📞 ${esc(me.phone)} · 📍 ${esc(me.location_text)}<br><button onclick="aib.signOut()" class="mt-2 text-red-600 font-bold">Sign out</button>`;
    loadStores(); plotUsers();
  }
  async function loadStores() {
    if (!me) return; const { data } = await db.from("stores").select("id,name").eq("owner", me.id);
    $("pStore").innerHTML = `<option value="">স্টোর ছাড়া</option>` + (data || []).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  }
  async function loadProducts() {
    $("aibCats").innerHTML = Object.entries({ all: "সব", ...CATS }).map(([k, v]) => `<button onclick="filterCategory('${k}')" class="interactive-hover px-3 py-1.5 rounded-lg border bg-gray-100 ${k === catFilter ? "active-selection" : ""}">${v}</button>`).join("");
    let q = db.from("products").select("*").order("created_at", { ascending: false }).limit(60);
    if (catFilter !== "all") q = q.eq("category", catFilter === "GI" ? "GI" : catFilter);
    const { data: ps, error } = await q; if (error) return ($("aibProducts").innerHTML = `<p class="text-red-600">${esc(error.message)}</p>`);
    const { data: rv } = await db.from("reviews").select("*");
    $("aibProducts").innerHTML = (ps || []).map((p) => {
      const r = (rv || []).filter((x) => x.product_id === p.id), avg = r.length ? (r.reduce((a, b) => a + b.rating, 0) / r.length).toFixed(1) : "—";
      return `<div class="border rounded-2xl p-4 shadow-sm space-y-1 text-sm">
       <span class="text-[10px] font-black px-2 py-0.5 rounded ${p.kind === "buy" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}">${p.kind === "buy" ? "ক্রয় রিকোয়েস্ট" : "বিক্রয়"}</span>
       <h4 class="font-bold text-base">${esc(p.title)}</h4>
       <div class="text-xs text-gray-500">${esc(CATS[p.category] || "")} · ${esc(p.district)} · ${esc(p.qty)}</div>
       <div class="text-brandRed font-black">${p.price ? "৳ " + esc(p.price) : "দর আলোচনা সাপেক্ষে"}</div>
       <p class="text-xs text-gray-600">${esc(p.description)}</p>
       <div class="text-xs">👤 ${esc(p.owner_name)} · ⭐ ${avg} (${r.length})</div>
       ${r.slice(0, 2).map((x) => `<div class="text-[11px] bg-gray-50 rounded p-1">${"★".repeat(x.rating)} ${esc(x.user_name)}: ${esc(x.comment)}</div>`).join("")}
       <div class="flex gap-2 pt-1"><button onclick="aib.contact('${esc(p.owner_name)}')" class="flex-1 bg-brandRed text-white rounded-lg py-1.5 text-xs font-bold">${p.kind === "buy" ? "সাপ্লাই অফার" : "অর্ডার / যোগাযোগ"}</button>
       <button onclick="aib.review(${p.id})" class="flex-1 bg-gray-200 rounded-lg py-1.5 text-xs font-bold">রিভিউ দিন</button></div></div>`;
    }).join("") || `<p class="text-gray-500 text-sm">এখনো কোনো পণ্য নেই। প্রথম পণ্যটি আপনিই যোগ করুন!</p>`;
  }
  async function pts() {
    const [{ data: u }, { data: s }] = await Promise.all([db.from("profiles").select("full_name,role,lat,lng").not("lat", "is", null), db.from("stores").select("name,lat,lng").not("lat", "is", null)]);
    return [...(u || []).map((x) => ({ lat: x.lat, lng: x.lng, t: `${x.full_name} (${x.role})` })), ...(s || []).map((x) => ({ lat: x.lat, lng: x.lng, t: `🏪 ${x.name}` }))];
  }
  async function plotUsers() {
    if (!window.map) return; if (usersLayer) usersLayer.clearLayers(); else usersLayer = L.layerGroup().addTo(map);
    (await pts()).forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 8, color: "#1d4ed8", fillOpacity: 0.8 }).bindPopup(esc(p.t)).addTo(usersLayer));
  }
  function addMsg(m) { const b = $("chatBox"); b.insertAdjacentHTML("beforeend", `<div><b class="text-brandRed">${esc(m.user_name)}:</b> ${esc(m.body)}</div>`); b.scrollTop = b.scrollHeight; }
  async function initChat() {
    const { data } = await db.from("messages").select("*").order("created_at", { ascending: false }).limit(50); (data || []).reverse().forEach(addMsg);
    db.channel("chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (x) => addMsg(x.new)).subscribe();
  }

  loadProducts(); initChat(); loadMe(); setTimeout(plotUsers, 1500);
  db.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN") loadMe(); });
})();
