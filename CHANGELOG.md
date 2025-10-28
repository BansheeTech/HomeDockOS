# CHANGELOG

- **2.0.2.280** (Latest): Fixed context menu behavior for system icons on mobile devices.

  - Fixed **system icon context menu on mobile**, long press on system icons like "My Home" now correctly shows the system icon menu (Refresh) instead of incorrectly displaying the regular app menu (Properties, System Logs, etc.).
  - Implemented **dedicated event handling** for system icons in mobile touch interactions by adding `systemiconContextmenu` event to properly distinguish between apps, folders, and system icons.
  - Enhanced **Mobile Desktop component** to emit the correct context menu event based on item type, ensuring consistent behavior across all desktop icon types.

---

- **2.0.2.268**: Redesigned Settings interface with new grouped layout system and improved mobile experience.

  - Introduced **new Settings layout components** for a cleaner, more modern interface.
  - Implemented **grouped settings sections** with headers and footer descriptions for better organization and user guidance.
  - Added **colored icon indicators** for each setting option (blue, green, red, orange, purple, gray, cyan, pink, yellow) making it easier to identify different types of settings at a glance.
  - Enhanced **mobile responsiveness** with automatic layout stacking on smaller screens, controls move below their labels when space is limited for better usability on phones and tablets.
  - Improved **Settings visual hierarchy** with better spacing, borders, and hover effects providing clearer visual feedback when interacting with options.
  - Added **animated transitions** for settings groups with smooth slide-in effects when opening the Settings window.
  - Implemented **smart control detection** that automatically adjusts layout based on control type. Small controls like switches stay inline while larger inputs stack on mobile.
  - Enhanced **form control styling** ensuring inputs, selects, and other controls take full width when stacked on mobile devices.
  - Added **comprehensive theme support** for all new Settings components across Default, Noir, and Aero+ themes with proper colors and backgrounds.
  - Improved **Settings readability** with better typography, consistent spacing, and clearer descriptions for each configuration option.
  - Fixed **inconsistent Context Menu behavior on mobile** when interacting with system icons - now properly detects touch events and shows appropriate options.
  - Also updated vite and axios dependencies to latest versions available.

- **2.0.2.266**: Added custom wallpaper support for Aero+ theme and improved Settings reactivity with better state management.

  - Introduced **custom wallpaper upload feature** allowing users to personalize their Aero+ theme with custom background images.
  - Added new **wallpaper upload endpoint** (`/api/upload_wallpaper`) with comprehensive security validation including magic byte verification for JPEG and PNG formats.
  - Enhanced **Settings Theme tab** with conditional rendering, showing wallpaper options only when Aero+ theme is selected for cleaner interface.
  - Improved **Settings form validation** ensuring wallpaper uploads complete before saving other settings to maintain data consistency.
  - Enhanced **reactivity in Settings app** by adding `update-settings` injection to properly propagate configuration changes across the application.
  - Removed obsolete **default custom wallpaper file** (`back_custom_default.jpg`) as custom wallpapers now use dynamic naming with timestamps.
  - Enhanced **CSRF token handling** in wallpaper upload requests ensuring secure file transfer operations.
  - Updated **upload limits configuration** adding wallpaper endpoint to size-controlled endpoints for consistent security policy.
  - Improved **Settings component communication** between parent and child components using refs for better state synchronization.
  - Added **fade-slide transitions** for wallpaper sections providing smooth visual feedback when switching themes.
  - Enhanced **warning notifications** in Settings to inform users about wallpaper upload failures with actionable error messages.
  - Refined **file delivery system** to support serving custom wallpaper files with proper MIME type detection.
  - Updated **theme selector** to handle dynamic custom wallpaper paths ensuring proper wallpaper loading across sessions.
  - Improved **desktop wallpaper rendering** in AeroPlusWallpaper component to support both default and custom wallpaper sources.
  - Enhanced **mobile desktop wallpaper** support ensuring custom wallpapers render correctly on touch devices and smaller screens.
  - Updated **SECURITY.md** documentation with latest security considerations and best practices.

- **2.0.2.260**: Enhanced App Store experience with screenshot previews, overall experience and more improvements.

  - Added **screenshot preview galleries** to the App Installation dialog, allowing you to view app screenshots before installing with smooth drag-to-scroll navigation.
  - Implemented **fullscreen screenshot viewer** with keyboard navigation support (arrow keys and ESC) for better preview experience.
  - Introduced **Show Desktop button** on the taskbar (vertical line on the bottom right) with right-click context menu for quick desktop access and window management.
  - Added **centralized system tray manager** preventing multiple tray panels from opening simultaneously for cleaner interface management.
  - Expanded App Store with **screenshot support for all available applications**, providing visual previews to help you choose the right apps.
  - Improved **update system reliability** with automatic server restart detection and smart polling to ensure smooth updates without manual intervention.
  - Refined **App Installation dialog layout** with reorganized screenshot placement and improved visual hierarchy.

- **2.0.2.148**: Major improvements to the application update system for better stability and efficiency.

  - Improved version comparison system to detect updates more accurately an follow only real newer versions instead of just different ones.
  - Fixed critical issue that caused orphaned images during insatlled application updates, making them dangling.
  - Implemented auto-cleanup update flag system with 120-second timeout to prevent locks while updating HomeDock OS.
  - Modified availale applications update check interval to 3 hours to reduce system load.

- **2.0.2.146**: Fixed a typo in `homedock-ui/vue3/static/js/__Layouts__/App.vue`, last-minute catch, we're on VDS 2025 and VC investors really do have eagle vision.

- **2.0.2.144**: Introduced the **HDS Package Management System** with the new **Packager** system tool, allowing you to create, import, and share custom application packages directly into the App Store. Added comprehensive **update tracking** for your apps with automatic detection. Enhanced system monitoring with a brand new **Home** dashboard displaying real-time storage statistics and system health.

  - Launched the **Packager** application, your personal package creation studio for building custom app distributions in the new `.hds` format.
  - Added **Package Generator** interface where you can bundle Docker Compose files with custom icons, metadata, and configurations into shareable packages.
  - Introduced **Package Manager** allowing you to import, browse, and manage all your custom application packages in one place.
  - Implemented support for **HDS package files** (`.hds`), a specialized format designed to simplify app distribution and installation across all HomeDock OS instances, making them instantly available on the App Store.
  - Created automatic **update detection system** that monitors your installed applications and alerts you when newer versions are available.
  - Added **App Updates Indicator** to the taskbar showing at-a-glance how many of your apps have updates ready to install.
  - Implemented background **update checker thread** that automatically scans for app updates every 6 hours without impacting system performance.
  - Built the new **My Home app** application serving as your system's dashboard, displaying storage usage, encrypted files, and external drive information at a glance.
  - Added **system storage overview** on My Home app showing your cloud storage usage with visual progress bars and detailed capacity information.
  - Integrated **encrypted storage statistics** on My Home app displaying how much space your secure Drop Zone files are using with file count tracking.
  - Implemented **external drive detection** and monitoring on My Home app, automatically showing external storage capacity and usage when drives are connected.
  - Enhanced **system statistics monitoring** with new real-time tracking capabilities for container resource usage and performance metrics.
  - Created dedicated **resource monitoring thread** for tracking CPU, memory, and network usage of individual Docker containers tracking CPU, RAM and network usage.
  - Introduced **system stats store** providing centralized state management for all performance metrics across the interface.
  - Upgraded the **Desktop icons grid** with improved drag-and-drop behavior, smoother animations, and better multi-selection support.
  - Enhanced **folder management** with refined context menus, improved color customization, and more intuitive organization features.
  - Refined **Start Menu** with better app categorization, improved search functionality, and visual polish for custom package apps.
  - Updated **Application Properties** window to display more comprehensive container information including now RAM and traffic usage too.
  - Added **Docker Compose Helper** class providing standardized utilities for parsing, validating, and managing compose file operations.
  - Enhanced **container data retrieval** with improved caching, better error handling, and support for user-created package apps.
  - Implemented **devhook placeholder detection** on Packager app allowing package creators to include dynamic variables like random strings or generated API keys in their compose files.
  - Added comprehensive .hds **validation system** for package creation including slug format checking, category validation, and file size limits.
  - Introduced .hds **package metadata system** supporting display names, descriptions, categories, types, and custom branding for user packages.
  - Created **package export functionality** allowing you to download your created packages as `.hds` files for backup or sharing.
  - Implemented **package import workflow** with drag-and-drop support, validation checks, and automatic installation to your app library.
  - Added **user packages directory** (`_user_packages/`) organizing imported packages with dedicated folders for package files, icons, and compose configurations.
  - Enhanced **App Store integration** to seamlessly display both official HomeDock OS apps and your custom imported packages in a unified interface.
  - Improved **desktop icon rendering** for custom package apps with proper icon loading, fallback handling, and theme-aware styling.
  - Updated **installation workflow** to support custom packages with the same reliability and features as official HomeDock OS App Store applications.
  - Refined **taskbar indicators** with new visual designs for updates, installations, and uploads maintaining consistent styling across themes.
  - Added support for **package deletion** with proper cleanup of associated files, icons, and compose configurations.
  - Implemented **package editing capabilities** allowing you to modify existing package metadata, icons, and compose files after creation.
  - Created **compose file editor** within Packager system app featuring syntax validation, live preview, and formatting assistance.
  - Added **icon preview system** in the package generator showing real-time previews of uploaded icons with size and format validation.
  - Introduced **category selection** with predefined options including Media, Development, Security, Networking, and more for better app organization.
  - Enhanced **error messaging** throughout the packaging system with clear, user-friendly feedback for validation failures and upload issues.
  - Implemented **file size limits** ensuring packages remain manageable (5MB for packages, 10MB for compose files, 5MB for icons).
  - Added **path traversal protection** in package handling preventing security issues when extracting or processing package files.
  - Created **package versioning support** within `.hds` format version tracking ensuring compatibility across future HomeDock OS releases.
  - Improved **container update logic** with smarter image comparison using manifest digests for accurate update detection.
  - Added **update filtering** to exclude dependency containers (marked with `HDRole=dependency`) from update notifications.
  - Refined **mobile responsiveness** for AppPackager with optimized layouts for tablets and smaller screens.
  - Updated **window configurations** adding proper size constraints, default dimensions, and positioning for the new Home and Packager system apps.
  - Enhanced **desktop layout** to accommodate the new Home system app as a quick-access system dashboard alongside other core applications.
  - Improved **Docker API interactions** with better error handling, retry logic, and timeout management for registry checks and container operations.
  - Added **cache invalidation** for external apps ensuring package changes are immediately reflected throughout the interface.
  - Fixed **compose version compatibility** in WireGuard and WG-Easy templates ensuring proper deployment across different Docker Compose versions.
  - Refined **notification system** to handle package installation progress, update availability, and error states with contextual messages.
  - Improved **state persistence** for package-related data ensuring your custom apps remain available across sessions and restarts.
  - Added **sanitization utilities** for container names and package slugs preventing conflicts and ensuring filesystem compatibility.
  - Enhanced **global functions** with new utilities for package path resolution, directory creation, and file operations.
  - Enhanced **file delivery system** supporting package downloads with proper MIME types and headers for `.hds` files.

- **2.0.1.106**: Updated JavaScript and Python dependencies to latest versions, migrated head management library and simplified rate limiting architecture.

  - Updated all **JavaScript dependencies** to their latest stable versions for improved security and performance.
  - Updated all **Python dependencies** to their latest stable versions ensuring compatibility and security patches.
  - Removed **Flask-Limiter** dependency, simplifying the rate limiting architecture with custom implementation.
  - Migrated from **vue-meta** to **@unhead/vue** for improved head/meta tag management with better Vue 3 compatibility, performance, and modern API.

- **2.0.1.104**: Implemented **session expiration detection system** with ultra-hardened axios interceptor and fixed **CSS theming bugs** in `AppDropzone.vue` and `ThemeSelector.ts`.

  - Added new `SessionExpiredTray.vue` component to taskbar that monitors HTTP 401/403 responses to automatically detect expired sessions and CSRF token failures.
  - Implemented **ultra-hardened axios interceptor** with comprehensive security protections against prototype pollution, getter traps, type coercion, ReDoS, and DoS attacks using native method caching, strict validation, string length limits, and rate limiting.
  - Added visual indicator to taskbar with animated SVG icon (gear with slash) showing session status.
  - Implemented dropdown panel with "Log in again" button for seamless re-authentication experience.
  - Fixed **CSS theming bug** in `AppDropzone` where upload list item text (`.ant-upload-list-item-name`) and loading icons (`.ant-upload-text-icon`) appeared black in Noir and Aero+ themes due to missing `themeClasses.scopeSelector` class on the `UploadDragger` component, preventing CSS rules in `antd.css` from applying correctly.
  - Fixed missing theme class in `ThemeSelector.ts` for folder color picker context menu text styling.

- **2.0.1.102**: Fixed **RegEx injection issue** in AppExplorer search functionality where special regex characters (like `(`, `)`, `[`, `]`, `*`, `+`, etc.) were not being escaped, causing application crashes and potential security issues. Implemented proper input sanitization by escaping all special regex characters before pattern compilation, preventing malformed expressions and protecting against ReDoS attacks.

- **2.0.1.88**: HomeDock OS 2.0 release featuring our brand new **Prism Windows Manager**, introducing real multitasking and a **complete operating system experience**.

  - Transformed HomeDock OS from a single-page web application into a **full desktop environment with true multitasking**, similar to **Windows 11** or **macOS**.
  - Released our fully functional **Prism Window Manager** with resizable, draggable, maximizable, and minimizable windows. App load from within this desktop manager will be enabled after the integrated reverse proxy gets released.
  - Implemented **draggable desktop icons** with **snap-to-grid positioning**, allowing users to organize applications freely on the desktop.
  - Added support for **desktop folders**, enabling users to group related applications together for better organization (e.g., "Media Apps", "Development Tools").
  - Implemented **Start Menu** with application search, quick access, and organization of both system and installed Docker applications.
  - Created functional **taskbar** with active application buttons, system clock, notification area and quick access to Start Menu.
  - Added **real-time system statistics widget** to the taskbar displaying **CPU**, **RAM**, **disk usage**, and **network activity**.
  - Implemented **context menus** for desktop, applications, and folders with right-click support for quick actions and long-press detection for mobile icon dragging/wiggling.
  - Converted all main sections (**App Store**, **Control Hub**, **Settings**, **System Logs**, **Drop Zone**) into independent windows that can be opened simultaneously.
  - Implemented proper **z-index management** ensuring focused windows appear on top of others.
  - Added support for **window size constraints** (`min`/`max` width/height) configurable per application type.
  - Implemented **double-click on title bar** to maximize/restore windows, matching standard desktop OS behavior.
  - Added **resize handles on all eight directions** (`N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`) for flexible window resizing.
  - Implemented **smooth minimize animations** with scaling effects.
  - Implemented **window state persistence**, remembering position and size across sessions.
  - Added support for **multi-selection** on Desktop using `Ctrl+Click` and **drag-to-select area selection** for batch operations on multiple applications.
  - Implemented **persistent icon positions** across sessions, maintaining user's desktop layout after logout/login.
  - Created a **mobile-optimized desktop experience** with horizontal page navigation and touch gestures, mimicking real-life mobile OS home screen behavior.
  - Created **mobile-optimized fullscreen mode** for windows on touch devices, respecting taskbar height.
  - Added **visual page indicators** for mobile users to track which page they're currently viewing.
  - Added **keyboard shortcuts** and accessibility features for window management.
  - Implemented **smooth animations and transitions** for icon movements, folder operations, and window actions.
  - Created new **File Explorer** system application for browsing and managing files within the desktop environment.
  - Implemented **Folder View** system application for viewing folder contents in a dedicated window.
  - Implemented **Application Properties** window displaying detailed information about Docker containers (status, ports, volumes, multi-service configs, etc).
  - Redesigned the whole **App Installation** modal using **Ant Design Vue** for customizing Docker Compose settings before installing applications.
  - Created **About** window displaying HomeDock OS version, credits, system information, and props for what we understand it's unacceptable now.
  - Massively expanded **theme system** with support for all new components (windows, desktop, context menus, color pickers, dialogs, etc).
  - Added new **CSS variables** for window shadows, borders, and backdrop effects ensuring consistent theming.
  - Integrated **Ant Design component styling** adapted to match HomeDock OS theme palette across all three themes (`Default`, `Noir`, `AeroPlus`).
  - Updated logo and graphics to support **dynamic color adaptation** based on selected theme using `currentColor`.
  - Implemented **theme-aware animations and transitions** for desktop interactions.
  - Implemented **modal dialog system** for application interactions (confirmations, inputs, alerts).
  - Created **color picker menu** for folder customization, allowing users to assign custom colors to organize folders visually.
  - Added **date/time picker component** with calendar view on the taskbar, replacing the top-right one.
  - Implemented **info banners** for displaying important system messages prominently.
  - Created **installation progress indicator** showing real-time status of App Store application installations to the **system tray**.
  - Added **upload progress indicator** with file-by-file tracking for Drop Zone uploads straight to the **system tray**.
  - Implemented **status bar** for windows displaying relevant information per application type and a little help section.
  - Created **consistent section headers** across all applications for improved visual hierarchy.
  - Added **version control component** for tracking and displaying HomeDock OS version information.
  - Implemented **unified logo icon component** used across the entire interface.
  - Refactored **App Store** with window system integration, allowing installation while browsing other sections.
  - Improved **search and filtering** capabilities with instant results and category-based organization.
  - Updated **Control Hub** to function as window with enhanced Docker container management capabilities.
  - Enhanced **chart displays** with better visual feedback and real-time data updates.
  - Improved **login attempt visualization** with clearer security indicators.
  - Integrated **notification bell** with taskbar for quick access to system alerts.
  - Enhanced **port routing logic** for better Docker service discovery and connection handling.
  - Added new **storage management options** in settings for external drive configuration.
  - Improved **theme selector** with live preview and instant switching.
  - Removed obsolete single-page HTML templates consolidating everything into the unified desktop environment.
  - Updated copyright notices and credits throughout the interface.
  - Patched **rate-limiting bypass vulnerability** (reported by **@StringManolo**) where attackers could spoof IP addresses via HTTP headers (`X-Forwarded-For`, `X-Real-IP`) to circumvent login attempt restrictions and **Shield Mode** protections. Replaced insecure `get_remote_address()` with `request.remote_addr` to enforce **TCP socket-based IP validation**, making IP spoofing impossible without a trusted reverse proxy. Enhanced `is_local_subnetwork_ip()` to properly validate all **RFC 1918 private networks** (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and loopback addresses using `ipaddress` module, fixing incomplete subnet validation that only checked `192.168.x.x` ranges.
  - Mitigated an **Authenticated SSRF vulnerability** in `/api/check-port` (reported at **Secur0** by **@cybernize**), which allowed **Host header manipulation** to probe internal services, implementing strict **hostname allowlisting** and IP validation against trusted local/internet IPs.
  - Fixed a **Path Traversal** vulnerability in Drop Zone file operations (reported at **Secur0** by **@esTse**), which allowed unauthorized path manipulation during file handling.
  - Additionally mitigated **DoS variant** of the Path Traversal vulnerability (reported at **Secur0** by **@Ismael034**) where accessing
    `/dev/random` could crash the application.
  - Updated `SECURITY.md` security documentation with complete vulnerability history and fix versions, acknowledging security researchers.
  - Implemented **desktop state persistence** on `localStorage` to remember your icon positions, folder organization, and personal preferences across sessions.
  - Added **window state management** to remember each window's position, size, and state after closing and reopening.
  - Added support for **tracking multiple simultaneous file uploads** with real-time progress indicators.
  - Enhanced application management to support **running multiple instances** of the same app in different windows.
  - Added **multi-selection support** for performing batch operations on multiple desktop icons simultaneously.
  - Implemented **custom dialog system** for consistent modal interactions across all applications with full theme support.
  - Implemented **intelligent responsive design** that automatically adapts the interface based on your device (mobile, tablet, or desktop).
  - Enhanced **security token management** with automatic token refresh and hot reload ensuring secure API communications throughout the application.
  - Integrated **real-time system monitoring** for CPU temperature, usage, containers, disk space, network activity, RAM, and uptime with live updates in the system statistics widget.
  - Unified **Docker container operations** allowing you to manage containers from any window or context seamlessly.
  - Improved **component rendering engine** for faster and more efficient dynamic window loading.
  - Enhanced **navigation system** with support for multiple simultaneous windows and intelligent routing (e.g., opening multiple log viewers at once).
  - Added a Vue Router cosmetic **client-side navigation guard** for better user experience when switching between protected routes (security validation still happens server-side).
  - Simplified **application layouts** by removing redundant navigation elements now handled by the desktop environment.
  - Created unified **desktop layout system** as the primary interface for the application.
  - Maintained **specialized pages** for login, error handling, limited mode, and shield mode with dedicated layouts.
  - Ensured **backward compatibility** with legacy application routing while supporting the new window-based architecture.
  - Redesigned **application initialization** to support the new desktop-first architecture with multiple concurrent windows.
  - Implemented **lazy loading** for window components, significantly improving initial application load performance.
  - Completely refactored **backend architecture** to support desktop environment with unified routing and data handling.
  - Enhanced **Docker service integration** with improved dynamic loading, port mapping, and container information retrieval.
  - Integrated **file management** with the window system for seamless Drop Zone operations within the desktop.
  - Expanded **settings management** providing comprehensive desktop configuration options and user preferences.
  - Enhanced **Docker API** to provide extended container information including detailed properties and resource usage (RAM monitoring coming soon).
  - Updated all **Docker operations** (start, stop, restart, pause, unpause, update, uninstall) to work seamlessly from any window context.
  - Implemented **comprehensive type safety** across the entire application with strict TypeScript interfaces for better reliability and developer experience.
  - Enhanced **file metadata system** for improved Drop Zone file management with detailed type information.
  - Updated **JavaScript dependencies** adding modern libraries for advanced window management, drag-and-drop functionality, and enhanced UI components.
  - Updated **Python dependencies** ensuring full compatibility with the new architectural patterns and desktop features.
  - Optimized **build system** with intelligent code splitting for faster page loads and improved performance.
  - Enhanced **TypeScript configuration** with stricter type checking and better module structure support.
  - Hi there! We're working! :D

- **1.0.18.126**: Dependabot security update patching Axios CVE-2025-58754

- **1.0.18.124**: Dependabot security update patching Vite CVE-2025-58751 and CVE-2025-58752. Minor improvements on the notification system to make it cleaner and more consistent with the rest of the HomeDock OS GUI.

- **1.0.18.122**: Improved `/app/` endpoint loader with dynamic app icons and smooth slide-up animations. Added `/api/container-by-port/<port>` to map ports to container names via Docker API, removing static config dependencies. Icons now show next to the HomeDock OS logo when available, UX at its finest... Updated backend-to-frontend data flow (`selected_app_slug`) with TypeScript interfaces and secured new endpoints with `@login_required` and our own CSRF protection module.

- **1.0.18.120**: Added new apps (Jellyseerr, Downtify, Web-Check, IT-Tools, Booklore (SSL too), Morphos, Homebridge, WG-Easy (SSL too), Homebox, Uptime-Kuma, and Compose-Toolbox) to the App Store. Fixed `hd_UIAppLoader.py` to correctly handle HTTP 308 redirects (which broke on some apps like Pi-hole due changing its response behavior). The loader now respects subpaths and makes requests to the exact endpoint configured (e.g., `localhost:8080/test` instead of just `localhost:8080`). Minor design tweaks were also applied to `App.vue` and `MenuContent.vue` to improve visual consistency. Fixed Nextcloud and also added native SSL support if enabled.

- **1.0.18.118** **[Dependency Clean-up]**: Upgraded `axios` to `1.11.0` to enforce a clean dependency tree after the previous mitigation of `CVE-2025-7783`. Although version `1.0.18.117` had already resolved the issue by bundling `form-data@4.0.4`, some security scanners (e.g. Dependabot, Snyk) continued flagging a potential risk due to transitive resolution inconsistencies. This update ensures `form-data@4.0.0` is fully removed from the lockfile and guarantees compliance with automated auditing tools. Additionally, most JavaScript dependencies have been updated to their latest versions, with the exception of Tailwind CSS (still on `3.4.16`), which requires additional configuration work. No runtime or API changes introduced.

- **1.0.18.117** **[Security Update]**: Upgraded npm dependency `axios` to version `1.10.0` to eliminate a transitive dependency on `form-data@4.0.2`, which used insecure `Math.random()` for multipart boundaries (CVE-2025-7783). The new version bundles `form-data@4.0.4`, fixing the issue without breaking compatibility. This ensures safer outbound HTTP requests and avoids injection risks in multipart payloads. No changes required to existing `axios` usage across the codebase. Confirmed that `form-data` is no longer a vulnerable node in the dependency tree.

- **1.0.18.116**: Added cross-platform external drive detection in `hd_ExternalDriveManager.py`, tested on Windows, macOS and Linux. Fixed container recreation on Windows by replacing `os.rename` with atomic `os.replace`. Added `[[RND_STR]]` devhook to compose preparser for dynamic string generation (perfect fit por API Keys and related). Replaced Python Requests user-agent in `/app/` with realistic Chrome/Windows UA and adjusted retry timing for better app compatibility. Centralized devhook handling in `hd_ComposeDevHooks.py` and added logic to detect and remove internal volumes on uninstall if configured. Replaced static `Welcome to HomeDock OS` greeting with dynamic messages from `WelcomeMessage.vue` and refactored `UserGreeting.vue` for cohesion. Removed VanillaJS legacy user button from dashboard and fixed mobile CSS issue causing blue links.

- **1.0.18.112**: Replaced the `Popconfirm` component used for uninstalling apps on the Dashboard with a new **custom multi-step confirmation system** to address a long-standing bug in Ant Design Vue that caused uninstall actions to fail silently on some Windows builds and specific screen resolutions. The new implementation uses a **progressive button interaction** with animated feedback (`Uninstall → Confirm? → Are you sure?!`) to ensure reliability, improve UX, and fully bypass the inconsistent rendering issues of the original component, this kind of inherits the file deletion confirmation from Drop Zone files so it would be better for UI/UX too. (Thanks @tracins for the issue report)

- **1.0.18.110**: Removed the Drop Zone delete confirmation modal and replaced it with a **double-click deletion** system for a faster, cleaner, and more intuitive UX. Improved overall UI flow. Introduced a **limit of 3 simultaneous uploads** to prevent overhead and ensure better stability during heavy usage.

- **1.0.18.109**: Complete `DropZone` interface redesign with advanced file management capabilities. Implemented **dual view modes** (`grid`/`list`) with persistent user preferences stored in `localStorage` under unified `dropzoneStatus` which will be soon extended to the dashboard for a Desktop feeling. Added intelligent **sorting system** with `name`, `size`, and `date` options plus ascending/descending toggle. Enhanced file information display with **relative timestamps** (`"5m ago"`, `"1h ago"`, `"Now"` for recent uploads) and **`NEW` badges** for files uploaded within the last hour. Introduced **confirmation modal** due to popular demand for file deletions to prevent accidental data loss (sorry if you were affected >\_>). Improved **responsive design** ensuring search bar and controls adapt perfectly across mobile and desktop devices. Added comprehensive **theming support** with new `themeClasses` for all interface elements (`view toggles`, `sort controls`, `modal`, `badges`) ensuring consistent styling across all three themes (`Default`, `Noir`, `AeroPlus`). **Progress bars** now maintain consistent appearance between grid and list views using `absolute positioning` to prevent layout shifts.

- **1.0.18.108**: Added CONTRIBUTING.md and improved DropZone file encryption with `AES-GCM` and `PBKDF2-HMAC-SHA256` `(1.2M iterations)` using per-user keys and 32 bytes salts stored in homedock_dropzone.conf (under the `dzkey_v2` prefix). Introduced **in-memory key caching** to avoid redundant derivations, and added associated data (username) to `AES-GCM` for integrity binding. This kind of mirrors the salt logic from the legacy `dzkey` system, but serves a distinct purpose. While the username is used in the salt to generate a unique key per user, it's also used as associated data to ensure that encrypted files are tightly bound to their intended user, so now both mechanisms now coexist in `dzkey_v2`. Legacy-encrypted files are automatically migrated on access so transition is seamless. Also removed key derivation from login to prevent slowdown, refined salt handling, cleaned up dead code, and improved error messages. In short, DropZone is now 10–50× more secure and obviously, faster.

- **1.0.18.106**: This quality-of-life update focuses on improving the stability and responsiveness of background services. We've enhanced the `homedock.local` (mDNS) service to gracefully handle network name conflicts, preventing potential application crashes and providing clearer user feedback. Some core network services have been reworked to be event-driven, allowing settings changes to take effect in real-time without requiring an application restart. Internal improvements and a monthly rotation in the active instance management service to enhance stability and entropy. Also fixed minor typos and some icon theme issues.

- **1.0.18.104**: Applied a temporary workaround to restore Filebrowser functionality after unexpected changes in their image and startup behavior, which broke compatibility with previously working Docker Compose setups. This ensures it remains operational while they clarify their recommended deployment approach.

- **1.0.18.103**: Updated `README.md` and `CHANGELOG.md` (we missed this one). Added GitHub icon to social links and integrated Discord with a ticket-based support system.

- **1.0.18.102**: Patched brace-expansion (CVE-2025-5889) and `requests/urllib3` vulnerabilities (CVE-2024-47081, CVE-2025-50181, CVE-2025-50182) related to ReDoS, SSRF, and credential leakage. Removed deprecated apps no longer aligned with current standards. Fixed `filebrowser.yml` for both SSL and non-SSL setups. Added a contextual troubleshooting guide and increased `/app/` endpoint retries to 10, as requested by users. Implemented `HomeDock OS Desktop` detection to disable in-app and HMR updates (**updates are handled externally by Electron in Desktop mode**). Introduced a lightweight entropy-based signature system for internal lighthouse consistency.

- **1.0.17.129**: Added upload and download progress bars to Drop Zone, as requested by several users. Each theme (Default, Noir/Dark, and Aero+) now features its own tailored progress bar styling for a more cohesive visual experience. Changelog added.

- **1.0.17.128**: Upgraded Flask to 3.1.1 (CVE-2025-47278), Vite to 6.3.4 (CVE-2025-46565), Pinia to 3.0.2, and @iconify/vue to 5.0.0. Refactored HTTP-to-HTTPS redirection to run inside Hypercorn via ASGI middleware, ensuring cleaner and more production-aligned behavior.

- **1.0.17.104**: Added a bunch of SSL native applications, there's a lot of work to do here since not all apps are compatible, may need to add an `HDRole=proxy` quite soon. Implemented automatic SSL environment detection to retrieve certificates dynamically. Fully revamped `/app` preload logic for improved performance and reliability. Also addressed Vite CVE-2025-32395 by updating dependencies. Detailed changelog coming soon (it's on 1.0.18.102!).

- **1.0.17.102**: Added native SSL support detection for compatible apps and displayed SSL status in the App Store. Introduced `StatusFooter.vue` (requires app image and label), improved image handling options, and applied minor UI tweaks to `OrbitLoader.vue`, `App.vue`, and `Login.vue`. Enforced `Strict-Transport-Security` via `hd_CSPMaxed.py` to prevent single-domain multiport conflicts, and enabled automatic HTTP-to-HTTPS redirection on SSL-enabled instances.

- **1.0.16.146**: Patched Vite vulnerabilities CVE-2025-31486 (arbitrary file access via crafted .svg paths) and CVE-2025-31125 (unauthorized file exposure via query parameter injection) by upgrading to Vite ≥6.2.5. Added social login icons to the login screen, introduced new icons on the Dashboard, and improved update failover handling for better resilience.

- **1.0.16.143**: Patched Axios (CVE-2025-27152) and Babel (CVE-2025-27789) vulnerabilities. Also fixed environment issues affecting n8n on Unix-based hosts.

- **1.0.16.142**: Added n8n and Jellystat to the App Store with full integration support.

- **1.0.16.141**: Minor tweaks and bug fixes in the Drop Zone module to improve stability and user experience.

- **1.0.16.129**: Addressed CVE-2024-12797 and updated Python dependencies accordingly. Fixed footer rendering behavior, improved uninstall confirmation UX, and increased default time delay for new Atlas instances (just kidding hehe). Resolved internal port routing in host mode and introduced `hd_FunctionsActiveInstance.py` for centralized active instance management.

- **1.0.15.055**: Fixed a bug in `hd_HMRUpdate.py` where the configuration was being loaded before it was guaranteed to exist, causing execution failures during certain update flows.

- **1.0.15.047**: Added failover retry polling to the Dashboard App Loader for improved resilience. Fixed a bug in Drop Zone’s active path menu and updated logic to use the configured username instead of the normalized ID. Updated `vite-fusion` to 0.0.9 for better performance and applied a security patch for `Vite@6.0.9` (CVE-2025-24010). Also changed the virtual environment path to `/venv` for consistency across setups.

- **1.0.15.046**: Added smart application endpoint detection with SSL support check and automatic redirection on HTTPS-enabled instances. Fixed a bug in `hd_DockerAPIContainerData.py` to ensure the correct HomeDock OS port is used in service URLs. Improved handling of apps that block `HEAD` requests and corrected a debug typo in SSL status detection.

- **1.0.15.029**: Merged `UpdateHMR` branch from private internal repository. Finalized HMR integration and resolved multiple stability issues. Also fixed `Drop Zone` `activePath` bug and reduced update redirect delay to 2s for a smoother user experience.

- **1.0.15.028**: Removed automatic updates on startup. Updates must now be manually applied by the user through frontend notifications, giving full control over when to update.

- **1.0.14.124**: Introduced support for modifying `version.txt` during the update process and enforced `last_update_hash: never` to ensure consistent version syncing behavior.

- **1.0.14.123**: Ensured consistent execution paths across environments. Fixed a bug from the `homedock_www` refactor where relative paths broke when running via the `homedock.py` binary. All assets and templates now load correctly regardless of the execution location, and Vite asset paths are resolved properly when launching HomeDock OS from different directories.

- **1.0.14.122**: Ensured consistent execution paths across environments. Fixed a bug introduced during the `homedock_www` refactor that broke relative paths when running via the `homedock.py` binary. Assets and templates now load reliably regardless of the working directory, and Vite asset paths are correctly resolved when launching HomeDock OS from alternative locations.

- **1.0.14.121**: Implemented full Hot Module Replacement (HMR) support with granular file-level updates and automatic restarts on changes within `/pymodules`. Improved versioning logic to prevent overruns and added mechanisms to safely interrupt the auto-update process, ensuring consistent reload behavior across updates.

- **1.0.14.117**: Migrated from WSGI to ASGI using Hypercorn with AsyncioWSGIMiddleware, enforcing 64KB size limits on critical endpoints (/login, /api/pcrypt) for enhanced security. Refactored `homedock_www` initialization into `pymodules/hd_HDOSWebServerInit.py`, replaced `homedock_www.rootpath` with `current_directory`, improved UI delivery via vite-fusion, and added a partial GitHub auto-update check/download system with pre-HMR sync status validation.

- **1.0.14.101**: Finalized and deployed workaround for Hypercorn's `wsgi_max_body_size` limitation affecting Drop Zone uploads. Ensures stable large file handling under ASGI constraints.

- **1.0.14.100**: Introduced Drop Zone with AES-256 CBC encryption, using `PBKDF2-HMAC-SHA256` based on username for secure upload/download, search, and responsive UI. Replaced Flask's global `MAX_CONTENT_LENGTH` with endpoint-specific size control via `hd_ApplyUploadLimits.py` middleware (e.g., 1GB for /api/upload_file). Fixed logic issues and typos in Notifications.vue. Cleaned up app-store by removing test/placeholder composes. Added workaround for Hypercorn's `wsgi_max_body_size` per-endpoint limitation. Reverted to `last_update_hash: never` as default.

- **1.0.12.402v3**: Completed Drop Zone backend with full support for encrypted upload, download, and deletion. Implemented client-side file size display and stabilized ciphering logic. Also improved `local_dns` handling using Zeroconf with better error management for edge cases and unavailable local networks accesible from homedock.local.

- **1.0.12.401v3**: Pre-release with broad improvements across security, UI, and functionality. Replaced legacy HDOS-VanillaJS AppStore endpoints and reintroduced favicons/manifest for SSL. Improved public IP detection and fixed NaN issues in external disk API for TypeScript. Added `/routes` support in Port Routing from the Dashboard, with error code 606 for invalid ports and port change notifications. Enhanced styling cohesion, added dynamic classes to `ThemeSelector.ts`, applied security patch for `urllib3 1.26.19`, and included build precompilation adjustments.

- **1.0.12.399v3**: Initial commit and prelaunch setup for version 12.399v3. Baseline foundation for upcoming features and release structure, v3 means Vue3, this nomenclature will be discarded when we fully port all features from Vanilla JS and CSS, we already have it working on Svelte and React.

_**This changelog consolidates multiple commits into unified version entries for clarity. Some changes originated from different branches and private repositories, ensuring a cleaner and more traceable development history.**_
