import {
  CELL_SIZE,
  SNAKE_LENGTH,
  COLS,
  ROWS,
  APPLE_COUNT,
  GAP_SIZE,
} from "./const";
import { Point2D, Scene, Direction } from "./types";

export const nextDirection = (previous: Direction, next: Direction) => {
  if (previous.x === -1 * next.x || previous.y === -1 * next.y) {
    return previous;
  }
  return next;
};

export const snakeMove = (
  snake: Point2D[],
  direction: Direction,
  snakeLength: number
) => {
  const { x, y } = snake[0];
  const dx = x + direction.x;
  const dy = y + direction.y;
  if (snakeLength > snake.length) {
    const tail = { x: dx, y: dy };
    snake.unshift(tail);
  } else {
    const tail = snake.pop()!;
    tail.x = dx;
    tail.y = dy;
    snake.unshift(tail);
  }

  return [...snake];
};

export const generateSnake: () => Point2D[] = () => {
  return Array(SNAKE_LENGTH)
    .fill(1)
    .map((_, i) => ({ x: SNAKE_LENGTH - i - 1, y: 0 }));
};

export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const checkCollision = (
  a: Point2D | Direction,
  b: Point2D | Direction
) => {
  return a.x === b.x && a.y === b.y;
};

export const isEmptyCell = (position: Direction, snake: Array<Point2D>) => {
  return !snake.some((segment) => checkCollision(segment, position));
};

export const getRandomPosition: (filledPoints: Point2D[]) => Point2D = (
  filledPoints: Point2D[]
) => {
  let position = {
    x: getRandomNumber(0, COLS - 1),
    y: getRandomNumber(0, ROWS - 1),
  };

  if (isEmptyCell(position, filledPoints)) {
    return { ...position };
  }

  return getRandomPosition(filledPoints);
};

export const generateApples: (snake: Point2D[]) => Point2D[] = (
  snake: Point2D[] = []
) => {
  let apples: Point2D[] = [];

  for (let i = 0; i < APPLE_COUNT; i++) {
    apples.push(getRandomPosition(snake.concat(apples)));
  }
  return apples;
};

export const eat = (
  apples: Point2D[],
  snake: Point2D[]
  // panel: HTMLElement
) => {
  const head = snake[0];
  const appleIndex = apples.findIndex((apple) => {
    return checkCollision(apple, head);
  });
  if (appleIndex !== -1) {
    apples.splice(appleIndex, 1);
    return [...apples, getRandomPosition(snake.concat(apples))];
  }
  return apples;
};

export const isSceneGameOver = (scene: Scene) => {
  let snake = scene.snake;
  console.log("isGameOver", JSON.stringify(scene), snake.length);
  let head = snake[0];
  let body = snake.slice(1, snake.length);
  console.log(body.some((segment) => checkCollision(segment, head)));
  return body.some((segment) => {
    console.log(segment, head);
    return checkCollision(segment, head);
  });
};

export const paintCell = (point: Point2D) => {
  let { x, y } = point;
  x = point.x * (CELL_SIZE + GAP_SIZE);
  y = point.y * (CELL_SIZE + GAP_SIZE);
  return { x, y };
};

export const wrapBounds = (point: Point2D) => {
  point.x = point.x >= COLS ? 0 : point.x < 0 ? COLS - 1 : point.x;
  point.y = point.y >= ROWS ? 0 : point.y < 0 ? COLS - 1 : point.y;
  return point;
};
