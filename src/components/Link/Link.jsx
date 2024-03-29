import { useSettings } from "contexts/settings";

export default function Link({ href, className, children }) {
  const { settings } = useSettings();
  return <a href={href} className={className} {...(settings.general.openLinkInNewTab ? { target: "_blank" } : {})}>{children}</a>;
}
