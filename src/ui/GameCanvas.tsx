import { camera } from "@/renderer/camera";
import { controls } from "@/renderer/controls";
import { renderer } from "@/renderer/renderer";
import { memo } from "react";
import { useEventListener } from "usehooks-ts";

function GameCanvas_() {
  useEventListener("keydown", (event) => controls.onKeyDown(event));
  useEventListener("keyup", () => controls.onKeyUp());

  useEventListener("resize", () => {
    renderer.resize(window.innerWidth, window.innerHeight);
    camera.refresh();
  });

  return (
    <canvas
      ref={(canvas) => {
        if (canvas) {
          renderer.setCanvas(canvas);
        }
      }}
      onClick={(e) => controls.onClick(e.nativeEvent)}
      onMouseDown={(e) => controls.onMouseDown(e.nativeEvent)}
      onMouseUp={() => controls.onMouseUp()}
      onMouseMove={(e) => controls.onMouseMove(e.nativeEvent)}
      onWheel={(e) => controls.onWheel(e.nativeEvent)}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

export const GameCanvas = memo(GameCanvas_);
