/* =========================================================
   APP — language, filters, reveal, and the booking engine.
   Static preview behavior; no database writes or real booking submissions.
   ========================================================= */
(function () {
  "use strict";

  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA_NUMBER = "201038331309";
  var WA_DEFAULT = {
    en: "Hello Dr. Mohsen's team, I would like to book an appointment.",
    ar: "السلام عليكم، مع فريق د. محسن ممدوح. عايز أحجز موعد أو أستفسر عن حالة."
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function lang() { return document.documentElement.lang === "ar" ? "ar" : "en"; }
  function tr(en, ar) { return lang() === "ar" ? ar : en; }
  function digits(v) { return String(v).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[^\d+]/g, ""); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmtDate(d, o) { return new Intl.DateTimeFormat(lang() === "ar" ? "ar-EG" : "en-GB", o).format(d); }
  function fmtTime(t) { var p = t.split(":"), d = new Date(); d.setHours(+p[0], +p[1]); return fmtDate(d, { hour: "numeric", minute: "2-digit" }); }
  function readLabel(el) {
    if (!el) return "";
    var span = el.querySelector(".en, .ar");
    var node = (span && span.closest("b")) || el.querySelector("b") || el;
    var pick = node.querySelector("." + lang());
    return (pick ? pick.textContent : node.textContent).replace(/\s+/g, " ").trim();
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  var App = { bookings: [], initializing: true };

  /* ---------- language ---------- */
  function setLang(next) {
    var initializing = App.initializing;
    App.initializing = true;
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    var site = $(".m-site");
    if (site) { site.lang = next; site.dir = document.documentElement.dir; }
    ["alt", "aria-label", "title", "placeholder", "href"].forEach(function (attr) {
      $$("[data-" + next + "-" + attr + "]").forEach(function (el) {
        el.setAttribute(attr, el.getAttribute("data-" + next + "-" + attr));
      });
    });
    document.title = document.body.getAttribute("data-title-" + next) || "PCA Clinic";
    $$("[data-wa]").forEach(function (a) {
      a.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_DEFAULT[next]);
    });
    $$("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setLang === next)); });
    try { localStorage.setItem("mm-lang", next); } catch (e) {}
    App.bookings.forEach(function (b) { b.render(); });
    if (App.teamBooking) App.teamBooking.render();
    if (App.refreshSlider) App.refreshSlider();
    App.initializing = initializing;
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    var targets = $$("[data-fade], [data-stagger]");
    if (!("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: .08 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- generic filter groups (doctors, procedures) ---------- */
  function initFilters() {
    $$("[data-filter-group]").forEach(function (group) {
      var items = $$("[data-cat]", $(group.dataset.target));
      var empty = $(group.dataset.empty);
      $$("[data-filter]", group).forEach(function (chip) {
        chip.addEventListener("click", function () {
          $$("[data-filter]", group).forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
          var want = chip.dataset.filter, shown = 0;
          items.forEach(function (item) {
            var cats = item.dataset.cat.split(/\s+/);
            var on = want === "all" || cats.indexOf(want) > -1;
            item.hidden = !on; if (on) shown++;
          });
          if (empty) empty.classList.toggle("show", shown === 0);
        });
      });
    });

    // specialty card → jump to the directory with that filter applied
    $$("[data-goto-spec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = $('[data-filter-group="docs"]');
        var chip = group && $('[data-filter="' + btn.dataset.gotoSpec + '"]', group);
        if (chip) chip.click();
        if (App.filterDoctors) App.filterDoctors(btn.dataset.gotoSpec);
        var target = $("#doctors");
        if (target) target.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* Static counterpart of the app's filtered, manually controlled slider. */
  function initDoctorSlider() {
    var section = $("#doctors");
    var track = $("[data-doctor-slider]");
    if (!section || !track) return;
    var cards = $$("[data-specialty]", track);
    var buttons = $$("[data-doctor-filter]", section);
    var controls = $(".m-doctor-slider__controls", section);
    var count = $("[data-doctor-count]", section);
    var empty = $("[data-doctor-empty]", section);
    var activeFilter = "all";
    var leadNote = document.createElement("p");
    leadNote.className = "note"; leadNote.hidden = true;
    leadNote.innerHTML = '<a href="doctor-dr-mohsen.html"><span class="en">View Dr. Mohsen Mamdouh\'s profile</span><span class="ar">شوف ملف د. محسن ممدوح</span></a>';
    section.querySelector(".wrap").appendChild(leadNote);
    function bounds() {
      var offset = Math.abs(track.scrollLeft);
      var previous = $('[data-slide="-1"]', section);
      var next = $('[data-slide="1"]', section);
      if (previous) previous.disabled = offset < 2;
      if (next) next.disabled = offset >= track.scrollWidth - track.clientWidth - 2;
    }
    function filter(value) {
      activeFilter = value;
      var visible = 0;
      cards.forEach(function (card) {
        card.hidden = value !== "all" && card.dataset.specialty !== value;
        if (!card.hidden) visible++;
      });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.doctorFilter === value)); });
      track.hidden = !visible;
      if (controls) controls.hidden = !visible;
      if (empty) empty.hidden = !!visible;
      if (count) count.textContent = visible + " " + T("doctors", "دكاترة");
      leadNote.hidden = value !== "pain";
      track.scrollLeft = 0;
      bounds();
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { filter(b.dataset.doctorFilter); }); });
    $$("[data-slide]", section).forEach(function (b) {
      b.addEventListener("click", function () {
        var card = cards.filter(function (c) { return !c.hidden; })[0];
        var width = card ? card.getBoundingClientRect().width : track.clientWidth;
        track.scrollBy({ left: Number(b.dataset.slide) * (width + 24) * (lang() === "ar" ? -1 : 1), behavior: RM ? "auto" : "smooth" });
      });
    });
    track.addEventListener("scroll", bounds, { passive: true });
    window.addEventListener("resize", bounds);
    if (window.ResizeObserver) new ResizeObserver(bounds).observe(track);
    App.filterDoctors = filter;
    App.refreshSlider = function () { filter(activeFilter); };
    filter("all");
  }

  /* ---------- booking engine ----------
     Markup contract
       [data-step="n"]            panels (data-require="service,date,time" guarded before advancing)
       [data-pick="key"]          single-choice buttons (data-value)
       [data-pick-multi="key"]    toggle buttons that collect several values
       [data-when="clinic surgery"]  blocks shown only for those values of data-when-watch
       [data-days] [data-times]   rendered chips
       [data-rows] [data-review-rows]  rendered summaries
       [data-err="x"]             field error slots
       [data-required] [data-phone] [data-consent]   field validation
     */
  function Booking(root, opts) {
    var step = 1;
    var steps = opts.steps || $$("[data-step]", root).length;
    var state = { files: [] };
    var form = root.tagName === "FORM" ? root : $("form", root);
    var api = { state: state, root: root, go: go, next: next, reset: reset, render: render, addFiles: addFiles, set: set, toggle: toggle };

    function labelFor(key, value) { return readLabel(root.querySelector('[data-pick="' + key + '"][data-value="' + value + '"]')); }

    function applyWhen(key, value) {
      $$("[data-when]", root).forEach(function (el) {
        var allowed = el.dataset.when.split(/\s+/);
        el.hidden = allowed.indexOf(value) === -1;
      });
      var step2 = $('[data-step="2"]', root);
      if (step2 && key === "service") step2.dataset.require = value === "team" ? "" : "specialty";
      var step3 = $('[data-step="3"]', root);
      if (step3 && key === "service") step3.dataset.require = value === "team" ? "" : "date,time";
    }

    function set(key, value) {
      state[key] = value;
      $$('[data-pick="' + key + '"]', root).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === value)); });
      if (key === "service") applyWhen(key, value);
      if (key === "clinic" || key === "place") { delete state.date; delete state.time; }
      if (key === "specialty") { delete state.doctor; $$('[data-pick="doctor"]', root).forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); }
      if (key === "date") delete state.time;
      clearErrors(); render();
    }
    function toggle(key, value) {
      var list = state[key] ? state[key].slice() : [];
      var i = list.indexOf(value);
      if (i > -1) list.splice(i, 1); else list.push(value);
      state[key] = list;
      $$('[data-pick-multi="' + key + '"]', root).forEach(function (b) { b.setAttribute("aria-pressed", String(list.indexOf(b.dataset.value) > -1)); });
      render();
    }

    function clearErrors() { $$("[data-err], [data-step-error]", root).forEach(function (e) { e.textContent = ""; }); }
    function stepError(msg) {
      var box = $("[data-step-error]", root);
      if (box) { box.textContent = msg; if (!RM && window.gsap) window.gsap.fromTo(box, { x: -6 }, { x: 0, duration: .5, ease: "elastic.out(1,.3)" }); }
      else if (msg) window.alert(msg);
    }

    function go(n) {
      step = Math.max(1, Math.min(steps, n));
      $$("[data-step]", root).forEach(function (s) { s.classList.toggle("is-current", +s.dataset.step === step); });
      var list = $("[data-step-list]", root);
      if (list) {
        Array.prototype.forEach.call(list.children, function (li, i) {
          li.classList.toggle("is-on", i + 1 === step);
          li.classList.toggle("is-done", i + 1 < step);
        });
      }
      var count = $("[data-step-count]", root);
      if (count) count.textContent = tr("Step " + step + " of " + steps, "الخطوة " + arabicNum(step) + " من " + arabicNum(steps));
      root.dataset.currentStep = step;
      if (!RM && !App.initializing) {
        var top = root.getBoundingClientRect().top;
        if (top < 80 || top > window.innerHeight * .6) root.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    function arabicNum(n) { return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); }

    function next() { if (checkStep(step)) go(step + 1); }

    function checkStep(n) {
      clearErrors();
      var panel = $('[data-step="' + n + '"]', root);
      if (!panel) return true;
      var ok = true, req = (panel.dataset.require || "").split(",").filter(Boolean);
      req.forEach(function (k) {
        if (!state[k] || (Array.isArray(state[k]) && !state[k].length)) {
          ok = false;
          var label = $('[data-pick="' + k + '"]', root) || $('[data-pick-multi="' + k + '"]', root);
          stepError(tr("Please choose: ", "من فضلك اختر: ") + (label ? readLabel(label) : k));
        }
      });
      $$("[data-required]", panel).forEach(function (input) {
        if (input.offsetParent === null) return;
        var err = $('[data-err="' + input.name + '"]', root);
        if (!input.value.trim()) { ok = false; if (err) err.textContent = tr("This field is required.", "الحقل ده مطلوب."); }
      });
      $$("[data-phone]", panel).forEach(function (input) {
        if (input.offsetParent === null) return;
        var err = $('[data-err="' + input.name + '"]', root);
        var v = digits(input.value);
        if (v && !/^(\+?20)?01[0125]\d{8}$/.test(v)) { ok = false; if (err) err.textContent = tr("Enter an Egyptian mobile number, e.g. 010 1234 5678.", "اكتب رقم موبايل مصري صحيح، مثال: ٠١٠ ١٢٣٤ ٥٦٧٨."); }
      });
      $$("[data-consent]", panel).forEach(function (input) {
        if (!input.checked) { ok = false; var err = $('[data-err="' + (input.dataset.errSlot || "consent") + '"]', root); if (err) err.textContent = tr("Please accept to continue.", "من فضلك وافق على الشروط للمتابعة."); }
      });
      if (!ok) stepError(tr("Please complete the highlighted items.", "من فضلك استكمل البيانات المطلوبة."));
      return ok;
    }

    function days() {
      if (opts.days) return opts.days(state);
      var out = [], d = new Date(); d.setHours(0, 0, 0, 0);
      while (out.length < 10) { d.setDate(d.getDate() + 1); if (d.getDay() !== 5) out.push(new Date(d)); }
      return out;
    }
    function slots() { return state.service === "surgery" ? ["10:00", "11:30", "13:00", "16:00", "17:30"] : ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]; }
    function busy(date, i) { return !!date && (date.charCodeAt(9) + i * 3) % 5 === 0; }

    function renderDays() {
      $$("[data-days]", root).forEach(function (box) {
        box.innerHTML = days().map(function (d) {
          return '<button type="button" class="m-day" data-date="' + iso(d) + '" aria-pressed="' + (state.date === iso(d)) + '">' +
            '<small>' + fmtDate(d, { weekday: "short" }) + '</small><b>' + fmtDate(d, { day: "numeric" }) + '</b>' +
            '<small>' + fmtDate(d, { month: "short" }) + '</small></button>';
        }).join("");
        $$("[data-date]", box).forEach(function (b) {
          b.addEventListener("click", function () { set("date", b.dataset.date); });
        });
      });
    }
    function renderTimes() {
      $$("[data-times]", root).forEach(function (box) {
        if (!state.date) { box.innerHTML = '<p class="small" style="grid-column:1/-1;color:var(--muted)">' + tr("Pick a day to see the available times.", "اختر اليوم الأول لتظهر المواعيد المتاحة.") + '</p>'; return; }
        box.innerHTML = slots().map(function (t, i) {
          return '<button type="button" class="m-time" data-time="' + t + '" aria-pressed="' + (state.time === t) + '"' + (busy(state.date, i) ? " disabled" : "") + '>' + fmtTime(t) + '</button>';
        }).join("");
        $$("[data-time]", box).forEach(function (b) { b.addEventListener("click", function () { set("time", b.dataset.time); }); });
      });
    }

    function rows() {
      var out = opts.rows ? opts.rows(state) : [];
      return out.filter(function (r) { return r && r.length; });
    }
    function renderRows() {
      var data = rows();
      $$("[data-rows], [data-review-rows]", root).forEach(function (box) {
        box.innerHTML = data.map(function (r) {
          var v = r[1];
          return '<div><dt>' + esc(r[0]) + '</dt><dd' + (v ? "" : ' class="empty"') + '>' + esc(v || tr("Not set yet", "لم يُحدَّد بعد")) + '</dd></div>';
        }).join("");
      });
      var badge = $("[data-files-count]", root);
      if (badge) badge.textContent = state.files.length ? (lang() === "ar" ? state.files.length + " ملف" : state.files.length + " file(s)") : "";
    }

    /* ---------- uploads ---------- */
    var MAX_FILES = 10, MAX_MB = 15;
    var OK_TYPES = /^(image\/(jpeg|png|jpg|webp|heic|heif)|application\/pdf)/i;
    function addFiles(fileList) {
      var err = $('[data-err="files"]', root), added = 0;
      Array.prototype.forEach.call(fileList, function (f) {
        if (state.files.length >= MAX_FILES) return;
        if (!OK_TYPES.test(f.type || "")) { if (err) err.textContent = tr("Only PDF or image files are accepted.", "نقبل ملفات PDF أو صور فقط."); return; }
        if (f.size > MAX_MB * 1024 * 1024) { if (err) err.textContent = tr("Each file must stay under 15 MB.", "حجم الملف لا يزيد عن ١٥ ميجا."); return; }
        state.files.push({ name: f.name, size: f.size, type: f.type || "" });
        added++;
      });
      if (err && added) err.textContent = "";
      renderFiles(); renderRows();
    }
    function fileSize(bytes) {
      return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1024 / 1024).toFixed(1) + " MB";
    }
    function renderFiles() {
      $$("[data-files]", root).forEach(function (box) {
        box.innerHTML = state.files.map(function (f, i) {
          var ico = /pdf/i.test(f.type) ? "ph-file-pdf" : "ph-file-image";
          var pct = Math.min(100, Math.round(20 + i * 14));
          return '<div class="m-file"><i class="ph-light ' + ico + '"></i>' +
            '<span class="m-file__meta"><b>' + esc(f.name) + '</b><span>' + fileSize(f.size) + '</span>' +
            '<span class="m-file__bar"><span style="width:' + pct + '%"></span></span></span>' +
            '<button type="button" class="m-file__x" data-file-x="' + i + '" aria-label="' + tr("Remove", "حذف") + '"><i class="ph-light ph-x"></i></button></div>';
        }).join("");
        $$("[data-file-x]", box).forEach(function (b) {
          b.addEventListener("click", function () { state.files.splice(+b.dataset.fileX, 1); renderFiles(); renderRows(); });
        });
      });
    }

    function render() { renderDays(); renderTimes(); renderRows(); renderFiles(); }

    /* ---------- wiring ---------- */
    $$("[data-pick]", root).forEach(function (b) {
      b.addEventListener("click", function () { set(b.dataset.pick, b.dataset.value); });
    });
    $$("[data-pick-multi]", root).forEach(function (b) {
      b.addEventListener("click", function () { toggle(b.dataset.pickMulti, b.dataset.value); });
    });
    $$("[data-next]", root).forEach(function (b) { b.addEventListener("click", next); });
    $$("[data-back]", root).forEach(function (b) { b.addEventListener("click", function () { go(step - 1); }); });

    // text fields write straight into the state so the summary rail stays live
    $$("input[name], select[name], textarea[name]", root).forEach(function (el) {
      if (el.type === "file" || el.type === "checkbox" || el.hasAttribute("data-up-input")) return;
      var sync = function () { state[el.name] = el.value; renderRows(); };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });

    // step 2: the doctor list follows the chosen specialty
    var docChips = $$("[data-doc-spec]", root);
    if (docChips.length) {
      var syncDocs = function () {
        var spec = state.specialty;
        docChips.forEach(function (c) {
          var match = !!spec && c.dataset.docSpec === spec;
          c.hidden = !match;
          if (!match && state.doctor === c.dataset.value) { delete state.doctor; c.setAttribute("aria-pressed", "false"); }
        });
      };
      $$('[data-pick="specialty"]', root).forEach(function (b) { b.addEventListener("click", syncDocs); });
      api.syncDocs = syncDocs;
      syncDocs();
    }

    var input = $("[data-up-input]", root), zone = $("[data-up]", root);
    if (zone && input) {
      zone.addEventListener("click", function (e) { if (e.target.tagName !== "BUTTON") input.click(); });
      input.addEventListener("change", function () { addFiles(input.files); input.value = ""; });
      ["dragenter", "dragover"].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add("is-drag"); }); });
      ["dragleave", "drop"].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove("is-drag"); if (ev === "drop" && e.dataTransfer) addFiles(e.dataTransfer.files); }); });
    }

    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!checkStep(step)) return;
      var btn = $("[data-submit]", root);
      if (btn) btn.classList.add("is-loading");
      setTimeout(function () {
        if (btn) btn.classList.remove("is-loading");
        state.ref = opts.makeRef ? opts.makeRef(state) : "MM-" + Math.floor(1000 + Math.random() * 9000);
        $$("[data-ref]", root).forEach(function (r) { r.textContent = state.ref; });
        var wa = $("[data-wa-summary]", root);
        if (wa) wa.href = waLink(state, opts.title);
        root.classList.add("is-done");
        if (opts.onDone) opts.onDone(state);
      }, 1200);
    });

    function waLink(s, title) {
      var lines = [title ? title[lang()] : tr("New booking request", "طلب حجز جديد"), "—"];
      (opts.rows ? opts.rows(s) : []).forEach(function (r) { if (r && r[0]) lines.push("• " + r[0] + ": " + r[1]); });
      if (s.files && s.files.length) lines.push("• " + tr("Files", "الملفات") + ": " + s.files.length);
      if (s.ref) lines.push("• " + tr("Reference", "رقم الطلب") + ": " + s.ref);
      return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    }

    function reset() {
      Object.keys(state).forEach(function (k) { delete state[k]; });
      state.files = [];
      root.classList.remove("is-done");
      if (form) form.reset();
      $$("[aria-pressed]", root).forEach(function (b) { if (b.dataset.pick || b.dataset.pickMulti) b.setAttribute("aria-pressed", "false"); });
      go(1); render();
    }
    $$("[data-reset]", root).forEach(function (b) { b.addEventListener("click", reset); });

    render();
    go(1);
    return api;
  }

  /* =========================================================
     main booking instance
     ========================================================= */
  function mainRows(s) {
    var T = function (en, ar) { return lang() === "ar" ? ar : en; };
    var out = [];
    out.push([T("Request type", "نوع الطلب"), s.service ? labelOf("service", s.service) : ""]);
    if (s.service === "team") {
      out.push([T("Facility", "المنشأة"), (s.facility || "").trim()]);
      out.push([T("City", "المدينة"), (s.facilityCity || "").trim()]);
      out.push([T("Case mix", "نوع العمليات"), (s.mix || []).map(function (v) { return labelOfMulti("mix", v); }).join("، ")]);
      out.push([T("Expected cases", "عدد الحالات"), (s.cases || "").trim()]);
      out.push([T("From", "من تاريخ"), s.from || ""]);
      out.push([T("To", "إلى تاريخ"), s.to || ""]);
      out.push([T("Days per week", "أيام في الأسبوع"), (s.daysPerWeek || "").trim()]);
      out.push([T("Contact person", "مسؤول التواصل"), (s.name || "").trim()]);
      out.push([T("Role", "الوظيفة"), (s.role || "").trim()]);
      out.push([T("Mobile", "الموبايل"), (s.phone || "").trim()]);
    } else {
      out.push([T("Specialty", "التخصص"), s.specialty ? labelOf("specialty", s.specialty) : ""]);
      out.push([T("Doctor", "الطبيب"), s.doctor ? labelOf("doctor", s.doctor) : (s.specialty ? T("Team will assign", "يحدده الفريق") : "")]);
      out.push([T("Clinic / hospital", "العيادة / المستشفى"), s.clinic ? labelOf("clinic", s.clinic) : ""]);
      out.push([T("Preferred time", "الموعد المفضل"), s.date ? fmtDate(new Date(s.date + "T00:00"), { weekday: "long", day: "numeric", month: "long" }) + (s.time ? " — " + fmtTime(s.time) : "") : ""]);
      out.push([T("Name", "الاسم"), (s.name || "").trim()]);
      out.push([T("Mobile", "الموبايل"), (s.phone || "").trim()]);
      out.push([T("Age", "السن"), (s.age || "").trim()]);
      out.push([T("City", "المدينة"), (s.city || "").trim()]);
      out.push([T("Chief complaint", "الشكوى الحالية"), (s.complaint || "").trim()]);
      out.push([T("Chronic conditions", "أمراض مزمنة"), (s.conds || []).map(function (v) { return labelOfMulti("conds", v); }).join("، ")]);
      out.push([T("Uploaded files", "الملفات المرفوعة"), s.files.length ? String(s.files.length) : ""]);
    }
    out.push([T("Notes", "ملاحظات"), (s.notes || "").trim()]);
    return out;
  }
  function labelOf(key, value) {
    var root = $("[data-booking='main']") || document;
    return readLabel(root.querySelector('[data-pick="' + key + '"][data-value="' + value + '"]')) || value;
  }
  function labelOfMulti(key, value) {
    var root = $("[data-booking='main']") || document;
    return readLabel(root.querySelector('[data-pick-multi="' + key + '"][data-value="' + value + '"]')) || value;
  }

  function teamRows(s) {
    var T = function (en, ar) { return lang() === "ar" ? ar : en; };
    var root = $("[data-booking='team']") || document;
    var lo = function (k, v) { return readLabel(root.querySelector('[data-pick="' + k + '"][data-value="' + v + '"]')) || v; };
    var lm = function (k, v) { return readLabel(root.querySelector('[data-pick-multi="' + k + '"][data-value="' + v + '"]')) || v; };
    return [
      [T("Coverage", "نوع التغطية"), s.coverage ? lo("coverage", s.coverage) : ""],
      [T("Facility", "المنشأة"), (s.facility || "").trim()],
      [T("City", "المدينة"), (s.facilityCity || "").trim()],
      [T("Case mix", "نوع العمليات"), (s.mix || []).map(function (v) { return lm("mix", v); }).join("، ")],
      [T("Expected cases", "عدد الحالات"), (s.cases || "").trim()],
      [T("From", "من تاريخ"), s.from || ""],
      [T("To", "إلى تاريخ"), s.to || ""],
      [T("Days per week", "أيام في الأسبوع"), (s.daysPerWeek || "").trim()],
      [T("Contact person", "مسؤول التواصل"), (s.name || "").trim()],
      [T("Role", "الوظيفة"), (s.role || "").trim()],
      [T("Mobile", "الموبايل"), (s.phone || "").trim()],
      [T("Uploaded schedule", "الجدول / الحالات المرفوعة"), s.files.length ? String(s.files.length) : ""],
      [T("Notes", "ملاحظات"), (s.notes || "").trim()]
    ];
  }

  /* =========================================================
     request sheet (anaesthesia team)
     ========================================================= */
  function initSheet() {
    var sheet = $("[data-sheet]");
    if (!sheet) return;
    var lastFocus = null;
    function open(preset) {
      lastFocus = document.activeElement;
      sheet.classList.add("is-open");
      document.body.style.overflow = "hidden";
      if (preset && App.teamBooking) App.teamBooking.set("coverage", preset);
      setTimeout(function () { var f = $("button, input, select, textarea", sheet); if (f) f.focus(); }, 120);
    }
    function close() {
      sheet.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    $$("[data-team-request]").forEach(function (b) {
      b.addEventListener("click", function () { open(b.dataset.teamRequest || null); });
    });
    $$("[data-sheet-close]").forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet.classList.contains("is-open")) close(); });
    App.openSheet = open;
  }

  /* =========================================================
     chrome: nav, menu, sticky bits
     ========================================================= */
  function initChrome() {
    var nav = $(".m-nav");
    function onScroll() {
      if (nav) nav.classList.toggle("is-solid", !!document.body.dataset.profile || window.scrollY > 60);
      var wa = $(".m-wa");
      if (wa) wa.classList.toggle("is-on", window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var menu = $("[data-menu]");
    var burger = $("[data-menu-open]");
    function openMenu() {
      if (!menu) return;
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      if (burger) burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    function closeMenu(restoreFocus) {
      if (!menu) return;
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      if (burger) burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (restoreFocus && burger) burger.focus();
    }
    $$("[data-menu-open]").forEach(function (b) { b.addEventListener("click", openMenu); });
    $$("[data-menu-close]").forEach(function (b) { b.addEventListener("click", function () { closeMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu && menu.classList.contains("is-open")) closeMenu(true);
    });

    // deep-link: quote / contact prefill for WhatsApp
    $$("[data-wa]").forEach(function (a) {
      a.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_DEFAULT[lang()]);
      a.target = "_blank"; a.rel = "noopener";
    });

    // process step highlight
    var steps = $$(".m-step");
    if (steps.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle("is-on", e.isIntersecting); });
      }, { rootMargin: "-42% 0px -42% 0px" });
      steps.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var saved = null;
    try { saved = localStorage.getItem("mm-lang"); } catch (e) {}
    $$("[data-set-lang]").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.setLang); }); });
    setLang(saved === "en" ? "en" : "ar");

    initChrome();
    initFilters();
    initDoctorSlider();
    initSheet();

    var main = $("[data-booking='main']");
    if (main) {
      var booking = Booking(main, { steps: 6, rows: mainRows });
      App.bookings.push(booking);
      if (main.dataset.initialDoctor) {
        booking.set("service", "clinic");
        booking.set("specialty", main.dataset.initialSpecialty);
        if (booking.syncDocs) booking.syncDocs();
        booking.set("doctor", main.dataset.initialDoctor);
        booking.go(2);
      }
    }

    var team = $("[data-booking='team']");
    if (team) App.teamBooking = Booking(team, { steps: 4, rows: teamRows });

    App.initializing = false;

    initReveal();

    // "Book online" on a doctor card → prefill the main booking and jump to it
    $$("[data-book-doc]").forEach(function (b) {
      b.addEventListener("click", function () {
        var bk = App.bookings[0];
        if (bk) {
          bk.set("service", "clinic");
          bk.set("specialty", b.dataset.docSpec);
          if (bk.syncDocs) bk.syncDocs();
          bk.set("doctor", b.dataset.docId);
          bk.go(2);
        }
        var target = $("#booking");
        if (target) target.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
      });
    });

    // hero portrait: gentle parallax (progressive enhancement)
    if (window.gsap && !RM) {
      try {
        if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
        var shot = $("[data-parallax]");
        if (shot && window.ScrollTrigger) window.gsap.to(shot, { yPercent: 5, ease: "none", scrollTrigger: { trigger: shot, start: "top top", end: "bottom top", scrub: true } });
      } catch (e) {}
    }
  });
})();
