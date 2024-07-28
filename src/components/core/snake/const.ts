import { Directions, Key } from "./types";

export const COLS = 60;
export const ROWS = 60;
export const GAP_SIZE = 1;
export const CELL_SIZE = 10;
export const CANVAS_WIDTH = COLS * (CELL_SIZE + GAP_SIZE);
export const CANVAS_HEIGHT = ROWS * (CELL_SIZE + GAP_SIZE);
export const SNAKE_LENGTH = 5;
export const APPLE_COUNT = 2;
export const SPEED = 500;
export const DIRECTIONS: Directions = {
  ArrowLeft: { x: -1, y: 0 }, // left
  ArrowRight: { x: 1, y: 0 }, //right
  ArrowUp: { x: 0, y: -1 }, // up
  ArrowDown: { x: 0, y: 1 }, // down
};
export const INITIAL_DIRECTION = DIRECTIONS[Key.RIGHT];
