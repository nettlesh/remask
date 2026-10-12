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
  const site = location.hostname.replace(/^www\./, "");
  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘\\" : "Ctrl+\\";

  // Colors match Firefox's own panels and follow the browser's light/dark setting.
  const THEMES = {
    light: {
      bg: "#fff", fg: "#15141a", muted: "#5b5b66", border: "#e0e0e6",
      field: "#fff", "field-border": "#8f8f9d", chip: "#f0f0f4", "chip-hover": "#e0e0e6",
      accent: "#0061e0", "accent-hover": "#0250bb", "on-accent": "#fff",
      "warn-bg": "#fff4de", "warn-fg": "#5a3a00", shadow: "rgba(0,0,0,.15)",
    },
    dark: {
      bg: "#2b2a33", fg: "#fbfbfe", muted: "#bfbfc9", border: "#52525e",
      field: "#1c1b22", "field-border": "#8f8f9d", chip: "#3a3944", "chip-hover": "#52525e",
      accent: "#00ddff", "accent-hover": "#80ebff", "on-accent": "#15141a",
      "warn-bg": "#5a3a00", "warn-fg": "#ffe8b0", shadow: "rgba(0,0,0,.5)",
    },
  };

  // Elements are built with the DOM API and styled through CSSOM so the panel
  // works on sites with strict Content-Security-Policy or Trusted Types.
  // `all:initial` keeps the page's own CSS from restyling the panel. Colors
  // come from --rm-* properties set on the panel, which `all` doesn't reset.
  const BASE = "all:initial;box-sizing:border-box;display:block;color-scheme:inherit;" +
    "font:13px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--rm-fg);";
  const el = (tag, css, props = {}, ...children) => {
    const node = Object.assign(document.createElement(tag), props);
    node.style.cssText = BASE + css;
    node.append(...children);
    return node;
  };
  // Inline styles can't use :hover or :focus, so repaint from events instead.
  const interactive = (tag, css, { hover = "", focus = "" }, props, ...children) => {
    const node = el(tag, css, props, ...children);
    let hovered = false, focused = false;
    const paint = () => node.style.cssText = BASE + css + (hovered ? hover : "") + (focused ? focus : "");
    node.addEventListener("mouseenter", () => { hovered = true; paint(); });
    node.addEventListener("mouseleave", () => { hovered = false; paint(); });
    node.addEventListener("focus", () => { focused = node.matches(":focus-visible"); paint(); });
    node.addEventListener("blur", () => { focused = false; paint(); });
    return node;
  };
  const show = (node, visible) => node.style.display = visible ? "block" : "none";

  // No `all:initial` here: in some browsers it would also reset the path data.
  const STROKE = "fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;";
  const FILL = "fill:currentColor;fill-rule:evenodd;stroke:none;";
  const icon = (size, { box = 24, filled = false, paths }) => {
    const ns = "http://www.w3.org/2000/svg";
    const style = filled ? FILL : STROKE;
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${box} ${box}`);
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = `display:block;flex:none;width:${size}px;height:${size}px;margin:0;` + style;
    for (const d of paths) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      path.style.cssText = style;
      svg.append(path);
    }
    return svg;
  };
  const ICONS = {
    // Same mask as assets/remask.svg.
    mask: { box: 16, filled: true, paths: [
      "M1 6.6C1 4.9 2.3 4 4.1 4c1.6 0 2.7.7 3.9.7S10.3 4 11.9 4C13.7 4 15 4.9 15 6.6c0 3.1-1.8 5.4-3.8 5.4-1.4 0-2.1-1.2-3.2-1.2s-1.8 1.2-3.2 1.2C2.8 12 1 9.7 1 6.6Z" +
      "M3.3 7.5c.4-.8 1.1-1.3 2-1.3.8 0 1.4.4 1.6 1.2-.5.6-1.2.9-2 .9-.6 0-1.2-.3-1.6-.8Z" +
      "M12.7 7.5c-.4-.8-1.1-1.3-2-1.3-.8 0-1.4.4-1.6 1.2.5.6 1.2.9 2 .9.6 0 1.2-.3 1.6-.8Z",
    ] },
    help: { paths: [
      "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
      "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.3",
      "M12 17h.01",
    ] },
    close: { paths: ["M18 6 6 18", "M6 6l12 12"] },
  };

  const FOCUS = "outline:2px solid var(--rm-accent);outline-offset:1px;";
  const iconButton = (label, glyph, onclick) => interactive("button",
    "display:flex;align-items:center;justify-content:center;width:26px;height:26px;" +
    "border-radius:6px;color:var(--rm-muted);cursor:pointer;",
    { hover: "background:var(--rm-chip);color:var(--rm-fg);", focus: FOCUS },
    { type: "button", title: label, ariaLabel: label, onclick }, icon(20, glyph));
  const button = (text, primary, props) => interactive("button",
    "display:inline-block;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;" +
    (primary ? "background:var(--rm-accent);color:var(--rm-on-accent);" : "background:var(--rm-chip);"),
    { hover: primary ? "background:var(--rm-accent-hover);" : "background:var(--rm-chip-hover);", focus: FOCUS },
    { type: primary ? "submit" : "button", textContent: text, ...props });

  const INPUT = "width:100%;height:32px;padding:0 8px;border:1px solid var(--rm-field-border);" +
    "border-radius:6px;background:var(--rm-field);cursor:text;" +
    `font-size:${matchMedia("(pointer: coarse)").matches ? 16 : 13}px;`;
  const field = (label, id, props) => {
    const input = interactive("input", INPUT,
      { focus: "border-color:var(--rm-accent);box-shadow:0 0 0 1px var(--rm-accent);" },
      { id: fieldID(id), required: true, ...props });
    return [el("label", "margin:10px 0 4px;font-size:12px;color:var(--rm-muted);",
      { htmlFor: input.id, textContent: label }), input];
  };
  const [emailLabel, email] = field("Email", "email",
    { name: "email", type: "email", autocomplete: "email" });
  // Required so Register can't offer to update the saved login with a blank password.
  const [passwordLabel, password] = field("Password", "password",
    { name: "password", type: "password", autocomplete: "new-password" });

  const status = el("p", "display:none;margin:10px 0 0;font-size:12px;color:var(--rm-muted);",
    { role: "status" });
  const say = text => { status.textContent = text; show(status, true); };

  const copy = async () => {
    if (!email.value) return say("Create a Masked Email from the Email field first.");
    try {
      await navigator.clipboard.writeText(email.value);
    } catch {
      email.select();
      document.execCommand("copy");
    }
    say(`Copied. Paste it into ${site}'s email settings.`);
  };

  const dark = matchMedia("(prefers-color-scheme: dark)");
  const paintTheme = () => {
    for (const [name, value] of Object.entries(THEMES[dark.matches ? "dark" : "light"])) {
      panel.style.setProperty(`--rm-${name}`, value);
    }
    panel.style.colorScheme = dark.matches ? "dark" : "light";
  };

  const close = () => {
    try {
      // Leave the URL alone if the site has navigated since we changed it.
      if (location.href === fakeURL) history.replaceState(original.state, "", original.url);
    } finally {
      dark.removeEventListener("change", paintTheme);
      panel.remove();
      delete window[KEY];
    }
  };

  const kbd = text => el("kbd", "display:inline;padding:0 4px;border:1px solid var(--rm-border);" +
    "border-radius:4px;font:11px/1.6 ui-monospace,monospace;color:var(--rm-fg);", { textContent: text });
  const step = (...content) => el("li",
    "display:list-item;list-style:decimal;margin:0 0 2px;font-size:12px;color:var(--rm-muted);", {}, ...content);
  const help = el("ol", "display:none;margin:10px 0 0;padding:8px 10px 8px 28px;" +
    "border-radius:6px;background:var(--rm-chip);", {},
    step("Press ", kbd(shortcut), " to fill your password, or generate one for a new account."),
    step("Click Email, then choose Create Masked Email."),
    step("Press Register, then choose Update or Save in 1Password."),
    step("Copy the email and paste it into the site's form."));

  const warning = extensionsBlocked && el("p", "margin:10px 0 0;padding:8px 10px;border-radius:6px;" +
    "font-size:12px;background:var(--rm-warn-bg);color:var(--rm-warn-fg);",
    { textContent: "Firefox blocks all extensions, including 1Password, on this site. " +
      "Open it in Safari, Chrome, or Edge instead." });

  const header = el("div", "display:flex;align-items:center;gap:6px;", {},
    el("span", "display:flex;color:var(--rm-accent);", {}, icon(20, ICONS.mask)),
    el("span", "font-weight:600;", { textContent: "remask" }),
    el("span", "flex:1;"),
    el("div", "display:flex;margin:-4px -6px -4px 0;", {},
      iconButton("Show steps", ICONS.help, () => show(help, help.style.display === "none")),
      iconButton("Close", ICONS.close, close)));

  const form = el("form", "", { action: "/submit", method: "post" },
    emailLabel, email, passwordLabel, password, status,
    el("div", "display:flex;justify-content:space-between;align-items:center;gap:8px;" +
      "margin:12px -12px 0;padding:10px 12px 0;border-top:1px solid var(--rm-border);", {},
      button("Copy email", false, { onclick: copy }), button("Register", true)));

  // Capture phase on the form: 1Password's document-level listeners still see
  // the submit, but the page's own handlers and the real navigation never do.
  form.addEventListener("submit", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    say("Not sent anywhere. Choose Update or Save in 1Password.");
  }, true);

  // Top left keeps clear of 1Password's save prompt, which opens top right.
  const panel = el("div", "position:fixed;top:16px;left:16px;z-index:2147483647;" +
    "width:300px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;" +
    "padding:12px;border:1px solid var(--rm-border);border-radius:10px;background:var(--rm-bg);" +
    "box-shadow:0 8px 24px var(--rm-shadow);", { id: prefix },
    header,
    el("h2", "margin:2px 0 0;font-size:12px;font-weight:400;color:var(--rm-muted);" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;", { textContent: `Register on ${site}` }),
    ...(warning ? [warning] : []),
    help,
    form);

  try {
    paintTheme();
    dark.addEventListener("change", paintTheme);
    history.replaceState(original.state, "", fakeURL);
    window[KEY] = { close };
    document.body.append(panel);
    // Autofill comes first; filling after the Masked Email would overwrite it.
    password.focus();
  } catch (error) {
    close();
    throw error;
  }
})();
