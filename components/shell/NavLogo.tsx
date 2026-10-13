/**
 * Dumb logo block — image when imageUrl set, wordmark text otherwise.
 * props → JSX only; sizing/position arrive as props (resolver-clamped).
 */
export interface NavLogoProps {
  imageUrl?: string;
  height?: number;
  wordmark?: string;
  href?: string;
  className?: string;
}

export default function NavLogo({
  imageUrl = "",
  height = 24,
  wordmark = "SHOP",
  href = "/",
  className = "",
}: NavLogoProps) {
  return (
    <a href={href} className={`sf-navlogo ${className}`} aria-label={wordmark}>
      {imageUrl !== "" ? (
        // alt="" deliberate: the anchor already announces the wordmark.
        <img src={imageUrl} alt="" style={{ height }} className="sf-navlogo__img" />
      ) : (
        <span className="sf-navlogo__word">{wordmark}</span>
      )}
    </a>
  );
}
