# pakubk.github.io

Simple static website hosted with GitHub Pages.

## Update content from a phone

Sign in to GitHub, open one of these links, tap **Run workflow**, fill in
the form, and tap the green **Run workflow** button:

- [Add a status update](https://github.com/PakuBK/pakubk.github.io/actions/workflows/add-status.yml)
- [Update the song of the week](https://github.com/PakuBK/pakubk.github.io/actions/workflows/update-weekly-song.yml)
- [Post artwork](https://github.com/PakuBK/pakubk.github.io/issues/new?template=post-artwork.yml)
- [Post lyrical artwork](https://github.com/PakuBK/pakubk.github.io/issues/new?template=post-lyrik.yml)

Bookmark these links on your phone. A successful run updates the JSON in
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

## Add art

Put the image in `imgs/`, then add its relative path to the `images` array in
`content/art.json`. The explicit list is required because GitHub Pages does not
provide directory listings for JavaScript to discover image files.

From a phone, use the **Post artwork** issue form linked above. Choose an image
and submit the issue. For safety, publishing only runs for issues opened by the
repository owner with the `[art]` title prefix. The workflow verifies the
attachment, adds it to the gallery, deploys the site, and closes the issue.

## Add lyrical work

The lyrical archive is stored in `content/lyrik.json` and displayed on
`pages/lyrik.html`. From a phone, use the **Post lyrical artwork** form linked
above. Its multiline editor preserves line breaks. The owner-only workflow
adds the work with a Berlin-local date, deploys the site, and closes the issue.
