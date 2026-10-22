import {Circle, Line, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInQuad,
  easeOutQuad,
  linear,
  waitFor,
} from '@motion-canvas/core';

const Radius = 60;
const Floor = 400;
const StartX = -760;
const EndX = 760;

// How high the ball rises on each bounce. The first value is the drop it starts
// from, and each bounce after that loses some height.
const Heights = [700, 480, 330, 220, 140, 80];
const Colors = [
  '#e13238',
  '#e6a700',
  '#99c47a',
  '#68abdf',
  '#ff6470',
  '#ffc66d',
];

// Under gravity, falling from height `h` takes time proportional to `sqrt(h)`.
function fallTime(height: number) {
  return 0.035 * Math.sqrt(height);
}

export default makeScene2D(function* (view) {
  const ball = createRef<Circle>();
  const ground = Floor - Radius;

  view.add(
    <>
      <Line
        points={[
          [StartX - Radius * 2, Floor],
          [EndX + Radius * 2, Floor],
        ]}
        stroke={'#242424'}
        lineWidth={8}
        lineCap={'round'}
      />
      <Circle
        ref={ball}
        size={Radius * 2}
        x={StartX}
        y={ground - Heights[0]}
        fill={Colors[0]}
      />
    </>,
  );

  // The first drop only falls; every later bounce goes up and comes back down.
  const duration = Heights.reduce(
    (total, height, i) => total + fallTime(height) * (i === 0 ? 1 : 2),
    0,
  );

  function* bounce() {
    yield* ball().y(ground, fallTime(Heights[0]), easeInQuad);
    for (let i = 1; i < Heights.length; i++) {
      const time = fallTime(Heights[i]);
      yield* all(
        ball()
          .y(ground - Heights[i], time, easeOutQuad)
          .to(ground, time, easeInQuad),
        ball().fill(Colors[i], time * 2),
      );
    }
  }

  // Constant speed sideways while the bounces play out vertically.
  yield* all(ball().x(EndX, duration, linear), bounce());
  yield* waitFor(0.5);
});
