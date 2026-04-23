"use client";

import type { CSSProperties } from "react";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { SportsLeagueChip } from "@/features/sports/games/parse";
import { cn } from "@/shared/lib/cn";
import {
  buildSportsDesktopRailModel,
  type SportsRailGroup,
  type SportsRailLeaf,
} from "./railTaxonomy";
import styles from "./SportsLeagueRail.module.css";

type SportsLeagueRailProps = {
  chips: ReadonlyArray<SportsLeagueChip>;
  activeLeagueSlug?: string;
  className?: string;
};

function RailMark({
  label,
  mark,
  bg,
  fg,
}: {
  label: string;
  mark: string;
  bg: string;
  fg: string;
}) {
  return (
    <span
      className={styles.mark}
      aria-hidden="true"
      title={label}
      style={
        {
          "--rail-mark-bg": bg,
          "--rail-mark-fg": fg,
        } as CSSProperties
      }
    >
      {mark}
    </span>
  );
}

function LeafRow({
  item,
  className,
}: {
  item: SportsRailLeaf;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      className={cn(styles.row, styles.leafRow, className)}
      aria-current={item.active ? "page" : undefined}
      data-active={item.active || undefined}
    >
      <span className={styles.rowContent}>
        <RailMark
          label={item.label}
          mark={item.mark}
          bg={item.tone.bg}
          fg={item.tone.fg}
        />
        <span className={styles.rowLabel}>{item.label}</span>
      </span>
      {item.count !== undefined ? <span className={styles.rowCount}>{item.count}</span> : null}
    </Link>
  );
}

function GroupRow({
  item,
  open,
  onToggle,
}: {
  item: SportsRailGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const groupId = useId();

  return (
    <div className={styles.group} data-open={open || undefined} data-active={item.active || undefined}>
      <button
        type="button"
        className={cn(styles.row, styles.groupButton)}
        aria-expanded={open}
        aria-controls={groupId}
        onClick={onToggle}
      >
        <span className={styles.rowContent}>
          <RailMark
            label={item.label}
            mark={item.mark}
            bg={item.tone.bg}
            fg={item.tone.fg}
          />
          <span className={styles.rowLabel}>{item.label}</span>
        </span>
        <ChevronDown className={styles.groupChevron} size={16} strokeWidth={2.1} />
      </button>

      <div id={groupId} className={styles.groupChildren} hidden={!open}>
        {item.children.map((child) => (
          <LeafRow key={`${item.slug}:${child.slug}`} item={child} className={styles.childRow} />
        ))}
      </div>
    </div>
  );
}

export function SportsLeagueRail({
  chips,
  activeLeagueSlug,
  className,
}: SportsLeagueRailProps) {
  const desktopModel = buildSportsDesktopRailModel({
    chips,
    activeLeagueSlug,
  });

  const initialOpenGroups = useMemo(
    () =>
      desktopModel.groups
        .filter((group) => group.active || (!activeLeagueSlug && group.slug === "football"))
        .map((group) => group.slug),
    [activeLeagueSlug, desktopModel.groups],
  );
  const openGroupsKey = useMemo(
    () => initialOpenGroups.join("|"),
    [initialOpenGroups],
  );
  const [openGroupsState, setOpenGroupsState] = useState<{
    key: string;
    value: Set<string>;
  }>(() => ({
    key: openGroupsKey,
    value: new Set(initialOpenGroups),
  }));
  const openGroups =
    openGroupsState.key === openGroupsKey
      ? openGroupsState.value
      : new Set(initialOpenGroups);

  return (
    <div className={cn(styles.rail, className)}>
      <nav className={styles.mobileRail} aria-label="Sports leagues">
        <Link
          href="/sports/live"
          className={styles.mobileChip}
          aria-current={activeLeagueSlug === undefined || activeLeagueSlug === "" ? "page" : undefined}
          data-active={activeLeagueSlug === undefined || activeLeagueSlug === ""}
        >
          <span>All Sports</span>
        </Link>

        {chips.map((chip) => (
          <Link
            key={chip.slug}
            href={chip.href}
            className={styles.mobileChip}
            aria-current={chip.active || chip.slug === activeLeagueSlug ? "page" : undefined}
            data-active={chip.active || chip.slug === activeLeagueSlug}
          >
            <span>{chip.label}</span>
            <span className={styles.mobileCount}>{chip.count}</span>
          </Link>
        ))}
      </nav>

      <nav className={styles.desktopRail} aria-label="Sports leagues">
        <div className={styles.desktopSection}>
          {desktopModel.topLeafs.map((item) => (
            <LeafRow key={item.slug} item={item} />
          ))}
        </div>

        <div className={styles.desktopSection}>
          {desktopModel.groups.map((item) => (
            <GroupRow
              key={item.slug}
              item={item}
              open={openGroups.has(item.slug)}
              onToggle={() => {
                setOpenGroupsState((current) => {
                  const base =
                    current.key === openGroupsKey ? current.value : new Set(initialOpenGroups);
                  const next = new Set(base);
                  if (next.has(item.slug)) {
                    next.delete(item.slug);
                  } else {
                    next.add(item.slug);
                  }

                  return {
                    key: openGroupsKey,
                    value: next,
                  };
                });
              }}
            />
          ))}
        </div>

        {desktopModel.trailingLeafs.length > 0 ? (
          <div className={styles.desktopSection}>
            {desktopModel.trailingLeafs.map((item) => (
              <LeafRow key={item.slug} item={item} />
            ))}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
