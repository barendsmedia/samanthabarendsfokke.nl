// Toegangscode-poort: ontsleutelt de inhoud in de browser (AES-GCM, sleutel via PBKDF2).
(function () {
  var KEY = "sbf-cv-code";
  var payload = JSON.parse(document.getElementById("payload").textContent);
  var form = document.getElementById("gateForm");
  var input = document.getElementById("code");
  var err = document.getElementById("err");
  var btn = document.getElementById("go");

  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function decrypt(code) {
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64(payload.salt), iterations: payload.iterations, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(payload.iv) }, key, b64(payload.data));
    return new TextDecoder().decode(plain);
  }

  function normalize(v) { return v.trim().toLowerCase(); }

  async function tryUnlock(code, silent) {
    try {
      var html = await decrypt(code);
      document.getElementById("app").innerHTML = html;
      document.body.classList.remove("locked");
      document.getElementById("gate").classList.add("hidden");
      try { sessionStorage.setItem(KEY, code); } catch (e) {}
      window.startCV();
      return true;
    } catch (e) {
      if (!silent) {
        err.textContent = "Die code klopt niet, probeer het nog eens.";
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      }
      return false;
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    err.textContent = "";
    btn.disabled = true; btn.textContent = "Even geduld…";
    await tryUnlock(normalize(input.value), false);
    btn.disabled = false; btn.textContent = "Bekijk cv";
  });

  var saved = null;
  try { saved = sessionStorage.getItem(KEY); } catch (e) {}
  if (saved) tryUnlock(saved, true);
})();
