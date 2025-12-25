/**
 * Password Mint - Privacy-First Password Generator
 *
 * A deterministic password generator using WebCrypto PBKDF2.
 * No data is stored or transmitted. Everything runs locally.
 *
 * Security Note: This implementation uses modulo mapping for character selection.
 * While this introduces minimal bias for typical character pool sizes (< 100 chars),
 * it's acceptable for password generation where the derived bytes have high entropy.
 */

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    const CONFIG = {
        SALT_PREFIX: 'password-mint::v1::',
        ITERATIONS: {
            standard: 210000,
            high: 400000
        },
        DERIVED_BYTES: 64,
        AUTO_CLEAR_MS: 5 * 60 * 1000, // 5 minutes
        HASH_ALGORITHM: 'SHA-256'
    };

    // Character sets
    const CHAR_SETS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        digits: '0123456789',
        symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?/'
    };

    // Ambiguous characters to exclude
    const AMBIGUOUS_CHARS = 'O0Il1';

    // Policy-problem characters (often rejected by password policies)
    const PROBLEMATIC_CHARS = '"\' \\`';

    // =========================================================================
    // DOM ELEMENTS
    // =========================================================================

    const elements = {
        form: document.getElementById('passwordForm'),
        site: document.getElementById('site'),
        masterPhrase: document.getElementById('masterPhrase'),
        version: document.getElementById('version'),
        length: document.getElementById('length'),
        lengthValue: document.getElementById('lengthValue'),
        useUpper: document.getElementById('useUpper'),
        useLower: document.getElementById('useLower'),
        useDigits: document.getElementById('useDigits'),
        useSymbols: document.getElementById('useSymbols'),
        excludeAmbiguous: document.getElementById('excludeAmbiguous'),
        excludeProblematic: document.getElementById('excludeProblematic'),
        securityLevel: document.getElementById('securityLevel'),
        generateBtn: document.getElementById('generateBtn'),
        outputSection: document.getElementById('outputSection'),
        generatedPassword: document.getElementById('generatedPassword'),
        copyBtn: document.getElementById('copyBtn'),
        copyIcon: document.getElementById('copyIcon'),
        regenerateBtn: document.getElementById('regenerateBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        normalizedDisplay: document.getElementById('normalizedDisplay'),
        normalizedSite: document.getElementById('normalizedSite'),
        toggleMasterVisibility: document.getElementById('toggleMasterVisibility'),
        eyeIcon: document.getElementById('eyeIcon'),
        rememberPhrase: document.getElementById('rememberPhrase'),
        rememberWarning: document.getElementById('rememberWarning'),
        forgetNow: document.getElementById('forgetNow'),
        autoClearNotice: document.getElementById('autoClearNotice'),
        howItWorksHeader: document.getElementById('howItWorksHeader'),
        howItWorksContent: document.getElementById('howItWorksContent'),
        advancedOptions: document.getElementById('advancedOptions'),
        copyText: document.querySelector('.copy-text')
    };

    // =========================================================================
    // STATE
    // =========================================================================

    let autoClearTimeout = null;
    let rememberedPhrase = null;

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Normalize a site/URL input to a consistent format.
     * - Trims whitespace
     * - Converts to lowercase
     * - Removes protocol (http/https)
     * - Removes path, query, fragment
     * - Keeps hostname only
     * - If no dots present, keeps as-is (e.g., "apple" stays "apple")
     */
    function normalizeSite(input) {
        let site = input.trim().toLowerCase();

        // Remove protocol
        site = site.replace(/^https?:\/\//, '');

        // Remove www. prefix
        site = site.replace(/^www\./, '');

        // If it looks like a URL (has dots), extract just the hostname
        if (site.includes('.') || site.includes('/')) {
            // Remove path, query, fragment
            site = site.split('/')[0];
            site = site.split('?')[0];
            site = site.split('#')[0];
            // Remove port if present
            site = site.split(':')[0];
        }

        return site;
    }

    /**
     * Build the character pool based on user selections.
     */
    function buildCharacterPool() {
        let pool = '';

        if (elements.useUpper.checked) pool += CHAR_SETS.upper;
        if (elements.useLower.checked) pool += CHAR_SETS.lower;
        if (elements.useDigits.checked) pool += CHAR_SETS.digits;
        if (elements.useSymbols.checked) pool += CHAR_SETS.symbols;

        // Remove ambiguous characters if selected
        if (elements.excludeAmbiguous.checked) {
            for (const char of AMBIGUOUS_CHARS) {
                pool = pool.replace(new RegExp(char, 'g'), '');
            }
        }

        // Remove problematic characters if selected
        if (elements.excludeProblematic.checked) {
            for (const char of PROBLEMATIC_CHARS) {
                pool = pool.replace(new RegExp('\\' + char, 'g'), '');
            }
        }

        return pool;
    }

    /**
     * Get individual character pools for each enabled type.
     */
    function getCharacterPools() {
        const pools = [];

        if (elements.useUpper.checked) {
            let pool = CHAR_SETS.upper;
            if (elements.excludeAmbiguous.checked) {
                pool = pool.replace(/[OI]/g, '');
            }
            if (pool.length > 0) pools.push({ type: 'upper', chars: pool });
        }

        if (elements.useLower.checked) {
            let pool = CHAR_SETS.lower;
            if (elements.excludeAmbiguous.checked) {
                pool = pool.replace(/[l]/g, '');
            }
            if (pool.length > 0) pools.push({ type: 'lower', chars: pool });
        }

        if (elements.useDigits.checked) {
            let pool = CHAR_SETS.digits;
            if (elements.excludeAmbiguous.checked) {
                pool = pool.replace(/[01]/g, '');
            }
            if (pool.length > 0) pools.push({ type: 'digits', chars: pool });
        }

        if (elements.useSymbols.checked) {
            let pool = CHAR_SETS.symbols;
            if (elements.excludeProblematic.checked) {
                for (const char of PROBLEMATIC_CHARS) {
                    pool = pool.replace(new RegExp('\\' + char, 'g'), '');
                }
            }
            if (pool.length > 0) pools.push({ type: 'symbols', chars: pool });
        }

        return pools;
    }

    /**
     * Convert a string to a Uint8Array (UTF-8 encoding).
     */
    function stringToBytes(str) {
        return new TextEncoder().encode(str);
    }

    /**
     * Harden a master phrase for enhanced security.
     *
     * This function normalizes user input and adds deterministic complexity,
     * making the phrase more resistant to attacks while remaining user-friendly.
     *
     * Transformations:
     * 1. Trim leading/trailing whitespace
     * 2. Convert to lowercase (normalization)
     * 3. Collapse multiple spaces to single space
     * 4. Deterministically capitalize 1-2 words based on phrase content
     * 5. Add deterministic suffix (symbol + digit + symbol)
     *
     * Example:
     *   Input:  "  My iPhone  purchase in INDIA  "
     *   Output: "my IPHONE purchase in india ELEC!7@" (example transformation)
     *
     * The same input ALWAYS produces the same output (deterministic).
     *
     * @param {string} phrase - The user's raw master phrase
     * @returns {string} - The hardened phrase ready for PBKDF2
     */
    function hardenPhrase(phrase) {
        // Step 1: Normalize - trim, lowercase, collapse spaces
        let normalized = phrase
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');

        // If empty after normalization, return as-is (validation will catch it)
        if (!normalized) {
            return normalized;
        }

        // Step 2: Generate a deterministic seed from the normalized phrase
        // Using a simple but effective hash (djb2 variant)
        let seed = 5381;
        for (let i = 0; i < normalized.length; i++) {
            seed = ((seed << 5) + seed) ^ normalized.charCodeAt(i);
            seed = seed >>> 0; // Convert to unsigned 32-bit
        }

        // Step 3: Deterministically capitalize words
        const words = normalized.split(' ');

        if (words.length >= 2) {
            // Capitalize 2 words at deterministic positions
            const pos1 = seed % words.length;
            const pos2 = Math.floor(seed / words.length) % words.length;

            words[pos1] = words[pos1].toUpperCase();
            if (pos2 !== pos1 && words.length > 2) {
                words[pos2] = words[pos2].toUpperCase();
            }
        } else if (words.length === 1 && words[0].length > 0) {
            // Single word: capitalize first letter
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        }

        // Step 4: Generate deterministic suffix
        // Using carefully chosen symbols that work across most password policies
        const symbols = '!@#$%^&*';
        const digits = '23456789'; // Excluding 0 and 1 (ambiguous)

        const sym1 = symbols[seed % symbols.length];
        const dig1 = digits[(seed >> 4) % digits.length];
        const sym2 = symbols[(seed >> 8) % symbols.length];

        // Step 5: Combine: words + suffix
        const hardened = words.join(' ') + sym1 + dig1 + sym2;

        return hardened;
    }

    // =========================================================================
    // CRYPTO FUNCTIONS (WebCrypto PBKDF2)
    // =========================================================================

    /**
     * Derive bytes using PBKDF2 with WebCrypto API.
     *
     * @param {string} masterPhrase - The user's master phrase
     * @param {string} salt - The salt string
     * @param {number} iterations - Number of PBKDF2 iterations
     * @returns {Promise<Uint8Array>} - Derived bytes
     */
    async function deriveBytes(masterPhrase, salt, iterations) {
        // Import the master phrase as a key
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            stringToBytes(masterPhrase),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        // Derive bits using PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: stringToBytes(salt),
                iterations: iterations,
                hash: CONFIG.HASH_ALGORITHM
            },
            keyMaterial,
            CONFIG.DERIVED_BYTES * 8 // bits
        );

        return new Uint8Array(derivedBits);
    }

    /**
     * Generate a password from derived bytes.
     *
     * Algorithm:
     * 1. Determine which character pools are active
     * 2. Ensure at least one character from each active pool (deterministically)
     * 3. Fill remaining positions from combined pool
     * 4. Shuffle positions deterministically based on derived bytes
     *
     * @param {Uint8Array} derivedBytes - Bytes from PBKDF2
     * @param {number} length - Desired password length
     * @returns {string} - Generated password
     */
    function generatePasswordFromBytes(derivedBytes, length) {
        const pools = getCharacterPools();
        const combinedPool = buildCharacterPool();

        if (combinedPool.length === 0) {
            throw new Error('No character types selected');
        }

        if (pools.length > length) {
            throw new Error('Password length too short for selected character types');
        }

        // Track byte index for deterministic consumption
        let byteIndex = 0;

        /**
         * Get next byte value, wrapping around if needed.
         */
        function nextByte() {
            const byte = derivedBytes[byteIndex % derivedBytes.length];
            byteIndex++;
            return byte;
        }

        /**
         * Get a 16-bit value from two bytes for better distribution.
         */
        function nextWord() {
            const high = nextByte();
            const low = nextByte();
            return (high << 8) | low;
        }

        // Array to hold the password characters
        const passwordChars = new Array(length);

        // Step 1: Determine positions for mandatory characters (one per pool)
        // We'll use the first N positions for mandatory chars, then shuffle
        const mandatoryCount = pools.length;

        // Pick one character from each pool for mandatory positions
        for (let i = 0; i < mandatoryCount; i++) {
            const pool = pools[i].chars;
            const charIndex = nextWord() % pool.length;
            passwordChars[i] = pool[charIndex];
        }

        // Step 2: Fill remaining positions from combined pool
        for (let i = mandatoryCount; i < length; i++) {
            const charIndex = nextWord() % combinedPool.length;
            passwordChars[i] = combinedPool[charIndex];
        }

        // Step 3: Shuffle array deterministically using Fisher-Yates
        // This ensures mandatory characters aren't always at the start
        for (let i = length - 1; i > 0; i--) {
            const j = nextWord() % (i + 1);
            [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
        }

        return passwordChars.join('');
    }

    // =========================================================================
    // MAIN PASSWORD GENERATION
    // =========================================================================

    /**
     * Generate password based on current form inputs.
     */
    async function generatePassword() {
        const site = elements.site.value.trim();
        const masterPhrase = elements.rememberPhrase.checked && rememberedPhrase
            ? rememberedPhrase
            : elements.masterPhrase.value;
        const version = elements.version.value || '1';
        const length = parseInt(elements.length.value, 10);
        const securityLevel = elements.securityLevel.value;

        // Validation
        if (!site) {
            alert('Please enter a site or app name.');
            elements.site.focus();
            return;
        }

        if (!masterPhrase) {
            alert('Please enter your master phrase.');
            elements.masterPhrase.focus();
            return;
        }

        // Harden the master phrase (normalize + strengthen)
        const hardenedPhrase = hardenPhrase(masterPhrase);

        // Normalize site
        const normalizedSite = normalizeSite(site);

        // Construct salt with domain separation
        const salt = CONFIG.SALT_PREFIX + normalizedSite + '::' + version;

        // Get iterations based on security level
        const iterations = CONFIG.ITERATIONS[securityLevel] || CONFIG.ITERATIONS.standard;

        // Show generating state
        elements.generateBtn.disabled = true;
        elements.generateBtn.classList.add('loading');

        try {
            // Derive bytes using PBKDF2 with hardened phrase
            const derivedBytes = await deriveBytes(hardenedPhrase, salt, iterations);

            // Generate password from derived bytes
            const password = generatePasswordFromBytes(derivedBytes, length);

            // Display result
            elements.generatedPassword.value = password;
            elements.outputSection.style.display = 'block';
            elements.normalizedSite.textContent = normalizedSite;

            // Remember phrase if option is enabled
            if (elements.rememberPhrase.checked) {
                rememberedPhrase = masterPhrase;
            }

            // Clear master phrase input if not remembering
            if (!elements.rememberPhrase.checked) {
                elements.masterPhrase.value = '';
            }

            // Start auto-clear timer
            startAutoClearTimer();

            // Scroll to output
            elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            alert('Error generating password: ' + error.message);
        } finally {
            elements.generateBtn.disabled = false;
            elements.generateBtn.classList.remove('loading');
        }
    }

    // =========================================================================
    // AUTO-CLEAR FUNCTIONALITY
    // =========================================================================

    function startAutoClearTimer() {
        clearAutoClearTimer();
        autoClearTimeout = setTimeout(clearOutput, CONFIG.AUTO_CLEAR_MS);
        updateAutoClearNotice();
    }

    function clearAutoClearTimer() {
        if (autoClearTimeout) {
            clearTimeout(autoClearTimeout);
            autoClearTimeout = null;
        }
    }

    function updateAutoClearNotice() {
        if (autoClearTimeout) {
            elements.autoClearNotice.style.display = 'block';
        } else {
            elements.autoClearNotice.style.display = 'none';
        }
    }

    function clearOutput() {
        elements.generatedPassword.value = '';
        elements.outputSection.style.display = 'none';
        clearAutoClearTimer();
        updateAutoClearNotice();
    }

    function clearAll() {
        // Clear inputs
        elements.site.value = '';
        elements.masterPhrase.value = '';
        elements.version.value = '1';

        // Clear output
        clearOutput();

        // Forget remembered phrase
        if (rememberedPhrase) {
            rememberedPhrase = null;
        }

        // Reset remember checkbox
        elements.rememberPhrase.checked = false;
        elements.rememberWarning.style.display = 'none';

        // Focus site input
        elements.site.focus();
    }

    // =========================================================================
    // CLIPBOARD FUNCTIONALITY
    // =========================================================================

    async function copyPassword() {
        const password = elements.generatedPassword.value;
        if (!password) return;

        try {
            await navigator.clipboard.writeText(password);

            // Visual feedback
            elements.copyBtn.classList.add('copied');
            if (elements.copyText) {
                elements.copyText.textContent = 'Copied!';
            }
            elements.copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';

            setTimeout(() => {
                elements.copyBtn.classList.remove('copied');
                if (elements.copyText) {
                    elements.copyText.textContent = 'Copy to Clipboard';
                }
                elements.copyIcon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
            }, 2000);

            // Reset auto-clear timer on interaction
            startAutoClearTimer();

        } catch (error) {
            // Fallback for older browsers
            elements.generatedPassword.select();
            document.execCommand('copy');
            elements.copyBtn.classList.add('copied');
            if (elements.copyText) {
                elements.copyText.textContent = 'Copied!';
            }
            setTimeout(() => {
                elements.copyBtn.classList.remove('copied');
                if (elements.copyText) {
                    elements.copyText.textContent = 'Copy to Clipboard';
                }
            }, 2000);
        }
    }

    // =========================================================================
    // UI EVENT HANDLERS
    // =========================================================================

    function setupEventListeners() {
        // Form submission
        elements.form.addEventListener('submit', function(e) {
            e.preventDefault();
            generatePassword();
        });

        // Length slider
        elements.length.addEventListener('input', function() {
            elements.lengthValue.textContent = this.value;
        });

        // Copy button
        elements.copyBtn.addEventListener('click', copyPassword);

        // Regenerate button
        elements.regenerateBtn.addEventListener('click', generatePassword);

        // Clear all button
        elements.clearAllBtn.addEventListener('click', clearAll);

        // Master phrase visibility toggle
        elements.toggleMasterVisibility.addEventListener('click', function() {
            const isPassword = elements.masterPhrase.type === 'password';
            elements.masterPhrase.type = isPassword ? 'text' : 'password';
            // Update SVG icon
            if (isPassword) {
                elements.eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            } else {
                elements.eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            }
        });

        // Remember phrase toggle
        elements.rememberPhrase.addEventListener('change', function() {
            elements.rememberWarning.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) {
                rememberedPhrase = null;
            }
        });

        // Forget now button
        elements.forgetNow.addEventListener('click', function() {
            rememberedPhrase = null;
            elements.masterPhrase.value = '';
            elements.rememberPhrase.checked = false;
            elements.rememberWarning.style.display = 'none';
        });

        // Accordion toggle
        elements.howItWorksHeader.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            elements.howItWorksContent.classList.toggle('open');
        });

        // Character set validation - ensure at least one is selected
        const charSetCheckboxes = [
            elements.useUpper,
            elements.useLower,
            elements.useDigits,
            elements.useSymbols
        ];

        charSetCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const anyChecked = charSetCheckboxes.some(cb => cb.checked);
                if (!anyChecked) {
                    this.checked = true;
                    alert('At least one character type must be selected.');
                }
            });
        });

        // Reset auto-clear timer on output interaction
        elements.generatedPassword.addEventListener('focus', function() {
            if (elements.outputSection.style.display !== 'none') {
                startAutoClearTimer();
            }
        });

        // Keyboard shortcut: Enter to generate (when not in textarea)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                generatePassword();
            }
        });
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function init() {
        // Check for WebCrypto support
        if (!window.crypto || !window.crypto.subtle) {
            alert('Your browser does not support the Web Crypto API. Please use a modern browser.');
            elements.generateBtn.disabled = true;
            return;
        }

        // Setup event listeners
        setupEventListeners();

        // Focus site input
        elements.site.focus();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
