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
  const modal = (id, title, body, wide) => `<div id="${id}" class="fixed inset-0 bg-black/70 z-[60] hidden flex items-center justify-center p-4"><div class="bg-white rounded-2xl ${wide ? "max-w-3xl" : "max-w-lg"} w-full max-h-[92vh] overflow-y-auto"><div class="bg-brandDark text-white p-4 flex justify-between items-center"><h3 class="font-black">${title}</h3><button onclick="aib.close('${id}')" class="text-2xl leading-none">×</button></div><div class="p-5">${body}</div></div></div>`;

  // ================= হেডারে নতুন অ্যাকশন বার (ক্যাটাগরি বারের ঠিক নিচে) =================
  const nav = [["fa-store", "আমার স্টোর", "aib.openStore()"], ["fa-plus", "পণ্য যোগ (বিক্রি)", "aib.openProd('sell')"], ["fa-cart-plus", "কিনতে চাই (ক্রয় রিকোয়েস্ট)", "aib.openProd('buy')"],
    ["fa-box", "আমার অর্ডার", "aib.openOrders()"], ["fa-comments", "চ্যাট রুম", "aib.goChat()"], ["fa-map-location-dot", "লোকেশন / ম্যাপ", "aib.goMap()"]];
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
    lastList = list; oldRender(list); enhance(list);
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
  const mkt = () => (typeof currentMarketMode !== "undefined" ? currentMarketMode : "b2b");
  const modeCls = (on) => "px-3 py-1.5 rounded-md " + (on ? "bg-brandRed text-white shadow" : "text-gray-600 hover:text-gray-900");
  $("modeB2C").insertAdjacentHTML("afterend", `<button id="modeBuyer" onclick="switchMarketMode('buyer')" class="${modeCls(false)}">ক্রেতা (Buyer)</button>`);
  window.switchMarketMode = (m) => {
    oldMode(m);
    [["b2b", "modeB2B"], ["b2c", "modeB2C"], ["buyer", "modeBuyer"]].forEach(([k, id]) => { const el = $(id); if (el) el.className = modeCls(k === m); });
    applyCat(catFilter, false);
    const t = $("sectionTitle"); if (t && m === "buyer" && catFilter === "all") t.innerText = "🛍️ ক্রেতা মোড — কেনার জন্য পণ্যসমূহ";
  };

  // লগইন/প্রোফাইল: আগের হেডার বাটনই ব্যবহার হবে (লগইন না থাকলে সাইন-ইন, থাকলে প্রোফাইল পপআপ)
  window.openAuthModal = () => { if (me) return aib.openProfile(); aib.open("aibAuth"); aib.tab(mode); };
  window.requireAction = (name) => {
    if (!me) { $("aibAuthMsg").innerText = `"${name}" এর আগে সাইন ইন করুন। আপনার রোল প্রোফাইলে সেভ হবে।`; return openAuthModal(); }
    if (name.includes("কার্ট")) return aib.openCart();
    if (name.includes("কোটেশন")) return aib.openProd("buy");
    if (name.includes("ডিলার")) return aib.openProfile();
    prodSection.scrollIntoView({ behavior: "smooth" });
  };
  const oldRoute = window.viewProductRoute;
  window.viewProductRoute = (id) => { if (!me) return requireAction("ম্যাপ ও সাপ্লাই রুট দেখতে"); oldRoute(id); };

  // ================= ইউজার পণ্য =================
  function userList() {
    const q = searchQ.toLowerCase().trim(), d = distFilter !== "all" ? DISTRICTS_DATA.find((x) => x.id === distFilter) : null;
    return P.filter((p) => (catFilter === "all" || p.category === catFilter) && (mkt() !== "buyer" || (p.kind === "sell" && p.price)) && (!d || String(p.district || "").includes(d.name)) &&
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
     <div class="p-4 pt-0 flex flex-wrap gap-2">
      ${p.kind === "sell" ? `<button onclick="aib.viewP(${p.id})" class="w-full py-2.5 bg-brandDark hover:bg-gray-800 text-white text-xs rounded-xl font-bold">🛍️ বিস্তারিত দেখুন ও কিনুন</button><button onclick="aib.addP(${p.id})" class="flex-1 py-2.5 bg-brandRed hover:bg-brandRedDark text-white text-xs rounded-xl font-bold">🛒 কার্টে যোগ</button>` : ""}
      <button data-n="${esc(p.owner_name)}" data-t="${esc(p.title)}" onclick="aib.contact(this)" class="flex-1 py-2.5 ${p.kind === "buy" ? "bg-brandRed text-white" : "bg-gray-100"} text-xs rounded-xl font-bold">${p.kind === "buy" ? "সাপ্লাই অফার" : "💬 যোগাযোগ"}</button>
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

  // ================= কার্ট / পণ্যের বিস্তারিত / চেকআউট / পেমেন্ট / অর্ডার =================
  // নিচের নম্বরগুলো আপনার নিজের মার্চেন্ট নম্বর দিয়ে বদলে নিন
  const PAY = {
    cod: { n: "ক্যাশ অন ডেলিভারি" },
    bkash: { n: "bKash", no: "01XXXXXXXXX" }, nagad: { n: "Nagad", no: "01XXXXXXXXX" }, rocket: { n: "Rocket", no: "01XXXXXXXXX" },
    bank: { n: "ব্যাংক ট্রান্সফার", no: "ব্যাংক: XXXX · A/C: XXXXXXXX" },
  };
  const STATUS = { pending: "⏳ অপেক্ষমাণ", confirmed: "✅ নিশ্চিত", shipped: "🚚 পাঠানো হয়েছে", delivered: "📦 ডেলিভারি সম্পন্ন", cancelled: "❌ বাতিল" };
  let cart = [], cur = null, curQty = 1;
  try { cart = JSON.parse(localStorage.getItem("aib_cart") || "[]"); } catch (e) {}
  cart.forEach((c) => (c.min = 1));
  const updateBadge = () => { ["cartCount", "bnCart"].forEach((i) => { const b = $(i); if (b) b.innerText = cart.length; }); };
  const saveCart = () => { try { localStorage.setItem("aib_cart", JSON.stringify(cart)); } catch (e) {} updateBadge(); };
  const cartTotal = () => cart.reduce((a, c) => a + c.price * c.qty, 0);
  window.updateCartBadge = updateBadge;
  let toastT; const toast = (m) => { const t = $("aibToast"); t.innerText = m; t.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 2200); };

  document.body.insertAdjacentHTML("beforeend",
    modal("aibItem", "পণ্যের বিস্তারিত", `<div id="itemBody"></div>`, true) +
    modal("aibCart", "🛒 আমার কার্ট", `<div id="cartBody"></div>`, true) +
    modal("aibCheckout", "অর্ডার ও পেমেন্ট", `<form onsubmit="aib.place(event)" class="space-y-2 text-sm">
      <div id="coSum" class="bg-gray-50 border rounded-xl p-3 text-xs space-y-1"></div>
      <div><label class="${lbl}">প্রাপকের নাম *</label><input id="coName" required class="${inp}"></div>
      <div><label class="${lbl}">মোবাইল *</label><input id="coPhone" required class="${inp}" placeholder="01XXXXXXXXX"></div>
      <div><label class="${lbl}">ডেলিভারি ঠিকানা *</label><input id="coAddr" required class="${inp}"></div>
      <div><label class="${lbl}">বিশেষ নির্দেশনা</label><input id="coNote" class="${inp}"></div>
      <div class="font-bold text-xs pt-1">পেমেন্ট পদ্ধতি</div>
      <div class="space-y-1">${Object.entries(PAY).map(([k, v], i) => `<label class="flex items-center gap-2 border rounded-lg p-2 cursor-pointer"><input type="radio" name="pm" value="${k}" ${i === 0 ? "checked" : ""} onchange="aib.pmSel()"> ${v.n}</label>`).join("")}</div>
      <div id="pmInfo" class="text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-2"></div>
      <div id="coTrxW" class="hidden"><label class="${lbl}">Transaction ID (TrxID) *</label><input id="coTrx" class="${inp}"></div>
      <button class="w-full bg-brandRed text-white rounded-lg font-bold py-3">অর্ডার নিশ্চিত করুন</button>
     </form>`) +
    modal("aibOrders", "📦 আমার অর্ডার", `<div id="ordBody" class="space-y-3"></div>`, true) +
    `<div id="aibToast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brandDark text-white text-sm px-4 py-2 rounded-full shadow-lg z-[70] hidden"></div>`);

  // আসল জেলা-কার্ডে "কিনুন" ও "কার্টে যোগ" বাটন
  function enhance(list) {
    const b2b = typeof currentMarketMode !== "undefined" && currentMarketMode === "b2b";
    [...grid.children].forEach((el, i) => {
      const d = list[i]; if (!d) return;
      const btns = el.querySelectorAll("button"), last = btns[btns.length - 1]; if (!last) return;
      last.outerHTML = `<button onclick="aib.viewD('${d.id}')" class="w-full py-2.5 bg-brandRed hover:bg-brandRedDark text-white text-xs rounded-xl font-bold shadow">${b2b ? "📦 বিস্তারিত ও বাল্ক অর্ডার" : "🛍️ বিস্তারিত দেখুন ও কিনুন"}</button>
        <button onclick="aib.addD('${d.id}')" class="w-full py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-xs rounded-xl font-bold">🛒 কার্টে যোগ করুন</button>`;
    });
  }
  function mkItem(src, id) {
    if (src === "d") {
      const d = DISTRICTS_DATA.find((x) => x.id === id); if (!d) return null;
      const b2b = typeof currentMarketMode !== "undefined" && currentMarketMode === "b2b";
      return { key: "d:" + id, src, id, title: d.famous, sub: `${d.name}, ${d.division}`, price: 250, min: 1, unit: "ইউনিট", seller: `${d.name} সাপ্লাই পয়েন্ট`, owner: null, gi: d.gi,
        desc: `${d.name} জেলার আসল ও খাঁটি স্থানীয় পণ্য, সরাসরি উৎস থেকে সরবরাহ।`, stock: b2b ? "বাল্ক: ১০০ কেজি / ২০ পিস" : "" };
    }
    const p = P.find((x) => x.id === +id); if (!p) return null;
    const ow = U[p.owner] || {};
    return { key: "p:" + p.id, src, id: p.id, title: p.title, sub: `${p.district || ""} · ${CATS[p.category] || ""}`, price: p.price ? +p.price : null, min: 1, unit: "ইউনিট",
      seller: p.owner_name, owner: p.owner, verified: ow.verified, desc: p.description, stock: p.qty };
  }
  function addToCart(it, qty, show = true) {
    if (me && it.owner && it.owner === me.id) return alert("নিজের পণ্য নিজে কেনা যাবে না");
    const ex = cart.find((c) => c.key === it.key);
    if (ex) ex.qty += qty; else cart.push({ key: it.key, src: it.src, title: it.title, sub: it.sub, gi: it.gi, verified: it.verified, stock: it.stock, price: it.price, min: 1, seller: it.seller, owner: it.owner, qty });
    saveCart(); toast("🛒 কার্টে যোগ হয়েছে"); if (show) { renderCart(); aib.open("aibCart"); }
  }
  function showItem(it) { cur = it; curQty = it.min; renderItem(); aib.open("aibItem"); }
  function setQty(v) { curQty = Math.max(cur.min, v); $("iq").value = curQty; $("itot").innerText = cur.price ? "৳ " + cur.price * curQty : ""; }
  function renderItem() {
    const it = cur, rv = it.src === "p" ? R.filter((x) => x.product_id === it.id) : [], avg = rv.length ? (rv.reduce((a, b) => a + b.rating, 0) / rv.length).toFixed(1) : "—";
    $("itemBody").innerHTML = `<div class="space-y-3 text-sm">
     <div class="h-28 rounded-xl bg-gradient-to-br from-brandDark to-gray-700 flex items-center justify-center text-white text-5xl"><i class="fa-solid fa-basket-shopping"></i></div>
     <h4 class="text-lg font-black">${esc(it.title)} ${it.gi ? `<span class="text-[10px] bg-brandGold text-gray-900 px-2 py-0.5 rounded font-black">GI স্বীকৃত</span>` : ""}</h4>
     <div class="text-xs text-gray-500">📍 ${esc(it.sub)}</div>
     <p class="text-gray-700">${esc(it.desc || "")}</p>
     <div class="bg-gray-50 border rounded-xl p-3 space-y-1 text-xs">
      <div>বিক্রেতা: <b>${esc(it.seller)}</b> ${it.src === "p" ? badge(it.verified) : ""}</div>
      ${it.stock ? `<div>পরিমাণ/মজুদ: <b>${esc(it.stock)}</b></div>` : ""}
      <div>সর্বনিম্ন অর্ডার: <b>${it.min}</b> ${esc(it.unit)}</div>
      <div>রিভিউ: ⭐ ${avg} (${rv.length})</div>
     </div>
     ${rv.slice(0, 3).map((x) => `<div class="text-[11px] bg-gray-50 rounded p-1">${"★".repeat(x.rating)} ${esc(x.user_name)}: ${esc(x.comment)}</div>`).join("")}
     ${it.price ? `<div class="text-2xl font-black text-brandRed">৳ ${it.price} <span class="text-xs text-gray-500 font-normal">/ ${esc(it.unit)}</span></div>
      <div class="flex items-center gap-2"><span class="font-bold text-xs">কত ${esc(it.unit)} নিবেন?</span>
       <button onclick="aib.q(-1)" class="w-8 h-8 rounded-lg bg-gray-200 font-black">−</button>
       <input id="iq" type="number" value="${curQty}" min="${it.min}" onchange="aib.qset(this.value)" class="w-20 border rounded-lg p-1.5 text-center font-bold">
       <button onclick="aib.q(1)" class="w-8 h-8 rounded-lg bg-gray-200 font-black">+</button>
       <span class="ml-auto text-lg font-black" id="itot">৳ ${it.price * curQty}</span></div>
      <div class="flex gap-2"><button onclick="aib.addCur(false)" class="flex-1 py-3 bg-brandDark text-white rounded-xl font-bold">🛒 কার্টে যোগ করুন</button><button onclick="aib.addCur(true)" class="flex-1 py-3 bg-brandRed text-white rounded-xl font-bold">⚡ এখনই কিনুন</button></div>`
      : `<div class="text-sm font-bold text-gray-700">দর আলোচনা সাপেক্ষে। বিক্রেতার সাথে কথা বলে দাম ঠিক করুন।</div><input id="iq" type="hidden"><span id="itot"></span>`}
     ${it.src === "p" ? `<div class="flex gap-2 text-xs font-bold"><button data-n="${esc(it.seller)}" data-t="${esc(it.title)}" onclick="aib.close('aibItem');aib.contact(this)" class="flex-1 py-2 bg-gray-100 rounded-lg">💬 বিক্রেতার সাথে কথা বলুন</button><button onclick="aib.review(${it.id})" class="flex-1 py-2 bg-gray-100 rounded-lg">⭐ রিভিউ দিন</button></div>` : ""}
    </div>`;
  }
  function renderCart() {
    const n = cart.reduce((a, c) => a + c.qty, 0);
    $("cartBody").innerHTML = cart.length ? `<div class="space-y-4">
      <div class="text-sm text-gray-600">আপনার কার্টে <b>${cart.length}</b> টি পণ্য (মোট <b>${n}</b> ইউনিট) আছে</div>
      ${cart.map((c) => `<div class="border-2 border-gray-200 rounded-2xl p-4 flex gap-4">
        <div class="hidden sm:flex w-24 h-24 shrink-0 rounded-xl bg-gradient-to-br from-brandDark to-gray-700 items-center justify-center text-white text-4xl"><i class="fa-solid fa-basket-shopping"></i></div>
        <div class="flex-1 space-y-2">
          <div class="flex justify-between gap-2"><h4 class="text-base font-black text-gray-900">${esc(c.title)} ${c.gi ? `<span class="text-[10px] bg-brandGold px-2 py-0.5 rounded font-black">GI</span>` : ""}</h4><button onclick="aib.cr('${c.key}')" class="text-red-600 text-sm font-bold whitespace-nowrap">🗑️ মুছুন</button></div>
          <div class="text-sm text-gray-500">📍 ${esc(c.sub || "")}</div>
          <div class="text-sm">🏪 বিক্রেতা: <b>${esc(c.seller)}</b> ${c.src === "p" ? badge(c.verified) : ""}</div>
          ${c.stock ? `<div class="text-sm text-gray-500">মজুদ/পরিমাণ: ${esc(c.stock)}</div>` : ""}
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <span class="text-sm">দর: <b class="text-brandRed">৳ ${c.price}</b> / ইউনিট</span>
            <div class="flex items-center gap-2"><button onclick="aib.cq('${c.key}',-1)" class="w-9 h-9 rounded-lg bg-gray-200 text-lg font-black">−</button><b class="text-lg w-10 text-center">${c.qty}</b><button onclick="aib.cq('${c.key}',1)" class="w-9 h-9 rounded-lg bg-gray-200 text-lg font-black">+</button></div>
            <span class="ml-auto text-xl font-black text-brandRed">৳ ${c.price * c.qty}</span>
          </div></div></div>`).join("")}
      <div class="bg-gray-50 border rounded-2xl p-4 space-y-1 text-sm">
        <div class="flex justify-between"><span>পণ্যের মোট দাম</span><b>৳ ${cartTotal()}</b></div>
        <div class="flex justify-between text-gray-500"><span>ডেলিভারি চার্জ</span><span>বিক্রেতার সাথে ঠিক হবে</span></div>
        <div class="flex justify-between text-xl font-black pt-2 border-t"><span>সর্বমোট</span><span class="text-brandRed">৳ ${cartTotal()}</span></div>
      </div>
      <div class="flex gap-2"><button onclick="aib.close('aibCart')" class="flex-1 py-3 bg-gray-200 rounded-xl font-bold">+ আরো পণ্য দেখুন</button><button onclick="aib.openCheckout()" class="flex-1 py-3 bg-brandRed text-white rounded-xl font-bold">অর্ডার ও পেমেন্টে যান →</button></div></div>`
      : `<p class="text-base text-gray-500 py-6 text-center">🛒 কার্ট খালি। পণ্যের কার্ডে "কার্টে যোগ করুন" চাপুন।</p>`;
  }
  async function loadOrders() {
    const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) { $("ordBody").innerHTML = `<p class="text-red-600 text-sm">${esc(error.message)}</p>`; return; }
    const grp = (list) => { const m = {}; list.forEach((o) => (m[o.group_id || o.id] ||= []).push(o)); return Object.values(m); };
    const mine = grp(data.filter((o) => o.buyer === me.id)), inc = grp(data.filter((o) => o.seller === me.id));
    const steps = ["pending", "confirmed", "shipped", "delivered"];
    const track = (s) => {
      if (s === "cancelled") return `<div class="text-sm font-bold text-red-600">❌ অর্ডার বাতিল</div>`;
      const T = { pending: "অপেক্ষমাণ", confirmed: "নিশ্চিত", shipped: "পাঠানো হয়েছে", delivered: "ডেলিভারি সম্পন্ন" }, cu = steps.indexOf(s);
      const chips = steps.map((x, i) => i < cu
        ? (x === "pending" ? `<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-400 line-through">❌ ${T[x]}</span>` : `<span class="px-2 py-1 rounded-full bg-green-50 text-green-600">✔ ${T[x]}</span>`)
        : i === cu ? `<span class="px-2 py-1 rounded-full bg-green-600 text-white ring-2 ring-green-200">${STATUS[x]}</span>`
        : `<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-400">${T[x]}</span>`).join('<span class="text-gray-300">›</span>');
      return `<div class="flex flex-wrap items-center gap-1 text-xs font-bold">${chips}</div>${s === "delivered" ? `<div class="text-sm font-bold text-green-700">✅ পণ্য ডেলিভারি সম্পন্ন হয়েছে</div>` : ""}`;
    };
    const box = (g, sel) => {
      const f = g[0], tot = g.reduce((a, o) => a + +o.total, 0), dt = new Date(f.created_at).toLocaleString("bn-BD");
      return `<div class="border-2 rounded-2xl p-4 space-y-3">
       <div class="flex flex-wrap justify-between gap-2"><div><b class="text-base">অর্ডার # ${esc(f.group_id || f.id)}</b><div class="text-xs text-gray-500">🕒 ${esc(dt)}</div></div><div class="text-xl font-black text-brandRed">৳ ${tot}</div></div>
       ${g.map((o) => `<div class="bg-gray-50 border rounded-xl p-3 space-y-2 text-sm">
         <div class="flex flex-wrap justify-between gap-2"><b class="text-base">${esc(o.item_title)}</b><b>${o.qty} × ৳${o.unit_price} = ৳${o.total}</b></div>
         ${sel ? "" : `<div>🏪 বিক্রেতা: <b>${esc(o.seller_name)}</b>${U[o.seller]?.phone ? " · 📞 " + esc(U[o.seller].phone) : ""}</div>`}
         <div>💳 ${esc(PAY[o.payment_method]?.n || o.payment_method)}${o.trx_id ? " · TrxID: <b>" + esc(o.trx_id) + "</b>" : ""} · ${o.pay_status === "paid" ? "<b class='text-green-700'>✅ পরিশোধিত</b>" : "<b class='text-yellow-700'>⏳ পেমেন্ট যাচাই বাকি</b>"}</div>
         ${track(o.status)}
         ${sel ? `<div class="flex flex-wrap gap-2 pt-1 font-bold text-xs">${["confirmed", "shipped", "delivered", "cancelled"].map((s) => `<button onclick="aib.setSt(${o.id},'${s}')" class="px-3 py-1.5 bg-gray-200 rounded-lg">${STATUS[s]}</button>`).join("")}<button onclick="aib.setPaid(${o.id})" class="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">💰 পেমেন্ট পেয়েছি</button></div>` : ""}</div>`).join("")}
       <div class="text-sm space-y-0.5"><div>👤 ${sel ? "ক্রেতা" : "প্রাপক"}: <b>${esc(f.buyer_name)}</b> · 📞 ${esc(f.buyer_phone)}</div><div>📍 ঠিকানা: ${esc(f.address)}</div>${f.note ? `<div>📝 নির্দেশনা: ${esc(f.note)}</div>` : ""}</div></div>`;
    };
    $("ordBody").innerHTML = `<div class="font-black text-base">🛍️ আমার কেনা অর্ডার (${mine.length})</div>${mine.map((g) => box(g, false)).join("") || `<p class="text-sm text-gray-500">এখনো কিছু কেনেননি</p>`}
      <div class="font-black text-base pt-4">📥 আমার কাছে আসা অর্ডার (${inc.length})</div>${inc.map((g) => box(g, true)).join("") || `<p class="text-sm text-gray-500">কোনো অর্ডার আসেনি</p>`}`;
  }

  Object.assign(aib, {
    viewD(id) { const it = mkItem("d", id); if (it) showItem(it); },
    viewP(id) { const it = mkItem("p", id); if (it) showItem(it); },
    addD(id) { aib.guard(() => { const it = mkItem("d", id); if (it) addToCart(it, it.min); }); },
    addP(id) { aib.guard(() => { const it = mkItem("p", id); if (!it) return; if (!it.price) return showItem(it); addToCart(it, it.min); }); },
    q(d) { setQty(curQty + d); }, qset(v) { setQty(parseInt(v, 10) || cur.min); },
    addCur(go) { aib.guard(() => { if (me && cur.owner === me.id) return alert("নিজের পণ্য নিজে কেনা যাবে না"); aib.close("aibItem"); addToCart(cur, curQty, !go); if (go) aib.openCheckout(); }); },
    openCart() { aib.guard(() => { renderCart(); aib.open("aibCart"); }); },
    cq(k, d) { const c = cart.find((x) => x.key === k); if (!c) return; c.qty = Math.max(c.min, c.qty + d); saveCart(); renderCart(); },
    cr(k) { cart = cart.filter((x) => x.key !== k); saveCart(); renderCart(); },
    openCheckout() {
      aib.guard(() => {
        if (!cart.length) return toast("কার্ট খালি");
        $("coSum").innerHTML = cart.map((c) => `<div class="flex justify-between"><span>${esc(c.title)} × ${c.qty}</span><b>৳ ${c.price * c.qty}</b></div>`).join("") + `<div class="flex justify-between text-sm font-black border-t pt-1"><span>সর্বমোট</span><span>৳ ${cartTotal()}</span></div>`;
        $("coName").value ||= me.full_name || ""; $("coPhone").value ||= me.phone || ""; $("coAddr").value ||= [me.address, me.location_text].filter(Boolean).join(", ");
        aib.pmSel(); aib.close("aibCart"); aib.open("aibCheckout");
      });
    },
    pmSel() {
      const k = document.querySelector("input[name=pm]:checked").value, p = PAY[k];
      $("coTrxW").classList.toggle("hidden", k === "cod");
      $("pmInfo").innerHTML = k === "cod" ? "পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।" : `${p.n}: <b>${p.no}</b> এ <b>৳ ${cartTotal()}</b> Send Money / ট্রান্সফার করুন, তারপর নিচে TrxID লিখুন। বিক্রেতা পেমেন্ট যাচাই করে অর্ডার নিশ্চিত করবে।`;
    },
    async place(e) {
      e.preventDefault();
      const pm = document.querySelector("input[name=pm]:checked").value, trx = $("coTrx").value.trim(), phone = $("coPhone").value.trim();
      if (!/^01[3-9]\d{8}$/.test(phone)) return alert("সঠিক মোবাইল নম্বর দিন");
      if (pm !== "cod" && trx.length < 6) return alert("সঠিক TrxID দিন");
      const gid = "O" + Date.now().toString(36).toUpperCase();
      const rows = cart.map((c) => ({ buyer: me.id, buyer_name: $("coName").value, buyer_phone: phone, address: $("coAddr").value, note: $("coNote").value, item_ref: c.key, item_title: c.title,
        seller: c.owner || null, seller_name: c.seller, qty: c.qty, unit_price: c.price, total: c.price * c.qty, payment_method: pm, trx_id: pm === "cod" ? null : trx, group_id: gid }));
      const { error } = await db.from("orders").insert(rows);
      if (error) return alert("অর্ডার হয়নি: " + error.message);
      cart = []; saveCart(); e.target.reset(); aib.close("aibCheckout"); alert(`✅ অর্ডার সফল! অর্ডার নম্বর: ${gid}\nঅর্ডারের অবস্থা "আমার অর্ডার" এ দেখুন।`); aib.openOrders();
    },
    openOrders() { aib.guard(async () => { aib.open("aibOrders"); $("ordBody").innerHTML = "লোড হচ্ছে..."; loadOrders(); }); },
    async setSt(id, s) { const { error } = await db.from("orders").update({ status: s }).eq("id", id); if (error) alert(error.message); loadOrders(); },
    async setPaid(id) { const { error } = await db.from("orders").update({ pay_status: "paid" }).eq("id", id); if (error) alert(error.message); loadOrders(); },
  });
  updateBadge();

  // ================= মোবাইল ভিউ =================
  document.head.insertAdjacentHTML("beforeend", `<style>
   @media (max-width: 768px) {
    body { padding-bottom: 72px; }
    body > div.bg-brandDark.text-xs { flex-direction: column; gap: 4px; text-align: center; padding: 6px 8px; }
    header { position: static !important; }
    header > .max-w-7xl { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
    header > .max-w-7xl > div:nth-child(1) { order: 1; }
    header > .max-w-7xl > div:nth-child(2) { order: 3; flex: 0 0 100%; max-width: 100%; margin: 0; }
    header > .max-w-7xl > div:nth-child(3) { order: 2; margin-left: auto; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    header > .max-w-7xl > div:nth-child(3) > * { margin-left: 0 !important; }
    header h1 { font-size: 1.1rem; }
    header .max-w-7xl p.text-xs { font-size: 10px; }
    header select#searchDistrictSelect { max-width: 105px; padding: 8px 6px; }
    header input#searchInput { min-width: 0; }
    #navUserName { max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
    #userProfileBtn { padding: 8px 10px; }
    header .overflow-x-auto { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    header .overflow-x-auto::-webkit-scrollbar { display: none; }
    section, #aibChatMap { scroll-margin-top: 10px !important; }
    main { padding-left: 12px; padding-right: 12px; }
    main section h2.text-3xl { font-size: 1.5rem; }
    main section .flex.justify-between.items-center { flex-wrap: wrap; gap: 6px; }
    #map { height: 300px !important; }
    #chatBox { height: 260px; }
    #aibToast { bottom: 84px !important; max-width: 90vw; text-align: center; }
    footer .max-w-7xl { padding-left: 16px; padding-right: 16px; }
   }
  </style>`);
  document.body.insertAdjacentHTML("beforeend", `
  <div id="aibBottomNav" class="md:hidden fixed bottom-0 inset-x-0 z-50 bg-brandDark text-white flex justify-around text-[11px] border-t border-gray-700">
   <button onclick="window.scrollTo({top:0,behavior:'smooth'})" class="flex-1 py-2 flex flex-col items-center gap-0.5"><i class="fa-solid fa-house text-base"></i>হোম</button>
   <button onclick="aib.openProd('sell')" class="flex-1 py-2 flex flex-col items-center gap-0.5"><i class="fa-solid fa-circle-plus text-base"></i>পণ্য যোগ</button>
   <button onclick="aib.openCart()" class="flex-1 py-2 flex flex-col items-center gap-0.5 relative"><i class="fa-solid fa-cart-shopping text-base"></i>কার্ট<span id="bnCart" class="absolute top-0.5 right-3 bg-brandRed text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">0</span></button>
   <button onclick="aib.openOrders()" class="flex-1 py-2 flex flex-col items-center gap-0.5"><i class="fa-solid fa-box text-base"></i>অর্ডার</button>
   <button onclick="aib.goChat()" class="flex-1 py-2 flex flex-col items-center gap-0.5"><i class="fa-solid fa-comments text-base"></i>চ্যাট</button>
   <button onclick="openAuthModal()" class="flex-1 py-2 flex flex-col items-center gap-0.5"><i class="fa-solid fa-user text-base"></i>প্রোফাইল</button>
  </div>`);
  updateBadge();

  // ================= শুরু =================
  refresh(); loadStores(); loadProducts(); initChat(); loadMe(); setTimeout(refreshMaps, 1200);
  db.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" && !me) loadMe(); });
})();
