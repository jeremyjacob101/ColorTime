import { getViewFromLocation } from "./view";
import ColorScreen from "../ts/ColorScreen";
import MyColorsScreen from "../ts/MyColorsScreen";

export default function App() {
  const view = getViewFromLocation();
  return view === "my-colors" ? <MyColorsScreen /> : <ColorScreen />;
}
