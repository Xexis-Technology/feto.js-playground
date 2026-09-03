/* Feto.js Documentation — app.js */

(function () {
  "use strict";

  // --- Theme ---
  const savedTheme = localStorage.getItem("feto-theme") || "dark";
  document.body.dataset.theme = savedTheme;

  document.getElementById("themeToggle").addEventListener("click", function () {
    const current = document.body.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem("feto-theme", next);
  });

  // --- Mobile sidebar ---
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuToggle = document.getElementById("menuToggle");

  function openSidebar() { sidebar.classList.add("open"); overlay.classList.add("open"); }
  function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("open"); }

  menuToggle.addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);

  // Close sidebar on nav click (mobile)
  sidebar.querySelectorAll(".sidebar-link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // --- Active sidebar link ---
  const sections = document.querySelectorAll(".section");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  function updateActiveLink() {
    let current = "";
    sections.forEach(function (sec) {
      if (sec.getBoundingClientRect().top <= 120) current = sec.id;
    });
    sidebarLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-section") === current);
    });
  }
  window.addEventListener("scroll", updateActiveLink, { passive: true });
  updateActiveLink();

  // --- Copy buttons ---
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const text = btn.dataset.copy || btn.closest(".code-block").querySelector("code").textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1500);
      });
    });
  });

  // --- Response viewer ---
  function renderResponse(container, data) {
    container.style.display = "block";
    var html = "";
    if (data.error) {
      html += '<div class="rv-status err">Error: ' + escHtml(data.error) + '</div>';
    } else {
      var okClass = data.ok ? "ok" : "err";
      html += '<div class="rv-status ' + okClass + '">Status: ' + data.status + " " + escHtml(data.statusText || "") + '</div>';
    }
    if (data.time) html += '<div class="rv-time">Time: ' + data.time + ' ms</div>';
    if (data.headers) {
      html += '<div class="rv-label">Headers</div><pre>' + escHtml(JSON.stringify(data.headers, null, 2)) + '</pre>';
    }
    if (data.body !== undefined) {
      html += '<div class="rv-label">Body</div><pre>' + escHtml(typeof data.body === "string" ? data.body : JSON.stringify(data.body, null, 2)) + '</pre>';
    }
    if (data.info) {
      html += '<div class="rv-status ok">' + escHtml(data.info) + '</div>';
    }
    container.innerHTML = html;
  }

  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function showStatus(id, msg, type) {
    var el = document.getElementById(id);
    el.style.display = "block";
    el.className = "status-box " + type;
    el.textContent = msg;
  }

  async function runRequest(method, url, options) {
    var start = Date.now();
    try {
      var res;
      if (method === "GET") res = await Feto.get(url, options);
      else if (method === "POST") res = await Feto.post(url, options.body, options);
      else if (method === "PUT") res = await Feto.put(url, options.body, options);
      else if (method === "PATCH") res = await Feto.patch(url, options.body, options);
      else if (method === "DELETE") res = await Feto.delete(url, options);
      var elapsed = Date.now() - start;
      return { status: res.status, statusText: res.statusText, ok: res.ok, headers: res.headers, body: res.data, time: res.duration || elapsed, fromCache: res.fromCache };
    } catch (err) {
      var elapsed = Date.now() - start;
      return { error: err.name + ": " + err.message, time: elapsed };
    }
  }

  // --- CDN test ---
  document.getElementById("testCdnBtn").addEventListener("click", function () {
    if (typeof Feto !== "undefined") {
      showStatus("cdnStatus", "Feto.js loaded successfully — Version: " + Feto.version, "success");
    } else {
      showStatus("cdnStatus", "Feto.js not available. CDN may have failed to load.", "error");
    }
  });

  // --- Example runners ---
  document.querySelectorAll(".run-example").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      var ex = btn.dataset.example;
      var container = document.getElementById("response-" + ex);
      btn.disabled = true;
      btn.textContent = "Running...";

      try {
        var result;
        switch (ex) {
          case "create":
            var api = Feto.create({ baseURL: "https://jsonplaceholder.typicode.com" });
            var apiRes = await api.get("/posts/1");
            result = { status: apiRes.status, statusText: apiRes.statusText, ok: apiRes.ok, headers: apiRes.headers, body: apiRes.data, time: apiRes.duration, fromCache: apiRes.fromCache, info: "Feto.create() instance with baseURL" };
            break;
          case "baseurl":
            var api2 = Feto.create({ baseURL: "https://jsonplaceholder.typicode.com" });
            var apiRes2 = await api2.get("/posts/1");
            result = { status: apiRes2.status, statusText: apiRes2.statusText, ok: apiRes2.ok, body: apiRes2.data, time: apiRes2.duration, info: "baseURL + /posts/1 combined safely" };
            break;
          case "params":
            var paramsRes = await Feto.get("https://httpbin.org/get", { params: { page: "1", limit: "20", search: "hello world" } });
            result = { status: paramsRes.status, statusText: paramsRes.statusText, ok: paramsRes.ok, body: paramsRes.data, time: paramsRes.duration, info: "Query params encoded automatically" };
            break;
          case "get":
            result = await runRequest("GET", "https://jsonplaceholder.typicode.com/posts/1", {});
            break;
          case "post":
            var body = JSON.parse(document.getElementById("postBody").value);
            result = await runRequest("POST", "https://jsonplaceholder.typicode.com/posts", { body: body });
            break;
          case "put":
            result = await runRequest("PUT", "https://jsonplaceholder.typicode.com/posts/1", {
              body: { id: 1, title: "Updated Title", body: "Updated body", userId: 1 }
            });
            break;
          case "patch":
            result = await runRequest("PATCH", "https://jsonplaceholder.typicode.com/posts/1", {
              body: { title: "Patched Title" }
            });
            break;
          case "delete":
            result = await runRequest("DELETE", "https://jsonplaceholder.typicode.com/posts/1", {});
            break;
          case "headers":
            var hName = document.getElementById("headerName").value;
            var hVal = document.getElementById("headerValue").value;
            var headers = {};
            headers[hName] = hVal;
            result = await runRequest("GET", "https://jsonplaceholder.typicode.com/posts/1", { headers: headers });
            break;
          case "auth":
            result = await runRequest("GET", "https://httpbin.org/get", {});
            break;
          case "timeout":
            result = await runRequest("GET", "https://httpbin.org/delay/5", { timeout: 200 });
            break;
          case "retry":
            result = await runRequest("GET", "https://jsonplaceholder.typicode.com/posts/1", { retry: 2, retryDelay: 300 });
            break;
          case "interceptors":
            var reqId = Feto.interceptors.request.use(function (config) {
              config.headers["X-Intercepted"] = "true";
              return config;
            });
            var resId = Feto.interceptors.response.use(function (response) {
              response.customFlag = "intercepted";
              return response;
            });
            result = await runRequest("GET", "https://jsonplaceholder.typicode.com/posts/1", {});
            result.info = "Request and response interceptors ran. X-Intercepted header was added.";
            Feto.interceptors.request.eject(reqId);
            Feto.interceptors.response.eject(resId);
            break;
          case "dedup":
            var start = Date.now();
            var results = await Promise.all([
              Feto.get("https://jsonplaceholder.typicode.com/posts/1"),
              Feto.get("https://jsonplaceholder.typicode.com/posts/1"),
              Feto.get("https://jsonplaceholder.typicode.com/posts/1")
            ]);
            var elapsed = Date.now() - start;
            result = { status: results[0].status, statusText: results[0].statusText, ok: results[0].ok, body: results[0].data, time: elapsed, info: "3 requests completed in " + elapsed + "ms. All returned identical data." };
            break;
          case "formdata":
            var form = new FormData();
            form.append("name", document.getElementById("formDataName").value);
            form.append("email", document.getElementById("formDataEmail").value);
            result = await runRequest("POST", "https://httpbin.org/post", { body: form });
            break;
          case "duration":
            var durRes = await Feto.get("https://jsonplaceholder.typicode.com/posts/1");
            result = { status: durRes.status, statusText: durRes.statusText, ok: durRes.ok, body: durRes.data, time: durRes.duration, info: "duration: " + durRes.duration + "ms" };
            break;
        }
        renderResponse(container, result);
      } catch (err) {
        renderResponse(container, { error: err.message });
      } finally {
        btn.disabled = false;
        btn.textContent = "Run Example";
      }
    });
  });

  // --- Auth controls ---
  document.getElementById("authSetBtn").addEventListener("click", function () {
    Feto.auth.setToken(document.getElementById("authTokenInput").value);
    showStatus("authStatus", "Token set. Current token: " + Feto.auth.getToken(), "success");
  });
  document.getElementById("authGetBtn").addEventListener("click", function () {
    var t = Feto.auth.getToken();
    showStatus("authStatus", t ? "Current token: " + t : "No token stored.", "info");
  });
  document.getElementById("authClearBtn").addEventListener("click", function () {
    Feto.auth.clearToken();
    showStatus("authStatus", "Token cleared.", "info");
  });

  // --- Abort demo ---
  var abortController = null;
  document.getElementById("abortStartBtn").addEventListener("click", async function () {
    abortController = new AbortController();
    document.getElementById("abortCancelBtn").disabled = false;
    var container = document.getElementById("response-abort");
    container.style.display = "block";
    container.innerHTML = '<div class="rv-status ok">Request started...</div>';
    try {
      var res = await Feto.get("https://httpbin.org/delay/5", { signal: abortController.signal });
      renderResponse(container, { status: res.status, statusText: res.statusText, ok: res.ok, body: res.data, info: "Request completed before abort." });
    } catch (err) {
      renderResponse(container, { error: err.name + ": " + err.message });
    } finally {
      document.getElementById("abortCancelBtn").disabled = true;
      abortController = null;
    }
  });
  document.getElementById("abortCancelBtn").addEventListener("click", function () {
    if (abortController) abortController.abort();
  });

  // --- Cache demo ---
  document.getElementById("cacheFirstBtn").addEventListener("click", async function () {
    Feto.cache.clear();
    var result = await runRequest("GET", "https://jsonplaceholder.typicode.com/posts/1", { cache: true, ttl: 30000 });
    if (!result.error) result.info = "fromCache: " + (result.fromCache || false);
    renderResponse(document.getElementById("response-cache"), result);
  });
  document.getElementById("cacheSecondBtn").addEventListener("click", async function () {
    var result = await runRequest("GET", "https://jsonplaceholder.typicode.com/posts/1", { cache: true, ttl: 30000 });
    if (!result.error) result.info = "fromCache: " + (result.fromCache || false);
    renderResponse(document.getElementById("response-cache"), result);
  });
  document.getElementById("cacheClearBtn").addEventListener("click", function () {
    Feto.cache.clear();
    showStatus("cdnStatus", "Cache cleared.", "info");
  });

  // --- Playground ---
  var pgMethod = document.getElementById("pgMethod");
  var pgUrl = document.getElementById("pgUrl");
  var pgHeaders = document.getElementById("pgHeaders");
  var pgBody = document.getElementById("pgBody");
  var pgTimeout = document.getElementById("pgTimeout");
  var pgRetry = document.getElementById("pgRetry");
  var pgCache = document.getElementById("pgCache");
  var pgCode = document.getElementById("pgCode");

  function updateCode() {
    var method = pgMethod.value;
    var url = pgUrl.value;
    var headers = pgHeaders.value.trim();
    var body = pgBody.value.trim();
    var timeout = parseInt(pgTimeout.value) || 0;
    var retry = parseInt(pgRetry.value) || 0;
    var cache = pgCache.checked;

    var code = "";
    if (method === "GET") {
      code = 'const response = await Feto.get(\n  "' + url + '"';
      var opts = [];
      if (headers !== "{}") opts.push("  headers: " + headers);
      if (timeout > 0) opts.push("  timeout: " + timeout);
      if (retry > 0) opts.push("  retry: " + retry);
      if (cache) opts.push("  cache: true");
      if (opts.length) code += ",\n" + opts.join(",\n");
      code += "\n);";
    } else {
      code = 'const response = await Feto.' + method.toLowerCase() + '(\n  "' + url + '"';
      if (body && body !== "{}") code += ",\n  " + body;
      var opts = [];
      if (headers !== "{}") opts.push("  headers: " + headers);
      if (timeout > 0) opts.push("  timeout: " + timeout);
      if (retry > 0) opts.push("  retry: " + retry);
      if (opts.length) code += ",\n" + opts.join(",\n");
      code += "\n);";
    }
    pgCode.textContent = code;
  }

  [pgMethod, pgUrl, pgHeaders, pgBody, pgTimeout, pgRetry, pgCache].forEach(function (el) {
    el.addEventListener("input", updateCode);
    el.addEventListener("change", updateCode);
  });

  document.getElementById("pgSendBtn").addEventListener("click", async function () {
    var btn = document.getElementById("pgSendBtn");
    btn.disabled = true;
    btn.textContent = "Sending...";
    var container = document.getElementById("pgResponse");
    try {
      var opts = {};
      var h = pgHeaders.value.trim();
      if (h && h !== "{}") opts.headers = JSON.parse(h);
      var t = parseInt(pgTimeout.value);
      if (t > 0) opts.timeout = t;
      var r = parseInt(pgRetry.value);
      if (r > 0) opts.retry = r;
      if (pgCache.checked) { opts.cache = true; opts.ttl = 30000; }

      var method = pgMethod.value;
      var url = pgUrl.value;
      var bodyData = undefined;
      if (method !== "GET" && method !== "DELETE") {
        var b = pgBody.value.trim();
        if (b && b !== "{}") bodyData = JSON.parse(b);
      }
      var result = await runRequest(method, url, Object.assign(opts, bodyData !== undefined ? { body: bodyData } : {}));
      renderResponse(container, result);
    } catch (err) {
      renderResponse(container, { error: err.message });
    } finally {
      btn.disabled = false;
      btn.textContent = "Send Request";
    }
  });

  document.getElementById("pgClearBtn").addEventListener("click", function () {
    pgMethod.value = "GET";
    pgUrl.value = "https://jsonplaceholder.typicode.com/posts/1";
    pgHeaders.value = "{}";
    pgBody.value = "{}";
    pgTimeout.value = "0";
    pgRetry.value = "0";
    pgCache.checked = false;
    document.getElementById("pgResponse").style.display = "none";
    updateCode();
  });

  document.getElementById("pgCopyBtn").addEventListener("click", function () {
    navigator.clipboard.writeText(pgCode.textContent).then(function () {
      var btn = document.getElementById("pgCopyBtn");
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = "Copy Code"; }, 1500);
    });
  });

  updateCode();
})();
