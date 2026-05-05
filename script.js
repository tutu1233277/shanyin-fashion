const coverShell = document.querySelector(".cover-shell");
const vinylTrigger = document.getElementById("vinylTrigger");
const vinylInner = document.getElementById("vinylInner");
const vinylSpinLayer = document.getElementById("vinylSpinLayer");
const vinylState1 = document.querySelector(".vinyl-state-1");
const vinylState2 = document.querySelector(".vinyl-state-2");
const backgroundLayer = document.querySelector(".background-layer");
const heroGalleryViewport = document.getElementById("heroGalleryViewport");
const heroGalleryTrack = document.getElementById("heroGalleryTrack");
const projectGalleryTrack = document.getElementById("projectGalleryTrack");
const projectGalleryHitLayer = document.getElementById("projectGalleryHitLayer");
const siteGradient = document.getElementById("siteGradient");
const projectTwoPanel = document.getElementById("projects");
const homeNavLinks = Array.from(document.querySelectorAll('.side-nav-item[href^="#"]'));

const allItems = [
  { src: "首图/1首图.png", href: "project-1.html" },
  { src: "首图/2首图.PNG", href: "project-2.html" },
  { src: "首图/3.png" },
  { src: "首图/2 copy 2.jpg" },
  { src: "首图/49e87c72al69bc41e9edc092fb8a7328.JPG" },
  { src: "首图/60b78789eg7148d1a7c9b7e7b1fcb9c6.JPG" },
  { src: "首图/IMG_7639 copy.PNG" },
  { src: "首图/IMG_8608.JPG" },
  { src: "首图/IMG_8611.JPG" },
  { src: "首图/P1074595.00_00_16_08.Still005.png" },
  { src: "首图/Screenshot 2024-01-24 at 02.13.37 copy.png" },
  { src: "首图/Screenshot 2024-05-26 at 13.01.33.png" },
  { src: "首图/Screenshot 2026-04-29 at 00.07.40.png" },
  { src: "首图/Screenshot 2026-04-29 at 00.28.36.png" },
  { src: "首图/Screenshot 2026-04-29 at 00.28.53.png" },
  { src: "首图/Screenshot 2026-04-29 at 00.31.20.png" },
  { src: "首图/2 copy.jpg" },
  { src: "首图/w copy.jpg" }
];

const heroItems = [
  { src: "主项目3 /第一张.png", href: "project-3.html" },
  { src: "项目5/第一张.JPG", href: "project-5.html" },
  { src: "主项目4/第一张.jpg", href: "project-4.html" },
  { src: "主项目1/第一张.jpg", href: "project-1.html" },
  { src: "主项目2/第一张.PNG", href: "project-2.html" },
  { src: "主项目1/第一张.jpg" }
];

const burstStagger = 0.035;
const imageRatios = new Map();

let heroCards = [];
let projectCards = [];
let projectHitAreas = [];
let heroState = "idle";
let layoutRefreshQueued = false;
let loopHeight = 0;

function getRatio(src) {
  return imageRatios.get(src) || 0.78;
}

function estimateHeight(width, src) {
  return width * getRatio(src);
}

function getBurstCenter() {
  const rect = vinylTrigger?.getBoundingClientRect();

  if (!rect) {
    return {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5
    };
  }

  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5
  };
}

function markEntryClasses(element, item) {
  if (item.src.endsWith("/3.png") || item.src.endsWith("/4.png")) {
    element.classList.add("transparent-art");
  }
  if (item.src.endsWith("/1首图.png")) {
    element.classList.add("detail-entry", "detail-entry-1");
  }
  if (item.src.endsWith("/2首图.PNG")) {
    element.classList.add("detail-entry", "detail-entry-2");
  }
}

function createImage(item) {
  const img = document.createElement("img");
  img.src = encodeURI(item.src);
  img.alt = item.href ? "Portfolio entry" : "Gallery image";
  img.addEventListener("load", () => {
    if (img.naturalWidth > 0) {
      imageRatios.set(item.src, img.naturalHeight / img.naturalWidth);
      queueLayoutRefresh();
    }
  });
  return img;
}

function createHeroCard(item) {
  const card = document.createElement("article");
  card.className = "orbit-card hero-card";
  markEntryClasses(card, item);

  const media = item.href ? document.createElement("a") : document.createElement("div");
  if (item.href) {
    media.href = item.href;
    media.setAttribute("aria-label", "Open project detail");
  }

  media.appendChild(createImage(item));
  card.appendChild(media);
  return card;
}

function createProjectCard(item, duplicate = false) {
  const card = document.createElement("article");
  card.className = "orbit-card";
  if (duplicate) {
    card.classList.add("orbit-card-duplicate");
  }
  markEntryClasses(card, item);

  const media = document.createElement("div");
  media.appendChild(createImage(item));
  card.appendChild(media);
  return card;
}

function createProjectHitArea(item, index, duplicate = false) {
  const hit = item.href ? document.createElement("a") : document.createElement("button");
  hit.className = "gallery-hit";

  if (item.href) {
    hit.classList.add("is-link");
    hit.href = item.href;
    hit.setAttribute("aria-label", "Open project detail");
  } else {
    hit.type = "button";
    hit.tabIndex = -1;
    hit.setAttribute("aria-hidden", "true");
  }

  if (!item.href) {
    hit.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  return hit;
}

function buildHeroGallery() {
  if (!heroGalleryTrack) {
    return;
  }

  heroGalleryTrack.innerHTML = "";
  heroCards = heroItems.map((item) => {
    const card = createHeroCard(item);
    heroGalleryTrack.appendChild(card);
    return card;
  });
}

function buildProjectGallery() {
  if (!projectGalleryTrack || !projectGalleryHitLayer) {
    return;
  }

  projectGalleryTrack.innerHTML = "";
  projectGalleryHitLayer.innerHTML = "";
  projectCards = [];
  projectHitAreas = [];

  allItems.forEach((item, index) => {
    const first = createProjectCard(item, false);
    const second = createProjectCard(item, true);
    const firstHit = createProjectHitArea(item, index, false);
    const secondHit = createProjectHitArea(item, index, true);

    projectGalleryTrack.appendChild(first);
    projectGalleryTrack.appendChild(second);
    projectGalleryHitLayer.appendChild(firstHit);
    projectGalleryHitLayer.appendChild(secondHit);

    projectCards.push({ first, second, item, index });
    projectHitAreas.push(firstHit, secondHit);
  });
}

function clearProjectFocus() {
  projectGalleryTrack?.classList.remove("is-hovering");
  projectCards.forEach(({ first, second }) => {
    first.classList.remove("is-focused");
    second.classList.remove("is-focused");
    gsap.to([first, second], {
      scale: 1,
      yPercent: 0,
      duration: 0.24,
      ease: "power3.out",
      overwrite: "auto"
    });
  });
}

function focusProjectCard(index, duplicate) {
  const pair = projectCards[index];
  if (!pair) {
    return;
  }

  clearProjectFocus();
  const target = duplicate ? pair.second : pair.first;
  projectGalleryTrack?.classList.add("is-hovering");
  target.classList.add("is-focused");
  gsap.to(target, {
    scale: 1.07,
    yPercent: -4,
    duration: 0.24,
    ease: "power3.out",
    overwrite: "auto"
  });
}

function hideProjectHitAreas() {
  projectHitAreas.forEach((hit) => {
    hit.classList.remove("is-active");
    hit.style.pointerEvents = "none";
    hit.style.width = "0px";
    hit.style.height = "0px";
  });
}

function getHeroLayoutData() {
  const mobile = window.innerWidth < 720;
  const templates = mobile
    ? [
        { x: 0.47, y: 0.38, w: 0.32, r: -7 },
        { x: 0.68, y: 0.48, w: 0.22, r: 8 },
        { x: 0.37, y: 0.62, w: 0.21, r: -12 },
        { x: 0.54, y: 0.6, w: 0.29, r: 0 },
        { x: 0.71, y: 0.66, w: 0.23, r: -5 },
        { x: 0.57, y: 0.8, w: 0.23, r: 6 }
      ]
    : [
        { x: 0.45, y: 0.39, w: 0.24, r: -8 },
        { x: 0.64, y: 0.48, w: 0.17, r: 10 },
        { x: 0.34, y: 0.64, w: 0.14, r: -14 },
        { x: 0.52, y: 0.62, w: 0.2, r: 0 },
        { x: 0.69, y: 0.67, w: 0.17, r: -5 },
        { x: 0.56, y: 0.82, w: 0.16, r: 7 }
      ];

  return heroItems.map((item, index) => {
    const template = templates[index];
    const width = window.innerWidth * template.w;
    const height = estimateHeight(width, item.src);
    return {
      width,
      x: window.innerWidth * template.x - width * 0.5,
      y: window.innerHeight * template.y - height * 0.5,
      rotation: template.r,
      zIndex: String(10 + index)
    };
  });
}

function applyHeroIdleLayout(animate = false) {
  const center = getBurstCenter();
  heroCards.forEach((card, index) => {
    const width = window.innerWidth < 720 ? 108 : 156;
    const height = estimateHeight(width, heroItems[index].src);
    card.style.width = `${width}px`;
    card.style.zIndex = "14";
    const target = {
      x: center.x - width * 0.5,
      y: center.y - height * 0.5,
      rotation: 0,
      scale: 0.16,
      opacity: 0
    };
    if (animate) {
      gsap.to(card, { ...target, duration: 0.35, ease: "power2.out", overwrite: "auto" });
    } else {
      gsap.set(card, target);
    }
  });
}

function applyHeroFinalLayout(animate = true) {
  const layout = getHeroLayoutData();

  heroCards.forEach((card, index) => {
    card.style.width = `${layout[index].width}px`;
    card.style.zIndex = layout[index].zIndex;
  });

  if (animate) {
    gsap.to(heroCards, {
      x: (index) => layout[index].x,
      y: (index) => layout[index].y,
      rotation: (index) => layout[index].rotation,
      scale: 1,
      opacity: 1,
      duration: 0.88,
      ease: "back.out(1.45)",
      stagger: burstStagger,
      overwrite: "auto",
      force3D: true
    });
  } else {
    gsap.set(heroCards, {
      x: (index) => layout[index].x,
      y: (index) => layout[index].y,
      rotation: (index) => layout[index].rotation,
      scale: 1,
      opacity: 1,
      force3D: true
    });
  }
}

function getProjectGridMetrics() {
  const mobile = window.innerWidth < 720;
  const columns = mobile ? 2 : 3;
  const gap = mobile ? 18 : 20;
  const sidePadding = mobile ? 16 : 72;
  const offsetX = mobile ? 24 : 128;
  const topPadding = mobile ? 72 : 88;
  const contentWidth = window.innerWidth - sidePadding * 2 - offsetX;
  const columnWidth = (contentWidth - gap * (columns - 1)) / columns;
  const baseWidth = columnWidth * (mobile ? 0.86 : 0.83);
  return { columns, gap, sidePadding, offsetX, topPadding, baseWidth, columnWidth };
}

function getProjectGridLayout(index) {
  const { columns, gap, sidePadding, offsetX, topPadding, baseWidth, columnWidth } = getProjectGridMetrics();
  const heights = Array(columns).fill(topPadding);

  for (let i = 0; i <= index; i += 1) {
    const column = heights.indexOf(Math.min(...heights));
    const width = baseWidth;
    const x = sidePadding + offsetX + column * (columnWidth + gap) + (columnWidth - width) / 2;
    const y = heights[column];
    const height = estimateHeight(width, allItems[i].src);
    heights[column] += height + gap;

    if (i === index) {
      return { width, x, y };
    }
  }

  return { width: 200, x: 0, y: 0 };
}

function getProjectMaxHeight() {
  const { columns, gap, topPadding, baseWidth } = getProjectGridMetrics();
  const heights = Array(columns).fill(topPadding);
  allItems.forEach((item) => {
    const column = heights.indexOf(Math.min(...heights));
    heights[column] += estimateHeight(baseWidth, item.src) + gap;
  });
  return Math.max(...heights) - gap;
}

function applyProjectGridLayout(animate = false) {
  if (!projectGalleryTrack || !projectGalleryHitLayer) {
    return;
  }

  loopHeight = getProjectMaxHeight();
  projectGalleryTrack.style.height = `${loopHeight}px`;
  projectGalleryHitLayer.style.height = `${loopHeight}px`;
  if (projectTwoPanel) {
    projectTwoPanel.style.minHeight = `${Math.max(window.innerHeight, loopHeight + 120)}px`;
  }

  projectCards.forEach(({ first, second, item, index }) => {
    const layout = getProjectGridLayout(index);
    const height = estimateHeight(layout.width, item.src);
    const hitZ = first.classList.contains("detail-entry") ? "40" : "24";

    first.style.width = `${layout.width}px`;
    second.style.width = `${layout.width}px`;
    first.style.zIndex = first.classList.contains("detail-entry") ? String(30 - index) : String(10 + (index % 6));
    second.style.zIndex = "0";

    const firstHit = projectHitAreas[index * 2];
    const secondHit = projectHitAreas[index * 2 + 1];
    [firstHit, secondHit].forEach((hit) => {
      hit.classList.add("is-active");
      hit.style.pointerEvents = "auto";
      hit.style.width = `${layout.width}px`;
      hit.style.height = `${height}px`;
      hit.style.zIndex = hitZ;
    });

    firstHit.style.left = `${layout.x}px`;
    firstHit.style.top = `${layout.y}px`;
    secondHit.style.left = `${layout.x}px`;
    secondHit.style.top = `${layout.y}px`;

    const firstTarget = {
      x: layout.x,
      y: layout.y,
      rotation: 0,
      scale: 1,
      opacity: 1,
      force3D: true
    };
    const secondTarget = {
      x: layout.x,
      y: layout.y,
      rotation: 0,
      scale: 1,
      opacity: 0,
      force3D: true
    };

    if (animate) {
      gsap.to(first, { ...firstTarget, duration: 0.65, ease: "power3.out", overwrite: "auto" });
      gsap.to(second, { ...secondTarget, duration: 0.65, ease: "power3.out", overwrite: "auto" });
    } else {
      gsap.set(first, firstTarget);
      gsap.set(second, secondTarget);
    }
  });
}

function startVinylSpin() {
  vinylSpinLayer?.classList.add("is-spinning");
}

function stopVinylSpin() {
  vinylSpinLayer?.classList.remove("is-spinning");
}

function syncGradientState() {
  if (!siteGradient || !projectTwoPanel) {
    return;
  }

  const secondPageStart = projectTwoPanel.offsetTop - window.innerHeight * 0.35;
  const inSecondPage = window.scrollY >= secondPageStart;
  siteGradient.classList.toggle("site-gradient-green", inSecondPage);
  siteGradient.classList.toggle("site-gradient-blue", !inSecondPage);
  coverShell?.classList.toggle("is-side-nav", inSecondPage);
}

function syncActiveNav() {
  if (!homeNavLinks.length) {
    return;
  }

  const sectionIds = ["home", "projects", "exhibitions", "about", "contact"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) {
    return;
  }

  const viewportMarker = window.innerHeight * 0.36;
  let activeId = sections[0].id;
  let bestSection = null;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const containsMarker = rect.top <= viewportMarker && rect.bottom >= viewportMarker;

    if (containsMarker) {
      bestSection = section.id;
      return;
    }

    if (rect.top <= viewportMarker) {
      activeId = section.id;
    }
  });

  if (bestSection) {
    activeId = bestSection;
  }

  homeNavLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
  });
}

function queueLayoutRefresh() {
  if (layoutRefreshQueued) {
    return;
  }

  layoutRefreshQueued = true;
  requestAnimationFrame(() => {
    layoutRefreshQueued = false;
    if (heroState === "idle") {
      applyHeroIdleLayout(false);
    } else {
      applyHeroFinalLayout(false);
    }
    applyProjectGridLayout(false);
  });
}

function markRevealElements() {
  const revealTargets = [
    { selector: ".project-gallery-viewport", reveal: "image", delay: "0" },
    { selector: ".exhibition-entry .exhibition-heading", reveal: "soft", delay: "0" },
    { selector: ".exhibition-entry .exhibition-copy > p", reveal: "soft", delay: "1" },
    { selector: ".exhibition-entry .exhibition-media", reveal: "image", delay: "2" },
    { selector: ".about-intro", reveal: "soft", delay: "0" },
    { selector: ".about-block", reveal: "soft", delay: "1" },
    { selector: ".contact-block", reveal: "soft", delay: "2" },
    { selector: ".about-portrait", reveal: "image", delay: "3" }
  ];

  revealTargets.forEach(({ selector, reveal, delay }) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.classList.add("reveal-on-scroll");
      element.dataset.reveal = reveal;
      if (delay !== "0") {
        element.dataset.revealDelay = delay;
      }
    });
  });
}

function setupScrollReveals() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) {
    return;
  }

  if (typeof IntersectionObserver === "undefined") {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function setupHome() {
  buildHeroGallery();
  buildProjectGallery();
  markRevealElements();
  setupScrollReveals();
  hideProjectHitAreas();
  clearProjectFocus();
  applyHeroIdleLayout(false);
  applyProjectGridLayout(false);

  gsap.set(vinylState2, { opacity: 0, scale: 0.82, rotation: 0 });
  gsap.set(vinylState1, { opacity: 1, scale: 1.24 });
  gsap.set(vinylSpinLayer, { opacity: 1, rotation: 0 });
  gsap.set(vinylInner, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
  gsap.set(heroGalleryViewport, { opacity: 0 });
  gsap.set(backgroundLayer, { opacity: 0, scale: 1.08 });
  stopVinylSpin();
  syncGradientState();
  syncActiveNav();
}

setupHome();

window.addEventListener("resize", () => {
  if (heroState === "idle") {
    applyHeroIdleLayout(false);
  } else {
    applyHeroFinalLayout(false);
  }
  applyProjectGridLayout(false);
  syncGradientState();
  syncActiveNav();
});

window.addEventListener(
  "scroll",
  () => {
    syncGradientState();
    syncActiveNav();
  },
  { passive: true }
);

vinylTrigger?.addEventListener("click", () => {
  if (!coverShell || heroState !== "idle" || typeof gsap === "undefined") {
    return;
  }

  heroState = "open";
  coverShell.dataset.state = "open";
  vinylTrigger.setAttribute("aria-label", "Album opened");

  const reveal = gsap.timeline();
  reveal
    .to(backgroundLayer, { opacity: 1, scale: 1, duration: 1, ease: "power2.out", force3D: true }, 0)
    .to(heroGalleryViewport, { opacity: 1, duration: 0.25, ease: "power1.out" }, 0.04)
    .to(vinylState1, { opacity: 0, scale: 1.12, duration: 0.24, ease: "power2.out" }, 0)
    .to(vinylState2, { opacity: 1, scale: 0.92, duration: 0.42, ease: "back.out(1.5)", force3D: true }, 0.06)
    .to(
      vinylInner,
      {
        keyframes: [
          { x: 18, y: -6, scale: 1.03, rotation: -1.4, duration: 0.16, ease: "power2.out" },
          { x: 56, y: 0, scale: 1, rotation: 5.5, duration: 0.34, ease: "back.out(1.4)" }
        ],
        force3D: true
      },
      0
    );

  startVinylSpin();
  gsap.delayedCall(0.08, () => {
    applyHeroFinalLayout(true);
  });
  gsap.delayedCall(1.05, () => {
    gsap.to(vinylInner, {
      scale: 0.08,
      opacity: 0,
      duration: 0.76,
      ease: "power3.inOut"
    });
  });
});
