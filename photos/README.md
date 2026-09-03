# 📸 Dossier photos

C'est ici que tu déposes les images que tu veux me montrer (maquettes, captures
d'écran, logo, photos du café, etc.). Je les lis directement depuis ce dossier.

## Comment envoyer une photo (le plus simple, depuis le navigateur)

1. Ouvre ce lien :
   https://github.com/brkbamustapha-ui/between-us-cofee/upload/claude/intelligent-dijkstra-j3gt6j/photos
2. Glisse-dépose tes images dans la zone (ou clique sur « choose your files »).
3. En bas, clique sur le bouton vert **Commit changes**.
4. Reviens me dire « j'ai ajouté les photos » — je vais les chercher ici.

## Depuis le téléphone

Application GitHub → dépôt `between-us-cofee` → branche
`claude/intelligent-dijkstra-j3gt6j` → dossier `photos` → **Add file** →
**Upload files**.

## En ligne de commande

```bash
git checkout claude/intelligent-dijkstra-j3gt6j
cp ~/mes-images/*.jpg photos/
git add photos/
git commit -m "Ajout de photos"
git push -u origin claude/intelligent-dijkstra-j3gt6j
```

## Bon à savoir

- Formats lisibles : `.png`, `.jpg` / `.jpeg`, `.gif`, `.webp`.
- Taille max : 25 Mo par fichier via le navigateur, 100 Mo via git.
- Donne des noms parlants (`logo-v2.png`, `menu-carte.jpg`) plutôt que
  `IMG_4821.jpg` — ça m'aide à savoir de quoi on parle.
- Si une photo remplace une ancienne, garde le même nom avec un numéro de
  version (`facade-v1.jpg`, `facade-v2.jpg`).

⚠️ Ce dépôt est public : n'y mets pas de documents personnels (papiers
d'identité, factures, coordonnées bancaires).
