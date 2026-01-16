// homedock-ui/vue3/static/js/__Config__/UtilitiesDefaultDetails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineAsyncComponent } from "vue";
import WindowLoading from "../__Components__/WindowLoading.vue";
import type { SystemApp } from "./WindowTypes";

const UtilsNotepad = defineAsyncComponent({
  loader: () => import("../__Apps__/UtilsNotepad.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const UtilsCalculator = defineAsyncComponent({
  loader: () => import("../__Apps__/UtilsCalculator.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const UtilsImageViewer = defineAsyncComponent({
  loader: () => import("../__Apps__/UtilsImageViewer.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const UtilsPDFViewer = defineAsyncComponent({
  loader: () => import("../__Apps__/UtilsPDFViewer.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const UtilsBrusher = defineAsyncComponent({
  loader: () => import("../__Apps__/UtilsBrusher.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});
const UtilsMediaPlayer = defineAsyncComponent({
  loader: () => import("../__Apps__/UtilsMediaPlayer.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});

import fileDocumentOutlineIcon from "@iconify-icons/mdi/file-document-outline";
import calculatorIcon from "@iconify-icons/mdi/calculator";
import imageOutlineIcon from "@iconify-icons/mdi/image-outline";
import filePdfBoxIcon from "@iconify-icons/mdi/file-pdf-box";
import brushIcon from "@iconify-icons/mdi/brush";
import movieOutlineIcon from "@iconify-icons/mdi/movie-outline";

export const UTILITIES_APPS: SystemApp[] = [
  {
    id: "notepad",
    name: "Notepad",
    description: "Create and edit text files",
    icon: fileDocumentOutlineIcon,
    component: UtilsNotepad,
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 400,
    minHeight: 350,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "utilities",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Quick calculations",
    icon: calculatorIcon,
    component: UtilsCalculator,
    defaultWidth: 320,
    defaultHeight: 480,
    minWidth: 320,
    minHeight: 480,
    resizable: false,
    maximizable: false,
    minimizable: true,
    closeable: true,
    category: "utilities",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "imageviewer",
    name: "Image Viewer",
    description: "View and browse images",
    icon: imageOutlineIcon,
    component: UtilsImageViewer,
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 400,
    minHeight: 600,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "utilities",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "pdfviewer",
    name: "PDF Viewer",
    description: "View PDF documents",
    icon: filePdfBoxIcon,
    component: UtilsPDFViewer,
    defaultWidth: 800,
    defaultHeight: 700,
    minWidth: 500,
    minHeight: 500,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "utilities",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "brusher",
    name: "Brusher",
    description: "Simple drawing and painting tool",
    icon: brushIcon,
    component: UtilsBrusher,
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 400,
    minHeight: 600,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "utilities",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
  {
    id: "mediaplayer",
    name: "Media Player",
    description: "Play video and audio files",
    icon: movieOutlineIcon,
    component: UtilsMediaPlayer,
    defaultWidth: 800,
    defaultHeight: 600,
    minWidth: 400,
    minHeight: 600,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "utilities",
    showInStartMenu: false,
    showInExplorerApp: false,
    showInMyHomeApp: false,
  },
];
