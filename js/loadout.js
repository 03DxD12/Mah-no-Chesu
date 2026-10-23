/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/loadout.js - Custom Element Loadout System, Attack Matrix, Presets & Element Visual Engine
 */

const ELEMENTS = {
    fire: {
        id: 'fire',
        name: 'Fire',
        color: '#f97316',
        secondaryColor: '#fbbf24',
        accentColor: '#dc2626',
        trailName: 'Flame Trail',
        captureFx: 'Fire Nova Explosion',
        auraDesc: 'Burning embers and heat distortion',
        badgeClass: 'elem-fire',
        audioMethod: 'playFireAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M12 23c-4.97 0-9-3.95-9-8.83 0-3.32 1.83-6.44 4.54-9.05.6-.58 1.57-.4 1.93.33.67 1.34 1.69 2.5 2.68 3.3 0-2.45 1.05-4.8 2.82-6.57.58-.58 1.57-.41 1.92.34C18.42 5.67 21 9.77 21 14.17 21 19.05 16.97 23 12 23zm0-4c2.21 0 4-1.79 4-4 0-1.42-.74-2.73-1.92-3.46-.42-.26-.97-.04-1.12.43-.37 1.15-1.22 2.03-2.3 2.37-.5.16-.76.7-.58 1.19.34.88 1.08 1.47 1.92 1.47z"/></svg>`
    },
    lightning: {
        id: 'lightning',
        name: 'Lightning',
        color: '#38bdf8',
        secondaryColor: '#ffffff',
        accentColor: '#c084fc',
        trailName: 'Electric Trail',
        captureFx: 'Thunderbolt & Ground Arc',
        auraDesc: 'Electric sparks and plasma crackle',
        badgeClass: 'elem-lightning',
        audioMethod: 'playLightningAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M11 21h-1l1-7H7.5c-.58 0-.96-.6-.74-1.14L11.76 2.4c.2-.5.78-.65 1.18-.3.26.22.36.57.26.89L12 9h4.5c.59 0 .97.62.74 1.16L12.24 20.6c-.2.5-.78.65-1.18.3-.04-.03-.06-.06-.06-.09z"/></svg>`
    },
    wind: {
        id: 'wind',
        name: 'Wind',
        color: '#34d399',
        secondaryColor: '#ecfdf5',
        accentColor: '#94a3b8',
        trailName: 'Gale Trail',
        captureFx: 'Vacuum Scythe Slices',
        auraDesc: 'Air streaks and swirling breeze',
        badgeClass: 'elem-wind',
        audioMethod: 'playWindAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3 1.35-3 3-3h8.5M3 8h12.5c1.65 0 3-1.35 3-3s-1.35-3-3-3-3 1.35-3 3M2 12.5h15.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5"/></svg>`
    },
    earth: {
        id: 'earth',
        name: 'Earth',
        color: '#d97706',
        secondaryColor: '#fef3c7',
        accentColor: '#78350f',
        trailName: 'Stone Tremor',
        captureFx: 'Fissures & Rising Spikes',
        auraDesc: 'Rock fragments and seismic dust',
        badgeClass: 'elem-earth',
        audioMethod: 'playEarthAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M14 6l-3.8 5.7 1.3 1.9-2.5 3.8-3-4.5L2 19h20L14 6zm-4.7 9.5l1.2-1.8 1.3 1.9 2.2-3.3 4.2 6.7H5.8l3.5-5.5z"/></svg>`
    },
    ice: {
        id: 'ice',
        name: 'Ice',
        color: '#06b6d4',
        secondaryColor: '#e0f2fe',
        accentColor: '#67e8f9',
        trailName: 'Frost Trail',
        captureFx: 'Glacial Mandala & Frost Shatter',
        auraDesc: 'Snow crystals and frozen mist',
        badgeClass: 'elem-ice',
        audioMethod: 'playIceAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M11 2v4.07l-2.83-2.83-1.41 1.41L9.59 7.5 7.5 9.59 4.66 6.76 3.24 8.17 6.07 11H2v2h4.07l-2.83 2.83 1.41 1.41L7.5 14.41l2.09 2.09-2.83 2.83 1.41 1.41L11 17.93V22h2v-4.07l2.83 2.83 1.41-1.41L14.41 16.5l2.09-2.09 2.83 2.83 1.41-1.41L17.93 13H22v-2h-4.07l2.83-2.83-1.41-1.41L16.5 9.59l-2.09-2.09 2.83-2.83-1.41-1.41L13 6.07V2h-2z"/></svg>`
    },
    water: {
        id: 'water',
        name: 'Water',
        color: '#0284c7',
        secondaryColor: '#bae6fd',
        accentColor: '#0ea5e9',
        trailName: 'Tidal Trail',
        captureFx: 'Hydro Whirlpool & Torrent Splash',
        auraDesc: 'Floating water droplets and ripples',
        badgeClass: 'elem-water',
        audioMethod: 'playWaterAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`
    },
    light: {
        id: 'light',
        name: 'Light',
        color: '#facc15',
        secondaryColor: '#ffffff',
        accentColor: '#fef08a',
        trailName: 'Radiant Trail',
        captureFx: 'Sacred Solar Pillar & Halos',
        auraDesc: 'Golden sunburst particles and holy aura',
        badgeClass: 'elem-light',
        audioMethod: 'playLightAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0-10V2h-2v3h2zm0 15v3h-2v-3h2zm8.5-9.5l2.12-2.12-1.41-1.41L19.09 7.1 20.5 8.5zm-17 0l1.41-1.41-2.12-2.12-1.41 1.41L3.5 8.5zm15.59 7.09l2.12 2.12 1.41-1.41-2.12-2.12-1.41 1.41zm-14.18 0l-2.12 2.12 1.41 1.41 2.12-2.12-1.41-1.41z"/></svg>`
    },
    shadow: {
        id: 'shadow',
        name: 'Shadow',
        color: '#8b5cf6',
        secondaryColor: '#c4b5fd',
        accentColor: '#4c1d95',
        trailName: 'Shadow Trail',
        captureFx: 'Void Implosion & Dark Fog',
        auraDesc: 'Dark purple mist and void wisps',
        badgeClass: 'elem-shadow',
        audioMethod: 'playShadowAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9.006 9.006 0 0 0 12 3z"/></svg>`
    },
    nature: {
        id: 'nature',
        name: 'Nature',
        color: '#10b981',
        secondaryColor: '#d1fae5',
        accentColor: '#047857',
        trailName: 'Verdant Trail',
        captureFx: 'Entangling Vines & Leaf Vortex',
        auraDesc: 'Floating green leaves and floral spores',
        badgeClass: 'elem-nature',
        audioMethod: 'playNatureAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3C8.42 20.35 10.15 21 12 21c6.08 0 11-4.92 11-11V3l-6 5zm-5 11c-1.39 0-2.73-.39-3.89-1.07 1.87-3.79 4.39-7.23 8.89-8.93v5c0 2.76-2.24 5-5 5z"/></svg>`
    },
    arcane: {
        id: 'arcane',
        name: 'Arcane',
        color: '#ec4899',
        secondaryColor: '#fbcfe8',
        accentColor: '#a855f7',
        trailName: 'Arcane Trail',
        captureFx: 'Runic Circles & Cosmic Supernova',
        auraDesc: 'Floating runes and ethereal magenta energy',
        badgeClass: 'elem-arcane',
        audioMethod: 'playArcaneAttack',
        svg: `<svg viewBox="0 0 24 24" class="elem-svg"><path d="M12 2l2.4 6.9 7.1.3-5.5 4.5 1.9 6.8-5.9-4-5.9 4 1.9-6.8-5.5-4.5 7.1-.3z"/></svg>`
    }
};

/**
 * 60 Distinct Piece-Specific Attack Names Matrix
 * pieceType: { element: attackName }
 */
const ELEMENT_ATTACKS = {
    p: { // Pawn
        fire: 'Fire Blast',
        lightning: 'Spark Shot',
        wind: 'Gale Shot',
        earth: 'Stone Burst',
        ice: 'Frost Shot',
        water: 'Aqua Burst',
        light: 'Radiant Shot',
        shadow: 'Dark Bolt',
        nature: 'Thorn Shot',
        arcane: 'Arcane Bolt'
    },
    n: { // Knight
        fire: 'Blazing Charge',
        lightning: 'Thunder Strike',
        wind: 'Tempest Leap',
        earth: 'Seismic Charge',
        ice: 'Frozen Charge',
        water: 'Tidal Rush',
        light: 'Radiant Charge',
        shadow: 'Phantom Strike',
        nature: 'Wild Charge',
        arcane: 'Arcane Leap'
    },
    b: { // Bishop
        fire: 'Inferno Slash',
        lightning: 'Volt Slash',
        wind: 'Wind Slash',
        earth: 'Terran Cleave',
        ice: 'Glacial Pierce',
        water: 'Torrent Siphon',
        light: 'Solar Ray',
        shadow: 'Void Slash',
        nature: 'Bramble Sever',
        arcane: 'Mystic Surge'
    },
    r: { // Rook
        fire: 'Volcanic Crash',
        lightning: 'Thunder Crash',
        wind: 'Cyclone Pillar',
        earth: 'Earth Breaker',
        ice: 'Permafrost Rampart',
        water: 'Tsunami Impact',
        light: 'Dawn Bastion',
        shadow: 'Abyssal Crush',
        nature: 'Overgrowth Slam',
        arcane: 'Aether Oblivion'
    },
    q: { // Queen
        fire: 'Infernal Dominion',
        lightning: 'Tempest Dominion',
        wind: 'Vortex Dominion',
        earth: 'Tectonic Empress',
        ice: 'Frozen Dominion',
        water: 'Oceanic Sovereign',
        light: 'Radiant Dominion',
        shadow: 'Abyssal Dominion',
        nature: 'Primordial Bloom',
        arcane: 'Arcane Singularity'
    },
    k: { // King
        fire: 'Royal Inferno',
        lightning: 'Divine Thunder',
        wind: 'Zephyr Crown',
        earth: 'Mountain Sovereign',
        ice: 'Glacial Majesty',
        water: 'Abyssal Tide',
        light: 'Judgment of Light',
        shadow: 'Eclipse Monarch',
        nature: 'Verdant Judgment',
        arcane: 'Cosmic Decree'
    }
};

/**
 * Built-in Preset Army Formations (Spec 117)
 */
const PRESETS = {
    classic: {
        name: 'Classic Mahō',
        desc: 'Canonical configuration: Fire, Lightning, Wind, Earth, Ice, Light',
        loadout: { p: 'fire', n: 'lightning', b: 'wind', r: 'earth', q: 'ice', k: 'light' }
    },
    inferno: {
        name: 'Inferno Legion',
        desc: 'All pieces command raging fire, magma explosions & ember storms',
        loadout: { p: 'fire', n: 'fire', b: 'fire', r: 'fire', q: 'fire', k: 'fire' }
    },
    storm: {
        name: 'Tempest Storm',
        desc: 'Rapid thunderbolts and razor wind gales',
        loadout: { p: 'wind', n: 'lightning', b: 'wind', r: 'lightning', q: 'lightning', k: 'wind' }
    },
    frozen_kingdom: {
        name: 'Frozen Kingdom',
        desc: 'Sub-zero glacial frost and surging tidal currents',
        loadout: { p: 'ice', n: 'ice', b: 'water', r: 'ice', q: 'ice', k: 'water' }
    },
    dark_legion: {
        name: 'Dark Legion',
        desc: 'Abyssal void shadows and forbidden arcane sorcery',
        loadout: { p: 'shadow', n: 'shadow', b: 'arcane', r: 'shadow', q: 'arcane', k: 'shadow' }
    },
    natures_guard: {
        name: "Nature's Guard",
        desc: 'Earth tremors, verdant overgrowth and celestial solar light',
        loadout: { p: 'nature', n: 'earth', b: 'nature', r: 'earth', q: 'nature', k: 'light' }
    }
};

/**
 * Loadout Manager class
 */
class LoadoutManager {
    constructor() {
        this.STORAGE_KEY_WHITE = 'maho_loadout_white_v1';
        this.STORAGE_KEY_BLACK = 'maho_loadout_black_v1';
        this.STORAGE_KEY_CUSTOM_PRESETS = 'maho_custom_presets_v1';
        this.STORAGE_KEY_AI_CONFIG = 'maho_ai_loadout_config_v1';

        // Load or initialize White and Black loadouts
        this.whiteLoadout = this.loadStoredLoadout(this.STORAGE_KEY_WHITE, { ...PRESETS.classic.loadout });
        this.blackLoadout = this.loadStoredLoadout(this.STORAGE_KEY_BLACK, { ...PRESETS.classic.loadout });

        // AI configuration: 'classic' | 'random' | 'match_player'
        this.aiLoadoutType = localStorage.getItem(this.STORAGE_KEY_AI_CONFIG) || 'classic';

        // Custom Presets
        this.customPresets = this.loadCustomPresets();
    }

    loadStoredLoadout(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.p && parsed.n && parsed.b && parsed.r && parsed.q && parsed.k) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Could not read loadout from storage', e);
        }
        return { ...fallback };
    }

    saveLoadouts() {
        try {
            localStorage.setItem(this.STORAGE_KEY_WHITE, JSON.stringify(this.whiteLoadout));
            localStorage.setItem(this.STORAGE_KEY_BLACK, JSON.stringify(this.blackLoadout));
            localStorage.setItem(this.STORAGE_KEY_AI_CONFIG, this.aiLoadoutType);
        } catch (e) {
            console.warn('Could not save loadout to storage', e);
        }
    }

    loadCustomPresets() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_CUSTOM_PRESETS);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn('Could not load custom presets', e);
        }
        return {};
    }

    saveCustomPresets() {
        try {
            localStorage.setItem(this.STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(this.customPresets));
        } catch (e) {
            console.warn('Could not save custom presets', e);
        }
    }

    addCustomPreset(name, loadout) {
        const id = 'custom_' + Date.now();
        this.customPresets[id] = {
            id,
            name,
            loadout: { ...loadout }
        };
        this.saveCustomPresets();
        return id;
    }

    deleteCustomPreset(id) {
        if (this.customPresets[id]) {
            delete this.customPresets[id];
            this.saveCustomPresets();
        }
    }

    /**
     * Get active element for a piece based on its type and player color
     */
    getElementForPiece(pieceType, color) {
        const type = (pieceType || '').toLowerCase();
        const loadout = color === 'w' ? this.whiteLoadout : this.blackLoadout;
        return loadout[type] || 'fire';
    }

    /**
     * Get attack name for piece + element combo
     */
    getAttackName(pieceType, element) {
        const type = (pieceType || '').toLowerCase();
        const elem = (element || 'fire').toLowerCase();
        if (ELEMENT_ATTACKS[type] && ELEMENT_ATTACKS[type][elem]) {
            return ELEMENT_ATTACKS[type][elem];
        }
        return `${pieceType.toUpperCase()} ${elem.toUpperCase()} STRIKE`;
    }

    getElementMeta(element) {
        return ELEMENTS[element] || ELEMENTS.fire;
    }

    /**
     * Generate randomized loadout
     * @param {boolean} allowDuplicates - If false, will try to pick 6 distinct elements
     */
    generateRandomLoadout(allowDuplicates = true) {
        const keys = Object.keys(ELEMENTS);
        const pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
        const result = {};

        if (allowDuplicates) {
            pieces.forEach(p => {
                const randIndex = Math.floor(Math.random() * keys.length);
                result[p] = keys[randIndex];
            });
        } else {
            // Shuffle
            const shuffled = [...keys].sort(() => 0.5 - Math.random());
            pieces.forEach((p, idx) => {
                result[p] = shuffled[idx % shuffled.length];
            });
        }
        return result;
    }

    /**
     * Set AI loadout according to setting
     */
    resolveAiLoadout(playerColor) {
        if (this.aiLoadoutType === 'random') {
            return this.generateRandomLoadout(true);
        }
        if (this.aiLoadoutType === 'match_player') {
            const playerLoadout = playerColor === 'w' ? this.whiteLoadout : this.blackLoadout;
            return { ...playerLoadout };
        }
        // 'classic'
        return { ...PRESETS.classic.loadout };
    }
}

// Global instance for convenience
window.LoadoutManager = LoadoutManager;
window.ELEMENTS = ELEMENTS;
window.ELEMENT_ATTACKS = ELEMENT_ATTACKS;
window.LOADOUT_PRESETS = PRESETS;
