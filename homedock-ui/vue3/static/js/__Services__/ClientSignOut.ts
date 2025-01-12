// homedock-ui/vue3/static/js/__Services__/ClientSignOut.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import axios from "axios";

let isSignOutInProgress = false;

export async function clientSignOut(csrfToken: string): Promise<void> {
  if (isSignOutInProgress) {
    return;
  }

  try {
    isSignOutInProgress = true;

    await axios.post(
      "/logout",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "X-HomeDock-CSRF-Token": csrfToken,
        },
      }
    );

    window.location.href = "/";
  } catch (error) {
    console.error("Error during sign-out:", error);
  } finally {
    isSignOutInProgress = false;
  }
}
