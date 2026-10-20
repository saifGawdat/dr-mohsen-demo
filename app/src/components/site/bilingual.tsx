import type { ReactNode } from "react";

/**
 * The prototype renders every string twice — `.en` and `.ar` — and the
 * stylesheet hides the inactive one. Keeping that contract means the markup
 * (and therefore the Arabic/English layout) matches the approved design
 * exactly, including the spaces between inline elements.
 */
export function Bi({ en, ar }: { en: ReactNode; ar: ReactNode }) {
  return (
    <>
      <span className="en">{en}</span>
      <span className="ar">{ar}</span>
    </>
  );
}
