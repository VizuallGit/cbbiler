function autoContrast(el) {
    const bg = getComputedStyle(el).backgroundColor;
    const [r, g, b, a = 1] = (bg.match(/[\d.]+/g) || []).map(Number);
    if (a === 0 || [r, g, b].some(Number.isNaN)) return;

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    el.style.color = brightness > 128
        ? 'var(--contrast-dark)'
        : 'var(--contrast-light)';
}

// Begge attributter får statisk kontrast; kun -hover genberegnes på hover.
const CONTRAST_SELECTOR = '[data-auto-contrast], [data-auto-contrast-hover]';

export function applyAutoContrast(root = document) {
    // trackContrast sampler hele transitionens varighed, så vi fanger den
    // ENDELIGE baggrund — ikke et øjebliksbillede mens en bg stadig fader
    // (fx en knap der lige er sat disabled ved load).
    root.querySelectorAll(CONTRAST_SELECTOR).forEach(trackContrast);
}

// Eksponeres så Live Preview-handleren kan gen-beregne kontrast efter en
// opdatering — body morphes ikke når kun head-CSS'en (--color-bg) ændrer sig.
window.applyAutoContrast = applyAutoContrast;

// Sampler baggrunden hver frame i hele transitionens varighed, så ikon/tekst-
// farven FØLGER en fadende baggrund (hover, disabled-toggle, slide) i stedet for
// at springe — den flipper når baggrunden krydser lys/mørk-grænsen.
function trackContrast(el) {
    const dur = parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 0;
    el._contrastUntil = performance.now() + dur + 50; // lille buffer
    if (el._contrastTicking) return;
    el._contrastTicking = true;
    const tick = (now) => {
        autoContrast(el);
        if (now < el._contrastUntil) {
            requestAnimationFrame(tick);
        } else {
            el._contrastTicking = false;
        }
    };
    requestAnimationFrame(tick);
}

// Live Preview morpher DOM'en, og carousel-knapper skifter `disabled` (og dermed
// baggrund) via JS når man slider. Begge skal trigge genberegning af kontrast.
let scheduled = false;
const observer = new MutationObserver((mutations) => {
    // disabled-toggle (fx carousel-knapper): følg baggrundens transition, så
    // SVG-pilens currentColor skifter med — lys på mørk bg, mørk på lys bg.
    for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'disabled'
            && m.target.matches?.(CONTRAST_SELECTOR)) {
            trackContrast(m.target);
        }
    }
    // Strukturelle/klasse-ændringer (fx morph): fuld re-apply, debounced.
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
        scheduled = false;
        document.querySelectorAll(CONTRAST_SELECTOR).forEach(trackContrast);
    });
});
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled'],
});

// Genberegn kontrast på hover — kun for [data-auto-contrast-hover], dvs.
// elementer der skifter baggrund på :hover. :hover udløser ingen mutation.
function onHoverContrast(e) {
    const el = e.target.closest?.('[data-auto-contrast-hover]');
    if (el) trackContrast(el);
}
document.addEventListener('mouseover', onHoverContrast);
document.addEventListener('mouseout', onHoverContrast);

applyAutoContrast();
