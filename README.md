# CV Samantha Barends Fokke

Geanimeerd online cv als één HTML-bestand, achter een toegangscode.

## Structuur

```
src/
  index.html     # schil: head, toegangscode-scherm, placeholders
  content.html   # de inhoud van het cv (wordt versleuteld)
  styles.css     # alle styling
  main.js        # animaties, navigatie, toetsenbordbediening
  gate.js        # ontsleutelt de inhoud met de toegangscode
  assets/
    samantha.jpg
build.js         # bouwt alles naar docs/index.html
```

## Lokaal bouwen

```bash
cp .env.example .env      # zet hier de toegangscode in
npm run build             # → docs/index.html
npm run preview           # bouwen + lokaal bekijken
```

Er zijn geen dependencies nodig; `build.js` gebruikt alleen Node (18+).

## Hoe de toegangscode werkt

De inhoud (tekst, foto, contactgegevens) wordt tijdens de build versleuteld met AES-256-GCM.
De sleutel wordt afgeleid van de toegangscode (PBKDF2-SHA256, 250.000 iteraties).
Zonder code staat er in de broncode alleen een versleutelde blob; na het invoeren ontsleutelt
de browser de inhoud. De code is niet hoofdlettergevoelig en wordt per sessie onthouden.

## Deployen

Bij elke push naar `main` bouwt GitHub Actions de site en zet `docs/` via FTP op GetHost.

Repo secrets (Settings → Secrets and variables → Actions):

| Secret           | Inhoud                         |
| ---------------- | ------------------------------ |
| `CV_ACCESS_CODE` | de toegangscode                |
| `FTP_SERVER`     | FTP-host van GetHost           |
| `FTP_USERNAME`   | FTP-gebruiker van het domein   |
| `FTP_PASSWORD`   | FTP-wachtwoord                 |

Pas `server-dir` in `.github/workflows/deploy.yml` aan als het FTP-account niet direct in de webroot uitkomt.
