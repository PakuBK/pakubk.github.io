# pakubk.github.io

Simple static website hosted with GitHub Pages.

## Update content from a phone

Sign in to GitHub, open one of these links, tap **Run workflow**, fill in
the form, and tap the green **Run workflow** button:

- [Add a status update](https://github.com/PakuBK/pakubk.github.io/actions/workflows/add-status.yml)
- [Update the song of the week](https://github.com/PakuBK/pakubk.github.io/actions/workflows/update-weekly-song.yml)

Bookmark both links on your phone. A successful run updates the JSON in
`content/`, commits the change to `main`, and deploys the new version of the
site. The status date is generated automatically in the `Europe/Berlin`
timezone.

## GitHub setup

After adding the workflows, open **Settings > Pages** in the repository and
set **Source** to **GitHub Actions**. No personal access token or external
service is required.

The publishing workflows request only the repository and Pages permissions
they need. Normal pushes to `main` also deploy the site through the same
deployment workflow.

## Local development

```powershell
npm run dev
```

Run the content updater tests with:

```powershell
npm test
```
