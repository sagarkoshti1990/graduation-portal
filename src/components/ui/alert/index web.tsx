const alertPolyfill = (
  title: string,
  description?: string,
  options?: any,
  extra?: any,
): void => {
  console.log('alertPolyfill', title, description, options, extra);
  let result = true;
  if (typeof window !== 'undefined' && window.confirm) {
    result = window.confirm([title, description].filter(Boolean).join('\n'));
  }

  // Ensure options is always an array to prevent runtime errors
  const opts = Array.isArray(options) ? options : [];

  if (result) {
    const confirmOption = opts.find(
      ({ style }: { style: string }) => style !== 'cancel',
    );
    confirmOption &&
      typeof confirmOption.onPress === 'function' &&
      confirmOption.onPress();
  } else {
    const cancelOption = opts.find(
      ({ style }: { style: string }) => style === 'cancel',
    );
    cancelOption &&
      typeof cancelOption.onPress === 'function' &&
      cancelOption.onPress();
  }
};

const alert = alertPolyfill;

export { alert };

export default { alert: alertPolyfill };
