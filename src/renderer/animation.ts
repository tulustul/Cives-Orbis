import { mapUi } from "@/ui/mapUi";

export type AnimationOptions<T extends number | number[]> = {
  from: T;
  to: T;
  duration: number;
  easing?: (t: number) => number;
  fn: (x: T) => void;
  onComplete?: () => void;
};

export type SequenceOptions = {
  animations: Animation[];
  onComplete?: () => void;
};

export class Animations {
  static new<T extends number | number[]>(
    options: AnimationOptions<T>,
  ): Animation<any> {
    if (Array.isArray(options.from)) {
      return new MultiValueAnimation(
        options as unknown as AnimationOptions<number[]>,
      ) as unknown as Animation<T>;
    }
    return new ValueAnimation(
      options as unknown as AnimationOptions<number>,
    ) as unknown as Animation<T>;
  }

  static run<T extends number | number[]>(
    options: AnimationOptions<T>,
  ): Animation<T> {
    const animation = Animations.new(options);
    animationsManager.add(animation);
    return animation;
  }

  static cancel(animation: Animation<any> | AnimationSequence) {
    animationsManager.cancel(animation);
  }

  static sequence(options: SequenceOptions): AnimationSequence {
    const animation = new AnimationSequence(options);
    animationsManager.add(animation);
    return animation;
  }

  static easing = {
    linear: (t: number) => t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeOutCubic: (t: number) => --t * t * t + 1,
  };
}

export class AnimationsManager {
  private animations: BaseAnimation[] = [];

  constructor() {
    setTimeout(() => {
      mapUi.destroyed$.subscribe(() => {
        for (const animation of this.animations) {
          this.cancel(animation);
        }
      });
    });
  }

  add(animation: BaseAnimation<any>) {
    this.animations.push(animation);
  }

  cancel(animation: BaseAnimation) {
    this.animations = this.animations.filter((a) => a !== animation);
  }

  update(stepTime: number) {
    this.animations = this.animations.filter((animation) => {
      const value = animation.step(stepTime);
      if (value !== null) {
        animation.fn(value);
        return true;
      }
      if (animation.onComplete) {
        animation.onComplete();
      }
      return false;
    });
  }
}

export interface BaseAnimation<
  T extends number | number[] = number | number[],
> {
  step(stepTime: number): T | null;
  fn: (x: T) => void;
  onComplete?: () => void;
}

export interface Animation<T extends number | number[] = number | number[]>
  extends BaseAnimation<T> {
  options: AnimationOptions<T>;
}

export class ValueAnimation implements Animation<number> {
  private progress = 0;
  private diff: number;
  private easing: (t: number) => number;
  public fn: (t: number) => void;
  public onComplete?: () => void;

  constructor(public options: AnimationOptions<number>) {
    this.fn = options.fn;
    this.onComplete = options.onComplete;
    this.easing = options.easing || Animations.easing.linear;
    this.diff = options.to - options.from;
  }

  step(stepTime: number): number | null {
    if (this.progress >= this.options.duration) {
      return null;
    }
    this.progress += stepTime;
    const eased = this.easing(this.progress / this.options.duration);
    return this.options.from + this.diff * Math.min(eased, 1);
  }
}

export class MultiValueAnimation implements Animation<number[]> {
  private progress = 0;
  private diff: number[] = [];
  private easing: (t: number) => number;
  public fn: (t: number[]) => void;
  public onComplete?: () => void;

  constructor(public options: AnimationOptions<number[]>) {
    this.fn = options.fn;
    this.onComplete = options.onComplete;
    this.easing = options.easing || Animations.easing.linear;
    if (options.from.length !== options.to.length) {
      throw new Error("From and to values must have the same length");
    }
    for (let i = 0; i < options.from.length; i++) {
      this.diff.push(options.to[i] - options.from[i]);
    }
  }

  step(stepTime: number): number[] | null {
    if (this.progress >= this.options.duration) {
      return null;
    }
    this.progress += stepTime;
    const eased = this.easing(this.progress / this.options.duration);
    return this.options.from.map(
      (from, i) => from + this.diff[i] * Math.min(eased, 1),
    );
  }
}

export class AnimationSequence {
  private progress = 0;
  private currentAnimation?: Animation;
  private animations: Animation[];
  public onComplete?: () => void;

  constructor(public options: SequenceOptions) {
    this.animations = options.animations;
    this.currentAnimation = this.animations.shift();
    this.onComplete = options.onComplete;
  }

  step(stepTime: number): number | number[] | null {
    this.progress += stepTime;

    if (!this.currentAnimation) {
      return null;
    }

    const value = this.currentAnimation.step(stepTime);
    if (value === null) {
      this.currentAnimation = this.animations.shift();
      this.progress = 0;
      return this.currentAnimation?.step(0) ?? null;
    }

    if (this.currentAnimation === null) {
      return null;
    }

    return value;
  }

  fn(value: number | number[]) {
    if (this.currentAnimation) {
      return this.currentAnimation.fn(value);
    }
    return null;
  }
}

export const animationsManager = new AnimationsManager();
