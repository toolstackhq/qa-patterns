const TEST_FILE_PATTERN = /[/\\]tests[/\\].+\.ts$/;
const PAGE_OBJECT_PATTERN = /[/\\](pages|components)[/\\].+\.ts$/;

const locatorMethods = new Set([
  "locator",
  "getByRole",
  "getByLabel",
  "getByTestId",
  "getByText",
  "getByPlaceholder",
  "getByAltText",
  "getByTitle",
  "$",
  "$$"
]);

function isIdentifierProperty(node, name) {
  return (
    node &&
    node.type === "MemberExpression" &&
    !node.computed &&
    node.property &&
    node.property.type === "Identifier" &&
    node.property.name === name
  );
}

module.exports = {
  rules: {
    "no-raw-locators-in-tests": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow selectors inside test files"
        },
        schema: [],
        messages: {
          noRawLocators:
            "Raw locators are not allowed in tests. Move selector logic into a page object or component."
        }
      },
      create(context) {
        if (!TEST_FILE_PATTERN.test(context.getFilename())) {
          return {};
        }

        return {
          CallExpression(node) {
            if (
              node.callee.type === "MemberExpression" &&
              !node.callee.computed &&
              node.callee.property.type === "Identifier" &&
              locatorMethods.has(node.callee.property.name)
            ) {
              context.report({
                node,
                messageId: "noRawLocators"
              });
            }
          }
        };
      }
    },
    "no-wait-for-timeout": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow waitForTimeout"
        },
        schema: [],
        messages: {
          noWaitForTimeout: "waitForTimeout is not allowed. Synchronize with user-visible events instead."
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            if (isIdentifierProperty(node.callee, "waitForTimeout")) {
              context.report({
                node,
                messageId: "noWaitForTimeout"
              });
            }
          }
        };
      }
    },
    "no-expect-in-page-objects": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow assertions inside page objects and UI components"
        },
        schema: [],
        messages: {
          noExpect:
            "Assertions are not allowed inside page objects or components. Return state and assert from the test."
        }
      },
      create(context) {
        if (!PAGE_OBJECT_PATTERN.test(context.getFilename())) {
          return {};
        }

        return {
          CallExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "expect") {
              context.report({
                node,
                messageId: "noExpect"
              });
            }
          }
        };
      }
    }
  }
};
