import {
  useObservable,
  useObservableRef,
  useObservableCallback,
  useSubscription,
  useObservableState,
} from "observable-hooks";
import { useEffect } from "react";

import {
  Observable,
  switchMap,
  of,
  interval,
  animationFrameScheduler,
  withLatestFrom,
  filter,
  map,
  scan,
  startWith,
  distinctUntilChanged,
  share,
  combineLatest,
  takeWhile,
  skip,
} from "rxjs";
import { DIRECTIONS, INITIAL_DIRECTION, SNAKE_LENGTH } from "./const";
import { Point2D, Direction } from "./types";
import {
  nextDirection,
  snakeMove,
  generateSnake,
  generateApples,
  eat,
  isSceneGameOver,
} from "./utils";

/**
 *
 * @param input$ [isGameStoped$, speed$]
 * @returns
 */
const obGameTickerStatus = (input$: Observable<[boolean, number]>) => {
  const speed$ = input$.pipe(switchMap(([_, speed]) => of(speed)));
  const isGameStoped$ = input$.pipe(
    switchMap(([isGameOver]) => of(isGameOver))
  );
  return speed$.pipe(
    switchMap((speed) =>
      interval(speed, animationFrameScheduler).pipe(
        withLatestFrom(isGameStoped$),
        filter(([, isStopped]) => {
          return !isStopped;
        }),
        map(([number]) => number)
      )
    )
  );
};

const obKeyboardPress = (event$: Observable<KeyboardEvent>) => {
  return event$.pipe(
    map((e) => DIRECTIONS[e.key]),
    filter((e) => !!e),
    scan((pre, cur) => nextDirection(pre, cur)),
    startWith(INITIAL_DIRECTION),
    distinctUntilChanged()
  );
};

const obSnake = (
  ticker$: Observable<number>,
  direction$: Observable<Direction>,
  snakeLength$: Observable<number>
) => {
  return ticker$
    .pipe(
      withLatestFrom(
        direction$,
        snakeLength$,
        (_, direction, snakeLength) => [direction, snakeLength] as const
      )
    )
    .pipe(
      scan((acc, value) => snakeMove(acc, value[0], value[1]), generateSnake()),
      share()
    );
};

const obApples = (snake$: Observable<Point2D[]>) => {
  return snake$.pipe(
    scan((apples, snake) => {
      if (apples.length === 0) {
        return generateApples(snake);
      } else {
        return eat(apples, snake);
      }
    }, [] as Point2D[]),
    distinctUntilChanged(),
    share()
  );
};

const obSnakeLength = (scoreTicker$: Observable<number>) => {
  return scoreTicker$.pipe(
    map((score) => score + SNAKE_LENGTH),
    share()
  );
};

const useObservableScene = (isStopped: boolean, speed: number) => {
  const timeTicker$ = useObservable(obGameTickerStatus, [isStopped, speed]);
  const [scoreTickerRef, scoreTickerSource] = useObservableRef(0);
  const scoreTicker$ = useObservable(() => scoreTickerSource.asObservable());

  const [onKeyboardPress, direction$] = useObservableCallback<
    Direction,
    KeyboardEvent
  >(obKeyboardPress);

  const snakeLength$ = useObservable(() => obSnakeLength(scoreTicker$));

  const snake$ = useObservable(() =>
    obSnake(timeTicker$, direction$, snakeLength$)
  );

  const apples$ = useObservable(() => obApples(snake$));

  const scene$ = useObservable(() =>
    combineLatest([snake$, apples$])
      .pipe(
        map(([snake, apples]) => ({
          snake,
          apples,
          score: snake.length - SNAKE_LENGTH,
        }))
      )
      .pipe(takeWhile((scene) => !isSceneGameOver(scene)))
  );

  const appleEaten$ = useObservable(() => apples$.pipe(skip(1)));

  useSubscription(appleEaten$, () => {
    scoreTickerRef.current += 1;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      onKeyboardPress(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });
  return useObservableState(scene$, { snake: [], apples: [], score: 0 });
};

export default useObservableScene;
