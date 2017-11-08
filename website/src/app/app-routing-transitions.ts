import {trigger, state, animate, style, transition} from '@angular/animations';

// Global router transition
export function routerTransition() {
  return fade();
}

// Fade in/out on route change
export function fade() {
  return trigger('routerTransition', [
    state('void', style({
      position: 'fixed',
    })),
    state('*', style({
      position: 'fixed',
    })),
    transition(':enter', [
      style({
        opacity: '0'
      }),
      animate('0.5s ease-in-out', style({
        opacity: '1'
      }))
    ]),
    transition(':leave', [
      style({
        opacity: '1'
      }),
      animate('0.5s ease-in-out', style({
        opacity: '0'
      }))
    ])
  ]);
}
