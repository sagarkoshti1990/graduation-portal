export const successToastStyles = {
  toast: {
    // Intentionally minimal so Gluestack's `Toast` (action="success", variant="solid")
    // matches the same styling used by `useAlert()`.
  },
  content: {
    // keep empty by default; layout is controlled in `SuccessToast.tsx`
  },
  icon: {
    // keep empty by default; matches `useAlert()` which doesn't wrap icon in a colored circle
  },
  iconSize: 16,
  title: {
    // keep empty by default; text color should come from Gluestack toast variant/action
  },
};

