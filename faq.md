# Frequently Asked Questions

## General

### What is Password Mint?

Password Mint is a privacy-first password generator that creates unique, strong passwords for each site you use. Instead of storing passwords, it *derives* them mathematically from your master phrase and the site name — meaning you can regenerate any password anytime, without storing anything.

### Is this a password manager?

No. Password managers store your passwords (encrypted) and sync them across devices. Password Mint stores nothing — it generates passwords on demand. Think of it as a mathematical recipe rather than a vault.

### Can you recover my passwords?

No. We have no servers, no accounts, and no way to contact you. We don't know your master phrase, and we can't help you recover it. If you forget your master phrase, you'll need to reset your passwords on each site manually.

### Why should I trust this?

You don't have to trust anyone — that's the point. The code runs entirely in your browser, makes no network requests, and stores nothing. You can:
1. View the source code (it's all in `app.js`)
2. Use it offline (download and disconnect)
3. Audit it yourself or have a security professional review it

---

## Security

### How secure is this?

Password Mint uses PBKDF2-SHA256 with 210,000+ iterations, which meets OWASP's 2023 recommendations. The security depends on:
- **Your master phrase strength**: Longer and more random = more secure
- **Your device security**: Keyloggers or malware would compromise any password tool
- **Your behavior**: Don't share your master phrase or use it elsewhere

### What if someone learns my master phrase?

This is the main risk. If your master phrase is compromised, an attacker could generate all your passwords (if they know which sites and versions you use). This is why:
1. Your master phrase should be long and unique
2. You should never reuse it anywhere else
3. For critical accounts, consider a full password manager with 2FA

### Is PBKDF2 secure enough?

PBKDF2 with 210,000 iterations for SHA-256 is the OWASP-recommended minimum as of 2023. It's well-studied and widely trusted. While Argon2 is theoretically stronger (memory-hard), it requires external libraries. We prioritized zero dependencies and browser-native crypto.

### Can someone reverse-engineer my master phrase from a password?

Not practically. PBKDF2 is a one-way function — you can go from phrase to password, but not from password to phrase. Brute-forcing would require trying every possible phrase, which is computationally infeasible with a strong master phrase.

### What about the "modulo bias" issue?

When mapping random bytes to characters, using modulo can introduce slight bias. For example, if you have 256 byte values and 26 letters, some letters appear slightly more often. However:
1. The bias is tiny for typical character pools (< 100 chars)
2. The high entropy from PBKDF2 (512 bits) makes this negligible
3. For password generation, this level of bias is acceptable

---

## Usage

### What should my master phrase be?

Your master phrase should be:
- **4+ random words**: Random words work best (e.g., "purple elephant dances tuesday")
- **Not personal**: Avoid birthdays, names, pet names, addresses
- **Not common**: Avoid song lyrics, famous quotes, movie lines, or common phrases
- **Unique**: Never used anywhere else
- **Memorable to you**: You need to remember the words, not exact typing

Example good phrases:
- `coffee sunset mountain bicycle`
- `happy penguin eats tacos`
- `keyboard river thirteen clouds`

**About phrase hardening**: The app applies phrase hardening (normalization + deterministic transformation), so "My Phrase" and "my phrase" produce the same password. However, phrase hardening does NOT make a weak phrase strong — you must still choose a strong, unique phrase.

### Does capitalization matter for my master phrase?

No! The app applies **phrase hardening (deterministic transformation)** which includes normalization. These all produce the **same password**:
- `my secret phrase`
- `My Secret Phrase`
- `MY SECRET PHRASE`
- `  my   secret   phrase  ` (extra spaces)

Internally, all of these are first normalized to `my secret phrase`, then deterministically transformed (capitalization added, suffix appended) before being fed to PBKDF2. This makes it easier to type on different devices without worrying about exact formatting.

**Important**: Phrase hardening improves consistency, but it does NOT make a weak phrase strong. Still choose a strong, unique phrase.

### What if I type the wrong site name?

**Site normalization** is applied automatically:
- `GITHUB.COM` → `github.com`
- `https://www.github.com/settings` → `github.com`
- `GitHub` → `github`

But if you type `guthub` instead of `github`, you'll get a different password. Site normalization handles case and URL formatting, but NOT typos. Always double-check the site name.

### How do I change a password for a site?

Increment the **Version** field:
1. Enter the site name and master phrase
2. Change Version from `1` to `2`
3. Generate the new password
4. Update the password on that site
5. Remember the new version number

### Do I need to remember version numbers?

Yes, if you've ever changed a password by incrementing the version. Most sites will be version 1. You could keep version numbers in a note (without your master phrase) or in a password manager's notes field.

### Can I use this on my phone?

Yes! Password Mint is a responsive web page. Open it in your mobile browser. You can also save it as a home screen shortcut for quick access (iOS: Share → Add to Home Screen; Android: Menu → Add to Home Screen).

---

## Privacy

### Does this send my data anywhere?

No. Zero network requests. You can verify by:
1. Opening browser developer tools (F12)
2. Going to the Network tab
3. Using Password Mint
4. Observing: no network activity

### Does this use cookies?

No. No cookies, no localStorage, no sessionStorage, no IndexedDB.

### Does this track me?

No. No analytics, no tracking pixels, no fingerprinting, no telemetry.

### Can I use this offline?

Yes! Download the files, disconnect from the internet, and use it. It works identically online or offline.

---

## Technical

### What's the algorithm?

1. **Site normalization**: Lowercase, remove protocol (http/https), remove www., remove path/query/fragment/port
2. **Phrase hardening (deterministic transformation)**:
   - Normalize: trim, lowercase, collapse multiple spaces
   - Deterministically capitalize 1-2 words based on phrase content
   - Append deterministic suffix (symbol + digit + symbol)
3. **Salt construction**: `password-mint::v1::` + normalized_site + `::` + version
4. **Key derivation**: PBKDF2(hardened_phrase, salt, 210,000+ iterations, SHA-256) → 64 bytes
5. **Password generation**: Map bytes to characters, ensuring at least one from each selected type
6. **Shuffle**: Deterministically shuffle positions based on derived bytes
7. **Output**: Final password of requested length

### Why 64 bytes of derived key material?

64 bytes (512 bits) provides ample entropy for password generation. Even for a 64-character password with a 94-character pool, you only need ~410 bits of entropy. 512 bits gives us headroom.

### Why not Argon2?

Argon2 is theoretically better (memory-hard, resistant to GPU attacks), but it requires a JavaScript library like libsodium-wrappers. We prioritized:
1. Zero external dependencies
2. Browser-native crypto (Web Crypto API)
3. No build step required

PBKDF2 with high iterations is still considered secure and is OWASP-recommended.

### What browsers are supported?

Any browser with Web Crypto API support:
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+
- Opera 24+

Internet Explorer is not supported.

---

## Troubleshooting

### The password is different from last time!

Check:
1. **Master phrase**: Same words? (Due to phrase hardening, capitalization and extra spaces don't matter, but the actual words must be identical!)
2. **Site name**: Exactly the same spelling? (Site normalization handles case/URL format, but NOT typos)
3. **Version**: Same number?
4. **Character options**: Same toggles enabled?
5. **Length**: Same value?

Note: Phrase hardening ensures "My Phrase" and "my phrase" produce the same result. But "my phrase" and "my phrases" (different words) produce different passwords — the words themselves must match.

### The Generate button doesn't work

Check if your browser supports Web Crypto API. Try a modern browser like Chrome or Firefox. If you see an error message, it may explain the issue.

### I forgot my master phrase

Unfortunately, there's no recovery option. You'll need to reset passwords on each site. This is the trade-off of a zero-storage design.

---

## Philosophy

### Why did you build this?

1. Password reuse is a massive security problem
2. Not everyone wants or can use a password manager
3. Privacy-first tools are important
4. Open-source alternatives should exist

### Should I stop using my password manager?

No! Password managers are more feature-rich (autofill, sync, 2FA codes, secure notes). Password Mint is a lightweight alternative or supplement — not a replacement.

### Is this production-ready?

The code is simple, auditable, and uses standard crypto primitives. However:
- It's provided as-is, without warranty
- You should review the code if using for sensitive accounts
- For critical systems, consult a security professional

---

## Contact

For questions, open an issue on GitHub or email [fareedkhan27@gmail.com](mailto:fareedkhan27@gmail.com).

For security vulnerabilities, please email directly rather than opening a public issue.
