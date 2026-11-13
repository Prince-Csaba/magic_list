import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import typescript from "typescript";

const source = await readFile(new URL("../lib/checklistHistory.ts", import.meta.url), "utf8");
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.ESNext },
});
const { snapshotChecklist } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("records checked and unchecked activities", () => {
  assert.deepEqual(snapshotChecklist(
    [{ id: "a", label: "Water" }, { id: "b", label: "Exercise" }],
    ["a"]
  ), [
    { id: "a", label: "Water", done: true },
    { id: "b", label: "Exercise", done: false },
  ]);
});

test("preserves completed names and removed completions across routine edits", () => {
  const previous = [
    { id: "a", label: "Water", done: true },
    { id: "b", label: "Exercise", done: true },
    { id: "c", label: "Old name", done: false },
  ];
  assert.deepEqual(snapshotChecklist(
    [{ id: "a", label: "Drink water" }, { id: "c", label: "New name" }],
    ["a", "c"],
    previous
  ), [
    { id: "a", label: "Water", done: true },
    { id: "c", label: "New name", done: true },
    { id: "b", label: "Exercise", done: true },
  ]);
});

test("unchecking and checking again uses the current activity name", () => {
  const items = [{ id: "a", label: "Drink water" }];
  const before = [{ id: "a", label: "Water", done: true }];
  const unchecked = snapshotChecklist(items, [], before);
  assert.deepEqual(snapshotChecklist(items, ["a"], unchecked), [
    { id: "a", label: "Drink water", done: true },
  ]);
});
