# Security Model

This document describes the security model, threat landscape, and limitations of Password Mint.

## Overview

Password Mint is a **client-side deterministic password generator**. It uses cryptographic key derivation to produce unique passwords from a master phrase, site name, and version number.

## Cryptographic Design

### Phrase Hardening (Deterministic Transformation)

Before any cryptographic operations, user input undergoes deterministic transformation:

1. **Normalization**: Trim leading/trailing whitespace, lowercase, collapse multiple spaces to single space
2. **Deterministic Capitalization**: 1-2 words are capitalized based on a seed derived from the normalized phrase (using djb2 hash variant)
3. **Deterministic Suffix**: Symbol + digit + symbol appended (selected based on the same seed)

This provides:
- **Consistency**: "My Phrase" and "my phrase" produce the same hardened output
- **Added complexity**: The hardened form includes mixed case and symbols even if user typed lowercase
- **Defense in depth**: Attackers need both the phrase AND the exact algorithm

Example: `my iphone purchase` → `my IPHONE purchase!7@`

**Critical Warning**: Phrase hardening improves consistency and adds superficial complexity, but it does NOT make a weak phrase strong. If you use a common phrase like "i love you" or "password123", the hardened version is still easily guessable. You must choose a strong, unique master phrase — avoid common phrases, song lyrics, quotes, or personal info.

### Algorithm: PBKDF2-SHA256

- **Hash Function**: SHA-256 (via Web Crypto API)
- **Iterations**:
  - Standard: 210,000 (per OWASP 2023 recommendation for SHA-256)
  - High: 400,000 (for users wanting extra security)
- **Output Length**: 64 bytes (512 bits)
- **Salt**: Constructed as `password-mint::v1::{normalized_site}::{version}`
- **Input**: Hardened phrase (not raw user input)

### Why PBKDF2?

PBKDF2 is chosen because:
1. **Browser Native**: Available in all modern browsers via Web Crypto API
2. **No Dependencies**: Works without external libraries
3. **Well-Studied**: Decades of cryptographic analysis
4. **OWASP Recommended**: Meets current security standards with sufficient iterations

**Trade-off Note**: Argon2 would be preferable for its memory-hardness, but it requires external libraries (like libsodium-wrappers), which conflicts with the "no external dependencies" requirement.

### Why 210,000 Iterations?

This number comes from OWASP's 2023 Password Storage Cheat Sheet, which recommends:
- SHA-256: 210,000 iterations minimum
- SHA-512: 120,000 iterations minimum

Higher iterations = slower brute force attacks, but also slower generation. The "High" option (400,000) nearly doubles the security margin for those willing to wait.

### Salt Construction

The salt includes:
1. **Fixed prefix** (`password-mint::v1::`): Domain separation, prevents cross-protocol attacks
2. **Normalized site**: Ensures consistent derivation across URL formats
3. **Version**: Enables password rotation without changing master phrase

Example: `password-mint::v1::github.com::1`

## Threat Model

### What Password Mint Protects Against

| Threat | Protection |
|--------|------------|
| **Password reuse** | Each site gets a unique, unrelated password |
| **Database breaches** | Compromised password from Site A reveals nothing about Site B |
| **Rainbow tables** | Salt includes site name, making precomputed tables impractical |
| **Clipboard exposure** | Auto-clear after 5 minutes; minimal screen time |
| **Server compromise** | No server exists to compromise |
| **Transit interception** | No network requests, nothing to intercept |
| **Tracking/profiling** | No analytics, no storage, no fingerprinting |

### What Password Mint Does NOT Protect Against

| Threat | Why |
|--------|-----|
| **Master phrase compromise** | If attacker knows your phrase, they can regenerate all passwords |
| **Keyloggers/malware** | If device is compromised, everything typed is exposed |
| **Shoulder surfing** | Someone watching you type sees your master phrase |
| **Phishing** | If you enter credentials on a fake site, they're stolen |
| **Weak master phrase** | Short or common phrases can be brute-forced offline |
| **Physical device access** | Remembered phrase (if enabled) stays in memory until tab closes |
| **Memory forensics** | JavaScript variables may persist in browser memory |

### Partial Protections

| Threat | Mitigation | Limitation |
|--------|------------|------------|
| **URL confusion** | Site normalization | Won't help if you mistype the site |
| **Version tracking** | You must remember version numbers | No built-in version storage |

## Storage Stance

Password Mint stores **nothing by default**:

- No cookies
- No localStorage
- No sessionStorage
- No IndexedDB
- No file system access
- No server storage

### Optional "Remember" Feature

If enabled, the master phrase is held **only in JavaScript memory** until:
- User clicks "Forget Now"
- User clicks "Clear All"
- Browser tab is closed

**Warning**: This trades convenience for security. Use only on trusted devices.

## Offline Stance

Password Mint is **fully offline-capable**:

- No CDN resources
- No external fonts
- No analytics scripts
- No API calls
- No telemetry

You can:
1. Download the HTML file
2. Disconnect from the internet
3. Use it completely offline

The tool will work identically online or offline.

## Attack Scenarios

### Scenario 1: Site Database Breach

**Setup**: You use Password Mint for Site A and Site B. Site A's database is breached.

**Outcome**: Attackers get your Site A password. They cannot:
- Use it on Site B (passwords are different)
- Derive your master phrase (PBKDF2 is one-way)
- Generate your Site B password (requires master phrase)

**Action**: Change Site A password by incrementing version to 2.

### Scenario 2: Attacker Knows Site Name

**Setup**: Attacker knows you use "github.com" with version 1.

**Outcome**: They still need your master phrase. Without it, they cannot generate the password.

### Scenario 3: Master Phrase Compromised

**Setup**: Attacker learns your master phrase.

**Outcome**: They can generate all your passwords if they know which sites and versions you use.

**Action**:
1. Change master phrase to something new
2. Update all passwords on all sites
3. This is why Password Mint is not a replacement for a full password manager

### Scenario 4: Offline Brute Force

**Setup**: Attacker has a generated password and knows the site/version.

**Outcome**: They can attempt to brute-force your master phrase offline.

**Protection**: 210,000+ PBKDF2 iterations make this slow. With a strong master phrase (20+ characters, high entropy), this is computationally infeasible.

**Recommendation**: Use a passphrase like "correct horse battery staple" (but don't use that one!).

## Comparison to Password Managers

| Feature | Password Mint | Traditional Password Manager |
|---------|---------------|------------------------------|
| Storage | Nothing | Encrypted vault |
| Sync | Not needed | Required for multi-device |
| Master password | Must remember exactly | Can hint/recover (sometimes) |
| Unique passwords | Yes | Yes |
| Password history | Via version numbers | Built-in |
| Autofill | No | Yes |
| Security notes | No | Yes |
| 2FA codes | No | Sometimes |
| Offline | Always | Depends |

**Bottom Line**: Password Mint is simpler and more private, but lacks the convenience features of full password managers. Consider using both together.

## Recommendations

1. **Master Phrase**:
   - Use 4+ random words (e.g., "purple elephant dances tuesday")
   - Avoid personal info (names, birthdays, pet names, addresses)
   - Avoid common phrases, song lyrics, famous quotes, movie lines
   - Don't reuse your master phrase anywhere else
   - Phrase hardening handles capitalization/spacing consistency, but does NOT strengthen weak phrases

2. **Usage**:
   - Verify you're on the correct site before using a password (site normalization handles case/URL format, but not typos)
   - Use the "High" security level for critical accounts
   - Use the Version field for rotation — keep version numbers somewhere safe (not with master phrase)

3. **Device Security**:
   - Use Password Mint on trusted devices only
   - Keep your operating system and browser updated
   - Consider using in private/incognito mode

## Version History

- **v1** (Current): Initial release with PBKDF2-SHA256

## Responsible Disclosure

If you discover a security vulnerability, please email [your-email@example.com] rather than opening a public issue.
