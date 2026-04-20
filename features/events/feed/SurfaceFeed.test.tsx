import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SurfaceFeed } from "./SurfaceFeed";
import styles from "./SurfaceFeed.module.css";
import {
  resolveSurfaceFeedLayout,
  type SurfaceFeedDescriptor,
  type SurfaceFeedItem,
} from "./types";

type TestModel = {
  title: string;
};

const buildDescriptor = (
  id: string,
  overrides: Partial<SurfaceFeedDescriptor> = {},
): SurfaceFeedDescriptor => ({
  id,
  layoutVariant: "standard",
  motionPolicy: "static",
  renderVariant: "test-card",
  ...overrides,
});

const buildItem = (
  id: string,
  overrides: Partial<SurfaceFeedDescriptor> = {},
): SurfaceFeedItem<TestModel> => ({
  descriptor: buildDescriptor(id, overrides),
  model: {
    title: `Item ${id}`,
  },
});

describe("SurfaceFeed", () => {
  it("resolves default spans and descriptor overrides", () => {
    expect(
      resolveSurfaceFeedLayout(
        buildDescriptor("feature-card", {
          layoutVariant: "feature",
          layout: {
            xl: 9,
          },
        }),
      ),
    ).toEqual({
      density: "comfortable",
      spans: {
        base: 12,
        sm: 12,
        md: 12,
        lg: 8,
        xl: 9,
      },
    });
  });

  it("maps descriptor variants into slot classes and breakpoint spans", () => {
    render(
      <SurfaceFeed
        items={[
          buildItem("wide", {
            layoutVariant: "wide",
            layout: {
              xl: 8,
            },
          }),
          buildItem("micro", {
            layoutVariant: "micro",
          }),
        ]}
        renderItem={(item) => <article>{item.model.title}</article>}
      />,
    );

    const wideSlot = screen.getByText("Item wide").parentElement;
    const microSlot = screen.getByText("Item micro").parentElement;

    expect(wideSlot?.className).toContain(styles.variantWide);
    expect(wideSlot?.dataset.layoutVariant).toBe("wide");
    expect(wideSlot?.style.getPropertyValue("--surface-feed-span-base")).toBe("12");
    expect(wideSlot?.style.getPropertyValue("--surface-feed-span-xl")).toBe("8");

    expect(microSlot?.className).toContain(styles.variantMicro);
    expect(microSlot?.dataset.layoutVariant).toBe("micro");
    expect(microSlot?.style.getPropertyValue("--surface-feed-span-md")).toBe("3");
  });
});
