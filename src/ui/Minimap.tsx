import { camera } from "@/renderer/camera";
import { MinimapRenderer } from "@/renderer/minimap";
import { Application } from "pixi.js";
import { memo, MouseEvent, useEffect, useRef } from "react";

function Minimap_() {
  const minimapRef = useRef<MinimapRenderer>(null);
  if (!minimapRef.current) {
    minimapRef.current = new MinimapRenderer();
  }

  const minimap = minimapRef.current;

  useEffect(() => {
    return () => {
      minimap.destroy();
    };
  }, []);

  async function create(canvas: HTMLCanvasElement) {
    if (minimap.app) {
      return;
    }

    await minimap.calculateSize();

    const app = new Application();
    await app.init({
      canvas,
      width: minimap.width,
      height: minimap.height,
      autoStart: false,
    });

    minimap.create(app);
  }

  function moveViewport(event: MouseEvent<HTMLCanvasElement>) {
    if (event.buttons === 1) {
      const canvasRect = minimap.app.canvas.getBoundingClientRect();
      camera.moveTo(
        (event.clientX - canvasRect.x) / minimap.scale,
        (event.clientY - canvasRect.y) / minimap.scale,
      );
    }
  }

  return (
    <canvas
      ref={(canvas) => {
        if (canvas) {
          create(canvas);
        }
      }}
      onMouseMove={moveViewport}
      onMouseDown={moveViewport}
    ></canvas>
  );
}

export const Minimap = memo(Minimap_);
