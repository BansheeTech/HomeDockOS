# CHANGELOG

- **1.0.18.104** (Latest): Applied a temporary workaround to restore Filebrowser functionality after unexpected changes in their image and startup behavior, which broke compatibility with previously working Docker Compose setups. This ensures it remains operational while they clarify their recommended deployment approach.

---

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

- **1.0.16.129**: Addressed CVE-2024-12797 and updated Python dependencies accordingly. Fixed footer rendering behavior, improved uninstall confirmation UX, and increased default time delay for new Atlas instances. Resolved internal port routing in host mode and introduced `hd_FunctionsActiveInstance.py` for centralized active instance management.

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
