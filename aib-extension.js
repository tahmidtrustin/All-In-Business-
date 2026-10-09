/* All In Business - Extension v4 (আসল index.html অপরিবর্তিত) */
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
  const lbl = "block text-[11px] font-bold text-gray-600 mb-0.5";
  const grid = $("productsGrid");
  const prodSection = grid.closest("section");
  prodSection.style.scrollMarginTop = "200px";
  const modal = (id, title, body) => `<div id="${id}" class="fixed inset-0 bg-black/70 z-[60] hidden flex items-center justify-center p-4"><div class="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto"><div class="bg-brandDark text-white p-4 flex justify-between items-center"><h3 class="font-black">${title}</h3><button onclick="aib.close('${id}')" class="text-2xl leading-none">×</button></div><div class="p-5">${body}</div></div></div>`;

  // ================= হেডারে নতুন অ্যাকশন বার (ক্যাটাগরি বারের ঠিক নিচে) =================
  const nav = [["fa-store", "আমার স্টোর", "aib.openStore()"], ["fa-plus", "পণ্য যোগ (বিক্রি)", "aib.openProd('sell')"], ["fa-cart-plus", "কিনতে চাই (ক্রয় রিকোয়েস্ট)", "aib.openProd('buy')"],
    ["fa-comments", "চ্যাট রুম", "aib.goChat()"], ["fa-map-location-dot", "লোকেশন / ম্যাপ", "aib.goMap()"]];
  document.querySelector("header").insertAdjacentHTML("beforeend", `
  <div class="bg-gray-800 text-gray-100 border-t border-gray-700"><div class="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto text-sm">
   ${nav.map(([ic, t, fn]) => `<div onclick="${fn}" class="interactive-hover px-4 py-2.5 font-semibold border-r border-gray-700 flex items-center gap-2 whitespace-nowrap"><i class="fa-solid ${ic}"></i> ${t}</div>`).join("")}
  </div></div>`);

  // ================= পপআপ (নিচে কোনো নতুন সেকশন নয়) =================
  document.body.insertAdjacentHTML("beforeend", `
  <div id="aibAuth" class="fixed inset-0 bg-black/70 z-[60] hidden flex items-center justify-center p-4">
   <div class="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto">
    <div class="bg-brandDark text-white p-5 text-center relative">
     <button onclick="aib.close('aibAuth')" class="absolute top-3 right-4 text-xl">×</button>
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
      <input id="aName" placeholder="Full name (পূর্ণ নাম)" class="${inp}">
      <input id="aBiz" placeholder="Business / shop name (ক্রেতা ছাড়া বাধ্যতামূলক)" class="${inp}">
      <select id="aCat" class="${inp}">${opts(CATS)}</select>
      <input id="aPhone" placeholder="Mobile (01XXXXXXXXX)" class="${inp}">
      <input id="aNid" placeholder="NID / ট্রেড লাইসেন্স নম্বর (ক্রেতা ছাড়া বাধ্যতামূলক)" class="${inp}">
      <input id="aLoc" placeholder="জেলা ও উপজেলা" class="${inp}">
      <input id="aAddr" placeholder="পূর্ণ ঠিকানা (গ্রাম/বাজার/রোড)" class="${inp}">
      <button type="button" onclick="aib.getGPS('aGps')" class="text-xs bg-gray-100 border rounded px-3 py-2 w-full">📍 আমার বর্তমান লোকেশন নিন (ক্রেতা ছাড়া বাধ্যতামূলক) <span id="aGps"></span></button>
      <p class="text-[11px] text-gray-500">মিথ্যা তথ্য দিলে অ্যাকাউন্ট বাতিল হবে। অ্যাডমিন যাচাই করলে ✅ ভেরিফাইড ব্যাজ পাবেন।</p>
     </div>
     <input id="aEmail" type="email" required placeholder="Email" class="${inp}">
     <input id="aPass" type="password" required minlength="6" placeholder="Password" class="${inp}">
     <button class="w-full bg-brandRed text-white py-3 rounded-xl font-bold" id="aSubmit">Sign in</button>
    </form>
   </div>
  </div>
  ${modal("aibProfile", "আমার প্রোফাইল", `<div id="profBody" class="text-sm space-y-2"></div>`)}
  ${modal("aibStore", "আমার স্টোর", `
   <div id="myStores" class="mb-4 space-y-2 text-sm"></div>
   <form onsubmit="aib.addStore(event)" class="space-y-2">
    <p class="text-xs text-gray-500">নতুন স্টোর খুলুন। সঠিক তথ্য দিন, অ্যাডমিন যাচাই করে ✅ ভেরিফাইড করবে।</p>
    <div><label class="${lbl}">স্টোরের নাম *</label><input id="sName" required class="${inp}"></div>
    <div><label class="${lbl}">ক্যাটাগরি *</label><select id="sCat" class="${inp}">${opts(CATS)}</select></div>
    <div><label class="${lbl}">মালিকের নাম *</label><input id="sOwner" required class="${inp}"></div>
    <div><label class="${lbl}">মোবাইল *</label><input id="sPhone" required class="${inp}" placeholder="01XXXXXXXXX"></div>
    <div><label class="${lbl}">ট্রেড লাইসেন্স / NID নম্বর *</label><input id="sLic" required class="${inp}"></div>
    <div><label class="${lbl}">জেলা ও উপজেলা *</label><input id="sDist" required class="${inp}"></div>
    <div><label class="${lbl}">পূর্ণ ঠিকানা *</label><input id="sAddr" required class="${inp}"></div>
    <div><label class="${lbl}">ওয়েবসাইট / ফেসবুক পেজ লিংক</label><input id="sWeb" class="${inp}"></div>
    <div><label class="${lbl}">স্টোরের বিবরণ</label><input id="sDesc" class="${inp}"></div>
    <button type="button" onclick="aib.getGPS('sGps')" class="text-xs bg-gray-100 border rounded p-2 w-full">📍 স্টোরের লোকেশন নিন (বাধ্যতামূলক) <span id="sGps"></span></button>
    <button class="w-full bg-brandRed text-white rounded-lg font-bold py-2.5">স্টোর তৈরি করুন</button>
   </form>`)}
  ${modal("aibProd", "পণ্য যোগ করুন", `
   <form id="prodForm" onsubmit="aib.addProduct(event)" class="space-y-2">
    <div><label class="${lbl}">ধরন</label><select id="pKind" class="${inp}"><option value="sell">আমি বিক্রি করব (Sell)</option><option value="buy">আমি কিনতে চাই (Buy request)</option></select></div>
    <div><label class="${lbl}">পণ্যের নাম *</label><input id="pTitle" required class="${inp}"></div>
    <div><label class="${lbl}">ক্যাটাগরি *</label><select id="pCat" class="${inp}">${opts(CATS)}</select></div>
    <div class="grid grid-cols-2 gap-2"><div><label class="${lbl}">দাম (৳)</label><input id="pPrice" type="number" class="${inp}"></div><div><label class="${lbl}">পরিমাণ</label><input id="pQty" class="${inp}" placeholder="১০০ কেজি"></div></div>
    <div><label class="${lbl}">জেলা *</label><input id="pDist" required class="${inp}"></div>
    <div><label class="${lbl}">আমার স্টোর</label><select id="pStore" class="${inp}"><option value="">স্টোর ছাড়া</option></select></div>
    <div><label class="${lbl}">বিবরণ</label><input id="pDesc" class="${inp}"></div>
    <button class="w-full bg-brandRed text-white rounded-lg font-bold py-2.5">প্রকাশ করুন</button>
   </form>`)}`);

  // চ্যাট ও Google লোকেশন (হেডারের লিংক এখানে নিয়ে আসবে)
  document.querySelector("main").insertAdjacentHTML("beforeend", `
  <section id="aibChatMap" style="scroll-margin-top:200px" class="grid lg:grid-cols-2 gap-6">
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
  const badge = (v) => v ? `<span class="text-[10px] font-black px-2 py-0.5 rounded bg-green-100 text-green-700">✅ ভেরিফাইড</span>` : `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">যাচাই চলছে</span>`;
  const aib = (window.aib = {
    open(id) { $(id).classList.remove("hidden"); }, close(id) { $(id).classList.add("hidden"); },
    tab(m) { mode = m; $("upOnly").classList.toggle("hidden", m === "in"); $("aSubmit").innerText = m === "in" ? "Sign in" : "Create account";
      $("tabIn").className = "flex-1 py-3 " + (m === "in" ? "bg-brandRed text-white" : "bg-gray-200"); $("tabUp").className = "flex-1 py-3 " + (m === "up" ? "bg-brandRed text-white" : "bg-gray-200"); },
    guard(fn) { if (!me) return openAuthModal(); fn(); },
    goChat() { $("aibChatMap").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("chatIn").focus({ preventScroll: true }), 600); },
    goMap() { $("map").closest("section").scrollIntoView({ behavior: "smooth" }); },
    openProfile() { renderProfile(); aib.open("aibProfile"); },
    openStore() { aib.guard(() => {
      if (me.role === "Buyer") return alert("স্টোর খুলতে Seller / Dealer / Wholesaler অ্যাকাউন্ট লাগবে। ক্রেতা হিসেবে আপনি ক্রয় রিকোয়েস্ট দিতে পারবেন।");
      $("sOwner").value ||= me.full_name || ""; $("sPhone").value ||= me.phone || ""; $("sLic").value ||= me.nid_or_license || ""; $("sDist").value ||= me.location_text || ""; $("sAddr").value ||= me.address || "";
      renderMyStores(); aib.open("aibStore"); }); },
    openProd(kind) { aib.guard(() => {
      if (kind === "sell" && me.role === "Buyer") return alert("পণ্য বিক্রি করতে Seller / Dealer / Wholesaler অ্যাকাউন্ট লাগবে। আপনি \"কিনতে চাই\" দিয়ে ক্রয় রিকোয়েস্ট দিতে পারবেন।");
      $("pKind").value = kind; if (catFilter !== "all") $("pCat").value = catFilter; $("pDist").value ||= ""; aib.open("aibProd"); }); },
    getGPS(el) { navigator.geolocation.getCurrentPosition((p) => { gps[el] = { lat: p.coords.latitude, lng: p.coords.longitude }; $(el).innerText = "✅ নেওয়া হয়েছে"; }, () => alert("লোকেশন পারমিশন দিন")); },
    saveLoc() {
      navigator.geolocation.getCurrentPosition(async (p) => {
        const { error } = await db.from("profiles").update({ lat: p.coords.latitude, lng: p.coords.longitude }).eq("id", me.id);
        if (error) return alert(error.message); me.lat = p.coords.latitude; me.lng = p.coords.longitude; alert("লোকেশন সেভ হয়েছে"); renderProfile(); refreshMaps();
      }, () => alert("লোকেশন পারমিশন দিন"));
    },
    async submitAuth(e) {
      e.preventDefault(); const email = $("aEmail").value, password = $("aPass").value;
      if (mode === "up") {
        const role = $("aRole").value, v = (i) => $(i).value.trim();
        if (!v("aName")) return alert("পূর্ণ নাম দিন");
        if (!/^01[3-9]\d{8}$/.test(v("aPhone"))) return alert("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
        if (role !== "Buyer") {
          if (!v("aBiz") || !v("aNid") || !v("aLoc") || !v("aAddr")) return alert("ব্যবসার নাম, NID/ট্রেড লাইসেন্স, জেলা-উপজেলা ও পূর্ণ ঠিকানা বাধ্যতামূলক");
          if (!gps.aGps) return alert("আপনার বর্তমান লোকেশন (GPS) নিন");
        }
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) return alert(error.message);
        if (!data.user) return alert("এই ইমেইল দিয়ে আগে অ্যাকাউন্ট খোলা হয়েছে। Sign in করুন।");
        if (!data.session) return alert("ইমেইল কনফার্ম করে Sign in করুন (অথবা Supabase এ Confirm email বন্ধ করুন)");
        const r = await db.from("profiles").upsert({ id: data.user.id, full_name: v("aName"), business_name: v("aBiz"), role, category: $("aCat").value, phone: v("aPhone"),
          nid_or_license: v("aNid"), location_text: v("aLoc"), address: v("aAddr"), lat: gps.aGps?.lat, lng: gps.aGps?.lng });
        if (r.error) return alert(r.error.message);
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password }); if (error) return alert(error.message);
      }
      aib.close("aibAuth"); await loadMe();
    },
    async addStore(e) {
      e.preventDefault(); const g = gps.sGps || (me.lat ? { lat: me.lat, lng: me.lng } : null);
      if (!g) return alert("স্টোরের লোকেশন (GPS) নিন");
      if (!/^01[3-9]\d{8}$/.test($("sPhone").value.trim())) return alert("সঠিক মোবাইল নম্বর দিন");
      const { error } = await db.from("stores").insert({ owner: me.id, name: $("sName").value, category: $("sCat").value, description: $("sDesc").value, owner_name: $("sOwner").value,
        phone: $("sPhone").value, trade_license: $("sLic").value, district: $("sDist").value, address: $("sAddr").value, website: $("sWeb").value, lat: g.lat, lng: g.lng });
      if (error) return alert(error.message); e.target.reset(); await loadStores(); renderMyStores(); refreshMaps(); alert("স্টোর তৈরি হয়েছে। যাচাইয়ের পর ✅ ভেরিফাইড ব্যাজ পাবেন।");
    },
    async addProduct(e) {
      e.preventDefault(); const kind = $("pKind").value;
      if (kind === "sell" && me.role === "Buyer") return alert("পণ্য বিক্রি করতে Seller / Dealer / Wholesaler অ্যাকাউন্ট লাগবে");
      if (kind === "sell" && (!me.phone || !me.nid_or_license)) return alert("বিক্রি করতে প্রোফাইলে মোবাইল ও NID/ট্রেড লাইসেন্স থাকতে হবে");
      const { error } = await db.from("products").insert({ owner: me.id, owner_name: me.business_name || me.full_name, store_id: $("pStore").value || null, title: $("pTitle").value, category: $("pCat").value,
        kind, price: $("pPrice").value || null, qty: $("pQty").value, district: $("pDist").value, description: $("pDesc").value });
      if (error) return alert(error.message); e.target.reset(); aib.close("aibProd"); loadProducts();
    },
    async del(id) { if (!confirm("পণ্যটি মুছবেন?")) return; const { error } = await db.from("products").delete().eq("id", id); if (error) alert(error.message); loadProducts(); },
    review(pid) {
      aib.guard(async () => { const r = parseInt(prompt("রেটিং দিন (১-৫):"), 10); if (!(r >= 1 && r <= 5)) return; const c = prompt("মন্তব্য:") || "";
        const { error } = await db.from("reviews").insert({ product_id: pid, user_id: me.id, user_name: me.full_name, rating: r, comment: c }); if (error) alert(error.message); loadProducts(); });
    },
    contact(el) { aib.guard(() => { $("chatIn").value = `@${el.dataset.n} আপনার পণ্য "${el.dataset.t}" সম্পর্কে জানতে চাই — `; aib.goChat(); }); },
    async send(e) {
      e.preventDefault(); if (!me) return openAuthModal(); const b = $("chatIn").value.trim(); if (!b) return;
      const { data, error } = await db.from("messages").insert({ user_id: me.id, user_name: me.full_name, body: b }).select().single();
      if (error) return alert(error.message); $("chatIn").value = ""; addMsg(data);
    },
    async signOut() { await db.auth.signOut(); me = null; aib.close("aibProfile"); $("navUserName").innerText = "প্রোফাইল / লগইন"; refresh(); },
    gToggle() { gType = gType === "k" ? "m" : "k"; const f = $("gframe"); if (f) f.src = f.src.replace(/t=[km]/, "t=" + gType); },
    showLoc(lat, lng) { if (GMAPS_KEY && window.gmapObj) { gmapObj.setCenter({ lat, lng }); gmapObj.setZoom(15); } else drawFrame(`${lat},${lng}`, 15); },
  });

  function renderProfile() {
    if (!me) return;
    $("profBody").innerHTML = `<div class="text-base font-black">${esc(me.full_name)} ${badge(me.verified)}</div>
     <div>${esc(ROLES[me.role] || me.role)} · ${esc(CATS[me.category] || "")}</div>
     <div>ব্যবসা: ${esc(me.business_name || "—")}</div><div>📞 ${esc(me.phone || "—")}</div><div>🪪 ${esc(me.nid_or_license || "—")}</div>
     <div>📍 ${esc(me.location_text || "—")} ${me.address ? "· " + esc(me.address) : ""} ${me.lat ? "(GPS ✅)" : "(GPS নেই)"}</div>
     <div class="flex flex-wrap gap-3 pt-2 font-bold"><button onclick="aib.saveLoc()" class="text-blue-700">📍 লোকেশন আপডেট</button><button onclick="aib.signOut()" class="text-red-600">Sign out</button></div>`;
  }
  function renderMyStores() {
    const mine = S.filter((s) => me && s.owner === me.id);
    $("myStores").innerHTML = mine.length ? `<div class="font-bold">আপনার স্টোরসমূহ:</div>` + mine.map((s) => `<div class="border rounded-lg p-2">🏪 <b>${esc(s.name)}</b> ${badge(s.verified)}<div class="text-xs text-gray-500">${esc(CATS[s.category] || "")} · ${esc(s.district || "")}</div></div>`).join("") : "";
  }

  // ================= বিদ্যমান ফাংশনের সাথে সংযোগ =================
  const oldRender = window.renderProductsGrid;
  window.renderProductsGrid = (list) => {
    lastList = list; oldRender(list);
    const ups = userList();
    if (ups.length) grid.insertAdjacentHTML("afterbegin", ups.map(card).join(""));
    else if (!list.length) grid.innerHTML = `<p class="text-gray-500 text-sm col-span-full">এই ক্যাটাগরিতে এখনো কোনো পণ্য নেই। উপরের "পণ্য যোগ" বাটনে চাপ দিয়ে প্রথম পণ্যটি আপনিই যোগ করুন!</p>`;
    $("productCountBadge").innerText = `মোট দেখানো হচ্ছে: ${list.length + ups.length} টি`;
  };
  function refresh() { window.renderProductsGrid(lastList || DISTRICTS_DATA); }

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

  // লগইন/প্রোফাইল: আগের হেডার বাটনই ব্যবহার হবে (লগইন না থাকলে সাইন-ইন, থাকলে প্রোফাইল পপআপ)
  window.openAuthModal = () => { if (me) return aib.openProfile(); aib.open("aibAuth"); aib.tab(mode); };
  window.requireAction = (name) => {
    if (!me) { $("aibAuthMsg").innerText = `"${name}" এর আগে সাইন ইন করুন। আপনার রোল প্রোফাইলে সেভ হবে।`; return openAuthModal(); }
    if (name.includes("কোটেশন")) return aib.openProd("buy");
    if (name.includes("ডিলার")) return aib.openProfile();
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
       <div class="absolute top-3 right-3">${badge(ow.verified)}</div>
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
    await loadStores(); loadProducts(); refreshMaps();
  }
  async function loadStores() {
    const { data } = await db.from("stores").select("*"); S = data || [];
    $("pStore").innerHTML = `<option value="">স্টোর ছাড়া</option>` + S.filter((s) => me && s.owner === me.id).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  }
  async function loadProducts() {
    const [a, b, c] = await Promise.all([db.from("products").select("*").order("created_at", { ascending: false }).limit(300), db.from("reviews").select("*"), db.from("profiles").select("*")]);
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
