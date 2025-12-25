# Password Mint

> A privacy-first, offline password generator that creates unique strong passwords per site — regenerable anytime using your private master phrase. Nothing is stored or sent anywhere.

## What It Is

Password Mint is a **deterministic password generator** that runs entirely in your browser. Instead of storing passwords, it *derives* them mathematically from:

- Your **master phrase** (a secret only you know)
- The **site/app name** (normalized automatically)
- A **version number** (for password rotation)

The same inputs will always produce the same password. This means you can regenerate any password anytime, on any device, without syncing or storing anything.

## Features

- **100% Offline** — Works without internet, no server calls ever
- **Privacy-First** — No data stored by default, no tracking, no analytics
- **Deterministic** — Same inputs = same password, every time
- **Cryptographically Secure** — Uses WebCrypto PBKDF2 with 210,000+ iterations
- **Customizable** — Adjust length (12-64), character types, security level
- **Password Rotation** — Increment version number to generate new passwords
- **Auto-Clear** — Passwords clear from screen after 5 minutes of inactivity

## How It Works

### Non-Technical Version

Think of Password Mint like a secret recipe. You provide three ingredients:
1. Your master phrase (the secret ingredient)
2. The site name (like "google" or "amazon")
3. A version number (usually 1)

Password Mint mixes these ingredients using advanced mathematics to produce a unique, strong password. The same ingredients always make the same password — so you can regenerate it anytime without storing it anywhere.

### Technical Version

1. **Site Normalization**: The input site is cleaned up:
   - Trimmed, lowercased
   - Protocol removed (http/https), www. removed
   - Path, query, fragment, port removed
   - Only hostname kept (e.g., `https://mail.google.com/inbox` → `mail.google.com`)
   - Simple names kept as-is (e.g., `Apple` → `apple`)

2. **Phrase Hardening (Deterministic Transformation)**: Your master phrase undergoes a deterministic transformation:
   - **Normalization**: Trimmed, lowercased, multiple spaces collapsed to single space
   - **Deterministic capitalization**: 1-2 words are capitalized based on a seed derived from the normalized phrase
   - **Deterministic suffix**: A symbol + digit + symbol sequence is appended
   - Example: `my iphone purchase` → `my IPHONE purchase!7@`
   - This means "My Phrase" and "my phrase" produce the **same** hardened output
   - **Important**: Phrase hardening improves consistency but does NOT make a weak phrase strong. Choose a strong, unique phrase — avoid common phrases, lyrics, or personal info.

3. **Salt Construction**: A unique salt is created for domain separation:
   ```
   salt = "password-mint::v1::" + normalized_site + "::" + version
   ```

4. **Key Derivation**: PBKDF2 with the following parameters:
   - Hardened phrase as input key material
   - Salt as described above
   - SHA-256 hash algorithm
   - 210,000 iterations (Standard) or 400,000 iterations (High)
   - 64 bytes (512 bits) output

5. **Password Generation**:
   - Character pools built based on user toggles
   - At least one character guaranteed from each selected type
   - Positions shuffled deterministically using derived bytes
   - Final password is exactly the requested length

6. **Bias Note**: Character selection uses modulo mapping on derived bytes. For typical character pool sizes (< 100 chars), the bias is negligible given the high entropy of PBKDF2 output.

## Quick Start

### Local Usage

Simply open `index.html` in any modern browser. No build step, no dependencies, no server required.

```bash
# Clone the repository
git clone https://github.com/yourusername/password-mint.git

# Open in browser
open index.html
# or on Windows:
start index.html
```

### Deploy to GitHub Pages

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/password-mint.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main** branch and **/ (root)** folder
   - Click **Save**
   - Your site will be live at `https://yourusername.github.io/password-mint/`

### Deploy to Vercel

1. **Push to GitHub** (if not already done)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click **New Project**
   - Import your `password-mint` repository
   - Framework Preset: **Other** (it's static HTML)
   - Click **Deploy**
   - Your site will be live at `https://password-mint.vercel.app`

3. **Alternative: Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

### Deploy to Netlify

1. **Drag and Drop**:
   - Go to [netlify.com](https://netlify.com)
   - Drag the project folder onto the deploy zone
   - Done!

2. **Or via Git**:
   - Connect your GitHub repository
   - Deploy settings: leave defaults (no build command needed)

## Security Model

### What It Protects Against

- **Password reuse attacks** — Each site gets a unique password
- **Database breaches** — Leaked passwords can't be used elsewhere
- **Reverse engineering** — Cannot derive master phrase from generated password
- **Clipboard history** — Optional auto-clear after 5 minutes

### What It Does NOT Protect Against

- **Compromised devices** — Keyloggers, malware, or someone watching your screen
- **Master phrase theft** — If someone learns your phrase, they can generate all passwords
- **Shoulder surfing** — Someone seeing you type your master phrase
- **Phishing** — The site normalization helps, but verify you're on the right site

### Limitations

- **No recovery** — If you forget your master phrase, passwords cannot be recovered
- **Deterministic** — Changing your master phrase changes ALL passwords
- **No storage** — You must remember your master phrase

See [security.md](security.md) for the full threat model.

## Password Rotation

If a password is compromised or you need to change it:

1. Increment the **Version** field (1 → 2 → 3...)
2. Generate the new password
3. Update the password on the site
4. Remember the version number for that site

The version number is part of the salt, so even a small change produces a completely different password.

## Browser Support

Password Mint requires a browser with Web Crypto API support:

- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+
- Opera 24+

All modern browsers are supported. Internet Explorer is not supported.

## File Structure

```
password-mint/
├── index.html      # Main application
├── styles.css      # Styling
├── app.js          # Application logic
├── README.md       # This file
├── LICENSE         # MIT License
├── security.md     # Threat model
├── faq.md          # Frequently asked questions
└── linkedin_post.md # Social media content
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For security issues, please email directly rather than opening a public issue.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Credits

Built with care as a gift to the internet.

---

**Remember**: Your master phrase is the key to everything. Choose 4+ random words (e.g., "purple elephant dances tuesday"). Phrase hardening ensures consistent results regardless of capitalization or spacing, but it does NOT strengthen a weak phrase. Avoid common phrases, song lyrics, quotes, or personal info (names, birthdays). Don't reuse your master phrase anywhere else.
