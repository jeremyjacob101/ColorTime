export type AppView = "color" | "my-colors";

export function getViewFromLocation(): AppView {
  const params = new URLSearchParams(window.location.search);
  const v = params.get("view");
  if (v === "my-colors") return "my-colors";
  return "color";
}
