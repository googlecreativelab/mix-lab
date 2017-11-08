/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const PRESETS = {
  default: {
    color: [.0, .0, .0],
    gradient: [
      [.0, .0, .0],
      [.0, .0, .0],
    ],
    titleColor: [1.0, 1.0, 1.0, 0.1],
    amplitude: 0.3,
    stillHeight: 0.025,
    offsetHeight: 0.175,
    lowcut: 0,
    opacity: 0.85,
    period: 4.0,
    speed: 1.5,
    resolution: 32,
    name: '',
    smoothing: 0.2,
    titleSpeed: 1.0,
    fake: 0,
  },

  drums: {
    default: {
      // name: 'Drums',
      amplitude: 0.256,
      rangeX1: 0,
      rangeX2: 0.207,
      rangeY1: 0.236,
      rangeY2: 0.629,
      rangeX1_2: 0.885,
      rangeX2_2: 1,
      rangeY1_2: 0.02,
      rangeY2_2: 0.403,
    },
    intro: {
      color : [1.0, 0.784, 0.0],
      titleColor: [1, 1, 1, 0],
      amplitude: 0.3,
      stillHeight: 0.0125,
      offsetHeight: 0.15,
    },
    on: {
      color : [1.0, 0.784, 0.0],
      gradient: [
        [ .953, 0.0, 0.953 ],
        [1.0, 0.827, 0.337 ],
      ],
      titleColor: [0, 0, 0, 0.07],
      titleSpeed: 3.0,
    },
    bonus: {
      offsetHeight: 0.15,
    },
    maxout: {
      lowcut: 1,
      stillHeight: 0,
      offsetHeight: 0.25,
    },
    greyout: {
      color: [.65, .65, .65],
      gradient: [
        [.0, .0, .0],
        [.0, .0, .0],
      ],
    },
  },

  bass: {
    default: {
      // name: 'Bass',
      amplitude: 0.15,
      rangeX1: 0,
      rangeX2: 0.03,
      rangeY1: 0.384,
      rangeY2: 0.688,
      rangeX1_2: 0.03,
      rangeX2_2: 0.167,
      rangeY1_2: 0.18,
      rangeY2_2: 0.42,
    },
    intro: {
      color: [ 0.0, 1.0, 0.565 ],
      titleColor: [1, 1, 1, 0],
      amplitude: 0.4,
      stillHeight: 0.0125,
      offsetHeight: 0.15,
      smoothing: 0.8,
      fake: 1,
    },
    on: {
      color: [ 0.0, 1.0, 0.565 ],
      gradient: [
        [1.0, 0.827, 0.337],
        [.953, 0.0, 0.953],
      ],
      titleColor: [0, 0, 0, 0.07],
      titleSpeed: 1.9,
    },
    bonus: {
      offsetHeight: 0.15,
    },
    maxout: {
      lowcut: 1,
      stillHeight: 0,
      offsetHeight: 0.25,
    },
    greyout: {
      color: [.65, .65, .65],
      gradient: [
        [.0, .0, .0],
        [.0, .0, .0],
      ],
    },
  },

  guitar: {
    default: {
      // name: 'Guitar',
      amplitude: 0.226,
      rangeX1: 0,
      rangeX2: 0.118,
      rangeY1: 0.17,
      rangeY2: 0.64,
      rangeX1_2: 0.167,
      rangeX2_2: 0.393,
      rangeY1_2: 0.226,
      rangeY2_2: 0.452,
    },
    intro: {
      color: [ 0.988, 0.349, 0.184 ],
      titleColor: [1, 1, 1, 0],
      amplitude: 0.3,
      stillHeight: 0.0125,
      offsetHeight: 0.15,
      smoothing: 0.9,
      fake: 1,
    },
    on: {
      color: [ 0.988, 0.349, 0.184 ],
      gradient: [
        [ 0.0, 0.651, 1.0 ],
        [ 0.235, 0.906, 0.173 ],
      ],
      titleColor: [0, 0, 0, 0.07],
      titleSpeed: 2.5,
    },
    bonus: {
      offsetHeight: 0.15,
    },
    maxout: {
      lowcut: 1,
      stillHeight: 0,
      offsetHeight: 0.25,
    },
    greyout: {
      color: [0.52, .52, .52],
      gradient: [
        [.0, .0, .0],
        [.0, .0, .0],
      ],
    },
  },

  keyboard: {
    default: {
      // name: 'Keyboard',
      amplitude: 0.482,
      rangeX1: 0,
      rangeX2: 0.177,
      rangeY1: 0.236,
      rangeY2: 0.551,
    },
    intro: {
      color: [ 0.0, 0.608, 1.0 ],
      titleColor: [1, 1, 1, 0],
      amplitude: 0.3,
      stillHeight: 0.0125,
      offsetHeight: 0.15,
    },
    on: {
      color: [ 0.0, 0.608, 1.0 ],
      gradient: [
        [0.235, 0.906, 0.173],
        [0.0, 0.651, 1.0],
      ],
      titleColor: [0, 0, 0, 0.07],
      titleSpeed: 2.0,
    },
    bonus: {
      offsetHeight: 0.15,
    },
    maxout: {
      lowcut: 1,
      stillHeight: 0,
      offsetHeight: 0.25,
    },
    greyout: {
      color: [.45, .45, .45],
      gradient: [
        [.0, .0, .0],
        [.0, .0, .0],
      ],
    },
  },

  bonus: {
    // name: 'Bonus',
    default: {
      offsetHeight: 0.08,
      opacity: 0,
      amplitude: 0.532,
      rangeX1: 0,
      rangeX2: 0.354,
      rangeY1: 0,
      rangeY2: 0.7,
    },
    intro: {
      color: [0.235, 0.906, 0.173],
      titleColor: [1, 1, 1, 0],
      amplitude: 0.3,
      stillHeight: 0.0125,
      offsetHeight: 0.1,
    },
    on: {
      opacity: 0.85,
      offsetHeight: 0.15,
      color: [0.235, 0.906, 0.173],
      gradient: [
        [0, 0.89, 0.85],
        [0.89, 0.97, 0],
      ],
      titleColor: [0, 0, 0, 0.07],
      titleSpeed: 2.0,
    },
    maxout: {
      lowcut: 1,
      stillHeight: 0,
      offsetHeight: 0.25,
    },
    greyout: {
      color: [.0, .0, .0],
      gradient: [
        [.0, .0, .0],
        [.0, .0, .0],
      ],
    },
  },
};
