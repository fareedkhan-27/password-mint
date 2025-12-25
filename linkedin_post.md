# LinkedIn Post Templates for Password Mint

## Short Version (Recommended for Engagement)

---

**Password reuse is the #1 reason accounts get hacked.**

Here's the uncomfortable truth: if you use the same password on multiple sites, you're one data breach away from losing everything.

I built something to help.

**Password Mint** is a free, open-source tool that:
- Generates unique, strong passwords for every site
- Works 100% offline — nothing stored, nothing sent
- Uses your secret phrase + site name to regenerate passwords anytime
- No account needed. No data collection. Just math.

How it works: Enter your master phrase + "amazon" = unique Amazon password. Enter the same phrase + "gmail" = completely different Gmail password. Same inputs always give the same output.

**Bonus:** Phrase hardening means "My Phrase" and "my phrase" produce the same password — we normalize and transform your input for consistency.

**Important caveat:** Phrase hardening does NOT make a weak phrase strong. Never use your birthday, name, pet's name, song lyrics, or common phrases. Choose something random like "purple elephant dances tuesday" — 4+ unrelated words that only you would think of.

This holiday season, I wanted to give something useful to my network.

Try it: [LINK]

Feedback welcome. Happy holidays.

---

## Medium Version (More Technical Context)

---

**81% of data breaches involve stolen or weak passwords.**

Yet most people still reuse passwords across sites. I get it — who can remember 50+ unique passwords?

Password managers are great, but they require trust in a third party. What if there was a simpler option for certain use cases?

**Introducing Password Mint** — a privacy-first password generator I built as a gift to my network this holiday season.

**What it does:**
- Generates unique, cryptographically strong passwords for each site
- Uses PBKDF2-SHA256 with 210,000+ iterations (OWASP recommended)
- Works 100% offline — nothing stored, nothing transmitted
- Regenerate any password anytime with the same inputs

**How it works:**
Your secret master phrase + site name + version number = unique password
Same inputs → same output, always.

**User-friendly features:**
- **Phrase hardening**: "My Phrase" and "my phrase" produce the same result (normalization + deterministic transformation)
- Extra spaces? Collapsed automatically
- Site normalization: "GitHub.com" and "github" produce the same result

**What it's NOT:**
- Not a password manager (no storage, no sync)
- Not using personal info (no DOB, no names, no "clever" patterns)
- Not connected to any server

**Key security notes:**
1. Use 4+ random words (e.g., "purple elephant dances tuesday")
2. Never use personal info, song lyrics, famous quotes, or common phrases
3. Phrase hardening improves consistency, but does NOT strengthen weak phrases
4. If your phrase is compromised, all passwords are at risk
5. For maximum security, still consider a full password manager

**Technical details for the curious:**
- Pure JavaScript, Web Crypto API only
- No external dependencies or CDNs
- MIT licensed, source available
- Phrase hardening (deterministic transformation): normalization → deterministic capitalization → deterministic suffix
- Site normalization: lowercase, remove protocol/www/path
- Salt = "password-mint::v1::" + normalized_site + "::" + version

This isn't meant to replace your password manager. Think of it as a lightweight alternative for lower-risk accounts, or a learning tool for understanding deterministic password generation.

Try it here: [LINK]

I'd love your feedback — especially from security folks. What would you improve?

Happy holidays to this incredible community.

---

## Alternate Hook Lines

1. "I stopped using the same password everywhere. Here's what I built instead."

2. "What if you could regenerate any password without storing it anywhere?"

3. "The average person has 100+ online accounts. How many unique passwords do you actually use?"

4. "No password manager? No problem. There's another way."

5. "I built a password tool that stores nothing. Here's why that matters."

---

## Hashtags

### Primary (Use 3-5)
#cybersecurity
#infosec
#passwordsecurity
#privacy
#opensource

### Secondary (Mix in 2-3)
#webdevelopment
#javascript
#security
#techforgood
#producthunt

### Seasonal
#holidaygift
#christmasgift

---

## Call-to-Action Options

1. "Try it and let me know what you think: [LINK]"

2. "Feedback from security professionals especially welcome: [LINK]"

3. "Clone it, fork it, improve it — it's open source: [LINK]"

4. "Want to see the source? It's all in one HTML file: [LINK]"

5. "Questions? Happy to explain the crypto in the comments."

---

## Important Reminders for Your Post

1. **Do NOT claim this replaces password managers** — position it as a lightweight alternative or learning tool

2. **Emphasize the security warning**: Master phrase must not contain personal info

3. **Be honest about limitations**: No recovery if phrase is forgotten, no storage = no convenience features

4. **Invite feedback**: Security community engagement builds credibility

5. **Keep the holiday tone genuine**: Gift framing works, but don't be salesy

---

## Sample Comment Responses

**Q: "How is this different from a password manager?"**

A: Great question! Password managers store encrypted passwords and sync them across devices. Password Mint stores nothing — it regenerates passwords on demand using math. Trade-off: more private, but less convenient. For high-value accounts, I still recommend a full password manager. This is a lighter option for certain use cases.

**Q: "What if I forget my master phrase?"**

A: There's no recovery option. If you forget your master phrase, you'd need to reset passwords on each site. This is the trade-off of storing nothing. For critical accounts, a password manager with recovery options is safer.

**Q: "Is this secure?"**

A: It uses PBKDF2-SHA256 with 210,000 iterations (OWASP recommended), all running locally in your browser via the Web Crypto API. The security depends heavily on your master phrase being strong and secret. Check the security.md file in the repo for the full threat model.

---

## Holiday-Themed Intro (Optional)

"This holiday season, I wanted to give something back to my network. Not a discount code. Not a newsletter signup. Just a useful tool that respects your privacy."
