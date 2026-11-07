// Specific grammar scopes supplement the shared language-independent rules.
export function languageRules(p) {
  const groups = [
    [
      "Documentation tags",
      "purple",
      [
        "storage.type.class.jsdoc",
        "entity.name.tag.documentation",
        "keyword.other.documentation",
      ],
    ],
    [
      "Documentation types",
      "yellow",
      ["entity.name.type.instance.jsdoc", "support.type.builtin.ts"],
    ],
    [
      "Object keys",
      "cyan",
      ["meta.object-literal.key.js", "meta.object-literal.key.ts"],
    ],
    [
      "Template interpolation",
      "purple",
      [
        "punctuation.definition.template-expression.begin",
        "punctuation.definition.template-expression.end",
      ],
    ],
    [
      "JSX components",
      "yellow",
      ["support.class.component.jsx", "support.class.component.tsx"],
    ],
    [
      "JSX attributes",
      "cyan",
      ["entity.other.attribute-name.jsx", "entity.other.attribute-name.tsx"],
    ],
    [
      "Python built-ins",
      "cyan",
      ["support.function.builtin.python", "support.type.python"],
    ],
    [
      "Python self",
      "orange",
      [
        "variable.language.special.self.python",
        "variable.language.special.cls.python",
      ],
    ],
    [
      "Python decorators",
      "yellow",
      [
        "entity.name.function.decorator.python",
        "meta.function.decorator.python",
      ],
    ],
    [
      "Python format strings",
      "purple",
      [
        "constant.character.format.placeholder.other.python",
        "storage.type.format.python",
      ],
    ],
    [
      "Ruby symbols",
      "orange",
      ["constant.other.symbol.ruby", "constant.language.symbol.ruby"],
    ],
    [
      "Ruby instance fields",
      "fg",
      [
        "variable.other.readwrite.instance.ruby",
        "variable.other.readwrite.class.ruby",
      ],
    ],
    [
      "PHP variables",
      "fg",
      ["variable.other.php", "punctuation.definition.variable.php"],
    ],
    [
      "PHP tags",
      "purple",
      [
        "punctuation.section.embedded.begin.php",
        "punctuation.section.embedded.end.php",
      ],
    ],
    [
      "C preprocessor directives",
      "purple",
      [
        "keyword.control.directive.include.c",
        "keyword.control.directive.define.c",
      ],
    ],
    [
      "C header paths",
      "green",
      ["string.quoted.other.lt-gt.include.c", "string.quoted.double.include.c"],
    ],
    [
      "C++ template types",
      "yellow",
      ["entity.name.type.template.cpp", "storage.type.template.cpp"],
    ],
    [
      "C++ namespaces",
      "yellow",
      ["entity.name.scope-resolution.cpp", "entity.name.namespace.cpp"],
    ],
    [
      "C# attributes",
      "yellow",
      ["entity.name.type.attribute.cs", "support.type.attribute.cs"],
    ],
    [
      "C# interpolation",
      "purple",
      [
        "punctuation.section.interpolation.begin.cs",
        "punctuation.section.interpolation.end.cs",
      ],
    ],
    [
      "Java annotations",
      "yellow",
      [
        "storage.type.annotation.java",
        "punctuation.definition.annotation.java",
      ],
    ],
    [
      "Java packages",
      "cyan",
      ["storage.modifier.package.java", "entity.name.namespace.java"],
    ],
    ["Go types", "yellow", ["entity.name.type.go", "support.type.go"]],
    [
      "Go built-ins",
      "cyan",
      ["support.function.builtin.go", "support.function.go"],
    ],
    [
      "Rust lifetimes",
      "orange",
      ["entity.name.type.lifetime.rust", "storage.modifier.lifetime.rust"],
    ],
    [
      "Rust macros",
      "purple",
      ["entity.name.function.macro.rust", "support.macro.rust"],
    ],
    ["Swift types", "yellow", ["support.type.swift", "entity.name.type.swift"]],
    [
      "Kotlin annotations",
      "yellow",
      ["entity.name.type.annotation.kotlin", "storage.type.annotation.kotlin"],
    ],
    ["Dart types", "yellow", ["support.class.dart", "entity.name.type.dart"]],
    [
      "Shell expansions",
      "orange",
      ["variable.other.normal.shell", "variable.other.positional.shell"],
    ],
    [
      "Shell substitution",
      "purple",
      [
        "punctuation.definition.subshell.shell",
        "punctuation.section.interpolation.begin.shell",
      ],
    ],
    ["SQL tables", "yellow", ["entity.name.table.sql", "support.type.sql"]],
    [
      "SQL functions",
      "accent",
      ["support.function.sql", "entity.name.function.sql"],
    ],
    [
      "YAML anchors",
      "purple",
      ["entity.name.type.anchor.yaml", "variable.other.alias.yaml"],
    ],
    [
      "YAML scalars",
      "green",
      ["string.unquoted.block.yaml", "string.unquoted.plain.out.yaml"],
    ],
    [
      "TOML sections",
      "yellow",
      ["entity.name.section.toml", "entity.name.table.toml"],
    ],
    [
      "Configuration properties",
      "accent",
      ["support.type.property-name.toml", "keyword.other.definition.ini"],
    ],
    [
      "CSS units",
      "orange",
      ["keyword.other.unit.css", "keyword.other.unit.scss"],
    ],
    [
      "CSS custom properties",
      "fg",
      ["variable.css", "variable.scss", "variable.less"],
    ],
    [
      "HTML entities",
      "orange",
      ["constant.character.entity.html", "punctuation.definition.entity.html"],
    ],
    [
      "XML declarations",
      "purple",
      ["keyword.other.xml", "entity.name.tag.xml"],
    ],
    [
      "Markdown code fences",
      "muted",
      [
        "punctuation.definition.markdown",
        "fenced_code.block.language.markdown",
      ],
    ],
    [
      "Markdown link targets",
      "cyan",
      ["markup.underline.link.markdown", "string.other.link.title.markdown"],
    ],
    ["Diff metadata", "muted", ["meta.diff.header", "meta.diff.range"]],
    [
      "Regular expression groups",
      "yellow",
      ["punctuation.definition.group.regexp", "keyword.control.anchor.regexp"],
    ],
    [
      "Regular expression classes",
      "orange",
      [
        "constant.other.character-class.regexp",
        "keyword.operator.quantifier.regexp",
      ],
    ],
  ];
  return groups.map(([name, role, scope]) => ({
    name,
    scope,
    settings: { foreground: p[role] },
  }));
}
