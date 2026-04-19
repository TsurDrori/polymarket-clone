import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { getEventImage } from "@/features/events/api/parse";
import type { PolymarketEvent } from "@/features/events/types";
import { formatVolume } from "@/shared/lib/format";
import styles from "./CardShell.module.css";

type CardShellProps = {
  event: PolymarketEvent;
  children: ReactNode;
  href?: string;
};

export function CardShell({ event, children, href }: CardShellProps) {
  const imageSrc = getEventImage(event) ?? "/placeholder.svg";

  return (
    <article className={styles.shell}>
      {href ? (
        <Link
          href={href}
          className={styles.stretchedLink}
          aria-label={`Open ${event.title}`}
        />
      ) : null}

      <div className={styles.header}>
        <div className={styles.imageWrap}>
          <Image
            src={imageSrc}
            alt=""
            width={40}
            height={40}
            sizes="40px"
            className={styles.image}
          />
        </div>

        <h2 className={styles.title} title={event.title}>
          {event.title}
        </h2>
      </div>

      <div className={styles.body}>{children}</div>

      <div className={styles.footer}>{formatVolume(event.volume)} Vol.</div>
    </article>
  );
}
