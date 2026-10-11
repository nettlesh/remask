// remask
//
// Shows a fake sign-up form on the site you're on, so 1Password offers
// "Create Masked Email" for that site's domain. Nothing is ever submitted:
// the form only exists in your tab and is removed when you close it.
(() => {
  const KEY = "__remask";
  if (window[KEY]) return window[KEY].close();

  if (!/^https?:$/.test(location.protocol)) {
    alert("Run this on the website you want a Masked Email for.");
    return;
  }

  // Firefox and its forks (Zen, LibreWolf, Floorp...) block every extension,
  // 1Password included, on these hosts. Pref:
  // extensions.webextensions.restrictedDomains
  const FIREFOX_BLOCKED = [
    "accounts-static.cdn.mozilla.net", "accounts.firefox.com",
    "addons.cdn.mozilla.net", "addons.mozilla.org", "api.accounts.firefox.com",
    "content.cdn.mozilla.net", "discovery.addons.mozilla.org",
    "install.mozilla.org", "oauth.accounts.firefox.com",
    "profile.accounts.firefox.com", "support.mozilla.org",
    "sync.services.mozilla.com",
  ];
  const extensionsBlocked = /Firefox\//.test(navigator.userAgent) &&
    FIREFOX_BLOCKED.includes(location.hostname);

  const original = { url: location.href, state: history.state };
  // A sign-up-looking URL helps 1Password classify the form as a registration.
  const fakeURL = new URL("/registration", location.origin).href;
  const prefix = "remask-" + crypto.randomUUID();
  // Prefer plain ids for 1Password's heuristics unless the page already uses them.
  const fieldID = name => document.getElementById(name) ? `${prefix}-${name}` : name;

  // Elements are built with the DOM API and styled through CSSOM so the panel
  // works on sites with strict Content-Security-Policy or Trusted Types.
  // `all:initial` keeps the page's own CSS from restyling the panel.
  const BASE = "all:initial;box-sizing:border-box;display:block;" +
    "font:14px/1.4 system-ui,sans-serif;color:#111;";
  const el = (tag, css, props = {}, ...children) => {
    const node = Object.assign(document.createElement(tag), props);
    node.style.cssText = BASE + css;
    node.append(...children);
    return node;
  };
  const BUTTON = "display:inline-block;padding:8px 12px;margin:4px 8px 0 0;" +
    "background:#eee;border:1px solid #555;border-radius:4px;cursor:pointer;";
  const INPUT = "width:100%;margin:4px 0 12px;padding:8px;background:#fff;" +
    "border:1px solid #555;border-radius:4px;font-size:16px;";

  const field = (label, id, props) => {
    const input = el("input", INPUT, { id: fieldID(id), required: true, ...props });
    return [el("label", "font-weight:600;", { htmlFor: input.id, textContent: label }), input];
  };
  const [emailLabel, email] = field("Email", "email",
    { name: "email", type: "email", autocomplete: "email" });
  const [passwordLabel, password] = field("Password", "password",
    { name: "password", type: "password", autocomplete: "new-password" });
  const [confirmLabel, confirm] = field("Confirm password", "password-confirm",
    { name: "password_confirmation", type: "password", autocomplete: "new-password" });

  const status = el("p", "min-height:1.4em;margin:8px 0;color:#555;", { role: "status" });
  const register = el("button", BUTTON, { type: "submit", textContent: "Register" });
  const form = el("form", "", { action: "/submit", method: "post" },
    emailLabel, email, passwordLabel, password, confirmLabel, confirm, register);

  // Capture phase on the form: 1Password's document-level listeners still see
  // the submit, but the page's own handlers and the real navigation never do.
  form.addEventListener("submit", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    status.textContent = "Not sent anywhere. Update or save the login when 1Password asks.";
  }, true);

  const copy = async () => {
    if (!email.value) {
      status.textContent = "No email yet. Create one from the Email field first.";
      return false;
    }
    try {
      await navigator.clipboard.writeText(email.value);
    } catch {
      email.select();
      document.execCommand("copy");
    }
    status.textContent = `Copied ${email.value}`;
    return true;
  };

  const close = () => {
    try {
      // Leave the URL alone if the site has navigated since we changed it.
      if (location.href === fakeURL) history.replaceState(original.state, "", original.url);
    } finally {
      panel.remove();
      delete window[KEY];
    }
  };

  const steps = el("ol", "margin:0 0 12px;padding-left:20px;font-size:13px;", {},
    ...[
      "Click Email and choose Create Masked Email.",
      "Enter the site's password in both password fields (your current one, or a new one from 1Password) and press Register.",
      "When 1Password asks, update your existing login or save a new one.",
      "Copy the email, close this panel, and paste it into the site's real form.",
    ].map(text => el("li", "display:list-item;list-style:decimal;margin-bottom:4px;font-size:13px;",
      { textContent: text })));

  const warning = extensionsBlocked && el("p",
    "margin:0 0 12px;padding:8px;background:#fff3cd;border:1px solid #c69500;border-radius:4px;font-size:13px;",
    { textContent: "Firefox blocks all extensions, including 1Password, on this site. " +
      "Open this page in another browser (Safari, Chrome, Edge) and run the helper there." });

  const panel = el("div", `
    position:fixed;top:20px;left:20px;z-index:2147483647;
    width:360px;max-width:calc(100vw - 40px);max-height:calc(100vh - 40px);overflow:auto;
    padding:20px;background:#fff;border:2px solid #555;border-radius:8px;
    box-shadow:0 8px 24px rgba(0,0,0,.25);color-scheme:light;
  `, { id: prefix },
    el("h2", "margin:0;font-size:20px;font-weight:700;", { textContent: "Registration" }),
    el("p", "margin:0 0 12px;font-size:12px;color:#555;",
      { textContent: "remask: this form is never sent." }),
    ...(warning ? [warning] : []),
    steps,
    form,
    status,
    el("button", BUTTON, { type: "button", textContent: "Copy email", onclick: copy }),
    el("button", BUTTON, { type: "button", textContent: "Copy & close",
      onclick: async () => { if (await copy()) close(); } }),
    el("button", BUTTON, { type: "button", textContent: "Close", onclick: close }),
  );

  try {
    history.replaceState(original.state, "", fakeURL);
    window[KEY] = { close };
    document.body.append(panel);
    email.focus();
  } catch (error) {
    close();
    throw error;
  }
})();
