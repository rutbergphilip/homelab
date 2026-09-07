# nas-maint — maintenance shell on the Ugreen NAS

Idle Alpine container with the app-config shares mounted (`/nas-apps` = Volume 2
SSD, `/nas-apps-backup`). UGOS has
no SSH, so this plus the container **Terminal** tab (Add → `/bin/sh`) is how files,
ownership and SQLite DBs on the NAS get inspected (`apk add sqlite` works).

Keep the project **stopped** when not in use: while running it holds the mounted
shared folders open, which blocks renaming or moving them. Wheel-scrolling the UGOS
container list does not work — filter with the Search box instead.
