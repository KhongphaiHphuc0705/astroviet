export function focusChartObject(
  root: HTMLElement | null,
  planetKey: string,
): boolean {
  if (!root || !planetKey) return false;

  // 1. Try interactive element on the wheel
  const wheelContainer = root.querySelector('[data-testid="chart-wheel"]');
  if (wheelContainer) {
    const wheelButtons = Array.from(
      wheelContainer.querySelectorAll<HTMLElement | SVGElement>(
        '[role="button"][data-planet]',
      ),
    );

    for (const el of wheelButtons) {
      if (el.dataset.planet === planetKey && el.isConnected) {
        el.focus();
        if (document.activeElement === el) {
          return true;
        }
      }
    }
  }

  // 2. Fallback to PlanetTable buttons (table or card view)
  const tableButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("button[data-planet-key]"),
  );
  for (const btn of tableButtons) {
    if (btn.dataset.planetKey === planetKey && btn.isConnected) {
      btn.focus();
      if (document.activeElement === btn) {
        return true;
      }
    }
  }

  return false;
}
