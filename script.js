const coverShell = document.querySelector(".cover-shell");
const vinylTrigger = document.getElementById("vinylTrigger");
const vinylInner = document.getElementById("vinylInner");
const vinylSpinLayer = document.getElementById("vinylSpinLayer");
const vinylState1 = document.querySelector(".vinyl-state-1");
const vinylState2 = document.querySelector(".vinyl-state-2");
const backgroundLayer = document.querySelector(".background-layer");
const galleryViewport = document.getElementById("galleryViewport");
const galleryTrack = document.getElementById("galleryTrack");
const galleryHitLayer = document.getElementById("galleryHitLayer");
const projectTwoPanel = document.getElementById("projectTwoPanel");

const spreadItems = [
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

const timings = {
  orbitToGrid: 1.05,
  loopDelay: 1.95
};
const gridScale = 0.78;
const burstStagger = 0.02;

let cards = [];
let loopHeight = 0;
let scrollOffset = 0;
let loopStarted = false;
let rafId = null;
let stage = "idle";
let lastFrameTime = 0;
const imageRatios = new Map();
let layoutRefreshQueued = false;
let hitAreas = [];

function getFirstCards() {
  return cards.map(({ first }) => first);
}

function getSecondCards() {
  return cards.map(({ second }) => second);
}

function clearFocusedCards() {
  galleryTrack?.classList.remove("is-hovering");
  cards.forEach(({ first, second }) => {
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

function focusCard(index, duplicate) {
  if (stage !== "grid") {
    return;
  }

  const pair = cards[index];
  if (!pair) {
    return;
  }

  clearFocusedCards();

  const target = duplicate ? pair.second : pair.first;
  galleryTrack?.classList.add("is-hovering");
  target.classList.add("is-focused");
  gsap.to(target, {
    scale: 1.07,
    yPercent: -4,
    duration: 0.24,
    ease: "power3.out",
    overwrite: "auto"
  });
}

function hideHitAreas() {
  hitAreas.forEach((hit) => {
    hit.classList.remove("is-active");
    hit.style.pointerEvents = "none";
    hit.style.width = "0px";
    hit.style.height = "0px";
  });
}

function getGridMetrics() {
  const mobile = window.innerWidth < 720;
  const columns = mobile ? 2 : 3;
  const gap = mobile ? 20 : 36;
  const sidePadding = mobile ? 18 : 48;
  const topPadding = mobile ? 88 : 104;
  const contentWidth = window.innerWidth - sidePadding * 2;
  const columnWidth = (contentWidth - gap * (columns - 1)) / columns;
  const baseWidth = columnWidth * gridScale;
  const widths = mobile ? [1, 1] : [1, 1, 1];

  return { columns, gap, sidePadding, topPadding, baseWidth, widths, columnWidth };
}

function estimateCardHeight(width, index) {
  const ratio = imageRatios.get(index) || 0.78;
  return width * ratio;
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

function getOrbitPosition(index, total, width, height) {
  const center = getBurstCenter();
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const edgeRadiusX = window.innerWidth * 0.5 - width * 0.72;
  const edgeRadiusY = window.innerHeight * 0.5 - estimateCardHeight(width, index) * 0.72;
  const band = index % 3;
  const bandScale = band === 0 ? 0.98 : band === 1 ? 0.78 : 0.58;
  const wobble = band === 0 ? 0 : band === 1 ? 0.12 : -0.1;
  const finalAngle = angle + wobble;
  const radiusX = edgeRadiusX * bandScale;
  const radiusY = edgeRadiusY * bandScale;
  const x = center.x + Math.cos(finalAngle) * radiusX - width * 0.5;
  const y = center.y + Math.sin(finalAngle) * radiusY - estimateCardHeight(width, index) * 0.5;
  const rotate = (Math.cos(finalAngle) * 5).toFixed(2);

  return { x, y, rotate };
}

function buildCardElement(item, index, duplicate = false) {
  const wrapper = document.createElement("article");
  wrapper.className = "orbit-card";
  if (duplicate) {
    wrapper.classList.add("orbit-card-duplicate");
  }
  if (item.src.endsWith("/3.png") || item.src.endsWith("/4.png")) {
    wrapper.classList.add("transparent-art");
  }
  if (item.src.endsWith("/1首图.png")) {
    wrapper.classList.add("detail-entry", "detail-entry-1");
  }
  if (item.src.endsWith("/2首图.PNG")) {
    wrapper.classList.add("detail-entry", "detail-entry-2");
  }

  const media = document.createElement("div");

  if (item.href) {
    wrapper.classList.add("is-link");
    wrapper.setAttribute("aria-label", `Open project ${index + 1}`);
  }

  const img = document.createElement("img");
  img.src = encodeURI(item.src);
  img.alt = `Cover image ${index + 1}`;
  img.addEventListener("load", () => {
    if (img.naturalWidth > 0) {
      imageRatios.set(index, img.naturalHeight / img.naturalWidth);
      queueLayoutRefresh();
    }
  });

  media.appendChild(img);
  wrapper.appendChild(media);
  wrapper.dataset.duplicate = duplicate ? "true" : "false";
  return wrapper;
}

function buildHitArea(item, index, duplicate = false) {
  const hit = item.href ? document.createElement("a") : document.createElement("button");
  hit.className = "gallery-hit";

  if (!item.href) {
    hit.type = "button";
  }

  if (item.href) {
    hit.classList.add("is-link");
    hit.setAttribute("aria-label", `Open project ${index + 1}`);
    hit.href = item.href;
  } else {
    hit.setAttribute("aria-hidden", "true");
    hit.tabIndex = -1;
  }

  hit.dataset.index = String(index);
  hit.dataset.duplicate = duplicate ? "true" : "false";

  hit.addEventListener("pointerenter", () => {
    focusCard(index, duplicate);
  });

  hit.addEventListener("pointerleave", () => {
    clearFocusedCards();
  });

  if (!item.href) {
    hit.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  return hit;
}

function createCards() {
  if (!galleryTrack || !galleryHitLayer) {
    return;
  }

  galleryTrack.innerHTML = "";
  galleryHitLayer.innerHTML = "";
  cards = [];
  hitAreas = [];

  spreadItems.forEach((item, index) => {
    const first = buildCardElement(item, index, false);
    const second = buildCardElement(item, index, true);
    const firstHit = buildHitArea(item, index, false);
    const secondHit = buildHitArea(item, index, true);
    galleryTrack.appendChild(first);
    galleryTrack.appendChild(second);
    galleryHitLayer.appendChild(firstHit);
    galleryHitLayer.appendChild(secondHit);
    cards.push({ first, second, index });
    hitAreas.push(firstHit, secondHit);
  });

  hideHitAreas();
}

function queueLayoutRefresh() {
  if (layoutRefreshQueued) {
    return;
  }

  layoutRefreshQueued = true;
  requestAnimationFrame(() => {
    layoutRefreshQueued = false;
    if (stage === "grid") {
      applyGridLayout(false);
    } else if (stage === "orbit") {
      applyOrbitLayout(false);
    } else {
      applyIdleLayout(false);
    }
  });
}

function getGridLayout(index) {
  const metrics = getGridMetrics();
  const { columns, gap, sidePadding, topPadding, baseWidth, widths, columnWidth } = metrics;
  const columnHeights = Array(columns).fill(topPadding);

  for (let i = 0; i <= index; i += 1) {
    const column = columnHeights.indexOf(Math.min(...columnHeights));
    const width = baseWidth * widths[column];
    const slotX = sidePadding + column * (columnWidth + gap);
    const x = slotX + (columnWidth - width) / 2;
    const y = columnHeights[column];
    const height = estimateCardHeight(width, i);
    const rotate = "0";

    columnHeights[column] += height + gap;

    if (i === index) {
      return { width, x, y, rotate };
    }
  }

  return { width: 200, x: 0, y: 0, rotate: "0" };
}

function getGridMaxHeight() {
  const metrics = getGridMetrics();
  const { columns, gap, topPadding, baseWidth, widths } = metrics;
  const columnHeights = Array(columns).fill(topPadding);

  spreadItems.forEach((_, index) => {
    const column = columnHeights.indexOf(Math.min(...columnHeights));
    const width = baseWidth * widths[column];
    columnHeights[column] += estimateCardHeight(width, index) + gap;
  });

  return Math.max(...columnHeights) - gap;
}

function getOrbitLayoutData() {
  const total = cards.length;

  return cards.map(({ index }) => {
    const width = (window.innerWidth < 720 ? 110 : 132) + (index % 4) * 14;
    const height = estimateCardHeight(width, index);
    const orbit = getOrbitPosition(index, total, width, height);

    return {
      width,
      x: orbit.x,
      y: orbit.y,
      rotation: Number(orbit.rotate)
    };
  });
}

function getGridLayoutData() {
  loopHeight = getGridMaxHeight();

  return cards.map(({ index }) => {
    const layout = getGridLayout(index);

    return {
      width: layout.width,
      x: layout.x,
      y: layout.y,
      rotation: 0
    };
  });
}

function applyIdleLayout(animate = false) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  hideHitAreas();
  clearFocusedCards();

  cards.forEach(({ first, second, index }) => {
    const baseWidth = window.innerWidth < 720 ? 108 : 152;
    const width = baseWidth + (index % 3) * 18;
    const height = estimateCardHeight(width, index);

    [first, second].forEach((card) => {
      card.style.width = `${width}px`;
      const target = {
        x: centerX - width / 2,
        y: centerY - height / 2,
        rotation: 0,
        scale: 0.18,
        opacity: 0
      };
      if (animate) {
        gsap.to(card, { ...target, duration: 0.4, ease: "power2.out", overwrite: "auto" });
      } else {
        gsap.set(card, target);
      }
    });
  });
}

function applyOrbitLayout(animate = true) {
  const layoutData = getOrbitLayoutData();
  const firstCards = getFirstCards();
  const secondCards = getSecondCards();
  hideHitAreas();
  clearFocusedCards();

  firstCards.forEach((card, index) => {
    card.style.width = `${layoutData[index].width}px`;
  });
  secondCards.forEach((card, index) => {
    card.style.width = `${layoutData[index].width}px`;
  });

  if (animate) {
    gsap.fromTo(
      firstCards,
      {
        x: (index) => getBurstCenter().x - layoutData[index].width * 0.5,
        y: (index) => getBurstCenter().y - estimateCardHeight(layoutData[index].width, index) * 0.5,
        rotation: 0,
        scale: 0.08,
        opacity: 0,
        force3D: true
      },
      {
        x: (index) => layoutData[index].x,
        y: (index) => layoutData[index].y,
        rotation: (index) => layoutData[index].rotation,
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: "power4.out",
        stagger: burstStagger,
        overwrite: "auto",
        force3D: true
      }
    );
  } else {
    gsap.set(firstCards, {
      x: (index) => layoutData[index].x,
      y: (index) => layoutData[index].y,
      rotation: (index) => layoutData[index].rotation,
      scale: 1,
      opacity: 1,
      force3D: true
    });
  }

  gsap.set(secondCards, {
    x: (index) => layoutData[index].x,
    y: (index) => layoutData[index].y,
    rotation: (index) => layoutData[index].rotation,
    scale: 1,
    opacity: 0,
    force3D: true
  });
}

function applyGridLayout(animate = true) {
  const layoutData = getGridLayoutData();
  const firstCards = getFirstCards();
  const secondCards = getSecondCards();
  galleryTrack.style.height = `${loopHeight * 2}px`;
  if (galleryHitLayer) {
    galleryHitLayer.style.height = `${loopHeight * 2}px`;
  }

  firstCards.forEach((card, index) => {
    card.style.width = `${layoutData[index].width}px`;
  });
  secondCards.forEach((card, index) => {
    card.style.width = `${layoutData[index].width}px`;
  });

  firstCards.forEach((card, index) => {
    card.style.zIndex = card.classList.contains("detail-entry")
      ? String(30 - index)
      : String(10 + (index % 6));
  });
  secondCards.forEach((card, index) => {
    card.style.zIndex = "1";
  });

  cards.forEach(({ first, index }) => {
    const base = layoutData[index];
    const height = estimateCardHeight(base.width, index);
    const hitWidth = Math.max(72, base.width);
    const hitHeight = Math.max(72, height);
    const hitX = base.x;
    const hitY = base.y;
    const hitZIndex = first.classList.contains("detail-entry") ? "40" : "24";
    const firstHit = hitAreas[index * 2];
    const secondHit = hitAreas[index * 2 + 1];

    [firstHit, secondHit].forEach((hit) => {
      if (!hit) {
        return;
      }

      hit.classList.add("is-active");
      hit.style.pointerEvents = "auto";
      hit.style.width = `${hitWidth}px`;
      hit.style.height = `${hitHeight}px`;
      hit.style.zIndex = hitZIndex;
    });

    if (firstHit) {
      firstHit.style.left = `${hitX}px`;
      firstHit.style.top = `${hitY}px`;
    }

    if (secondHit) {
      secondHit.style.left = `${hitX}px`;
      secondHit.style.top = `${hitY + loopHeight}px`;
    }
  });

  if (animate) {
    gsap.to(firstCards, {
      x: (index) => layoutData[index].x,
      y: (index) => layoutData[index].y,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: 0.72,
      ease: "power3.out",
      stagger: 0.014,
      overwrite: "auto",
      force3D: true
    });
    gsap.to(secondCards, {
      x: (index) => layoutData[index].x,
      y: (index) => layoutData[index].y + loopHeight,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: 0.64,
      ease: "power2.out",
      stagger: 0.012,
      overwrite: "auto",
      force3D: true
    });
  } else {
    gsap.set(firstCards, {
      x: (index) => layoutData[index].x,
      y: (index) => layoutData[index].y,
      rotation: 0,
      scale: 1,
      opacity: 1,
      force3D: true
    });
    gsap.set(secondCards, {
      x: (index) => layoutData[index].x,
      y: (index) => layoutData[index].y + loopHeight,
      rotation: 0,
      scale: 1,
      opacity: 1,
      force3D: true
    });
  }
}

function startVinylSpin() {
  vinylSpinLayer?.classList.add("is-spinning");
}

function startLoop() {
  if (loopStarted || !galleryTrack || !galleryHitLayer || stage !== "grid") {
    return;
  }

  loopStarted = true;
  lastFrameTime = performance.now();

  const step = (time) => {
    const delta = time - lastFrameTime;
    lastFrameTime = time;
    scrollOffset = (scrollOffset + delta * 0.15) % loopHeight;
    galleryTrack.style.transform = `translateY(${-scrollOffset}px)`;
    galleryHitLayer.style.transform = `translateY(${-scrollOffset}px)`;
    rafId = window.requestAnimationFrame(step);
  };

  rafId = window.requestAnimationFrame(step);
}

function resetProjectTwoScene() {
  if (!projectTwoPanel) {
    return;
  }
  projectTwoPanel.dataset.state = "closed";
}

function stopLoop() {
  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  loopStarted = false;
  scrollOffset = 0;
  if (galleryTrack) {
    galleryTrack.style.transform = "translateY(0)";
  }
  if (galleryHitLayer) {
    galleryHitLayer.style.transform = "translateY(0)";
  }
}

function setupCover() {
  createCards();
  gsap.set(vinylState2, { opacity: 0, scale: 0.82, rotation: 0 });
  gsap.set(vinylState1, { opacity: 1, scale: 1.24 });
  gsap.set(vinylSpinLayer, { opacity: 1, rotation: 0 });
  gsap.set(vinylInner, { x: 0, y: 0, scale: 1, rotation: 0 });
  gsap.set(galleryViewport, { opacity: 0 });
  gsap.set(backgroundLayer, { opacity: 0, scale: 1.08 });
  vinylSpinLayer?.classList.remove("is-spinning");
  applyIdleLayout();
  resetProjectTwoScene();
}

setupCover();

window.addEventListener("resize", () => {
  stopLoop();

  if (stage === "idle") {
    applyIdleLayout();
    return;
  }

  if (stage === "orbit") {
    applyOrbitLayout(false);
    return;
  }

  applyGridLayout(false);
  window.setTimeout(startLoop, 80);
});

vinylTrigger?.addEventListener("click", () => {
  if (!coverShell || stage !== "idle" || typeof gsap === "undefined") {
    return;
  }

  stage = "orbit";
  coverShell.dataset.state = "orbit";
  vinylTrigger.setAttribute("aria-label", "Album opened");
  galleryTrack.classList.remove("is-hovering");
  galleryTrack.classList.add("is-bursting");

  const reveal = gsap.timeline();
  reveal
    .to(backgroundLayer, { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out", force3D: true }, 0)
    .to(galleryViewport, { opacity: 1, duration: 0.35, ease: "power1.out" }, 0.08)
    .to(vinylState1, { opacity: 0, scale: 1.12, duration: 0.24, ease: "power2.out" }, 0)
    .to(vinylState2, { opacity: 1, scale: 0.92, duration: 0.42, ease: "back.out(1.5)", force3D: true }, 0.08)
    .to(
      vinylInner,
      {
        keyframes: [
          { x: 18, y: -6, scale: 1.04, rotation: -1.6, duration: 0.18, ease: "power2.out" },
          { x: 54, y: -2, scale: 1.02, rotation: 2.8, duration: 0.3, ease: "power2.out" },
          { x: 84, y: 0, scale: 1, rotation: 6, duration: 0.36, ease: "back.out(1.5)" }
        ],
        force3D: true
      },
      0
    );

  startVinylSpin();
  gsap.delayedCall(0.08, () => {
    applyOrbitLayout(true);
  });

  gsap.delayedCall(timings.orbitToGrid, () => {
    stage = "grid";
    coverShell.dataset.state = "grid";
    applyGridLayout(true);
    galleryTrack.classList.remove("is-bursting");
    gsap.to(vinylInner, {
      scale: 0.08,
      opacity: 0,
      duration: 0.78,
      ease: "power3.inOut"
    });
  });

  gsap.delayedCall(timings.loopDelay, () => {
    startLoop();
  });
});
