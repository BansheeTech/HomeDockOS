#!/bin/bash
# HomeDock OS Uninstaller 1.0.0

# [===================================================================================================]
#                                            Script Functions
# [===================================================================================================]

((EUID)) && sugo="sudo" || sugo=""

____CLRF____() {
  printf "\n"
}

____DISPLAY_LOGO____() {
  clear
  cat <<"EOF"

            @@@@@@@@@@@@@@@@@@@@@@@@
           @@@@@@@@@@@@@@@@@@@@@@@@@
          @@@@
         @@@@   @@@@@@@@@@@@@@@@@@@@
        @@@@   @@@
        @@@   @@@   @@@@@@@@@@@@@
       @@@   @@@*  @@@@      @@@*  @
      @@@   @@@@  @@@@      @@@@  @@
     @@@*  @@@@  (@@@      @@@@@@@@@
    @@@@  @@@@   @@@      //////////
   @@@@  @@@@   @@@
  @@@@  #@@@   @@@
 @@@@   @@@   @@@

 Repo:     https://github.com/BansheeTech/HomeDockOS
 Web:      https://www.homedock.cloud
 Docs:     https://docs.homedock.cloud
 Discord:  https://discord.gg/Zj3JCYsRWw
 Support:  support@homedock.cloud

EOF
  printf " ⌂ HomeDock OS Uninstaller\n"
  ____CLRF____
}

____CHECK_SUDO____() {
  if [[ -z "$sugo" ]]; then
    return
  fi

  if ! command -v ${sugo} &>/dev/null; then
    ____CLRF____
    printf " ✗ Error: sudo is not installed. Please install sudo and try again.\n"
    exit 1
  fi

  if ! ${sugo} -n true 2>/dev/null; then
    ____CLRF____
    printf " i You must have sudo privileges to run this script.\n"
    ${sugo} -v || exit 1
  fi
}

____VERIFY_HOMEDOCK_DIRECTORY____() {
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  if [ ! -f "$SCRIPT_DIR/homedock.py" ] || [ ! -d "$SCRIPT_DIR/pymodules" ]; then
    ____CLRF____
    printf " ✗ Error: This does not appear to be a valid HomeDock OS installation.\n"
    printf " i Could not find homedock.py or pymodules directory.\n"
    printf " i Please run this script from the HomeDock OS installation directory.\n"
    ____CLRF____
    exit 1
  fi

  printf " ✓ Valid HomeDock OS installation detected\n"
}

____PROMPT_CONFIRMATION____() {
  local timeout=10
  ____CLRF____
  printf " ! WARNING: This will completely remove HomeDock OS from your system.\n"
  printf " i The following actions will be performed:\n"
  printf "   - Stop and disable the homedock.service (if exists)\n"
  printf "   - Remove /etc/systemd/system/homedock.service (if exists)\n"
  printf "   - Delete the HomeDock OS installation directory\n"
  ____CLRF____
  printf " ! This action is IRREVERSIBLE. All HomeDock OS data will be lost.\n"
  ____CLRF____
  printf " i Note: Docker containers, images and bind mounts will NOT be removed.\n"
  printf "   - To remove bind mounts issue: sudo rm -rf /DATA/*\n"
  ____CLRF____

  for ((i = timeout; i > 0; i--)); do
    printf "\r ? Are you sure you want to uninstall HomeDock OS? (Y/N) [Auto-No in %2d seconds]:" "$i"
    read -t 1 -n 1 response </dev/tty && break
  done
  printf "\n"

  response=${response:-n}
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    ____CLRF____
    printf " ! Uninstallation aborted by user.\n"
    ____CLRF____
    exit 0
  fi
}

____REMOVE_SERVICE____() {
  local SERVICE_FILE="/etc/systemd/system/homedock.service"

  if [ -f "$SERVICE_FILE" ]; then
    printf " i Stopping homedock.service...\n"
    ${sugo} systemctl stop homedock.service 2>/dev/null
    printf " ✓ Service stopped\n"

    printf " i Disabling homedock.service...\n"
    ${sugo} systemctl disable homedock.service 2>/dev/null
    printf " ✓ Service disabled\n"

    printf " i Removing service file...\n"
    ${sugo} rm -f "$SERVICE_FILE"
    printf " ✓ Service file removed\n"

    printf " i Reloading systemd daemon...\n"
    ${sugo} systemctl daemon-reload
    printf " ✓ Systemd daemon reloaded\n"
  else
    printf " i homedock.service not found in systemd, skipping...\n"
  fi
}

____REMOVE_INSTALLATION____() {
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  ____CLRF____
  printf " i Installation directory: %s\n" "$SCRIPT_DIR"
  printf " i Removing HomeDock OS installation...\n"

  cd / || exit 1

  ${sugo} rm -rf "$SCRIPT_DIR"

  if [ ! -d "$SCRIPT_DIR" ]; then
    printf " ✓ HomeDock OS installation directory removed successfully\n"
  else
    printf " ✗ Failed to remove installation directory\n"
    exit 1
  fi
}

# [===================================================================================================]
#                                             Main Logic
# [===================================================================================================]

____MAIN____() {
  ____DISPLAY_LOGO____
  ____CHECK_SUDO____
  ____VERIFY_HOMEDOCK_DIRECTORY____
  ____PROMPT_CONFIRMATION____

  ____CLRF____
  printf " i Starting uninstallation process...\n"
  ____CLRF____

  ____REMOVE_SERVICE____
  ____REMOVE_INSTALLATION____

  ____CLRF____
  printf "\033[1;30;47m ✓ HomeDock OS has been successfully uninstalled! \033[0m\n"
  ____CLRF____
  printf " i Thank you for using HomeDock OS.\n"
  printf " i If you have feedback, please reach out at support@homedock.cloud\n"
  ____CLRF____
}

____MAIN____
