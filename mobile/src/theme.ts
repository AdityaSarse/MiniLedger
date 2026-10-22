/**
 * MiniLedger Design System — central theme tokens.
 * Every screen imports from here; no hardcoded colors or sizes in components.
 */

/* ------------------------------------------------------------------ */
/*  Colors                                                             */
/* ------------------------------------------------------------------ */
export const colors = {
  /* Backgrounds */
  bgGradientTop: "#DCEEFF",
  bgGradientBottom: "#F7FAFF",
  bgScreen: "#F2F7FD",

  /* Cards */
  cardBg: "#FFFFFF",
  cardBorder: "#E6EEF7",
  cardOverdueBg: "#FFFBFA",

  /* Hero / summary card navy gradient */
  heroStart: "#0F1F3D",
  heroEnd: "#070E1F",
  heroGlow: "rgba(56, 142, 200, 0.25)",
  heroMuted: "rgba(255, 255, 255, 0.65)",
  heroMetricBg: "rgba(255, 255, 255, 0.08)",
  heroMetricBorder: "rgba(255, 255, 255, 0.08)",
  heroEyebrow: "rgba(56, 189, 248, 0.9)",
  heroOverdue: "#FF9B7B",

  /* Primary / accent */
  primary: "#2F6BDE",
  primaryLight: "#EBF1FD",

  /* Success / CTA */
  success: "#3DBE6C",
  successLight: "#EAFAF0",

  /* Danger */
  danger: "#E5372E",
  dangerLight: "#FEF2F2",
  dangerBorder: "rgba(229, 55, 46, 0.3)",

  /* Warning / Pending badge */
  badgeWarningBg: "#FFF7ED",
  badgeWarningText: "#B87514",

  /* Text */
  textPrimary: "#111827",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textHint: "#9CA3AF",
  textWhite: "#FFFFFF",

  /* Inputs */
  inputBg: "#F4F7FB",
  inputBorder: "#DDE4EE",
  inputBorderFocused: "#2F6BDE",

  /* Misc */
  divider: "#EEF2F8",
  overlay: "rgba(0, 0, 0, 0.04)",
} as const;

/* ------------------------------------------------------------------ */
/*  Typography                                                         */
/* ------------------------------------------------------------------ */
export const typography = {
  /** Big hero amount on summary card */
  heroAmount: {
    fontSize: 34,
    fontWeight: "800" as const,
    color: colors.textWhite,
  },
  /** Screen titles */
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  /** Section titles inside the body */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  /** Card body text / friend names */
  body: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  /** Amounts on loan cards */
  amount: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: colors.textPrimary,
  },
  /** Small all-caps eyebrow labels */
  eyebrow: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.4,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
  },
  /** Form labels */
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  /** Input text */
  input: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  /** Small muted captions */
  caption: {
    fontSize: 12,
    color: colors.textMuted,
  },
  /** Button text */
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.textWhite,
  },
  /** Link text */
  link: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Spacing scale (4-px grid)                                          */
/* ------------------------------------------------------------------ */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/* ------------------------------------------------------------------ */
/*  Radii                                                              */
/* ------------------------------------------------------------------ */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

/* ------------------------------------------------------------------ */
/*  Shadows                                                            */
/* ------------------------------------------------------------------ */
export const shadows = {
  card: {
    shadowColor: "#2F6BDE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  hero: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  button: {
    shadowColor: "#3DBE6C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Sizes (buttons, inputs)                                            */
/* ------------------------------------------------------------------ */
export const sizes = {
  buttonHeight: 52,
  inputHeight: 52,
  avatarSize: 44,
} as const;
