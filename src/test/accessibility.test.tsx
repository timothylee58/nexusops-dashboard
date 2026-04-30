import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

describe("accessibility smoke", () => {
  it("has no detectable violations on a semantic page shell", async () => {
    const { container } = render(
      <div>
        <a className="skip" href="#main-content">
          Skip to main
        </a>
        <header>
          <nav aria-label="Primary">
            <a href="/">Home</a>
          </nav>
        </header>
        <main id="main-content">
          <h1>Cross-border dashboard</h1>
          <label htmlFor="q">Search</label>
          <input id="q" type="search" name="q" aria-label="Search transactions" />
          <button type="button">
            Submit
          </button>
        </main>
      </div>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
