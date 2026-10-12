<img src="assets/remask.svg" width="64" height="64" alt="">

# remask

A bookmarklet that gets 1Password to offer **Create Masked Email** (Fastmail) on any site.

1Password only offers Masked Emails on pages it recognizes as sign-up forms. That rules
out change-email pages on accounts you already have, and sign-up forms it fails to
detect. remask adds a registration form to the page you're on, so 1Password creates the
Masked Email for that site. The right website is saved in both 1Password and Fastmail,
and the login item is linked to the Masked Email.

## Install

Open **https://nettlesh.github.io/remask/** and drag **remask** to your bookmarks bar.

On iPhone or iPad, tap **Copy bookmarklet URL**, bookmark any page, then edit the
bookmark and paste the URL as its address.

## Use

1. On the site you want a Masked Email for, click the bookmark.
2. Fill the password: press **⌘\\** (**Ctrl+\\** on Windows) or use **Autofill** in the
   1Password toolbar. For a new account, generate a password instead. Do this before the
   next step, because autofill also fills your old email address.
3. Click **Email** and choose **Create Masked Email**.
4. Press **Register**, then choose **Update** (existing login) or **Save** (new login)
   in 1Password.
5. Press **Copy & close** and paste the address into the site's real form.

The form is never sent anywhere; it only exists in your tab. While it's open, the
address bar shows `/registration` so 1Password treats the page as a sign-up. Close the
form before reloading the page.

## Toolbar icon (Zen and Firefox)

Bookmarklets always get the browser's default icon. In Zen or Firefox, you can give
remask its own:

1. In `about:config`, set `toolkit.legacyUserProfileCustomizations.stylesheets` to `true`.
2. In `about:support`, click the button next to **Profile Folder** to open it.
3. In that folder, open the `chrome` folder (create it if it's missing) and copy the
   contents of [`assets/userChrome.css`](assets/userChrome.css) into `userChrome.css`
   there, creating the file if needed.
4. Restart the browser.

The rule looks for a bookmark named **remask**, so keep that name. Chrome, Edge, and
Safari don't support custom bookmark icons.

## Troubleshooting

- **No 1Password menu on Mozilla sites in Firefox or Zen.** Firefox blocks all
  extensions on a few Mozilla domains, such as accounts.firefox.com. Use Safari, Chrome,
  or Edge for those.
- **No Create Masked Email option.** Check that Fastmail is still connected to
  1Password. Fastmail also limits how many Masked Emails you can create per day.

## License

[MIT](LICENSE)
