const buttons = document.querySelectorAll('.control-btn');
const activeActions = new Set();

buttons.forEach(button => {
  const action = button.dataset.action;
  button.addEventListener('touchstart', evt => {
    evt.preventDefault();
    activeActions.add(action);
    onPress?.(action);
  });
  button.addEventListener('touchend', evt => {
    evt.preventDefault();
    activeActions.delete(action);
    onRelease?.(action);
  });
  button.addEventListener('mousedown', evt => {
    evt.preventDefault();
    activeActions.add(action);
    onPress?.(action);
  });
  button.addEventListener('mouseup', evt => {
    evt.preventDefault();
    activeActions.delete(action);
    onRelease?.(action);
  });
});

let onPress;
let onRelease;

export function setupTouchControls(pressHandler, releaseHandler) {
  onPress = pressHandler;
  onRelease = releaseHandler;
}

export function getActiveActions() {
  return Array.from(activeActions);
}
