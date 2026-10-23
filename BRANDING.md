# Chef's Seal · Languini v0.35.3

The selected Chef's Seal direction now replaces the opening-screen leaf wordmark.

- Desktop: the full illustrated plate, crossed utensils, LANGUINI lettering and Mr. Saymaz credit appear above the introduction.
- Portrait phones: the full logo shares the welcome area with the taller owner; compact navigation uses the matching emblem and a readable text label.
- Landscape and the smallest phones: compact branding preserves the complete setup panel and its controls.
- Browser tabs: multi-size ICO and a 32-pixel PNG use the plate-and-utensils emblem.
- Home-screen metadata: a 180-pixel Apple touch icon and 192/512-pixel manifest icons use the same emblem. No offline/service-worker behavior is added.

Both selected source assets preserve transparency. They were checked over the actual cream restaurant interface: no dark rectangle, glow panel or added frame. All versions preserve their proportions.

Three WebP sizes support the full logo (240, 480 and 768 pixels wide). Compact emblem assets use 64 and 128 pixels. The smallest full logo is 14,154 bytes; the 64-pixel emblem is 3,506 bytes. Larger PNG icons are for home-screen metadata, rather than inline page rendering. Images are lazy loaded so hidden responsive variants are not all fetched immediately. Sources and a byte/dimension report are in source/artwork/branding; source/scripts/optimize-branding.py rebuilds the derivatives with Pillow.

The setup panel, taller transparent owner, English content and gameplay rules are retained. Existing save identity remains unchanged.

Browser QA covers eight viewport sizes from 320×480 through 1366×768, image loading, menu fit, Help and starting service. Physical home-screen installation behavior varies by device and was not tested on actual phones.
