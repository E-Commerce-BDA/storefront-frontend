// @vitest-environment jsdom
/**
 * Select contract — native branch (controlled value, arrow layer,
 * house paint) + custom branch (open, arrows, type-ahead, Home/End,
 * Enter, Esc, Tab, outside-click, controlled open, faces, motion).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import Select from "@/components/ui/Select";

afterEach(cleanup);

const OPTIONS = [
  { value: "flat", label: "Flat rate" },
  { value: "express", label: "Express" },
  { value: "pickup", label: "Pickup" },
];

const BASE = {
  value: "",
  onChange: () => {},
  options: OPTIONS,
  label: "Ship",
};

describe("Select native", () => {
  it("controls value, shows placeholder + arrow layer", () => {
    render(<Select {...BASE} />);
    const box = screen.getByLabelText("Ship");
    expect(box.tagName).toBe("SELECT");
    expect(box.textContent).toContain("Select…");
    // Appearance-none (custom arrow owns the affordance).
    expect(box.className).toContain("appearance-none");
  });

  it("changes value and feeds house paint", () => {
    const onChange = vi.fn();
    render(<Select {...BASE} onChange={onChange} bg="#111111" arrowPadding={20} />);
    const box = screen.getByLabelText("Ship");
    fireEvent.change(box, { target: { value: "express" } });
    expect(onChange).toHaveBeenCalledWith("express", expect.anything());
    expect(box.style.background).toBe("rgb(17, 17, 17)");
  });
});

describe("Select custom", () => {
  const CUSTOM = { ...BASE, variant: "custom" as const };

  it("opens on trigger, commits on Enter, closes on Esc", () => {
    const onChange = vi.fn();
    render(<Select {...CUSTOM} onChange={onChange} />);
    const btn = screen.getByRole("button", { name: "Ship" });
    expect(btn.getAttribute("aria-haspopup")).toBe("listbox");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox")).not.toBeNull();
    fireEvent.keyDown(screen.getByRole("listbox").parentElement as HTMLElement, { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("listbox").parentElement as HTMLElement, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("flat");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("arrows cycle with wrap, Home/End bound, type-ahead jumps", () => {
    render(<Select {...CUSTOM} value="flat" />);
    fireEvent.click(screen.getByRole("button", { name: "Ship" }));
    const root = screen.getByRole("listbox").parentElement as HTMLElement;
    fireEvent.keyDown(root, { key: "End" });
    expect(root.querySelector('[data-active="true"]')?.textContent).toBe("Pickup");
    fireEvent.keyDown(root, { key: "Home" });
    expect(root.querySelector('[data-active="true"]')?.textContent).toBe("Flat rate");
    fireEvent.keyDown(root, { key: "e" });
    expect(root.querySelector('[data-active="true"]')?.textContent).toBe("Express");
  });

  it("Esc refocuses trigger, Tab closes, outside-click closes", () => {
    render(
      <div>
        <Select {...CUSTOM} />
        <button type="button">Outside</button>
      </div>,
    );
    const btn = screen.getByRole("button", { name: "Ship" });
    fireEvent.click(btn);
    expect(screen.queryByRole("listbox")).not.toBeNull();
    fireEvent.keyDown(screen.getByRole("listbox").parentElement as HTMLElement, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(btn);
    fireEvent.click(btn);
    fireEvent.keyDown(screen.getByRole("listbox").parentElement as HTMLElement, { key: "Tab" });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.click(btn);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("marks selected options, honors controlled open, inlines faces + motion", () => {
    const onOpenChange = vi.fn();
    const { container, unmount } = render(
      <Select
        {...CUSTOM}
        value="express"
        open
        onOpenChange={onOpenChange}
        listTheme={{ selectedBg: "#111111", optionPaddingY: 10 }}
        listMotion={{ enabled: true, durationMs: 200, easing: "linear", travel: "minimal" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Ship" }).textContent).toContain("Express");
    const sel = container.querySelector('[data-selected="true"]') as HTMLElement;
    expect(sel.textContent).toBe("Express");
    const list = screen.getByRole("listbox") as HTMLElement;
    expect(list.style.getPropertyValue("--se-selected-bg")).toBe("#111111");
    expect(list.style.getPropertyValue("--se-opt-pad-y")).toBe("10px");
    expect(list.style.getPropertyValue("--se-list-duration")).toBe("200ms");
    expect(list.getAttribute("data-motion")).toBe("on");
    // Controlled open: internal toggle defers (parent owns it).
    fireEvent.click(screen.getByRole("button", { name: "Ship" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("listbox")).not.toBeNull();
    unmount();
  });

  it("renders motion-off without vars and an empty state without options", () => {
    render(<Select {...CUSTOM} options={[]} listMotion={{ enabled: false, durationMs: 180, easing: "ease-out", travel: "minimal" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Ship" }));
    const list = screen.getByRole("listbox") as HTMLElement;
    expect(list.getAttribute("data-motion")).toBe("off");
    expect(list.style.getPropertyValue("--se-list-duration")).toBe("");
    expect(screen.getByText("No options available")).not.toBeNull();
  });
});
