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
/**
 * 60 Distinct Piece-Specific Attack Names Matrix (Specs 133 - 143)
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
        water: 'Tidal Charge',
        light: 'Radiant Charge',
        shadow: 'Phantom Strike',
        nature: 'Wild Charge',
        arcane: 'Mystic Leap'
    },
    b: { // Bishop
        fire: 'Inferno Crescent',
        lightning: 'Volt Slash',
        wind: 'Wind Slash',
        earth: 'Stone Spear',
        ice: 'Glacial Slash',
        water: 'Tidal Slash',
        light: 'Sacred Slash',
        shadow: 'Void Slash',
        nature: 'Verdant Slash',
        arcane: 'Rune Slash'
    },
    r: { // Rook
        fire: 'Volcanic Fortress',
        lightning: 'Thunder Crash',
        wind: 'Cyclone Breaker',
        earth: 'Earth Breaker',
        ice: 'Frozen Fortress',
        water: 'Tsunami Breaker',
        light: 'Holy Fortress',
        shadow: 'Abyss Breaker',
        nature: 'Root Breaker',
        arcane: 'Arcane Breaker'
    },
    q: { // Queen
        fire: 'Infernal Dominion',
        lightning: 'Tempest Dominion',
        wind: 'Tempest Dominion',
        earth: 'Titanic Dominion',
        ice: 'Frozen Dominion',
        water: 'Ocean Dominion',
        light: 'Radiant Dominion',
        shadow: 'Abyssal Dominion',
        nature: 'Verdant Dominion',
        arcane: 'Arcane Dominion'
    },
    k: { // King
        fire: 'Royal Inferno',
        lightning: 'Divine Thunder',
        wind: 'Sovereign Gale',
        earth: "King's Fortress",
        ice: 'Absolute Judgment',
        water: 'Royal Tsunami',
        light: 'Judgment of Light',
        shadow: 'Sovereign Eclipse',
        nature: "Nature's Judgment",
        arcane: 'Sovereign Arcana'
    }
};

/**
 * 60 Distinct Piece Ability Details & Canonical Visual Behavior (Specs 134 - 143)
 */
const ABILITY_DETAILS = {
    p: {
        style: 'projectile',
        motionTrail: 'Linear forward spark trail',
        fire: { name: 'Fire Blast', desc: 'Small projectile followed by an ember explosion.', impact: 'Ember Nova' },
        lightning: { name: 'Spark Shot', desc: 'Small electric projectile darting straight into the foe.', impact: 'Shock Spark' },
        wind: { name: 'Gale Shot', desc: 'Small compressed-air projectile piercing forward.', impact: 'Air Vortex' },
        earth: { name: 'Stone Burst', desc: 'Small rocks erupt beneath the target upon impact.', impact: 'Rock Shards' },
        ice: { name: 'Frost Shot', desc: 'Small frozen projectile leaving sub-zero crystals.', impact: 'Frost Burst' },
        water: { name: 'Aqua Burst', desc: 'Small high-pressure water projectile splashing target.', impact: 'Water Splash' },
        light: { name: 'Radiant Shot', desc: 'Small concentrated beam of sacred light.', impact: 'Holy Flash' },
        shadow: { name: 'Dark Bolt', desc: 'Small shadow projectile dissolving into dark mist.', impact: 'Dark Wisp' },
        nature: { name: 'Thorn Shot', desc: 'Sharp thorns launch swiftly toward the enemy.', impact: 'Thorn Pierce' },
        arcane: { name: 'Arcane Bolt', desc: 'Small magical projectile shimmering with arcane energy.', impact: 'Runic Spark' }
    },
    n: {
        style: 'leap',
        motionTrail: 'High-arched jumping trajectory',
        fire: { name: 'Blazing Charge', desc: 'Knight jumps through flames and crashes into destination.', impact: 'Fire Crater' },
        lightning: { name: 'Thunder Strike', desc: 'Knight jumps while lightning strikes the target from above.', impact: 'Thunderbolt' },
        wind: { name: 'Tempest Leap', desc: 'Knight becomes surrounded by a cyclone during its jump.', impact: 'Cyclone Slam' },
        earth: { name: 'Seismic Charge', desc: 'Knight lands with a ground-breaking seismic impact.', impact: 'Ground Fissure' },
        ice: { name: 'Frozen Charge', desc: 'Knight leaves frost behind before creating an ice impact.', impact: 'Glacial Pillar' },
        water: { name: 'Tidal Charge', desc: 'Knight surges through a wave-like aquatic arc.', impact: 'Torrent Crash' },
        light: { name: 'Radiant Charge', desc: 'Knight transforms briefly into a streak of holy light.', impact: 'Solar Flare' },
        shadow: { name: 'Phantom Strike', desc: 'Knight temporarily disappears and reappears near the target.', impact: 'Void Rift' },
        nature: { name: 'Wild Charge', desc: 'Knight jumps while surrounded by leaves, roots and vines.', impact: 'Bramble Slam' },
        arcane: { name: 'Mystic Leap', desc: 'Knight jumps through a luminous mystical warp portal.', impact: 'Astral Supernova' }
    },
    b: {
        style: 'slash',
        motionTrail: 'Diagonal sweeping razor blade',
        fire: { name: 'Inferno Crescent', desc: 'A burning diagonal blade travels toward the enemy.', impact: 'Flame Cleave' },
        lightning: { name: 'Volt Slash', desc: 'Diagonal electrical blade shocking target at impact.', impact: 'Arc Sever' },
        wind: { name: 'Wind Slash', desc: 'Long diagonal air blade slicing across the Bishop’s path.', impact: 'Vacuum Blade' },
        earth: { name: 'Stone Spear', desc: 'Diagonal stone spikes travel rapidly toward the enemy.', impact: 'Spike Cleave' },
        ice: { name: 'Glacial Slash', desc: 'Razor diagonal blade crafted from sub-zero permafrost.', impact: 'Ice Shard Cleave' },
        water: { name: 'Tidal Slash', desc: 'High-pressure diagonal water blade cutting through defenses.', impact: 'Hydro Blade' },
        light: { name: 'Sacred Slash', desc: 'Diagonal golden holy beam illuminating the battlefield.', impact: 'Divine Sever' },
        shadow: { name: 'Void Slash', desc: 'Diagonal dark-energy blade dissolving enemy essence.', impact: 'Abyssal Tear' },
        nature: { name: 'Verdant Slash', desc: 'Diagonal leaf-and-vine blade with razor floral edges.', impact: 'Petal Cleave' },
        arcane: { name: 'Rune Slash', desc: 'A diagonal magical rune cuts through the target.', impact: 'Rune Sever' }
    },
    r: {
        style: 'breaker',
        motionTrail: 'Heavy linear rolling tremor',
        fire: { name: 'Volcanic Fortress', desc: 'The ground cracks and a volcanic eruption strikes destination.', impact: 'Magma Eruption' },
        lightning: { name: 'Thunder Crash', desc: 'Heavy straight-line electrical shockwave roaring forward.', impact: 'Plasma Detonation' },
        wind: { name: 'Cyclone Breaker', desc: 'Powerful tornado rushes along the Rook’s path.', impact: 'Whirlwind Blast' },
        earth: { name: 'Earth Breaker', desc: 'Massive ground crack and stone eruption crushing target.', impact: 'Tectonic Rampart' },
        ice: { name: 'Frozen Fortress', desc: 'Large ice pillars erupt underneath the enemy.', impact: 'Permafrost Wall' },
        water: { name: 'Tsunami Breaker', desc: 'A massive tidal wave travels in a straight line.', impact: 'Tsunami Crash' },
        light: { name: 'Holy Fortress', desc: 'A colossal pillar of light erupts from the destination.', impact: 'Sacred Bastion' },
        shadow: { name: 'Abyss Breaker', desc: 'Dark fissures spread across destination, consuming all.', impact: 'Void Collapse' },
        nature: { name: 'Root Breaker', desc: 'Colossal primordial roots erupt beneath the enemy.', impact: 'Overgrowth Rampart' },
        arcane: { name: 'Arcane Breaker', desc: 'Large mystical symbols detonate beneath the enemy.', impact: 'Aether Oblivion' }
    },
    q: {
        style: 'dominion',
        motionTrail: 'Global mandala & pulsing aura',
        fire: { name: 'Infernal Dominion', desc: 'A large magical fire circle surrounds enemy before exploding.', impact: 'Cataclysmic Supernova' },
        lightning: { name: 'Tempest Dominion', desc: 'Multiple lightning bolts surround and strike the enemy.', impact: 'Storm Cataclysm' },
        wind: { name: 'Tempest Dominion', desc: 'Large colossal vortex surrounds the target with razor winds.', impact: 'Hurricane Eye' },
        earth: { name: 'Titanic Dominion', desc: 'Massive rock pillars imprison and crush the target.', impact: 'Tectonic Tomb' },
        ice: { name: 'Frozen Dominion', desc: 'Target freezes completely into deep crystal before shattering.', impact: 'Absolute Shatter' },
        water: { name: 'Ocean Dominion', desc: 'A magical oceanic vortex envelops and submerges the enemy.', impact: 'Abyssal Whirlpool' },
        light: { name: 'Radiant Dominion', desc: 'Several divine beams surround and strike the enemy in unison.', impact: 'Solar Cataclysm' },
        shadow: { name: 'Abyssal Dominion', desc: 'Dark abyssal portal surrounds and completely consumes target.', impact: 'Singularity Void' },
        nature: { name: 'Verdant Dominion', desc: 'Primordial vines surround and completely crush the target.', impact: 'Eternal Overgrowth' },
        arcane: { name: 'Arcane Dominion', desc: 'Multiple magical circles surround enemy before detonating.', impact: 'Cosmic Singularity' }
    },
    k: {
        style: 'sovereign',
        motionTrail: 'Royal celestial aura & heavenly beam',
        fire: { name: 'Royal Inferno', desc: 'A golden-red sovereign pillar of fire consumes the target.', impact: 'Sovereign Pyre' },
        lightning: { name: 'Divine Thunder', desc: 'A royal lightning pillar crashes onto target with thunderous fury.', impact: 'Judgment Bolt' },
        wind: { name: 'Sovereign Gale', desc: 'Royal wind shockwave pulverizes the enemy in a tempest blast.', impact: 'Crown of Gales' },
        earth: { name: "King's Fortress", desc: 'A huge royal stone monolith descends to crush the enemy.', impact: 'Mountain Monolith' },
        ice: { name: 'Absolute Judgment', desc: 'A massive royal ice crystal traps and destroys the target.', impact: 'Glacial Monolith' },
        water: { name: 'Royal Tsunami', desc: 'A powerful royal wave crashes onto target with sovereign weight.', impact: 'Sovereign Deluge' },
        light: { name: 'Judgment of Light', desc: 'A huge divine beam of pure light descends from the heavens.', impact: 'Sacred Verdict' },
        shadow: { name: 'Sovereign Eclipse', desc: 'A dark royal eclipse manifests before annihilating the enemy.', impact: 'Eclipse Oblivion' },
        nature: { name: "Nature's Judgment", desc: 'Massive ancient roots and golden leaves destroy the target.', impact: 'Verdant Verdict' },
        arcane: { name: 'Sovereign Arcana', desc: 'A large royal rune summons a powerful cosmic beam.', impact: 'Imperial Aether' }
    }
};

/**
 * Built-in Preset Army Formations (Spec 117 & 130)
 */
const PRESETS = {
    classic: {
        name: 'Classic Mahō',
        desc: 'Canonical configuration: Fire, Lightning, Wind, Earth, Ice, Light',
        loadout: { p: 'fire', n: 'lightning', b: 'wind', r: 'earth', q: 'ice', k: 'light' }
    },
    inferno: {
        name: 'Inferno Legion',
        desc: 'Pure Fire Army: All 6 pieces command magma, blazing charges & fiery nova blasts',
        loadout: { p: 'fire', n: 'fire', b: 'fire', r: 'fire', q: 'fire', k: 'fire' }
    },
    storm: {
        name: 'Tempest Storm',
        desc: 'Lightning and Wind army delivering devastating thunderbolts and razor gales',
        loadout: { p: 'wind', n: 'lightning', b: 'wind', r: 'lightning', q: 'lightning', k: 'wind' }
    },
    frozen_kingdom: {
        name: 'Frozen Kingdom',
        desc: 'Sub-zero glacial frost and surging tidal currents',
        loadout: { p: 'ice', n: 'ice', b: 'water', r: 'ice', q: 'ice', k: 'water' }
    },
    dark_legion: {
        name: 'Dark Legion',
        desc: 'Pure Shadow & Arcane sorcery devouring foes in abyssal voids',
        loadout: { p: 'shadow', n: 'shadow', b: 'arcane', r: 'shadow', q: 'arcane', k: 'shadow' }
    },
    natures_guard: {
        name: "Nature's Guard",
        desc: 'Living fortress of earth, verdant overgrowth and radiant solar light',
        loadout: { p: 'nature', n: 'earth', b: 'nature', r: 'earth', q: 'nature', k: 'light' }
    }
};

/**
 * Hybrid Elemental Affinities (Spec 152)
 */
const HYBRID_COMBINATIONS = [
    { elements: ['fire', 'lightning', 'wind'], name: 'Tempest Flame', desc: 'Infernal firestorms laced with lightning arcs' },
    { elements: ['fire', 'wind'], name: 'Firestorm', desc: 'Raging flames amplified by gale force winds' },
    { elements: ['water', 'lightning'], name: 'Storm Surge', desc: 'Electrified tidal waves and conductible current' },
    { elements: ['water', 'ice'], name: 'Frozen Tide', desc: 'Sub-zero arctic glaciers surging with tidal force' },
    { elements: ['earth', 'nature'], name: 'Living Fortress', desc: 'Ancient stone bastion reinforced by primordial roots' },
    { elements: ['light', 'arcane'], name: 'Celestial Magic', desc: 'Transcendent holy runes and radiant starlight' },
    { elements: ['shadow', 'arcane'], name: 'Void Magic', desc: 'Forbidden dark sorcery and abyssal dimensional rifts' },
    { elements: ['fire', 'earth'], name: 'Volcanic Force', desc: 'Molten magma surging through tectonic fissures' }
];

/**
 * Loadout Manager class (Specs 101 - 162)
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
     * Get attack name for piece + element combo (Spec 133)
     */
    getAttackName(pieceType, element) {
        const type = (pieceType || '').toLowerCase();
        const elem = (element || 'fire').toLowerCase();
        if (ELEMENT_ATTACKS[type] && ELEMENT_ATTACKS[type][elem]) {
            return ELEMENT_ATTACKS[type][elem];
        }
        return `${pieceType.toUpperCase()} ${elem.toUpperCase()} STRIKE`;
    }

    /**
     * Get complete canonical ability details for piece + element (Specs 134 - 143)
     */
    getAbilityDetails(pieceType, element) {
        const type = (pieceType || 'p').toLowerCase();
        const elem = (element || 'fire').toLowerCase();
        const pieceDetails = ABILITY_DETAILS[type] || ABILITY_DETAILS.p;
        const specific = pieceDetails[elem] || {
            name: this.getAttackName(type, elem),
            desc: 'Powerful elemental attack unleashing devastating force.',
            impact: 'Elemental Nova'
        };

        const elemMeta = this.getElementMeta(elem);

        return {
            name: specific.name,
            desc: specific.desc,
            impact: specific.impact,
            style: pieceDetails.style || 'projectile',
            motionTrail: pieceDetails.motionTrail || elemMeta.trailName,
            elementMeta: elemMeta
        };
    }

    getElementMeta(element) {
        return ELEMENTS[element] || ELEMENTS.fire;
    }

    /**
     * Calculate Element Synergies, Dominions & Pure Armies (Specs 144 - 153, 160)
     * @param {Object} loadout - { p, n, b, r, q, k }
     */
    calculateElementSynergies(loadout) {
        const counts = {};
        const pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
        
        pieces.forEach(p => {
            const el = (loadout[p] || 'fire').toLowerCase();
            counts[el] = (counts[el] || 0) + 1;
        });

        const uniqueElements = Object.keys(counts);
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const dominant = entries[0] || ['fire', 0];
        const dominantElement = dominant[0];
        const dominantCount = dominant[1];

        // Determine Level: 1 to 5 (Spec 145)
        let synergyLevel = 0;
        let synergyTitle = '';
        let synergyDesc = '';
        let isPureArmy = false;

        const elemMeta = this.getElementMeta(dominantElement);
        const elemUpper = elemMeta.name.toUpperCase();

        if (dominantCount === 6) {
            synergyLevel = 5;
            isPureArmy = true;
            synergyTitle = `PURE ${elemUpper} ARMY`;
            synergyDesc = `Maximum Synergy! Full army commanded by ${elemMeta.name}. Board aura, themed check & victory finishers activated.`;
        } else if (dominantCount === 5) {
            synergyLevel = 4;
            synergyTitle = `${elemUpper} DOMINION`;
            synergyDesc = `5 / 6 Pieces. Elemental battlefield aura, amplified attacks & high-density particles.`;
        } else if (dominantCount === 4) {
            synergyLevel = 3;
            synergyTitle = `${elemUpper} MASTERY`;
            synergyDesc = `4 / 6 Pieces. Special impact effects, screen tremor & upgraded attack power.`;
        } else if (dominantCount === 3) {
            synergyLevel = 2;
            synergyTitle = `${elemUpper} SYNERGY`;
            synergyDesc = `3 / 6 Pieces. Enhanced movement trails and stronger elemental particle density.`;
        } else if (dominantCount === 2) {
            synergyLevel = 1;
            synergyTitle = `${elemUpper} BOND`;
            synergyDesc = `2 / 6 Pieces. Shared elemental piece aura enhancement.`;
        }

        // Elemental Balance Check (Spec 150 - 151)
        const isBalanced = uniqueElements.length === 6;
        if (isBalanced) {
            synergyTitle = 'ELEMENTAL BALANCE';
            synergyDesc = 'All 6 pieces command unique elements. Balanced prismatic magical harmony.';
        }

        // Detect Hybrid Affinities (Spec 152)
        const activeHybrids = [];
        HYBRID_COMBINATIONS.forEach(hybrid => {
            const hasAll = hybrid.elements.every(el => uniqueElements.includes(el));
            if (hasAll) {
                activeHybrids.push(hybrid);
            }
        });

        return {
            counts,
            dominantElement,
            dominantCount,
            synergyLevel,
            synergyTitle,
            synergyDesc,
            isPureArmy,
            isBalanced,
            activeHybrids,
            uniqueCount: uniqueElements.length
        };
    }

    /**
     * Get theme CSS class for board frame based on active synergy
     */
    getBoardThemeClass(loadout) {
        const syn = this.calculateElementSynergies(loadout);
        if (syn.isPureArmy) {
            return `pure-army-${syn.dominantElement}`;
        }
        if (syn.isBalanced) {
            return 'elemental-balance';
        }
        if (syn.synergyLevel >= 3) {
            return `synergy-theme-${syn.dominantElement}`;
        }
        return '';
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
window.ABILITY_DETAILS = ABILITY_DETAILS;
window.LOADOUT_PRESETS = PRESETS;
window.HYBRID_COMBINATIONS = HYBRID_COMBINATIONS;

