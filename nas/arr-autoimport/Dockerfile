FROM python:3.12-alpine
COPY autoimport.py /autoimport.py
# root on purpose: UGOS enforces shared-folder permissions per uid and denies
# uid 1000 on /volume2/nas-apps (where the arr config.xml files live). The
# container only reads two config files and talks HTTP — no media mounts.
CMD ["python3", "-u", "/autoimport.py"]
