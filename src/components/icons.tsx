import type { ComponentProps, FC } from "react";

import { cn } from "@/lib/utils";

interface IIconProps extends ComponentProps<"svg"> {}

// Stroke paths adapted from Lucide (ISC license, https://lucide.dev).
const createIcon = (paths: React.ReactNode): FC<IIconProps> => {
  const Icon: FC<IIconProps> = ({ className, ...props }) => (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative, buttons carry the label
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-5", className)}
      {...props}
    >
      {paths}
    </svg>
  );
  return Icon;
};

export const UndoIcon = createIcon(
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </>,
);

export const RedoIcon = createIcon(
  <>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </>,
);

export const EraseIcon = createIcon(
  <>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </>,
);

export const NotesIcon = createIcon(
  <>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </>,
);

export const HintIcon = createIcon(
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>,
);

export const PauseIcon = createIcon(
  <>
    <rect x="14" y="4" width="4" height="16" rx="1" />
    <rect x="6" y="4" width="4" height="16" rx="1" />
  </>,
);

export const PlayIcon = createIcon(<path d="M6 3 20 12 6 21Z" />);

export const MenuIcon = createIcon(
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>,
);

export const SparkleIcon: FC<IIconProps> = ({ className, ...props }) => (
  // From Health Icons by Resolve to Save Lives (MIT, https://github.com/resolvetosavelives/healthicons).
  // biome-ignore lint/a11y/noSvgWithoutTitle: decorative, next to a text label
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    aria-hidden
    className={cn("size-4", className)}
    {...props}
  >
    <path
      fill="currentColor"
      d="M34 6c-1.368 4.944-3.13 6.633-8 8c4.87 1.367 6.632 3.056 8 8c1.368-4.944 3.13-6.633 8-8c-4.87-1.367-6.632-3.056-8-8m-14 8c-2.395 8.651-5.476 11.608-14 14c8.524 2.392 11.605 5.349 14 14c2.395-8.651 5.476-11.608 14-14c-8.524-2.392-11.605-5.349-14-14"
    />
  </svg>
);
