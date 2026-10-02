// homedock-ui/vue3/static/js/__Utils__/collapseLeave.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const COLLAPSE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const COLLAPSE_MS = 280;

export function expandEnter(el: Element, done: () => void) {
  const node = el as HTMLElement;
  const target = node.offsetHeight;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    node.style.removeProperty("height");
    node.style.removeProperty("overflow");
    node.style.removeProperty("opacity");
    node.style.removeProperty("transform");
    node.style.removeProperty("transition");
    done();
  };

  node.style.height = "0px";
  node.style.overflow = "hidden";
  node.style.opacity = "0";
  node.style.transform = "scale(0.97)";
  void node.offsetHeight;
  node.style.transition = `height ${COLLAPSE_MS}ms ${COLLAPSE_EASING}, opacity 220ms ease 60ms, transform ${COLLAPSE_MS}ms ${COLLAPSE_EASING}`;

  requestAnimationFrame(() => {
    node.style.height = `${target}px`;
    node.style.opacity = "1";
    node.style.transform = "scale(1)";
  });

  node.addEventListener("transitionend", (event) => {
    if (event.target === node && event.propertyName === "height") finish();
  });
  setTimeout(finish, COLLAPSE_MS + 120);
}

export function collapseLeave(el: Element, done: () => void, onSettled?: () => void) {
  const node = el as HTMLElement;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onSettled?.();
    done();
  };

  node.style.height = `${node.offsetHeight}px`;
  node.style.minHeight = "0px";
  node.style.overflow = "hidden";
  node.style.transition = `height ${COLLAPSE_MS}ms ${COLLAPSE_EASING}, padding-top ${COLLAPSE_MS}ms ${COLLAPSE_EASING}, padding-bottom ${COLLAPSE_MS}ms ${COLLAPSE_EASING}, opacity 180ms ease, transform ${COLLAPSE_MS}ms ${COLLAPSE_EASING}`;
  void node.offsetHeight;

  requestAnimationFrame(() => {
    node.style.height = "0px";
    node.style.paddingTop = "0px";
    node.style.paddingBottom = "0px";
    node.style.opacity = "0";
    node.style.transform = "scale(0.97)";
  });

  node.addEventListener("transitionend", (event) => {
    if (event.target === node && event.propertyName === "height") finish();
  });
  setTimeout(finish, COLLAPSE_MS + 80);
}
