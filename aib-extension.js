/* All In Business - Extension v3 (আসল index.html অপরিবর্তিত) */
(function () {
  const GMAPS_KEY = ""; // ঐচ্ছিক
  const SPONSOR = "https://trustinuniver.wordpress.com";
  const BIO = "https://tahmidtrustin.github.io/Tahmid-Trustin-/";
  const db = typeof supabaseClient !== "undefined" ? supabaseClient : null;
  if (!db) { console.error("Supabase client পাওয়া যায়নি"); return; }

  const CATS = { Agri: "এগ্রিকালচার ও ফলমূল", Food: "বিখ্যাত খাবার ও মিষ্টি", Handicraft: "হস্তশিল্প ও তাঁত বস্ত্র", Ayurvedic: "আয়ুর্বেদিক ও ভেষজ", GI: "জিআই (GI) পণ্য", Other: "অন্যান্য" };
  const ROLES = { Buyer: "Buyer", Seller: "Seller / Producer", Dealer: "Dealer", Wholesaler: "Wholesaler / Reseller" };
  const ROLE_COLOR = { Buyer: "#1d4ed8", Seller: "#16a34a", Dealer: "#ea580c", Wholesaler: "#9333ea" };
  let me = null, P = [], R = [], S = [], U = {}, lastList = null;
  let catFilter = "all", distFilter = "all", searchQ = "";
  let usersLayer = null, gType = "k", mode = "in", gps = {};
  const seen = new Set();
  const $ = (i) => document.getElementById(i);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const opts = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  const inp = "w-full border border-gray-300 rounded-lg p-2.5 text-sm";
  const grid = $("productsGrid");
  const prodSection = grid.closest("section");
  prodSection.style.scrollMarginTop = "150px";

  // ================= UI (নতুন কোনো পণ্য-সেকশন নয়; শুধু বাটন/ফর্ম ও লগইন) =================
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

  // বিদ্যমান "পণ্যসমূহ" সেকশনের গ্রিডের ঠিক উপরে: শুধু অ্যাকশন বাটন + ফর্ম
  grid.insertAdjacentHTML("beforebegin", `
  <div id="aibTools" class="mb-5 space-y-3">
   <div class="flex flex-wrap gap-2 text-xs font-bold">
    <button onclick="aib.openProd('sell')" class="bg-brandRed text-white px-3 py-2 rounded-lg">+ পণ্য যোগ করুন (বিক্রি)</button>
    <button onclick="aib.openProd('buy')" class="bg-blue-700 text-white px-3 py-2 rounded-lg">+ ক্রয় রিকোয়েস্ট</button>
    <button onclick="aib.guard(()=>aib.toggle('storeForm'))" class="bg-brandDark text-white px-3 py-2 rounded-lg">+ আমার স্টোর</button>
    <button onclick="aib.guard(()=>aib.toggle('myProfile'))" class="bg-gray-200 px-3 py-2 rounded-lg">আমার প্রোফাইল</button>
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
  </div>`);

  // চ্যাট ও ইউজার-লোকেশন (পণ্য সেকশনের নিচে)
  document.querySelector("main").insertAdjacentHTML("beforeend", `
  <section id="aibChatMap" style="scroll-margin-top:150px" class="grid lg:grid-cols-2 gap-6">
   <div class="bg-white p-5 rounded-2xl shadow-md border">
    <div class="flex justify-between items-center mb-2">
     <h3 class="font-bold"><i class="fa-solid fa-comments text-brandRed"></i> কমন চ্যাট রুম</h3>
     <span class="text-xs font-bold text-green-600">🟢 অনলাইন: <span id="onl">1</span></span>
    </div>
    <div id="chatBox" class="h-72 overflow-y-auto bg-gray-50 border rounded-xl p-3 space-y-2 text-sm"></div>
    <form onsubmit="aib.send(event)" class="flex gap-2 mt-2"><input id="chatIn" class="${inp}" placeholder="মেসেজ লিখুন..."><button class="bg-brandRed text-white px-4 rounded-lg">পাঠান</button></form>
   </div>
   <div class="bg-white p-5 rounded-2xl shadow-md border">
    <div class="flex justify-between items-center mb-2 gap-2">
     <h3 class="font-bold"><i class="fa-solid fa-location-crosshairs text-brandRed"></i> ক্রেতা / বিক্রেতা / স্টোর লোকেশন</h3>
     <button onclick="aib.gToggle()" class="text-xs bg-brandDark text-white px-3 py-1.5 rounded">Google ম্যাপ / স্যাটেলাইট</button>
    </div>
    <div id="gmap" class="h-64 rounded-xl bg-gray-100 text-xs text-gray-500 flex items-center justify-center">লোড হচ্ছে...</div>
    <div id="locList" class="flex gap-2 overflow-x-auto text-xs mt-2"></div>
   </div>
  </section>`);

  document.querySelector("footer").insertAdjacentHTML("beforeend", `
  <div class="max-w-7xl mx-auto px-4 mt-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs">
   <a href="${SPONSOR}" target="_blank" rel="noopener" class="text-brandGold font-bold hover:underline">Sponsored by TRUSTINUNIVERS</a>
   <a href="${BIO}" target="_blank" rel="noopener" class="text-white hover:underline"><i class="fa-solid fa-user"></i> Developer Bio: Tahmid Trustin</a>
   <a href="${SPONSOR}" target="_blank" rel="noopener" class="text-gray-300 hover:underline">Copyright © 2026 Trustin Univers. All rights reserved.</a>
  </div>`);

  // ================= Actions =================
  const aib = (window.aib = {
    tab(m) { mode = m; $("upOnly").classList.toggle("hidden", m === "in"); $("aSubmit").innerText = m === "in" ? "Sign in" : "Create account";
      $("tabIn").className = "flex-1 py-3 " + (m === "in" ? "bg-brandRed text-white" : "bg-gray-200"); $("tabUp").className = "flex-1 py-3 " + (m === "up" ? "bg-brandRed text-white" : "bg-gray-200"); },
    closeAuth() { $("aibAuth").classList.add("hidden"); },
    toggle(id) { $(id).classList.toggle("hidden"); },
    guard(fn) { if (!me) return openAuthModal(); fn(); },
    openProd(kind) { aib.guard(() => { $("prodForm").classList.remove("hidden"); $("pKind").value = kind; if (catFilter !== "all") $("pCat").value = catFilter; prodSection.scrollIntoView({ behavior: "smooth" }); }); },
    getGPS(el) { navigator.geolocation.getCurrentPosition((p) => { gps[el] = { lat: p.coords.latitude, lng: p.coords.longitude }; $(el).innerText = "✅ নেওয়া হয়েছে"; }, () => alert("লোকেশন পারমিশন দিন")); },
    saveLoc() {
      navigator.geolocation.getCurrentPosition(async (p) => {
        const { error } = await db.from("profiles").update({ lat: p.coords.latitude, lng: p.coords.longitude }).eq("id", me.id);
        if (error) return alert(error.message); me.lat = p.coords.latitude; me.lng = p.coords.longitude; alert("লোকেশন সেভ হয়েছে"); refreshMaps();
      }, () => alert("লোকেশন পারমিশন দিন"));
    },
    async submitAuth(e) {
      e.preventDefault(); const email = $("aEmail").value, password = $("aPass").value;
      if (mode === "up") {
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) return alert(error.message);
        if (!data.user) return alert("এই ইমেইল দিয়ে আগে অ্যাকাউন্ট খোলা হয়েছে। Sign in করুন।");
        if (!data.session) return alert("ইমেইল কনফার্ম করে Sign in করুন (অথবা Supabase এ Confirm email বন্ধ করুন)");
        const p = { id: data.user.id, full_name: $("aName").value, business_name: $("aBiz").value, role: $("aRole").value, category: $("aCat").value,
          phone: $("aPhone").value, location_text: $("aLoc").value, lat: gps.aGps?.lat, lng: gps.aGps?.lng };
        const r = await db.from("profiles").upsert(p); if (r.error) return alert(r.error.message);
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password }); if (error) return alert(error.message);
      }
      aib.closeAuth(); await loadMe();
    },
    async addStore(e) {
      e.preventDefault(); const g = gps.sGps || {};
      const { error } = await db.from("stores").insert({ owner: me.id, name: $("sName").value, category: $("sCat").value, description: $("sDesc").value, lat: g.lat ?? me.lat, lng: g.lng ?? me.lng });
      if (error) return alert(error.message); e.target.reset(); aib.toggle("storeForm"); await loadStores(); refreshMaps();
    },
    async addProduct(e) {
      e.preventDefault();
      const { error } = await db.from("products").insert({ owner: me.id, owner_name: me.business_name || me.full_name, store_id: $("pStore").value || null, title: $("pTitle").value, category: $("pCat").value,
        kind: $("pKind").value, price: $("pPrice").value || null, qty: $("pQty").value, district: $("pDist").value, description: $("pDesc").value });
      if (error) return alert(error.message); e.target.reset(); aib.toggle("prodForm"); loadProducts();
    },
    async del(id) { if (!confirm("পণ্যটি মুছবেন?")) return; const { error } = await db.from("products").delete().eq("id", id); if (error) alert(error.message); loadProducts(); },
    review(pid) {
      aib.guard(async () => { const r = parseInt(prompt("রেটিং দিন (১-৫):"), 10); if (!(r >= 1 && r <= 5)) return; const c = prompt("মন্তব্য:") || "";
        const { error } = await db.from("reviews").insert({ product_id: pid, user_id: me.id, user_name: me.full_name, rating: r, comment: c }); if (error) alert(error.message); loadProducts(); });
    },
    contact(el) { aib.guard(() => { $("chatIn").value = `@${el.dataset.n} আপনার পণ্য "${el.dataset.t}" সম্পর্কে জানতে চাই — `; $("aibChatMap").scrollIntoView({ behavior: "smooth" }); $("chatIn").focus(); }); },
    async send(e) {
      e.preventDefault(); if (!me) return openAuthModal(); const b = $("chatIn").value.trim(); if (!b) return;
      const { data, error } = await db.from("messages").insert({ user_id: me.id, user_name: me.full_name, body: b }).select().single();
      if (error) return alert(error.message); $("chatIn").value = ""; addMsg(data);
    },
    async signOut() { await db.auth.signOut(); me = null; $("navUserName").innerText = "প্রোফাইল / লগইন"; $("myProfile").classList.add("hidden"); refresh(); },
    gToggle() { gType = gType === "k" ? "m" : "k"; const f = $("gframe"); if (f) f.src = f.src.replace(/t=[km]/, "t=" + gType); },
    showLoc(lat, lng) { if (GMAPS_KEY && window.gmapObj) { gmapObj.setCenter({ lat, lng }); gmapObj.setZoom(15); } else drawFrame(`${lat},${lng}`, 15); },
  });

  // ================= বিদ্যমান ফাংশনের সাথে সংযোগ =================
  // ১) আসল renderProductsGrid চলার পর একই গ্রিডে ইউজারদের পণ্য যোগ হবে
  const oldRender = window.renderProductsGrid;
  window.renderProductsGrid = (list) => {
    lastList = list; oldRender(list);
    const ups = userList();
    if (ups.length) grid.insertAdjacentHTML("afterbegin", ups.map(card).join(""));
    else if (!list.length) grid.innerHTML = `<p class="text-gray-500 text-sm col-span-full">এই ক্যাটাগরিতে এখনো কোনো পণ্য নেই। উপরের "+ পণ্য যোগ করুন" বাটনে চাপ দিয়ে প্রথম পণ্যটি আপনিই যোগ করুন!</p>`;
    $("productCountBadge").innerText = `মোট দেখানো হচ্ছে: ${list.length + ups.length} টি`;
  };
  function refresh() { window.renderProductsGrid(lastList || DISTRICTS_DATA); }

  // ২) বিদ্যমান ক্যাটাগরি বার (এগ্রিকালচার, খাবার, হস্তশিল্প, আয়ুর্বেদিক, GI): শুধু ওই ক্যাটাগরির পণ্য, বাকিগুলো লুকানো
  const oldCat = window.filterCategory;
  function applyCat(c, scroll) {
    catFilter = c; distFilter = "all"; oldCat(c);
    document.querySelectorAll("header [onclick^=\"filterCategory\"]").forEach((el) => el.classList.toggle("active-selection", el.getAttribute("onclick") === `filterCategory('${c}')`));
    const t = $("sectionTitle"); if (t) t.innerText = c === "all" ? "সকল জেলার জনপ্রিয় ও খাঁটি পণ্যসমূহ" : `${CATS[c] || c} — পণ্যসমূহ`;
    if (scroll) prodSection.scrollIntoView({ behavior: "smooth" });
  }
  window.filterCategory = (c) => applyCat(c, true);

  const oldDist = window.filterProductsByDistrict;
  window.filterProductsByDistrict = (id) => { distFilter = id; catFilter = "all"; oldDist(id); if (id !== "all") prodSection.scrollIntoView({ behavior: "smooth" }); };
  const oldSearch = window.searchProducts;
  window.searchProducts = (q) => { searchQ = q; oldSearch(q); };
  const oldMode = window.switchMarketMode;
  window.switchMarketMode = (m) => { oldMode(m); applyCat(catFilter, false); };

  // ৩) সব অ্যাকশনের আগে লগইন
  window.openAuthModal = () => {
    if (me) { $("myProfile").classList.remove("hidden"); return $("aibTools").scrollIntoView({ behavior: "smooth", block: "center" }); }
    $("aibAuth").classList.remove("hidden"); aib.tab(mode);
  };
  window.requireAction = (name) => {
    if (!me) { $("aibAuthMsg").innerText = `"${name}" এর আগে সাইন ইন করুন। আপনার রোল প্রোফাইলে সেভ হবে।`; return openAuthModal(); }
    if (name.includes("কোটেশন")) return aib.openProd("buy");
    if (name.includes("ডিলার")) return aib.guard(() => $("myProfile").classList.remove("hidden"));
    prodSection.scrollIntoView({ behavior: "smooth" });
  };
  const oldRoute = window.viewProductRoute;
  window.viewProductRoute = (id) => { if (!me) return requireAction("ম্যাপ ও সাপ্লাই রুট দেখতে"); oldRoute(id); };

  // ================= ইউজার পণ্য =================
  function userList() {
    const q = searchQ.toLowerCase().trim(), d = distFilter !== "all" ? DISTRICTS_DATA.find((x) => x.id === distFilter) : null;
    return P.filter((p) => (catFilter === "all" || p.category === catFilter) && (!d || String(p.district || "").includes(d.name)) &&
      (!q || [p.title, p.district, p.description, p.owner_name].join(" ").toLowerCase().includes(q)));
  }
  function card(p) {
    const r = R.filter((x) => x.product_id === p.id), avg = r.length ? (r.reduce((a, b) => a + b.rating, 0) / r.length).toFixed(1) : "—";
    const st = S.find((s) => s.id === p.store_id), ow = U[p.owner] || {};
    return `<div class="bg-white border-2 border-brandRed/30 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between">
     <div>
      <div class="relative h-28 bg-gradient-to-br from-brandDark to-gray-700 flex items-center justify-center text-white text-4xl">
       <i class="fa-solid ${p.kind === "buy" ? "fa-hand-holding-dollar" : "fa-basket-shopping"}"></i>
       <div class="absolute top-3 left-3 bg-brandRed text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow">${p.kind === "buy" ? "ক্রয় রিকোয়েস্ট" : "বিক্রয়"}</div>
       <div class="absolute top-3 right-3 bg-brandGold text-gray-900 text-[10px] font-black px-2 py-0.5 rounded shadow">ইউজার পণ্য</div>
      </div>
      <div class="p-4 space-y-2">
       <h4 class="font-bold text-gray-900 text-base leading-snug">${esc(p.title)}</h4>
       <p class="text-xs text-gray-500"><i class="fa-solid fa-location-dot text-brandRed mr-1"></i>${esc(p.district || "—")} · ${esc(CATS[p.category] || "")}</p>
       <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs space-y-1">
        <div class="flex justify-between text-gray-600"><span>পরিমাণ:</span><span class="font-bold text-gray-900">${esc(p.qty || "—")}</span></div>
        <div class="flex justify-between text-brandRed font-black text-sm pt-1 border-t border-gray-200"><span>দর:</span><span>${p.price ? "৳ " + esc(p.price) : "আলোচনা সাপেক্ষে"}</span></div>
       </div>
       <p class="text-xs text-gray-600">${esc(p.description)}</p>
       <div class="text-xs text-gray-700">👤 ${esc(p.owner_name)}${ow.role ? " (" + esc(ROLES[ow.role] || ow.role) + ")" : ""}${st ? " · 🏪 " + esc(st.name) : ""} · ⭐ ${avg} (${r.length})</div>
       ${me && ow.phone ? `<div class="text-xs">📞 ${esc(ow.phone)}</div>` : ""}
       ${r.slice(0, 2).map((x) => `<div class="text-[11px] bg-gray-50 rounded p-1">${"★".repeat(x.rating)} ${esc(x.user_name)}: ${esc(x.comment)}</div>`).join("")}
      </div>
     </div>
     <div class="p-4 pt-0 flex gap-2">
      <button data-n="${esc(p.owner_name)}" data-t="${esc(p.title)}" onclick="aib.contact(this)" class="flex-1 py-2.5 bg-brandRed hover:bg-brandRedDark text-white text-xs rounded-xl font-bold">${p.kind === "buy" ? "সাপ্লাই অফার" : "অর্ডার / যোগাযোগ"}</button>
      <button onclick="aib.review(${p.id})" class="flex-1 py-2.5 bg-gray-200 text-xs rounded-xl font-bold">রিভিউ</button>
      ${me && p.owner === me.id ? `<button onclick="aib.del(${p.id})" class="px-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold">মুছুন</button>` : ""}
     </div></div>`;
  }

  // ================= ডাটা =================
  async function loadMe() {
    const { data: { user } } = await db.auth.getUser(); if (!user) return;
    const { data } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
    me = data || { id: user.id, full_name: user.email, role: "Buyer" };
    $("navUserName").innerText = `${me.full_name} (${me.role})`;
    $("myProfile").innerHTML = `<b>${esc(me.full_name)}</b> · ${esc(ROLES[me.role] || me.role)}<br>স্টোর/ব্যবসা: ${esc(me.business_name)} · ক্যাটাগরি: ${esc(CATS[me.category] || "")}<br>📞 ${esc(me.phone)} · 📍 ${esc(me.location_text)} ${me.lat ? "(GPS ✅)" : "(GPS নেই)"}<br>
     <button onclick="aib.saveLoc()" class="mt-2 mr-3 text-blue-700 font-bold">📍 আমার লোকেশন আপডেট</button><button onclick="aib.signOut()" class="mt-2 text-red-600 font-bold">Sign out</button>`;
    await loadStores(); loadProducts(); refreshMaps();
  }
  async function loadStores() {
    const { data } = await db.from("stores").select("id,name,category,owner"); S = data || [];
    $("pStore").innerHTML = `<option value="">স্টোর ছাড়া</option>` + S.filter((s) => me && s.owner === me.id).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  }
  async function loadProducts() {
    const [a, b, c] = await Promise.all([db.from("products").select("*").order("created_at", { ascending: false }).limit(300), db.from("reviews").select("*"), db.from("profiles").select("id,phone,role")]);
    if (a.error) return console.error(a.error.message);
    P = a.data || []; R = b.data || []; U = {}; (c.data || []).forEach((u) => (U[u.id] = u)); refresh();
  }

  // ================= লোকেশন / ম্যাপ =================
  async function pts() {
    const [{ data: u }, { data: s }] = await Promise.all([db.from("profiles").select("full_name,role,lat,lng").not("lat", "is", null), db.from("stores").select("name,lat,lng").not("lat", "is", null)]);
    return [...(u || []).map((x) => ({ lat: x.lat, lng: x.lng, t: `${x.full_name} (${ROLES[x.role] || x.role})`, c: ROLE_COLOR[x.role] || "#1d4ed8" })), ...(s || []).map((x) => ({ lat: x.lat, lng: x.lng, t: `🏪 ${x.name}`, c: "#e53935" }))];
  }
  function drawFrame(q, z) { $("gmap").innerHTML = `<iframe id="gframe" class="w-full h-full rounded-xl" loading="lazy" src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=${gType}&z=${z}&output=embed"></iframe>`; }
  async function refreshMaps() {
    const a = await pts();
    if (window.map) { if (usersLayer) usersLayer.clearLayers(); else usersLayer = L.layerGroup().addTo(map);
      a.forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 8, color: p.c, fillOpacity: 0.85 }).bindPopup(esc(p.t)).addTo(usersLayer)); }
    $("locList").innerHTML = a.map((p) => `<button onclick="aib.showLoc(${p.lat},${p.lng})" class="px-3 py-1.5 rounded-lg border bg-gray-100 whitespace-nowrap">📍 ${esc(p.t)}</button>`).join("") || `<span class="text-gray-500">এখনো কোনো লোকেশন যোগ হয়নি</span>`;
    if (GMAPS_KEY) {
      const draw = () => { window.gmapObj = new google.maps.Map($("gmap"), { center: { lat: 23.8, lng: 90.4 }, zoom: 7, mapTypeId: "hybrid" });
        a.forEach((p) => new google.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map: gmapObj, title: p.t })); };
      if (window.google?.maps) draw(); else { const s = document.createElement("script"); s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}`; s.onload = draw; document.head.appendChild(s); }
    } else if (!$("gframe")) drawFrame("Bangladesh", 7);
  }

  // ================= চ্যাট =================
  function addMsg(m) {
    if (!m || seen.has(m.id)) return; seen.add(m.id);
    const b = $("chatBox"), own = me && m.user_id === me.id;
    b.insertAdjacentHTML("beforeend", `<div class="${own ? "text-right" : ""}"><span class="inline-block max-w-[85%] rounded-xl px-3 py-1.5 ${own ? "bg-brandRed text-white" : "bg-white border"}"><b class="${own ? "" : "text-brandRed"}">${esc(m.user_name)}:</b> ${esc(m.body)}</span></div>`);
    b.scrollTop = b.scrollHeight;
  }
  async function initChat() {
    const { data } = await db.from("messages").select("*").order("created_at", { ascending: false }).limit(50); (data || []).reverse().forEach(addMsg);
    const ch = db.channel("aib-chat", { config: { presence: { key: "u" + Math.random().toString(36).slice(2) } } });
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (x) => addMsg(x.new))
      .on("presence", { event: "sync" }, () => { $("onl").innerText = Object.keys(ch.presenceState()).length || 1; })
      .subscribe((s) => { if (s === "SUBSCRIBED") ch.track({ at: Date.now() }); });
  }

  // ================= শুরু =================
  refresh(); loadStores(); loadProducts(); initChat(); loadMe(); setTimeout(refreshMaps, 1200);
  db.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" && !me) loadMe(); });
})();
