import Link from "next/link";

// A player's name linking to their public profile.
export default function PlayerLink({ id, children, className = "" }) {
  if (!id) return <span className={className}>{children}</span>;
  return (
    <Link href={`/player/${id}`} className={`hover:underline decoration-gold decoration-2 underline-offset-2 ${className}`}>
      {children}
    </Link>
  );
}
