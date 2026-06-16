type ConfirmState = { message: string; resolve: (v: boolean) => void } | null;
type Listener = (state: ConfirmState) => void;

let state: ConfirmState = null;
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l(state));
}

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    state = { message, resolve: (v) => { state = null; notify(); resolve(v); } };
    notify();
  });
}

export function subscribeConfirm(fn: Listener) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
