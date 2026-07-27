export function resolveArchetypeNextStep(state = {}) {
  if (state.safetyState === "crisis") {
    return {
      kind: "support",
      href: "/pervyi-shag.html",
      label: "Найти подходящую поддержку",
    };
  }
  if (state.codeKnown === false && state.birthTimeKnown === true) {
    return {
      kind: "test",
      href: "/test-arhetipov/",
      label: "Рассчитать код архетипов",
    };
  }
  return {
    kind: "reading",
    href: "/arhetipy/#temy",
    label: "Выбрать материал по своей теме",
  };
}

if (process.argv[1]?.endsWith("archetype-route-resolver.mjs")) {
  const fixtures = [
    [
      { safetyState: "normal", codeKnown: false, birthTimeKnown: true },
      "test",
    ],
    [
      { safetyState: "normal", codeKnown: true, birthTimeKnown: true },
      "reading",
    ],
    [
      { safetyState: "normal", codeKnown: false, birthTimeKnown: false },
      "reading",
    ],
    [{ safetyState: "crisis", codeKnown: false, birthTimeKnown: true }, "support"],
  ];
  for (const [state, expected] of fixtures) {
    const actual = resolveArchetypeNextStep(state);
    if (actual.kind !== expected) {
      throw new Error(
        `Route fixture failed: expected ${expected}, got ${actual.kind}.`,
      );
    }
  }
  console.log(`Archetype route resolver: ${fixtures.length} fixtures passed.`);
}
