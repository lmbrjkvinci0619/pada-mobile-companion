const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/dist/metro/index");

const baseConfig = getDefaultConfig(__dirname);
const wrappedConfig = withNativeWind(baseConfig, { input: "./global.css" });

console.log("Base Config keys:", Object.keys(baseConfig));
console.log("Wrapped Config keys:", Object.keys(wrappedConfig));

if (wrappedConfig.transformer) {
  console.log("Transformer keys:", Object.keys(wrappedConfig.transformer));
}
