// homedock-ui/vue3/static/js/__Utils__/IconFlight.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const FLIGHT_Z_INDEX = "10000";

export interface FlightTarget {
  left: number;
  top: number;
  width: number;
}

export function flyIcon(source: HTMLElement, to: FlightTarget, options: { fadeOut?: boolean } = {}): Promise<void> {
  const from = source.getBoundingClientRect();
  if (!from.width) return Promise.resolve();

  const dx = to.left - from.left;
  const dy = to.top - from.top;
  const scale = to.width / from.width;
  const distance = Math.hypot(dx, dy);
  const duration = Math.min(750, 420 + distance * 0.35);
  const peak = Math.min(0, dy) - Math.min(70, 28 + distance * 0.12);

  const carrier = document.createElement("div");
  Object.assign(carrier.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    zIndex: FLIGHT_Z_INDEX,
    pointerEvents: "none",
    willChange: "transform",
  });

  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    margin: "0",
    visibility: "visible",
    transformOrigin: "top left",
    willChange: "transform, opacity",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.28)",
  });

  carrier.appendChild(ghost);
  document.body.appendChild(carrier);

  const horizontal = carrier.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], { duration, easing: "cubic-bezier(0.45, 0, 0.35, 1)", fill: "forwards" });

  const midScale = Math.max(1, scale) * 1.12;
  ghost.animate(
    [
      { transform: "translateY(0) scale(1)", opacity: 1, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
      { transform: `translateY(${peak}px) scale(${midScale})`, opacity: 1, offset: 0.45, easing: "cubic-bezier(0.55, 0, 0.8, 0.4)" },
      { transform: `translateY(${dy}px) scale(${scale})`, opacity: options.fadeOut ? 0 : 1 },
    ],
    { duration, fill: "forwards" },
  );

  return horizontal.finished
    .catch(() => undefined)
    .then(() => {
      carrier.remove();
    });
}

export function landBounce(el: HTMLElement, options: { glow?: boolean } = {}) {
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.16)", offset: 0.35 }, { transform: "scale(0.95)", offset: 0.65 }, { transform: "scale(1)" }], { duration: 480, easing: "ease-out" });

  if (options.glow) {
    el.animate([{ filter: "drop-shadow(0 0 0 rgba(96, 165, 250, 0))" }, { filter: "drop-shadow(0 0 10px rgba(96, 165, 250, 0.95))", offset: 0.3 }, { filter: "drop-shadow(0 0 0 rgba(96, 165, 250, 0))" }], { duration: 1100, easing: "ease-out" });
  }
}

export function isRectVisibleWithin(rect: DOMRect, container: HTMLElement | null): boolean {
  const bounds = container ? container.getBoundingClientRect() : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return rect.width > 0 && centerX >= bounds.left && centerX <= bounds.right && centerY >= bounds.top && centerY <= bounds.bottom;
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
