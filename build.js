#!/usr/bin/env node
/**
 * Bouwt src/ naar één zelfstandig bestand: docs/index.html
 *
 * - styles.css, main.js en gate.js worden inline gezet
 * - de foto wordt als data-URI in de inhoud gezet
 * - de inhoud (content.html) wordt versleuteld met de toegangscode (AES-256-GCM, PBKDF2-SHA256)
 *
 * Toegangscode komt uit de omgevingsvariabele CV_ACCESS_CODE of uit een lokaal .env-bestand.
 * Gebruik: CV_ACCESS_CODE=geheim npm run build
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SRC = path.join(__dirname, "src");
const OUT = path.join(__dirname, "docs");
const ITERATIONS = 250000;

function read(file) {
  return fs.readFileSync(path.join(SRC, file), "utf8");
}

function loadEnv() {
  const envFile = path.join(__dirname, ".env");
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function encrypt(plain, code) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(code, salt, ITERATIONS, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return {
    v: 1,
    iterations: ITERATIONS,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    data: data.toString("base64"),
  };
}

loadEnv();
const code = (process.env.CV_ACCESS_CODE || "").trim().toLowerCase();
if (!code) {
  console.error("✖ Geen toegangscode. Zet CV_ACCESS_CODE in je omgeving of in een .env-bestand.");
  process.exit(1);
}

const photo = "data:image/jpeg;base64," + fs.readFileSync(path.join(SRC, "assets", "samantha.jpg")).toString("base64");
const content = read("content.html").split("{{PHOTO}}").join(photo);
const payload = JSON.stringify(encrypt(content, code));

const html = read("index.html")
  .replace("{{STYLES}}", () => read("styles.css"))
  .replace("{{PAYLOAD}}", () => payload)
  .replace("{{MAIN}}", () => read("main.js"))
  .replace("{{GATE}}", () => read("gate.js"));

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log(`✔ docs/index.html gebouwd (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
