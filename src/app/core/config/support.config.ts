/**
 * Support / "buy me a coffee" link, shown as a single small, muted entry
 * on the Progress tab — not a banner, popup, or anything on every screen.
 *
 * `enabled` defaults to false on purpose: flip it to true once `url` below
 * is a real link. Nothing else in the app needs to change.
 */
export interface SupportLinkConfig {
  enabled: boolean;
  url: string;
  label: string;
}

export const SUPPORT_LINK: SupportLinkConfig = {
  enabled: false,
  url: 'https://www.buymeacoffee.com/YOUR_USERNAME',
  label: 'Buy me a coffee'
};
