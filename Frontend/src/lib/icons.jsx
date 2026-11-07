const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

function Svg({ size = 18, children, ...rest }) {
  return (
    <svg width={size} height={size} {...base} {...rest} aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </Svg>
)

export const IconRecipes = (p) => (
  <Svg {...p}>
    <path d="M12 3.5c3 2.2 6 3.4 6 6.6 0 3.6-2.7 6.5-6 8.4-3.3-1.9-6-4.8-6-8.4 0-3.2 3-4.4 6-6.6Z" />
    <path d="M12 8.4v9.9" />
  </Svg>
)

export const IconPlanner = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
)

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconLeaf = (p) => (
  <Svg {...p}>
    <path d="M20 4C10 4 4 9 4 16c0 2 1 4 1 4s6-1 9-4 6-8 6-12Z" />
    <path d="M5 20c3-6 7-9 12-11" />
  </Svg>
)

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3a2 2 0 1 1 0-4h.11a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 .97-1.47V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47.97H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.49.53Z" />
  </Svg>
)

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
)

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
)

export const IconArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

export const IconArrowLeft = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
)

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
)

export const IconX = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.4 2" />
  </Svg>
)

export const IconSpark = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3Z" />
  </Svg>
)

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
  </Svg>
)

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </Svg>
)

export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </Svg>
)

export const IconBook = (p) => (
  <Svg {...p}>
    <path d="M5 4.5h9.5A3.5 3.5 0 0 1 18 8v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Z" />
    <path d="M5 4.5V16" />
  </Svg>
)

export const IconMonitor = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Svg>
)

export const IconCamera = (p) => (
  <Svg {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.5" r="3.4" />
  </Svg>
)

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Svg>
)

export const IconPencil = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
    <path d="m14.5 5.5 4 4" />
  </Svg>
)
