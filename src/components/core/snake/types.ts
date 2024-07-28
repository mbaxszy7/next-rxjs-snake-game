export interface Point2D {
  x: number;
  y: number;
}

export interface Scene {
  snake: Array<Point2D>;
  apples: Array<Point2D>;
}

export interface Directions {
  [key: string]: Direction;
}

export type Direction = Omit<Point2D, "ele">;

export enum Key {
  LEFT = "ArrowLeft",
  RIGHT = "ArrowRight",
  UP = "ArrowUp",
  DOWN = "ArrowDown",
}
