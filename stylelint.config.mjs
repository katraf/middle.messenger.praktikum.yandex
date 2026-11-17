/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // БЭМ: block__element--modifier (стандартный конфиг разрешает только kebab-case)
    "selector-class-pattern": [
      "^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$",
      { message: "Используйте БЭМ: block__element--modifier" },
    ],
  },
};
