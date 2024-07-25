"use client";

import {
  useObservable,
  useObservableCallback,
  useObservableEagerState,
  useObservableRef,
  useObservableState,
  useSubscription,
} from "observable-hooks";
import {
  animationFrameScheduler,
  BehaviorSubject,
  combineLatest,
  interval,
  of,
} from "rxjs";
import {
  map,
  withLatestFrom,
  filter,
  combineLatestWith,
  tap,
  scan,
  startWith,
  distinctUntilChanged,
  skip,
  share,
  takeWhile,
  switchMap,
} from "rxjs/operators";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

interface Point2D {
  x: number;
  y: number;
  ele: HTMLDivElement;
}

interface Scene {
  snake: Array<Point2D>;
  apples: Array<Point2D>;
}

interface Directions {
  [key: string]: Direction;
}

type Direction = Omit<Point2D, "ele">;

enum Key {
  LEFT = "ArrowLeft",
  RIGHT = "ArrowRight",
  UP = "ArrowUp",
  DOWN = "ArrowDown",
}

const COLS = 60;
const ROWS = 60;
const GAP_SIZE = 1;
const CELL_SIZE = 10;
const CANVAS_WIDTH = COLS * (CELL_SIZE + GAP_SIZE);
const CANVAS_HEIGHT = ROWS * (CELL_SIZE + GAP_SIZE);

const SNAKE_LENGTH = 5;

const APPLE_COUNT = 2;

const SPEED = 400;

const DIRECTIONS: Directions = {
  ArrowLeft: { x: -1, y: 0 }, // left
  ArrowRight: { x: 1, y: 0 }, //right
  ArrowUp: { x: 0, y: -1 }, // up
  ArrowDown: { x: 0, y: 1 }, // down
};

const INITIAL_DIRECTION = DIRECTIONS[Key.RIGHT];

const nextDirection = (previous: Direction, next: Direction) => {
  if (previous.x === -1 * next.x || previous.y === -1 * next.y) {
    return previous;
  }
  return next;
};
const generateCell = () => {
  const cell = document.createElement("div");
  cell.style.position = "absolute";
  cell.style.willChange = "left, top";
  cell.style.width = CELL_SIZE + "px";
  cell.style.height = CELL_SIZE + "px";
  return cell;
};
const snakeMove = (
  snake: Point2D[],
  direction: Direction,
  snakeLength: number
) => {
  const { x, y } = snake[0];
  const dx = x + direction.x;
  const dy = y + direction.y;
  if (snakeLength > snake.length) {
    const tail = { x: dx, y: dy, ele: generateCell() };
    snake.unshift(tail);
  } else {
    const tail = snake.pop()!;
    tail.x = dx;
    tail.y = dy;
    snake.unshift(tail);
  }

  return snake;
};
const generateSnake: () => Point2D[] = () => {
  return Array(SNAKE_LENGTH)
    .fill(1)
    .map((_, i) => ({ x: SNAKE_LENGTH - i - 1, y: 0, ele: generateCell() }));
};

const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
const checkCollision = (a: Point2D | Direction, b: Point2D | Direction) => {
  return a.x === b.x && a.y === b.y;
};
const isEmptyCell = (position: Direction, snake: Array<Point2D>) => {
  return !snake.some((segment) => checkCollision(segment, position));
};

const getRandomPosition: (filledPoints: Point2D[]) => Point2D = (
  filledPoints: Point2D[]
) => {
  let position = {
    x: getRandomNumber(0, COLS - 1),
    y: getRandomNumber(0, ROWS - 1),
  };

  if (isEmptyCell(position, filledPoints)) {
    return { ...position, ele: generateCell() };
  }

  return getRandomPosition(filledPoints);
};

const generateApples: (snake: Point2D[]) => Point2D[] = (
  snake: Point2D[] = []
) => {
  let apples: Point2D[] = [];

  for (let i = 0; i < APPLE_COUNT; i++) {
    apples.push(getRandomPosition(snake.concat(apples)));
  }
  return apples;
};

const eat = (apples: Point2D[], snake: Point2D[], panel: HTMLElement) => {
  const head = snake[0];
  const appleIndex = apples.findIndex((apple) => {
    return checkCollision(apple, head);
  });
  if (appleIndex !== -1) {
    const apple = apples[appleIndex];
    panel.removeChild(apple.ele);
    apples.splice(appleIndex, 1);
    return [...apples, getRandomPosition(snake.concat(apples))];
  }
  return apples;
};

const isSceneGameOver = (scene: Scene) => {
  let snake = scene.snake;
  console.log(
    "isGameOver",
    { ...scene },
    JSON.stringify({ snake: scene.snake }),
    snake.length
  );
  let head = snake[0];
  let body = snake.slice(1, snake.length);
  console.log(body.some((segment) => checkCollision(segment, head)));
  return body.some((segment) => {
    console.log(segment, head);
    return checkCollision(segment, head);
  });
};

const paintCell = (point: Point2D, color: string, panel: HTMLElement) => {
  let { x, y, ele: cell } = point;
  x = point.x * (CELL_SIZE + GAP_SIZE);
  y = point.y * (CELL_SIZE + GAP_SIZE);

  cell.style.left = x + "px";
  cell.style.top = y + "px";

  cell.style.background = color;

  if (panel && !panel?.contains(cell)) {
    panel.appendChild(cell);
  }
};

const wrapBounds = (point: Point2D) => {
  point.x = point.x >= COLS ? 0 : point.x < 0 ? COLS - 1 : point.x;
  point.y = point.y >= ROWS ? 0 : point.y < 0 ? COLS - 1 : point.y;
  return point;
};

const getSegmentColor = (index: number) => {
  return index === 0 ? "black" : "blue";
};

function Snake() {
  const panel = useRef<HTMLDivElement | null>(null);
  const [isStopped, setIsStopped] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [speed, setSpeed] = useState(SPEED);
  const [score, setScore] = useState(0);

  const ticker$ = useObservable(
    (input$) => {
      const speed$ = input$.pipe(switchMap(([_, speed]) => of(speed)));
      const isGameOver$ = input$.pipe(
        switchMap(([isGameOver]) => of(isGameOver))
      );
      return speed$.pipe(
        switchMap((speed) =>
          interval(speed, animationFrameScheduler).pipe(
            withLatestFrom(isGameOver$),
            filter(([, isStopped]) => {
              return !isStopped;
            }),
            map(([number]) => number)
          )
        )
      );
    },
    [isStopped, speed]
  );

  const [onKeyboardPress, direction$] = useObservableCallback<
    Direction,
    KeyboardEvent
  >((event$) => {
    return event$.pipe(
      map((e) => DIRECTIONS[e.key]),
      filter((e) => !!e),
      scan((pre, cur) => nextDirection(pre, cur)),
      startWith(INITIAL_DIRECTION),
      distinctUntilChanged()
    );
  });

  const snakeLength$ = useObservable(
    (score$) =>
      score$.pipe(
        skip(1),
        scan((acc) => acc + 1, SNAKE_LENGTH),
        startWith(SNAKE_LENGTH),
        share()
      ),
    [score]
  );

  const snake$ = useObservable(
    () =>
      ticker$
        .pipe(
          withLatestFrom(
            direction$,
            snakeLength$,
            (_, direction, snakeLength) => [direction, snakeLength] as const
          )
        )
        .pipe(
          scan(
            (acc, value) => snakeMove(acc, value[0], value[1]),
            typeof document === "undefined" ? [] : generateSnake()
          ),
          share()
        ),
    [isStopped]
  );

  const apples$ = useObservable(() =>
    snake$.pipe(
      scan((apples, snake) => {
        if (apples.length === 0) {
          return generateApples(snake);
        } else {
          return eat(apples, snake, panel.current!);
        }
      }, [] as Point2D[]),
      distinctUntilChanged(),
      share()
    )
  );

  const scene$ = useObservable(() =>
    combineLatest([snake$, apples$])
      .pipe()
      .pipe(map(([snake, apples]) => ({ snake, apples })))
      .pipe(takeWhile((scene) => !isSceneGameOver(scene)))
  );

  const appleEaten$ = useObservable(() =>
    apples$.pipe(
      skip(1),
      scan((acc) => acc + 1, 0),
      tap((number) => {
        setScore(number);
      })
    )
  );

  useSubscription(appleEaten$);

  useSubscription(
    scene$,
    (scene) => {
      scene.apples.map((apple) => paintCell(apple, "red", panel.current!));
      scene.snake.forEach((segment, index) =>
        paintCell(wrapBounds(segment), getSegmentColor(index), panel.current!)
      );
    },
    undefined,
    () => {
      setIsGameOver(true);
      setIsStopped(true);
    }
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      onKeyboardPress(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <div className="flex items-center justify-center flex-col">
      <div className=" flex items-center">
        <Button
          onClick={() => {
            setSpeed((pre) => pre - 10);
          }}
          disabled={isStopped}
        >
          Speed + 10
        </Button>
        <div className=" mx-4">current speed: {speed}</div>
        <Button
          onClick={() => {
            setSpeed((pre) => pre + 10);
          }}
          disabled={isStopped}
        >
          Speed - 10
        </Button>
      </div>
      <div
        className="relative m-4 bg-slate-100"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        ref={panel}
      >
        <div
          className="absolute w-full h-full text-slate-300 text-center text-9xl"
          style={{ lineHeight: `${CANVAS_HEIGHT}px` }}
        >
          {score}
        </div>
        {isGameOver && (
          <div
            className="absolute w-full h-full text-black text-center text-6xl bg-slate-100"
            style={{ lineHeight: `${CANVAS_HEIGHT}px` }}
          >
            Game Over!
          </div>
        )}
      </div>
      <Button
        variant={!isStopped ? "destructive" : "default"}
        onClick={() => setIsStopped((pre) => !pre)}
      >
        {isStopped ? "Start" : "Stop"}
      </Button>
    </div>
  );
}

export default Snake;
