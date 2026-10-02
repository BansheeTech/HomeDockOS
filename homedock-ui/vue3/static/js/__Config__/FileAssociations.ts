// homedock-ui/vue3/static/js/__Config__/FileAssociations.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { BROWSER_IMAGE_EXTENSIONS, EXTENDED_IMAGE_EXTENSIONS } from "../__Composables__/useThumbnails";

export const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "tsv", "log", "env", "tex", "latex", "sty", "cls", "bib", "bst", "dtx", "ins", "properties", "lock", "gitignore", "gitattributes", "editorconfig", "prettierrc", "eslintrc", "babelrc"]);
export const CODE_EXTENSIONS = new Set(["json", "yml", "yaml", "xml", "conf", "ini", "js", "ts", "jsx", "tsx", "mjs", "cjs", "vue", "svelte", "astro", "py", "pyw", "pyi", "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd", "css", "scss", "sass", "less", "styl", "html", "htm", "xhtml", "sql", "c", "cpp", "h", "hpp", "cs", "java", "kt", "kts", "go", "rs", "rb", "php", "pl", "pm", "r", "rmd", "swift", "m", "mm", "scala", "groovy", "lua", "tcl", "dockerfile", "makefile", "cmake", "gradle", "toml", "graphql", "requirements.txt"]);
export const IMAGE_EXTENSIONS = new Set([...BROWSER_IMAGE_EXTENSIONS, ...EXTENDED_IMAGE_EXTENSIONS]);
export const MEDIA_EXTENSIONS = new Set(["mp4", "webm", "ogv", "ogg", "mp3", "wav", "aac", "flac", "m4a"]);
export const PDF_EXTENSIONS = new Set(["pdf"]);
export const SHEETS_EXTENSIONS = new Set(["xlsx"]);
export const WRITER_EXTENSIONS = new Set(["docx"]);
