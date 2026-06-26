# Zerun Niu Personal Website

This repository contains the source for Zerun Niu's academic personal website, deployed with GitHub Pages at:

https://zerunniu.github.io/

The site is built with Jekyll and the al-folio theme. It includes research projects, publications, CV content, teaching interests, and research notes.

## Local Preview

```bash
docker compose pull
docker compose up
```

Then open:

```text
http://localhost:8080
```

## Deployment

Pushes to the `main` branch trigger the `Deploy site` GitHub Actions workflow. The generated site is published from the `gh-pages` branch.
