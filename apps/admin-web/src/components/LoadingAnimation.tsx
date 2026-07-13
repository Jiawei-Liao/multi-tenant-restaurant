import { useEffect, useRef } from "react";
import styles from "./LoadingAnimation.module.css";

const SLOT_COUNT = 5;
const ICON_SIZE = 32;
const ICON_BUFFER = 6;

type LoaderWindow = Window & {
  __restaurantLoaderIcons?: string[];
};

function LoadingAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const icons = (window as LoaderWindow).__restaurantLoaderIcons;

    if (!container || !icons?.length) {
      return;
    }

    const loader = container;
    const iconSet = icons;
    const slotTimers: Array<ReturnType<typeof setTimeout>> = [];
    const animations = new Set<Animation>();
    let stopped = false;

    function rand(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    function buildTrajectory(
      dx: number,
      peakPx: number,
      rotDeg: number,
      samples: number,
    ): Keyframe[] {
      const frames: Keyframe[] = [];

      for (let index = 0; index <= samples; index += 1) {
        const progress = index / samples;
        const x = dx * progress;
        const y = -4 * peakPx * progress * (1 - progress);
        const rotation = rotDeg * progress;

        frames.push({
          transform:
            `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) ` +
            `rotate(${rotation.toFixed(1)}deg)`,
          offset: progress,
        });
      }

      return frames;
    }

    function tossFromSlot(slotIndex: number) {
      if (stopped || !loader.isConnected) {
        return;
      }

      const width = loader.clientWidth;
      const height = loader.clientHeight;
      const marginFraction = (ICON_SIZE / 2 + ICON_BUFFER) / width;
      const startFraction = rand(marginFraction, 1 - marginFraction);
      const relativePosition =
        (startFraction - marginFraction) / (1 - 2 * marginFraction);

      let direction: 1 | -1;

      if (relativePosition < 0.3) direction = 1;
      else if (relativePosition > 0.7) direction = -1;
      else direction = Math.random() < 0.5 ? -1 : 1;

      const tossHeight = 0.3 + 0.65 * Math.pow(Math.random(), 0.35);
      const boundary = direction === 1 ? 1 - marginFraction : marginFraction;
      const available = Math.abs(boundary - startFraction);
      const heightSkew = 1 + tossHeight * 0.25;
      const spread = Math.min(1, rand(0.2, 1) * heightSkew);
      const dx = available * spread * direction * width;
      const peakPx = tossHeight * height * 0.92;
      const rotation = rand(180, 420) * direction;
      const duration = rand(2.2, 3.4);
      const piece = document.createElement("div");

      piece.className = styles.piece!;
      piece.innerHTML =
        iconSet[Math.floor(Math.random() * iconSet.length)]!;
      piece.style.left = `${startFraction * 100}%`;
      loader.appendChild(piece);

      const animation = piece.animate(
        buildTrajectory(dx, peakPx, rotation, 24),
        {
          duration: duration * 1000,
          easing: "linear",
          fill: "forwards",
        },
      );

      animations.add(animation);
      animation.onfinish = () => {
        animations.delete(animation);
        piece.remove();
      };

      const multiplier = 0.5 + 0.8 * Math.pow(Math.random(), 0.6);
      slotTimers[slotIndex] = setTimeout(
        () => tossFromSlot(slotIndex),
        duration * multiplier * 1000,
      );
    }

    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const initialDelay = rand(0, 4) + index * 0.15;
      slotTimers[index] = setTimeout(
        () => tossFromSlot(index),
        initialDelay * 1000,
      );
    }

    return () => {
      stopped = true;
      slotTimers.forEach(clearTimeout);
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      loader.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.loader}
      role="status"
      aria-label="Checking your session"
    />
  );
}

export default LoadingAnimation;
