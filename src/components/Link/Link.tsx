import type { PropsWithChildren } from "react";
import { useSettings } from "contexts/settings";

type Props = PropsWithChildren & {
  href: string,
  className: string
}

export default function Link({ href, className, children }: Props) {
  const { settings } = useSettings();
  return <a href={href} className={className} {...(settings.general.openLinkInNewTab ? { target: "_blank" } : {})}>{children}</a>;
}
