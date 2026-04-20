import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import styles from "./CardShell.module.css";

type CardShellProps = {
  family: "binary" | "grouped";
  title: string;
  imageSrc: string;
  metaLabels?: ReadonlyArray<string>;
  footerLeading: string;
  footerTrailing?: string;
  footerTrailingTone?: "default" | "live";
  children: ReactNode;
  href?: string;
};

export function CardShell({
  family,
  title,
  imageSrc,
  metaLabels = [],
  footerLeading,
  footerTrailing,
  footerTrailingTone = "default",
  children,
  href,
}: CardShellProps) {
  return (
    <article className={styles.shell} data-card-family={family}>
      {href ? (
        <Link
          href={href}
          className={styles.stretchedLink}
          aria-label={`Open ${title}`}
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
            unoptimized={shouldBypassNextImageOptimization(imageSrc)}
            className={styles.image}
          />
        </div>

        <div className={styles.headerCopy}>
          <h2 className={styles.title} title={title}>
            {title}
          </h2>
          {metaLabels.length > 0 ? (
            <p className={styles.meta}>
              {metaLabels.map((label, index) => (
                <span key={`${label}-${index}`} className={styles.metaChunk}>
                  {label}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.body}>{children}</div>

      <div className={styles.footer}>
        <span>{footerLeading}</span>
        {footerTrailing ? (
          <span
            className={styles.footerTrailing}
            data-tone={footerTrailingTone}
          >
            {footerTrailing}
          </span>
        ) : null}
      </div>
    </article>
  );
}
