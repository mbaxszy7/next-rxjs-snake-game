"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { CANVAS_HEIGHT, CANVAS_WIDTH, CELL_SIZE, SPEED } from "./const";
import { paintCell, wrapBounds } from "./utils";
import { cn } from "@/lib/utils";
import useScene from "./useScene";

function Snake() {
  const [isStopped, setIsStopped] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [speed, setSpeed] = useState(SPEED);
  const scene = useScene(isStopped, speed);

  return (
    <div className="flex items-center justify-center flex-col">
      <div className=" flex items-center">
        <Button
          onClick={() => {
            setSpeed((speed) => speed - 10);
          }}
          disabled={isStopped || speed <= 0}
        >
          Speed + 10
        </Button>
        <div className=" mx-4">current speed: {SPEED + (SPEED - speed)}/ms</div>
        <Button
          onClick={() => {
            setSpeed((speed) => speed + 10);
          }}
          disabled={isStopped || speed >= 1000}
        >
          Speed - 10
        </Button>
      </div>
      <div
        className="relative m-4 bg-slate-100"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <div
          className="absolute w-full h-full text-slate-300 text-center text-9xl"
          style={{ lineHeight: `${CANVAS_HEIGHT}px` }}
        >
          {scene.score}
        </div>
        {isGameOver && (
          <div
            className="absolute w-full h-full text-black text-center text-6xl bg-slate-100"
            style={{ lineHeight: `${CANVAS_HEIGHT}px` }}
          >
            Game Over!
          </div>
        )}
        {scene.apples.map((cell, index) => {
          const { x, y } = paintCell(cell);
          return (
            <div
              key={index}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                left: x,
                top: y,
              }}
              className=" absolute bg-red-500"
            />
          );
        })}
        {scene.snake.map((cell, index) => {
          const { x, y } = paintCell(wrapBounds(cell));
          return (
            <div
              key={index}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                willChange: "left, top",
                left: x,
                top: y,
              }}
              className={cn(
                " absolute",
                index === 0 ? "bg-slate-900" : "bg-blue-500"
              )}
            />
          );
        })}
      </div>
      <Button
        variant={!isStopped ? "destructive" : "default"}
        onClick={() => {
          setIsStopped((pre) => !pre);
          if (isGameOver) {
            setIsGameOver(false);
          }
        }}
      >
        {isStopped ? "Start" : "Stop"}
      </Button>
    </div>
  );
}

export default Snake;
