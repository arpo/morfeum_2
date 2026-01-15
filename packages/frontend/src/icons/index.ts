// Centralized icon management
// Add new icons here ONLY - never import directly from @tabler/icons-react
// Only export icons that are actually used in the application

export {
  IconLoader2,
  IconSun,
  IconMoon,
  IconSettings,
  IconInfoCircle,
  IconX,
  IconCheck,
  IconMaximize,
  IconMinimize,
  IconDeviceFloppy,
  IconBookmark,
  IconTrash,
  IconDice,
  IconPin,
  IconPinFilled,
  IconCopy,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconSquare,
  IconSquareCheckFilled,
  IconWorld,
  IconMapPin,
  IconHome,
  IconLayoutSidebar,
  IconMessageCircle,
  IconStack2,
  Icon3dCubeSphere,
  IconExternalLink,
  IconCamera,
  IconArrowBadgeRight,
  IconSparkles,
  IconEye
} from '@tabler/icons-react';

// Icon type for string references
export type IconName = keyof typeof import('@tabler/icons-react');
