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
  let me = null, P = [], R = [], S = [], U = {}, lastList = null, dm = null, dmCh = null;
  let catFilter = "all", distFilter = "all", searchQ = "", storeF = "", ownerF = "", editId = null;
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
  const nav = [["fa-table-cells-large", "ড্যাশবোর্ড", "aib.dash()"], ["fa-store", "আমার স্টোর", "aib.openStore()"], ["fa-plus", "পণ্য যোগ (বিক্রি)", "aib.openProd('sell')"], ["fa-cart-plus", "কিনতে চাই (ক্রয় রিকোয়েস্ট)", "aib.openProd('buy')"],
    ["fa-box", "আমার অর্ডার", "aib.openOrders()"], ["fa-envelope", "মেসেজ", "aib.openInbox()"], ["fa-clock-rotate-left", "ইতিহাস", "aib.openHistory()"], ["fa-comments", "চ্যাট রুম", "aib.goChat()"], ["fa-map-location-dot", "লোকেশন / ম্যাপ", "aib.goMap()"]];
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
      <button type="button" onclick="aib.getGPS('aGps')" class="text-xs bg-gray-100 border rounded px-3 py-2 w-full">📍 আমার বর্তমান লোকেশন নিন (বাধ্যতামূলক) <span id="aGps"></span></button>
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
    <div><label class="${lbl}">সংক্ষিপ্ত বিবরণ (১-২ লাইন)</label><input id="pDesc" class="${inp}"></div>
    <div><label class="${lbl}">পণ্যের ছবি</label><input id="pImg" type="file" accept="image/*" onchange="aib.prevImg(this)" class="${inp}"><img id="pImgPrev" alt="" class="hidden mt-2 h-32 rounded-lg object-cover"></div>
    <div><label class="${lbl}">বিস্তারিত বিবরণ (পণ্য কী, কোথায় উৎপাদিত, মান, ওজন/মাপ, প্যাকেজিং, ডেলিভারি ইত্যাদি)</label><textarea id="pDetails" rows="4" class="${inp}"></textarea></div>
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
     <h3 class="font-bold"><i class="fa-solid fa-location-crosshairs text-brandRed"></i> লোকেশন খুঁজুন (ক্রেতা / বিক্রেতা / স্টোর / পণ্য)</h3>
     <button onclick="aib.gToggle()" class="text-xs bg-brandDark text-white px-3 py-1.5 rounded">🛰️ স্যাটেলাইট / ম্যাপ</button>
    </div>
    <div class="relative mb-2"><input id="locQ" oninput="aib.locSearch(this.value)" class="${inp}" placeholder="স্টোর, বিক্রেতা, পণ্য বা জেলার নাম লিখুন..." autocomplete="off"><div id="locRes" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto"></div></div>
    <div id="locMap" class="h-64 rounded-xl bg-gray-100"></div>
    <div id="locInfo" class="mt-2 text-sm"></div>
    <div id="locList" class="flex flex-wrap gap-2 text-xs mt-2"></div>
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
    open(id) { $(id).classList.remove("hidden"); }, close(id) { $(id).classList.add("hidden"); if (id === "aibDM" && dmCh) { db.removeChannel(dmCh); dmCh = null; } },
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
      editId = null; $("prodForm").reset(); $("pImgPrev").classList.add("hidden"); $("aibProd").querySelector("h3").innerText = "পণ্য যোগ করুন"; $("pKind").value = kind; if (catFilter !== "all") $("pCat").value = catFilter; aib.open("aibProd"); }); },
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
          }
        if (!gps.aGps) return alert("আপনার বর্তমান লোকেশন (GPS) নিন — লোকেশন ছাড়া অ্যাকাউন্ট খোলা যাবে না");
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
      const btn = e.target.querySelector("button:last-of-type"), f = $("pImg").files[0]; let image_url = null, pos = null;
      const done = () => { btn.disabled = false; btn.innerText = "প্রকাশ করুন"; };
      btn.disabled = true; btn.innerText = "অপেক্ষা করুন...";
      if (!editId) {
        pos = (await getPos()) || (me.lat ? { lat: me.lat, lng: me.lng } : null);
        if (!pos) { done(); return alert("পণ্যের লোকেশন লাগবে: ব্রাউজারে লোকেশনের অনুমতি দিন অথবা প্রোফাইলে \"লোকেশন আপডেট\" করুন"); }
      }
      try { if (f) image_url = await uploadImg(f); } catch (er) { done(); return alert("ছবি আপলোড হয়নি: " + (er.message || er) + "\nSupabase Storage-এ product-images বাকেটটি ঠিক আছে কি না দেখুন।"); }
      const base = { title: $("pTitle").value, category: $("pCat").value, kind, price: $("pPrice").value || null, qty: $("pQty").value, district: $("pDist").value, description: $("pDesc").value, details: $("pDetails").value };
      if (image_url) base.image_url = image_url;
      let error;
      if (editId) { const r = await db.from("products").update(base).eq("id", editId).select(); error = r.error || (!r.data?.length ? { message: "পরিবর্তন করার অনুমতি নেই" } : null); }
      else ({ error } = await db.from("products").insert({ ...base, owner: me.id, owner_name: me.business_name || me.full_name, store_id: $("pStore").value || null, lat: pos.lat, lng: pos.lng }));
      done(); if (error) return alert(error.message);
      editId = null; e.target.reset(); $("pImgPrev").classList.add("hidden"); aib.close("aibProd"); loadProducts();
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
      });

  function renderProfile() {
    if (!me) return;
    $("profBody").innerHTML = `<div class="text-base font-black">${esc(me.full_name)} ${badge(me.verified)}${me.is_admin ? ' <span class="text-xs text-purple-700">🛡️ অ্যাডমিন</span>' : ""}</div>
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
    lastList = list; if (storeF || ownerF) list = []; oldRender(list); enhance(list); renderChip();
    const ups = userList();
    if (ups.length) grid.insertAdjacentHTML("afterbegin", ups.map(card).join(""));
    else if (!list.length) grid.innerHTML = `<p class="text-gray-500 text-sm col-span-full">এই ক্যাটাগরিতে এখনো কোনো পণ্য নেই। উপরের "পণ্য যোগ" বাটনে চাপ দিয়ে প্রথম পণ্যটি আপনিই যোগ করুন!</p>`;
    $("productCountBadge").innerText = `মোট দেখানো হচ্ছে: ${list.length + ups.length} টি`;
  };
  function refresh() { window.renderProductsGrid(lastList || DISTRICTS_DATA); }

  const oldCat = window.filterCategory;
  function applyCat(c, scroll) {
    catFilter = c; distFilter = "all"; storeF = ownerF = ""; oldCat(c);
    document.querySelectorAll("header [onclick^=\"filterCategory\"]").forEach((el) => el.classList.toggle("active-selection", el.getAttribute("onclick") === `filterCategory('${c}')`));
    const t = $("sectionTitle"); if (t) t.innerText = c === "all" ? "সকল জেলার জনপ্রিয় ও খাঁটি পণ্যসমূহ" : `${CATS[c] || c} — পণ্যসমূহ`;
    if (scroll) prodSection.scrollIntoView({ behavior: "smooth" });
  }
  window.filterCategory = (c) => applyCat(c, true);
  const oldDist = window.filterProductsByDistrict;
  window.filterProductsByDistrict = (id) => { distFilter = id; catFilter = "all"; storeF = ownerF = ""; oldDist(id); if (id !== "all") prodSection.scrollIntoView({ behavior: "smooth" }); };
  const oldSearch = window.searchProducts;
  window.searchProducts = (q) => { searchQ = q; storeF = ownerF = ""; oldSearch(q); sug(q); };
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
    return P.filter((p) => (catFilter === "all" || p.category === catFilter) && (mkt() !== "buyer" || (p.kind === "sell" && p.price && !p.hidden)) && (!storeF || String(p.store_id) === storeF) && (!ownerF || p.owner === ownerF) && (!d || String(p.district || "").includes(d.name)) &&
      (!q || [p.title, p.district, p.description, p.details, p.owner_name, (S.find((x) => x.id === p.store_id) || {}).name, CATS[p.category]].join(" ").toLowerCase().includes(q)));
  }
  function card(p) {
    const r = R.filter((x) => x.product_id === p.id), avg = r.length ? (r.reduce((a, b) => a + b.rating, 0) / r.length).toFixed(1) : "—";
    const st = S.find((s) => s.id === p.store_id), ow = U[p.owner] || {};
    return `<div class="bg-white border-2 border-brandRed/30 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition flex flex-col justify-between">
     <div>
      ${p.hidden ? `<div class="bg-gray-800 text-white text-xs font-bold px-3 py-1.5">🙈 লুকানো — পাবলিক দেখতে পাচ্ছে না</div>` : ""}
      <div class="relative h-40 bg-gradient-to-br from-brandDark to-gray-700 flex items-center justify-center text-white text-4xl">
       ${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover">` : `<i class="fa-solid ${p.kind === "buy" ? "fa-hand-holding-dollar" : "fa-basket-shopping"}"></i>`}
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
      ${p.kind === "sell" && !p.hidden ? `<button onclick="aib.viewP(${p.id})" class="w-full py-2.5 bg-brandDark hover:bg-gray-800 text-white text-xs rounded-xl font-bold">🛍️ বিস্তারিত দেখুন ও কিনুন</button><button onclick="aib.addP(${p.id})" class="flex-1 py-2.5 bg-brandRed hover:bg-brandRedDark text-white text-xs rounded-xl font-bold">🛒 কার্টে যোগ</button>` : ""}
      <button onclick="aib.openDM(${p.id})" class="flex-1 py-2.5 ${p.kind === "buy" ? "bg-brandRed text-white" : "bg-blue-600 text-white"} text-xs rounded-xl font-bold">${p.kind === "buy" ? "💬 সাপ্লাই অফার (চ্যাট)" : "💬 সরাসরি চ্যাট"}</button>
      <button onclick="aib.review(${p.id})" class="flex-1 py-2.5 bg-gray-200 text-xs rounded-xl font-bold">রিভিউ</button>
      ${me && (p.owner === me.id || me.is_admin) ? `<button onclick="aib.editProd(${p.id})" class="px-3 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold">✏️ সম্পাদনা</button>` : ""}
      ${me && p.owner === me.id ? `<button onclick="aib.del(${p.id})" class="px-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold">মুছুন</button>` : ""}
      ${me?.is_admin ? `<div class="w-full flex flex-wrap gap-2 pt-2 mt-1 border-t text-[11px] font-bold"><span class="text-purple-700">🛡️ অ্যাডমিন:</span><button onclick="aib.adminHide(${p.id},${!p.hidden})" class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">${p.hidden ? "👁️ প্রকাশ করুন" : "🙈 লুকান"}</button><button onclick="aib.adminDel(${p.id})" class="px-2 py-1 bg-red-100 text-red-700 rounded">🗑️ মুছুন</button><button onclick="aib.adminVerify('${p.owner}',${!ow.verified})" class="px-2 py-1 bg-green-100 text-green-700 rounded">${ow.verified ? "আনভেরিফাই" : "✅ ভেরিফাই"}</button></div>` : ""}
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
    P = a.data || []; R = b.data || []; U = {}; (c.data || []).forEach((u) => (U[u.id] = u)); refresh(); refreshMaps();
  }

  // ================= লোকেশন / ম্যাপ =================
  let locMap = null, locLayer = null, locBase = null, locSat = null, locPts = [], locSel = null;
  const dist = (a, b) => { const rad = (x) => (x * Math.PI) / 180, h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  function allPts() {
    const out = [];
    Object.values(U).forEach((u) => u.lat != null && u.lng != null && out.push({ key: "u:" + u.id, k: "u", ico: "👤", t: u.business_name || u.full_name || "ইউজার", sub: `${ROLES[u.role] || u.role || ""} · ${u.location_text || ""}`, lat: +u.lat, lng: +u.lng, c: ROLE_COLOR[u.role] || "#1d4ed8" }));
    S.forEach((x) => x.lat != null && x.lng != null && out.push({ key: "s:" + x.id, k: "s", ico: "🏪", t: x.name, sub: `স্টোর · ${x.district || ""} · ${x.owner_name || ""}`, lat: +x.lat, lng: +x.lng, c: "#e53935" }));
    P.forEach((x) => {
      const la = x.lat ?? U[x.owner]?.lat, ln = x.lng ?? U[x.owner]?.lng;
      if (la == null || ln == null || x.hidden) return;
      out.push({ key: "p:" + x.id, k: "p", ico: x.kind === "buy" ? "🛒" : "📦", t: x.title, sub: `${x.kind === "buy" ? "ক্রয় রিকোয়েস্ট" : "পণ্য"} · ${x.owner_name || ""} · ${x.district || ""}`, lat: +la, lng: +ln, c: "#0d9488" });
    });
    return out;
  }
  function initLocMap() {
    if (locMap || !window.L || !$("locMap")) return;
    locMap = L.map("locMap").setView([23.8, 90.4], 7);
    locBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" });
    locSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles &copy; Esri" });
    locSat.addTo(locMap); locLayer = L.layerGroup().addTo(locMap);
  }
  function renderLoc() {
    initLocMap(); if (!locMap) return; locLayer.clearLayers();
    if (!locSel) {
      locPts.filter((x) => x.k !== "d").slice(0, 15).forEach((x) => L.circleMarker([x.lat, x.lng], { radius: 6, color: x.c, fillOpacity: 0.8 }).bindPopup(`${x.ico} ${esc(x.t)}<br>${esc(x.sub)}`).addTo(locLayer));
      $("locInfo").innerHTML = `<span class="text-gray-500 text-xs">উপরের বক্সে নাম লিখে খুঁজুন। এখানে শুধু কয়েকটি লোকেশন দেখানো হচ্ছে; খুঁজলে সেই লোকেশন লাল রঙে ও আশেপাশের স্টোর/পণ্য কমলা রঙে দেখাবে।</span>`; $("locList").innerHTML = ""; return;
    }
    const near = locPts.filter((x) => x.k !== "d" && x.key !== locSel.key && dist(locSel, x) <= 25).sort((x, y) => dist(locSel, x) - dist(locSel, y));
    near.forEach((x) => L.circleMarker([x.lat, x.lng], { radius: 8, color: "#d97706", fillColor: "#fbbf24", fillOpacity: 0.9 }).bindPopup(`${x.ico} ${esc(x.t)}<br>${esc(x.sub)}<br><b>${dist(locSel, x).toFixed(1)} কিমি দূরে</b>`).addTo(locLayer));
    L.circleMarker([locSel.lat, locSel.lng], { radius: 13, color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 1, weight: 4 }).bindPopup(`${locSel.ico} <b>${esc(locSel.t)}</b><br>${esc(locSel.sub)}`).addTo(locLayer).openPopup();
    locMap.setView([locSel.lat, locSel.lng], 12); setTimeout(() => locMap.invalidateSize(), 200);
    $("locInfo").innerHTML = `<div class="font-bold text-red-600">📍 ${esc(locSel.ico + " " + locSel.t)}</div><div class="text-xs text-gray-500">${esc(locSel.sub)}</div>
      <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${locSel.lat},${locSel.lng}&t=k" class="inline-block mt-1 text-xs bg-brandDark text-white px-3 py-1.5 rounded">Google Maps এ খুলুন ↗</a> <button onclick="aib.locClear()" class="text-xs bg-gray-200 px-3 py-1.5 rounded">✖ সরান</button>`;
    $("locList").innerHTML = near.length ? `<div class="w-full text-xs font-bold">🟠 আশেপাশে (২৫ কিমির মধ্যে):</div>` + near.slice(0, 12).map((x) => `<button onclick="aib.locKey('${x.key}')" class="px-3 py-1.5 rounded-lg border bg-amber-50 text-xs">${x.ico} ${esc(x.t)} · ${dist(locSel, x).toFixed(1)} কিমি</button>`).join("") : `<span class="text-xs text-gray-500">আশেপাশে আর কোনো স্টোর/পণ্য নেই</span>`;
  }
  function refreshMaps() {
    locPts = [...allPts(), ...DISTRICTS_DATA.map((d) => ({ key: "d:" + d.id, k: "d", ico: "📍", t: d.name + " জেলা", sub: d.division + " বিভাগ", lat: d.lat, lng: d.lng, c: "#6b7280" }))];
    if (typeof map !== "undefined" && map && map.addLayer) {
      if (usersLayer) usersLayer.clearLayers(); else usersLayer = L.layerGroup().addTo(map);
      locPts.filter((x) => x.k !== "d").slice(0, 60).forEach((x) => L.circleMarker([x.lat, x.lng], { radius: 8, color: x.c, fillOpacity: 0.85 }).bindPopup(`${x.ico} ${esc(x.t)}`).addTo(usersLayer));
    }
    renderLoc();
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
  const DIST_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
  const CAT_TXT = {
    Agri: "এই অঞ্চলের কৃষিপণ্য ও ফলমূল স্থানীয় কৃষক ও বাগান থেকে সংগ্রহ করা হয়। মৌসুম ও মজুদ অনুযায়ী তাজা সরবরাহ পাওয়া যায়।",
    Food: "ঐতিহ্যবাহী রেসিপিতে স্থানীয় কারিগরদের তৈরি খাবার ও মিষ্টি। অর্ডারের আগে তাজা থাকার সময় ও সংরক্ষণের নিয়ম জেনে নিন।",
    Handicraft: "স্থানীয় তাঁতি ও কারিগরদের হাতে তৈরি ঐতিহ্যবাহী হস্তশিল্প ও বস্ত্র। রং, নকশা ও আকার অনুযায়ী দাম ভিন্ন হতে পারে।",
    Ayurvedic: "প্রাকৃতিক ভেষজ ও আয়ুর্বেদিক উপাদানভিত্তিক পণ্য। ব্যবহারের আগে উপাদান ও ব্যবহারবিধি দেখে নিন; স্বাস্থ্যগত সমস্যা থাকলে চিকিৎসকের পরামর্শ নিন।",
  };
  function descFor(d) {
    return `📍 উৎপত্তিস্থল: ${d.name}, ${d.division} বিভাগ\n🛒 প্রধান পণ্যসমূহ: ${d.famous}\n\n${CAT_TXT[d.category] || ""}${d.gi ? "\n\n🏅 এই জেলার পণ্য জিআই (GI) স্বীকৃত হিসেবে চিহ্নিত।" : ""}\n\n📦 সর্বনিম্ন অর্ডার ১ ইউনিট; বড় পরিমাণে (বাল্ক) অর্ডারে দাম আলোচনা সাপেক্ষে।\n🤝 সরাসরি উৎস এলাকা থেকে সরবরাহ।`;
  }
  function mkItem(src, id) {
    if (src === "d") {
      const d = DISTRICTS_DATA.find((x) => x.id === id); if (!d) return null;
      const b2b = typeof currentMarketMode !== "undefined" && currentMarketMode === "b2b";
      return { key: "d:" + id, src, id, title: d.famous, sub: `${d.name}, ${d.division}`, price: 250, min: 1, unit: "ইউনিট", seller: `${d.name} সাপ্লাই পয়েন্ট`, owner: null, gi: d.gi,
        desc: `${d.name} জেলার আসল ও খাঁটি স্থানীয় পণ্য, সরাসরি উৎস থেকে সরবরাহ।`, stock: b2b ? "বাল্ক: ১০০ কেজি / ২০ পিস" : "", img: DIST_IMG, details: descFor(d) };
    }
    const p = P.find((x) => x.id === +id); if (!p) return null;
    const ow = U[p.owner] || {};
    return { key: "p:" + p.id, src, id: p.id, title: p.title, sub: `${p.district || ""} · ${CATS[p.category] || ""}`, price: p.price ? +p.price : null, min: 1, unit: "ইউনিট",
      seller: p.owner_name, owner: p.owner, verified: ow.verified, desc: p.description, stock: p.qty, img: p.image_url, details: p.details };
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
     ${it.img ? `<img src="${esc(it.img)}" alt="" class="w-full h-56 object-cover rounded-xl">` : `<div class="h-28 rounded-xl bg-gradient-to-br from-brandDark to-gray-700 flex items-center justify-center text-white text-5xl"><i class="fa-solid fa-basket-shopping"></i></div>`}
     <h4 class="text-lg font-black">${esc(it.title)} ${it.gi ? `<span class="text-[10px] bg-brandGold text-gray-900 px-2 py-0.5 rounded font-black">GI স্বীকৃত</span>` : ""}</h4>
     <div class="text-xs text-gray-500">📍 ${esc(it.sub)}</div>
     <p class="text-gray-700">${esc(it.desc || "")}</p>
     ${it.details ? `<div class="text-gray-700 whitespace-pre-line bg-white border rounded-xl p-3">${esc(it.details)}</div>` : ""}
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
     ${it.src === "p" ? `<div class="flex gap-2 text-xs font-bold"><button onclick="aib.openDM(${it.id})" class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg">💬 বিক্রেতার সাথে সরাসরি চ্যাট</button><button onclick="aib.review(${it.id})" class="flex-1 py-2 bg-gray-100 rounded-lg">⭐ রিভিউ দিন</button></div>` : ""}
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
    const mine = grp(data.filter((o) => o.buyer === me.id)), inc = grp(data.filter((o) => o.seller === me.id)), rest = me.is_admin ? grp(data.filter((o) => o.buyer !== me.id && o.seller !== me.id)) : [];
    const steps = ["pending", "confirmed", "shipped", "delivered"];
    const track = (s) => {
      if (s === "cancelled") return `<div class="text-sm font-bold text-red-600">❌ অর্ডার বাতিল</div>`;
      const T = { pending: "অপেক্ষমাণ", confirmed: "নিশ্চিত", shipped: "পাঠানো হয়েছে", delivered: "ডেলিভারি সম্পন্ন" }, cu = steps.indexOf(s);
      const chips = steps.map((x, i) => i < cu
        ? (x === "pending" ? `<span class="px-2 py-1 rounded-full bg-red-50 text-red-500 line-through">❌ ${T[x]}</span>` : `<span class="px-2 py-1 rounded-full bg-green-50 text-green-600">✔ ${T[x]}</span>`)
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
         ${sel || me.is_admin ? `<div class="flex flex-wrap gap-2 pt-1 font-bold text-xs">${["confirmed", "shipped", "delivered", "cancelled"].map((s) => `<button onclick="aib.setSt(${o.id},'${s}')" class="px-3 py-1.5 bg-gray-200 rounded-lg">${STATUS[s]}</button>`).join("")}<button onclick="aib.setPaid(${o.id})" class="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">💰 পেমেন্ট পেয়েছি</button></div>` : ""}</div>`).join("")}
       <div class="text-sm space-y-0.5"><div>👤 ${sel ? "ক্রেতা" : "প্রাপক"}: <b>${esc(f.buyer_name)}</b> · 📞 ${esc(f.buyer_phone)}</div><div>📍 ঠিকানা: ${esc(f.address)}</div>${f.note ? `<div>📝 নির্দেশনা: ${esc(f.note)}</div>` : ""}</div></div>`;
    };
    $("ordBody").innerHTML = `<div class="font-black text-base">🛍️ আমার কেনা অর্ডার (${mine.length})</div>${mine.map((g) => box(g, false)).join("") || `<p class="text-sm text-gray-500">এখনো কিছু কেনেননি</p>`}
      <div class="font-black text-base pt-4">📥 আমার কাছে আসা অর্ডার (${inc.length})</div>${inc.map((g) => box(g, true)).join("") || `<p class="text-sm text-gray-500">কোনো অর্ডার আসেনি</p>`}${me.is_admin ? `<div class="font-black text-base pt-4">🛡️ অন্যান্য সব অর্ডার — অ্যাডমিন (${rest.length})</div>${rest.map((g) => box(g, true)).join("") || `<p class="text-sm text-gray-500">অন্য কোনো অর্ডার নেই</p>`}` : ""}`;
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

  // ================= অ্যাডমিন / ছবি আপলোড / সরাসরি চ্যাট / ড্যাশবোর্ড / মোবাইল প্রিভিউ =================
  function resizeImg(file, max = 1000) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? res(b) : rej(new Error("ছবি প্রসেস হয়নি"))), "image/jpeg", 0.82);
      };
      img.onerror = () => rej(new Error("ছবি পড়া যায়নি")); img.src = url;
    });
  }
  async function uploadImg(file) {
    const blob = await resizeImg(file), path = `${me.id}/${Date.now()}.jpg`;
    const { error } = await db.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  const dmSeen = new Set(), dmThreads = {};
  function dmMsg(m) {
    if (!m || dmSeen.has(m.id)) return; dmSeen.add(m.id);
    const own = m.sender === me.id, t = new Date(m.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
    $("dmBox").insertAdjacentHTML("beforeend", `<div class="${own ? "text-right" : ""}"><span class="inline-block max-w-[85%] rounded-xl px-3 py-1.5 text-left ${own ? "bg-brandRed text-white" : "bg-white border"}">${own ? "" : `<b class="text-brandRed">${esc(m.sender_name)}:</b> `}${esc(m.body)}</span><div class="text-[10px] text-gray-400">${esc(t)}</div></div>`);
    $("dmBox").scrollTop = $("dmBox").scrollHeight;
  }
  async function startDM(ctx) {
    dm = ctx; dmSeen.clear(); $("dmBox").innerHTML = "";
    $("dmHead").innerHTML = `📦 ${esc(ctx.title)}<div class="text-xs font-normal text-gray-500">কথোপকথন: ${esc(ctx.other)}</div>`;
    aib.open("aibDM");
    const { data } = await db.from("dm").select("*").eq("thread", ctx.thread).order("created_at"); (data || []).forEach(dmMsg);
    if (dmCh) db.removeChannel(dmCh);
    dmCh = db.channel("dm-" + ctx.thread).on("postgres_changes", { event: "INSERT", schema: "public", table: "dm", filter: `thread=eq.${ctx.thread}` }, (x) => dmMsg(x.new)).subscribe();
  }
  const DASH = () => [
    { g: "🛍️ পণ্য ও ক্যাটাগরি", items: [["fa-border-all", "সব পণ্য", () => filterCategory("all")], ["fa-wheat-awn", "কৃষি ও ফলমূল", () => filterCategory("Agri")], ["fa-bowl-food", "খাবার ও মিষ্টি", () => filterCategory("Food")],
      ["fa-shirt", "হস্তশিল্প", () => filterCategory("Handicraft")], ["fa-leaf", "আয়ুর্বেদিক", () => filterCategory("Ayurvedic")], ["fa-award", "জিআই পণ্য", () => filterCategory("GI")]] },
    { g: "🏪 কেনা ও বেচা", items: [["fa-store", "আমার স্টোর", () => aib.openStore()], ["fa-plus", "পণ্য বিক্রি", () => aib.openProd("sell")], ["fa-cart-plus", "কিনতে চাই", () => aib.openProd("buy")],
      ["fa-cart-shopping", `কার্ট (${cart.length})`, () => aib.openCart()], ["fa-box", "আমার অর্ডার", () => aib.openOrders()], ["fa-clock-rotate-left", "ইতিহাস", () => aib.openHistory()]] },
    { g: "💬 যোগাযোগ ও ম্যাপ", items: [["fa-envelope", "আমার মেসেজ", () => aib.openInbox()], ["fa-comments", "কমন চ্যাট রুম", () => aib.goChat()], ["fa-map-location-dot", "লোকেশন / ম্যাপ", () => aib.goMap()],
      ["fa-city", "জেলা নির্বাচন", () => $("districtButtonsGrid").closest("section").scrollIntoView({ behavior: "smooth" })]] },
    { g: "👤 অ্যাকাউন্ট ও তথ্য", items: [["fa-user", me ? "আমার প্রোফাইল" : "লগইন / সাইন-আপ", () => openAuthModal()],
      ...(me?.is_admin ? [["fa-shield-halved", "অ্যাডমিন: সব অর্ডার", () => aib.openOrders()]] : []),
      ["fa-handshake", "স্পনসর TRUSTINUNIVERS", () => window.open(SPONSOR, "_blank")], ["fa-id-card", "ডেভেলপার বায়ো", () => window.open(BIO, "_blank")]] },
  ];

  document.body.insertAdjacentHTML("beforeend",
    modal("aibDM", "💬 সরাসরি চ্যাট", `<div id="dmHead" class="font-bold text-sm mb-2"></div><div id="dmBox" class="h-72 overflow-y-auto bg-gray-50 border rounded-xl p-3 space-y-2 text-sm"></div>
      <form onsubmit="aib.dmSend(event)" class="flex gap-2 mt-2"><input id="dmIn" class="${inp}" placeholder="মেসেজ লিখুন..." autocomplete="off"><button class="bg-brandRed text-white px-4 rounded-lg">পাঠান</button></form>`) +
    modal("aibInbox", "💬 আমার মেসেজ", `<div id="inboxBody" class="space-y-2"></div>`, true) +
    `<div id="aibDash" class="fixed inset-0 z-[65] bg-gray-100 hidden overflow-y-auto"><div class="bg-brandDark text-white p-4 flex justify-between items-center sticky top-0 z-10"><div><b class="text-lg">📊 ড্যাশবোর্ড</b><div class="text-xs text-gray-300">সব সেকশন এক জায়গায় — ক্লিক করলেই সেখানে যাবে</div></div><button onclick="aib.close('aibDash')" class="text-3xl leading-none">×</button></div><div id="dashBody" class="p-4 space-y-5 max-w-3xl mx-auto pb-24"></div></div>`);

  if (window.self === window.top) {
    document.body.insertAdjacentHTML("beforeend", `
    <button onclick="aib.mobilePreview()" class="hidden md:flex fixed bottom-4 left-4 z-50 items-center gap-2 bg-brandDark text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg"><i class="fa-solid fa-mobile-screen"></i> মোবাইল প্রিভিউ</button>
    <div id="aibPrev" class="fixed inset-0 z-[70] bg-black/80 hidden items-center justify-center p-4"><div class="relative"><button onclick="aib.closePrev()" class="absolute -top-3 -right-3 bg-white text-black w-9 h-9 rounded-full text-xl font-bold z-10">×</button><div class="bg-black rounded-[38px] p-3 shadow-2xl"><iframe id="prevFrame" style="width:390px;height:min(780px,82vh);border:0;border-radius:28px;background:#fff"></iframe></div></div></div>`);
  }

  Object.assign(aib, {
    prevImg(i) { const f = i.files[0], im = $("pImgPrev"); if (!f) return im.classList.add("hidden"); im.src = URL.createObjectURL(f); im.classList.remove("hidden"); },
    mobilePreview() { $("prevFrame").src = location.href.split("#")[0]; $("aibPrev").classList.remove("hidden"); $("aibPrev").classList.add("flex"); },
    closePrev() { $("prevFrame").src = "about:blank"; $("aibPrev").classList.add("hidden"); $("aibPrev").classList.remove("flex"); },
    dash() {
      $("dashBody").innerHTML = `<div class="bg-white rounded-2xl p-3 text-sm shadow">${me ? `👤 <b>${esc(me.full_name)}</b> · ${esc(ROLES[me.role] || me.role)} ${badge(me.verified)}${me.is_admin ? " 🛡️ অ্যাডমিন" : ""}` : "আপনি লগইন করেননি। লগইন করলে কেনাকাটা ও স্টোরের সব সুবিধা পাবেন।"}</div>`
        + DASH().map((sec, gi) => `<div><div class="font-black mb-2">${sec.g}</div><div class="grid grid-cols-3 gap-3">${sec.items.map((it, ii) => `<button onclick="aib.dashGo(${gi},${ii})" class="bg-white rounded-2xl shadow p-3 flex flex-col items-center gap-2 text-center text-xs font-bold active:scale-95"><i class="fa-solid ${it[0]} text-2xl text-brandRed"></i>${it[1]}</button>`).join("")}</div></div>`).join("");
      aib.open("aibDash");
    },
    dashGo(gi, ii) { const fn = DASH()[gi].items[ii][2]; aib.close("aibDash"); setTimeout(fn, 150); },
    openDM(pid) {
      aib.guard(() => {
        const p = P.find((x) => x.id === +pid); if (!p) return;
        if (p.owner === me.id) { aib.close("aibItem"); alert("এটি আপনার নিজের পণ্য। ক্রেতাদের মেসেজ \"মেসেজ\" বাটনে দেখুন।"); return aib.openInbox(); }
        aib.close("aibItem");
        startDM({ thread: `${p.id}:${me.id}`, pid: p.id, title: p.title, other: p.owner_name, buyer: me.id, buyerName: me.full_name, seller: p.owner, sellerName: p.owner_name });
      });
    },
    async dmSend(e) {
      e.preventDefault(); const b = $("dmIn").value.trim(); if (!b || !dm) return;
      const { data, error } = await db.from("dm").insert({ thread: dm.thread, product_id: dm.pid, product_title: dm.title, buyer: dm.buyer, buyer_name: dm.buyerName, seller: dm.seller, seller_name: dm.sellerName, sender: me.id, sender_name: me.full_name, body: b }).select().single();
      if (error) return alert(error.message); $("dmIn").value = ""; dmMsg(data);
    },
    openInbox() {
      aib.guard(async () => {
        aib.open("aibInbox"); $("inboxBody").innerHTML = "লোড হচ্ছে...";
        const { data, error } = await db.from("dm").select("*").order("created_at", { ascending: false }).limit(500);
        if (error) { $("inboxBody").innerHTML = `<p class="text-red-600 text-sm">${esc(error.message)}</p>`; return; }
        Object.keys(dmThreads).forEach((k) => delete dmThreads[k]); (data || []).forEach((x) => { if (!dmThreads[x.thread]) dmThreads[x.thread] = x; });
        const list = Object.values(dmThreads);
        $("inboxBody").innerHTML = list.map((x) => `<button onclick="aib.openThread('${x.thread}')" class="w-full text-left border-2 rounded-2xl p-3 hover:bg-gray-50"><div class="flex justify-between gap-2"><b>📦 ${esc(x.product_title)}</b><span class="text-[11px] text-gray-400">${esc(new Date(x.created_at).toLocaleString("bn-BD"))}</span></div><div class="text-xs text-gray-500">কথোপকথন: ${esc(x.buyer === me.id ? x.seller_name : x.buyer_name)}</div><div class="text-sm text-gray-700 truncate">${esc(x.sender_name)}: ${esc(x.body)}</div></button>`).join("")
          || `<p class="text-sm text-gray-500">এখনো কোনো মেসেজ নেই। পণ্যের কার্ডে "💬 সরাসরি চ্যাট" চেপে বিক্রেতার সাথে কথা শুরু করুন।</p>`;
      });
    },
    openThread(t) {
      const x = dmThreads[t]; if (!x) return; aib.close("aibInbox");
      startDM({ thread: t, pid: x.product_id, title: x.product_title, other: x.buyer === me.id ? x.seller_name : x.buyer_name, buyer: x.buyer, buyerName: x.buyer_name, seller: x.seller, sellerName: x.seller_name });
    },
    async adminHide(id, hide) {
      const { data, error } = await db.from("products").update({ hidden: hide }).eq("id", id).select();
      if (error || !data?.length) return alert(error?.message || "অনুমতি নেই — আপনার অ্যাকাউন্ট অ্যাডমিন হিসেবে সেট করা আছে কি না দেখুন");
      toast(hide ? "🙈 পণ্যটি পাবলিক থেকে লুকানো হয়েছে" : "👁️ পণ্যটি আবার প্রকাশ হয়েছে"); loadProducts();
    },
    async adminDel(id) {
      if (!confirm("অ্যাডমিন হিসেবে এই পণ্যটি স্থায়ীভাবে মুছবেন?\n(শুধু লুকাতে চাইলে \"লুকান\" বাটন ব্যবহার করুন)")) return;
      const { data, error } = await db.from("products").delete().eq("id", id).select();
      if (error || !data?.length) return alert(error?.message || "অনুমতি নেই — আপনার অ্যাকাউন্ট অ্যাডমিন হিসেবে সেট করা আছে কি না দেখুন"); loadProducts();
    },
    async adminVerify(uid, v) {
      const { data, error } = await db.from("profiles").update({ verified: v }).eq("id", uid).select();
      if (error || !data?.length) return alert(error?.message || "অনুমতি নেই"); toast(v ? "✅ বিক্রেতা ভেরিফাইড হয়েছে" : "ভেরিফিকেশন তুলে নেওয়া হয়েছে"); loadProducts();
    },
  });

  // ================= সম্পাদনা / সার্চ / ইতিহাস / লোকেশন সার্চ =================
  const getPos = () => new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null), { timeout: 8000, enableHighAccuracy: true });
  });

  grid.insertAdjacentHTML("beforebegin", `<div id="aibChip" class="hidden mb-3"></div>`);
  function renderChip() {
    const el = $("aibChip"); if (!el) return;
    const st = storeF && S.find((x) => String(x.id) === storeF), ow = ownerF && U[ownerF];
    const txt = st ? `🏪 স্টোর: ${st.name}` : ow ? `👤 বিক্রেতা: ${ow.business_name || ow.full_name}` : "";
    el.classList.toggle("hidden", !txt);
    el.innerHTML = txt ? `<span class="inline-flex items-center gap-2 bg-brandRed/10 text-brandRed font-bold text-sm px-3 py-1.5 rounded-full">${esc(txt)} <button onclick="aib.clearFilter()" class="text-lg leading-none">✖</button></span>` : "";
  }

  // সার্চ সাজেশন (জেলা / স্টোর / বিক্রেতা / পণ্য)
  $("searchInput").closest(".relative").insertAdjacentHTML("beforeend", `<div id="aibSug" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-[55] max-h-80 overflow-y-auto text-sm text-gray-800"></div>`);
  document.addEventListener("click", (ev) => { if (!ev.target.closest("#aibSug") && ev.target.id !== "searchInput") $("aibSug").classList.add("hidden"); });
  function sug(q) {
    const t = (q || "").trim().toLowerCase(), box = $("aibSug"); if (!t) return box.classList.add("hidden");
    const has = (...a) => a.join(" ").toLowerCase().includes(t), rows = [];
    DISTRICTS_DATA.filter((d) => has(d.name, d.division, d.famous)).slice(0, 4).forEach((d) => rows.push(["📍", d.name + " জেলা", d.famous.split(",")[0], "d", d.id]));
    S.filter((x) => has(x.name, x.owner_name, x.district, x.description)).slice(0, 4).forEach((x) => rows.push(["🏪", x.name, `স্টোর · ${x.district || ""}`, "s", x.id]));
    Object.values(U).filter((u) => u.role !== "Buyer" && has(u.business_name, u.full_name)).slice(0, 3).forEach((u) => rows.push(["👤", u.business_name || u.full_name, ROLES[u.role] || "", "u", u.id]));
    P.filter((x) => !x.hidden && has(x.title, x.owner_name, x.district)).slice(0, 4).forEach((x) => rows.push(["📦", x.title, `${x.owner_name || ""} · ${x.district || ""}`, "p", x.id]));
    box.innerHTML = rows.map(([ic, a, b, ty, id]) => `<button onclick="aib.sugGo('${ty}','${id}')" class="w-full text-left px-3 py-2 hover:bg-gray-50 border-b flex gap-2 items-center"><span>${ic}</span><span><b>${esc(a)}</b><span class="block text-xs text-gray-500">${esc(b)}</span></span></button>`).join("")
      || `<div class="px-3 py-3 text-gray-500 text-xs">কিছু পাওয়া যায়নি</div>`;
    box.classList.remove("hidden");
  }

  // আমার ইতিহাস
  document.body.insertAdjacentHTML("beforeend", modal("aibHist", "📜 আমার ইতিহাস", `<div id="histBody" class="space-y-4"></div>`, true));
  async function loadHistory() {
    const { data } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    const o = data || [], bought = o.filter((x) => x.buyer === me.id), sold = o.filter((x) => x.seller === me.id);
    const myP = P.filter((x) => x.owner === me.id), myS = S.filter((x) => x.owner === me.id);
    const sum = (a) => a.reduce((t, x) => t + +x.total, 0), cp = {};
    bought.forEach((x) => { const c = (cp["🏪 " + x.seller_name] ||= { n: 0, t: 0, ty: "থেকে কিনেছেন" }); c.n++; c.t += +x.total; });
    sold.forEach((x) => { const c = (cp["👤 " + x.buyer_name] ||= { n: 0, t: 0, ty: "কে বিক্রি করেছেন" }); c.n++; c.t += +x.total; });
    const ev = [
      ...bought.map((x) => ({ d: x.created_at, h: `🛍️ কিনেছেন: <b>${esc(x.item_title)}</b> (${x.qty} ইউনিট, ৳${x.total}) — বিক্রেতা: <b>${esc(x.seller_name)}</b> · ${STATUS[x.status] || x.status}` })),
      ...sold.map((x) => ({ d: x.created_at, h: `💰 বিক্রি করেছেন: <b>${esc(x.item_title)}</b> (${x.qty} ইউনিট, ৳${x.total}) — ক্রেতা: <b>${esc(x.buyer_name)}</b> · ${STATUS[x.status] || x.status}` })),
      ...myP.map((x) => ({ d: x.created_at, h: `➕ ${x.kind === "buy" ? "ক্রয় রিকোয়েস্ট" : "পণ্য"} যোগ করেছেন: <b>${esc(x.title)}</b>${x.hidden ? " (🙈 অ্যাডমিন লুকিয়েছে)" : ""}` })),
      ...myS.map((x) => ({ d: x.created_at, h: `🏪 স্টোর খুলেছেন: <b>${esc(x.name)}</b>` })),
    ].sort((a, b) => new Date(b.d) - new Date(a.d));
    $("histBody").innerHTML = `<div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
       <div class="bg-blue-50 rounded-xl p-3">🛍️ মোট কেনা<div class="text-lg font-black text-blue-700">৳ ${sum(bought)}</div><div class="font-normal">${bought.length} টি অর্ডার</div></div>
       <div class="bg-green-50 rounded-xl p-3">💰 মোট বিক্রি<div class="text-lg font-black text-green-700">৳ ${sum(sold)}</div><div class="font-normal">${sold.length} টি অর্ডার</div></div>
       <div class="bg-amber-50 rounded-xl p-3">🤝 লেনদেনকারী<div class="text-lg font-black text-amber-700">${Object.keys(cp).length} জন</div><div class="font-normal">${myP.length} পণ্য · ${myS.length} স্টোর</div></div></div>
      <div><div class="font-black mb-2">🤝 কার সাথে লেনদেন</div>${Object.entries(cp).map(([k, c]) => `<div class="border rounded-xl p-2 text-sm flex justify-between gap-2 mb-1"><span>${esc(k)} <span class="text-gray-500 text-xs">${c.ty}</span></span><b>${c.n} বার · ৳${c.t}</b></div>`).join("") || `<p class="text-sm text-gray-500">এখনো কোনো লেনদেন নেই</p>`}</div>
      <div><div class="font-black mb-2">🕒 কার্যকলাপের তালিকা</div>${ev.map((x) => `<div class="border-l-4 border-brandRed bg-gray-50 rounded-r-xl p-2 mb-2 text-sm">${x.h}<div class="text-[11px] text-gray-400">${esc(new Date(x.d).toLocaleString("bn-BD"))}</div></div>`).join("") || `<p class="text-sm text-gray-500">এখনো কোনো কার্যকলাপ নেই</p>`}</div>`;
  }

  Object.assign(aib, {
    editProd(id) {
      aib.guard(() => {
        const x = P.find((q) => q.id === +id); if (!x) return;
        if (x.owner !== me.id && !me.is_admin) return alert("শুধু নিজের পণ্য সম্পাদনা করা যায়");
        editId = x.id; $("prodForm").reset();
        $("pKind").value = x.kind || "sell"; $("pTitle").value = x.title || ""; $("pCat").value = x.category || "Other"; $("pPrice").value = x.price ?? ""; $("pQty").value = x.qty ?? "";
        $("pDist").value = x.district || ""; $("pDesc").value = x.description || ""; $("pDetails").value = x.details || "";
        const im = $("pImgPrev"); if (x.image_url) { im.src = x.image_url; im.classList.remove("hidden"); } else im.classList.add("hidden");
        $("aibProd").querySelector("h3").innerText = "পণ্য সম্পাদনা (নতুন ছবি না দিলে আগের ছবি থাকবে)"; aib.open("aibProd");
      });
    },
    openHistory() { aib.guard(async () => { aib.open("aibHist"); $("histBody").innerHTML = "লোড হচ্ছে..."; await loadHistory(); }); },
    sugGo(ty, id) {
      $("aibSug").classList.add("hidden");
      if (ty === "d") return filterProductsByDistrict(id);
      if (ty === "p") return aib.viewP(id);
      if (ty === "s") return aib.pickStore(id);
      if (ty === "u") return aib.pickOwner(id);
    },
    pickStore(id) {
      storeF = String(id); ownerF = ""; refresh(); prodSection.scrollIntoView({ behavior: "smooth" });
      const x = S.find((q) => q.id === +id); if (x && x.lat != null) { if (typeof map !== "undefined" && map && map.flyTo) map.flyTo([x.lat, x.lng], 11); aib.locKey("s:" + id); }
    },
    pickOwner(id) {
      ownerF = id; storeF = ""; refresh(); prodSection.scrollIntoView({ behavior: "smooth" });
      const u = U[id]; if (u && u.lat != null) { if (typeof map !== "undefined" && map && map.flyTo) map.flyTo([u.lat, u.lng], 11); aib.locKey("u:" + id); }
    },
    clearFilter() { storeF = ownerF = ""; refresh(); },
    gToggle() {
      initLocMap(); if (!locMap) return;
      if (gType === "k") { locMap.removeLayer(locSat); locBase.addTo(locMap); gType = "m"; } else { locMap.removeLayer(locBase); locSat.addTo(locMap); gType = "k"; }
    },
    locSearch(q) {
      const t = q.trim().toLowerCase(), box = $("locRes"); if (!t) return box.classList.add("hidden");
      const r = locPts.filter((x) => (x.t + " " + x.sub).toLowerCase().includes(t)).slice(0, 10);
      box.innerHTML = r.map((x) => `<button onclick="aib.locKey('${x.key}')" class="w-full text-left px-3 py-2 hover:bg-gray-50 border-b text-xs">${x.ico} <b>${esc(x.t)}</b><div class="text-gray-500">${esc(x.sub)}</div></button>`).join("") || `<div class="px-3 py-2 text-xs text-gray-500">কিছু পাওয়া যায়নি</div>`;
      box.classList.remove("hidden");
    },
    locKey(key) { const x = locPts.find((q) => q.key === key); if (!x) return; locSel = x; $("locRes").classList.add("hidden"); renderLoc(); },
    locClear() { locSel = null; $("locQ").value = ""; renderLoc(); if (locMap) locMap.setView([23.8, 90.4], 7); },
  });

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
   <button onclick="aib.dash()" class="flex-1 py-2 flex flex-col items-center gap-0.5"><i class="fa-solid fa-table-cells-large text-base"></i>ড্যাশবোর্ড</button>
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
