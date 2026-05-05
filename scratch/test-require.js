try {
  const { withNativeWind } = require("nativewind/metro");
  console.log("nativewind/metro loaded successfully with require");
} catch (e) {
  console.error("Failed to load nativewind/metro with require:", e.message);
}
